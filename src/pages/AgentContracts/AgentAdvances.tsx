import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Plus } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SectionHeader } from "@/components/common";
import {
  Button,
  ConfirmationModal,
  DataTable,
  Select,
  Textarea,
  TextField,
} from "@/ui-kit";
import { agentContractsService } from "@/services/agentContracts";
import { agentsService } from "@/services/agents";
import { capitalSourcesService } from "@/services/capitalSources";
import { fundingAnalyticsService } from "@/services/fundingAnalytics";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { RootState } from "@/store/store";
import type { AgentDto } from "@/types/agents";
import type { CapitalSourceDto } from "@/types/capitalSources";
import type { AgentAdvanceFundingAnalyticsDto, FundingDailyCostDto } from "@/types/fundingAnalytics";
import type {
  AgentAdvanceDto,
  AgentAdvanceExtensionDto,
  AgentContractStatus,
  RepaymentTermsSnapshotDto,
} from "@/types/agentContracts";
import {
  isActiveAgentStatus,
  isDraftAgentStatus,
  normalizeAgentStatus,
} from "@/utils/agentStatus";
import styles from "./AgentContracts.module.css";

const statuses: AgentContractStatus[] = [
  "Draft",
  "Active",
  "Completed",
  "Cancelled",
  "Defaulted",
];
const money = (amount?: number | null) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
    amount ?? 0,
  );
const date = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString() : "-";
const datetime = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "-";
const today = () => new Date(new Date().setHours(0, 0, 0, 0));
const daysBetween = (left: Date, right: Date) =>
  Math.ceil((left.getTime() - right.getTime()) / 86400000);
const addDays = (value: Date, days: number) =>
  new Date(value.getTime() + days * 86400000);
const isoDate = (value: Date) => value.toISOString().slice(0, 10);
const agentName = (agent: AgentDto) =>
  `${agent.code} - ${agent.customer?.fullName || "—"}`;
const toDateTimeRange = (value: string, endOfDay: boolean) => {
  if (!value) return undefined;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  if (endOfDay) parsed.setHours(23, 59, 59, 999);
  return parsed.toISOString();
};

const deadlineFor = (
  advance: AgentAdvanceDto,
  terms?: RepaymentTermsSnapshotDto | null,
) => {
  if (advance.repaymentDeadline) return new Date(advance.repaymentDeadline);
  return addDays(
    new Date(advance.advanceDate),
    terms?.defaultRepaymentPeriodDays ??
      advance.repaymentTerms?.defaultRepaymentPeriodDays ??
      30,
  );
};

const deadlineStatus = (days: number) =>
  days > 14 ? "safe" : days > 7 ? "warning" : days >= 0 ? "urgent" : "overdue";

const DeadlineWarning = ({ deadline }: { deadline: Date }) => {
  const { t } = useTranslation();
  const days = daysBetween(deadline, today());
  const status = deadlineStatus(days);
  const text =
    days < 0
      ? t("agentAdvances.deadline.overdue", { days: Math.abs(days) })
      : t("agentAdvances.deadline.remaining", { days });
  return (
    <div
      className={`${styles.deadline} ${styles[`deadline${status}`]}`}
      role="status"
      aria-live="polite"
    >
      <strong>{date(deadline.toISOString())}</strong>
      <span>{text}</span>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string | number }) => {
  const { t } = useTranslation();
  const label = normalizeAgentStatus(status) || String(status ?? "");
  return (
    <span className={`${styles.status} ${styles[`status${label}`] ?? ""}`}>
      {t(`agentAdvances.statuses.${label.toLowerCase()}`, { defaultValue: label })}
    </span>
  );
};
const Detail = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className={styles.detail}>
    <span>{label}</span>
    <strong>{value ?? "-"}</strong>
  </div>
);

const ExtensionHistory = ({
  extensions,
  loading,
}: {
  extensions: AgentAdvanceExtensionDto[];
  loading: boolean;
}) => {
  const { t } = useTranslation();
  const columns = useMemo(
    () => [
      { accessorKey: "extensionNumber", header: t("agentAdvances.history.extensionNumber") },
      {
        id: "previous",
        header: t("agentAdvances.history.previousDeadline"),
        cell: ({ row }: any) => date(row.original.previousDeadline),
      },
      {
        id: "new",
        header: t("agentAdvances.history.newDeadline"),
        cell: ({ row }: any) => date(row.original.newDeadline),
      },
      {
        id: "days",
        header: t("agentAdvances.history.daysAdded"),
        cell: ({ row }: any) =>
          daysBetween(
            new Date(row.original.newDeadline),
            new Date(row.original.previousDeadline),
          ),
      },
      {
        accessorKey: "reason",
        header: t("agentAdvances.history.reason"),
        cell: ({ row }: any) => row.original.reason || "-",
      },
      {
        id: "granted",
        header: t("agentAdvances.history.granted"),
        cell: ({ row }: any) =>
          `${row.original.createdBy || "-"} · ${datetime(row.original.createdAt)}`,
      },
    ],
    [t],
  );
  const sorted = [...extensions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return (
    <section className={styles.section}>
      <h2>{t("agentAdvances.history.title")}</h2>
      <DataTable
        columns={columns as any}
        data={sorted}
        isLoading={loading}
        noResultsText={t("agentAdvances.history.empty")}
        loadingText={t("agentAdvances.history.loading")}
      />
    </section>
  );
};

const ExtensionModal = ({
  open,
  advance,
  deadline,
  extensionCount,
  maximumExtensions,
  onClose,
  onSubmit,
  saving,
}: {
  open: boolean;
  advance: AgentAdvanceDto;
  deadline: Date;
  extensionCount: number;
  maximumExtensions: number;
  onClose: () => void;
  onSubmit: (request: {
    newDeadline: string;
    reason?: string | null;
  }) => Promise<void>;
  saving: boolean;
}) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState("plus14");
  const [customDate, setCustomDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (open) {
      setSelected("plus14");
      setCustomDate("");
      setReason("");
      setError("");
    }
  }, [open]);
  const options = [7, 14, 21, 30].map((days) => ({
    id: `plus${days}`,
    days,
    date: addDays(deadline, days),
  }));
  const selectedDate =
    selected === "custom"
      ? customDate
        ? new Date(`${customDate}T00:00:00`)
        : null
      : (options.find((option) => option.id === selected)?.date ?? null);
  const submit = async () => {
    if (!selectedDate || Number.isNaN(selectedDate.getTime())) {
      setError(t("agentAdvances.extension.required"));
      return;
    }
    if (selectedDate <= deadline) {
      setError(t("agentAdvances.extension.mustBeLater"));
      return;
    }
    if (selectedDate < today()) {
      setError(t("agentAdvances.extension.notPast"));
      return;
    }
    if (daysBetween(selectedDate, today()) > 365) {
      setError(t("agentAdvances.extension.maxOneYear"));
      return;
    }
    if (reason.length > 500) {
      setError(t("agentAdvances.extension.reasonTooLong"));
      return;
    }
    await onSubmit({
      newDeadline: selectedDate.toISOString(),
      reason: reason.trim() || null,
    });
  };
  return (
    <ConfirmationModal
      open={open}
      onOpenChange={(value) => !value && onClose()}
      title={t("agentAdvances.extension.title")}
      description={t("agentAdvances.extension.description", { advanceNumber: advance.advanceNumber, deadline: date(deadline.toISOString()), count: extensionCount, maximum: maximumExtensions })}
      confirmText={t("agentAdvances.extension.submit")}
      confirmLoading={saving}
      preventClose
      onConfirm={() => void submit()}
    >
      <div className={styles.modalFields}>
        <div className={styles.quickOptions}>
          <strong>{t("agentAdvances.extension.newDeadlineSelection")}</strong>
          {options.map((option) => (
            <label key={option.id}>
              <input
                type="radio"
                name="extension-option"
                checked={selected === option.id}
                onChange={() => setSelected(option.id)}
              />
              {t("agentAdvances.extension.dayOption", { days: option.days, date: date(option.date.toISOString()) })}
            </label>
          ))}
          <label>
            <input
              type="radio"
              name="extension-option"
              checked={selected === "custom"}
              onChange={() => setSelected("custom")}
            />
            {t("agentAdvances.extension.customDate")}
          </label>
        </div>
        {selected === "custom" && (
          <TextField
            label={t("agentAdvances.extension.customDeadline")}
            type="date"
            min={isoDate(addDays(deadline, 1))}
            value={customDate}
            onChange={(event) => setCustomDate(event.target.value)}
          />
        )}
        <Textarea
          label={t("agentAdvances.extension.reasonOptional")}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={500}
          rows={4}
        />
        {error && <span className={styles.error}>{error}</span>}
      </div>
    </ConfirmationModal>
  );
};

export const AgentAdvancesList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<AgentAdvanceDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<AgentDto[]>([]);
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || 10);
  const status = searchParams.get("status") || "";
  const agentId = searchParams.get("agentId") || "";
  const advanceNumber = searchParams.get("advanceNumber") || "";
  const from = searchParams.get("advanceDateFrom") || "";
  const to = searchParams.get("advanceDateTo") || "";
  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    value ? next.set(key, value) : next.delete(key);
    next.set("page", "1");
    setSearchParams(next);
  };
  useEffect(() => {
    void agentsService
      .getAgents({ page: 1, pageSize: 200, status: 0 })
      .then((result) => setAgents(result.results ?? []))
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const result = await agentContractsService.listAdvances({
          page,
          pageSize,
          status: status || undefined,
          agentId: agentId || undefined,
          advanceType: "Cash",
          advanceNumber: advanceNumber || undefined,
          advanceDateFrom: from || undefined,
          advanceDateTo: to || undefined,
        });
        setItems((result.results ?? []).filter((advance) => {
          const type = String(advance.advanceType ?? "Cash").toLowerCase();
          return !type || type.includes("cash");
        }));
        setTotal(result.totalItems);
      } catch (error) {
        toast.error(getApiErrorMessage(error, t("agentAdvances.errors.loadFailed")));
      } finally {
        setLoading(false);
      }
    })();
  }, [page, pageSize, status, agentId, advanceNumber, from, to]);
  const columns = useMemo(
    () => [
      { accessorKey: "advanceNumber", header: t("agentAdvances.fields.advanceNumber") },
      {
        id: "agent",
        header: t("agentAdvances.fields.agent"),
        cell: ({ row }: any) =>
          `${row.original.agent.code} - ${row.original.agent.fullName}`,
      },
      {
        id: "amount",
        header: t("agentAdvances.fields.amount"),
        cell: ({ row }: any) => money(row.original.advancedAmount),
      },
      {
        accessorKey: "status",
        header: t("agentAdvances.fields.status"),
        cell: ({ row }: any) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "deadline",
        header: t("agentAdvances.fields.deadline"),
        cell: ({ row }: any) => (
          <DeadlineWarning deadline={deadlineFor(row.original)} />
        ),
      },
      {
        id: "extensions",
        header: t("agentAdvances.fields.extensions"),
        cell: ({ row }: any) =>
          `${row.original.extensionCount ?? 0}/${row.original.maximumExtensions ?? row.original.repaymentTerms?.maximumExtensions ?? "-"}`,
      },
      {
        id: "actions",
        header: t("agentAdvances.fields.actions"),
        cell: ({ row }: any) => (
          <Button
            size="small"
            variant="secondary"
            onClick={() => navigate(`/agents/cash-powder/advances/${row.original.id}`)}
          >
            {t("agentAdvances.actions.view")}
          </Button>
        ),
      },
    ],
    [navigate, t],
  );
  return (
    <div className={styles.page}>
      <SectionHeader
        title={t("agentAdvances.title")}
        actions={
          <Button
            variant="secondary"
            onClick={() => navigate("/agents/cash-powder/contracts")}
          >
            <Plus size={14} /> {t("agentAdvances.list.contracts")}
          </Button>
        }
      />
      <div className={styles.filters}>
        <Select
          value={agentId}
          onChange={(event) => setFilter("agentId", event.target.value)}
        >
          <option value="">{t("agentAdvances.list.allAgents")}</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agentName(agent)}
            </option>
          ))}
        </Select>
        <Select
          value={status}
          onChange={(event) => setFilter("status", event.target.value)}
        >
          <option value="">{t("agentAdvances.list.allStatuses")}</option>
          {statuses.map((item) => (
            <option key={item} value={item}>{t(`agentAdvances.statuses.${item.toLowerCase()}`)}</option>
          ))}
        </Select>
        <TextField
          label={t("agentAdvances.fields.advanceNumber")}
          value={advanceNumber}
          onChange={(event) => setFilter("advanceNumber", event.target.value)}
        />
        <TextField
          label={t("agentContracts.fields.from")}
          type="date"
          value={from}
          onChange={(event) => setFilter("advanceDateFrom", event.target.value)}
        />
        <TextField
          label={t("agentContracts.fields.to")}
          type="date"
          value={to}
          onChange={(event) => setFilter("advanceDateTo", event.target.value)}
        />
      </div>
      <DataTable
        columns={columns as any}
        data={items}
        isLoading={loading}
        manualPagination
        pageCount={Math.max(1, Math.ceil(total / pageSize))}
        pageIndex={page - 1}
        onPaginationChange={(index) => setFilter("page", String(index + 1))}
        noResultsText={t("agentAdvances.list.empty")}
        loadingText={t("agentAdvances.list.loading")}
      />
    </div>
  );
};

export const AgentAdvanceDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const role = useSelector(
    (state: RootState) => state.auth.user?.role?.toLowerCase() || "",
  );
  const canRequest = [
    "admin",
    "operations manager",
    "operationsmanager",
    "sales manager",
    "salesmanager",
    "agent",
  ].includes(role);
  const [advance, setAdvance] = useState<AgentAdvanceDto | null>(null);
  const [extensions, setExtensions] = useState<AgentAdvanceExtensionDto[]>([]);
  const [sources, setSources] = useState<CapitalSourceDto[]>([]);
  const [sourceId, setSourceId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [allocationOpen, setAllocationOpen] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [activateOpen, setActivateOpen] = useState(false);
  const [extensionOpen, setExtensionOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [extensionLoading, setExtensionLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fundingAnalytics, setFundingAnalytics] = useState<AgentAdvanceFundingAnalyticsDto | null>(null);
  const [fundingFromDate, setFundingFromDate] = useState("");
  const [fundingToDate, setFundingToDate] = useState("");
  const [fundingHistory, setFundingHistory] = useState<FundingDailyCostDto[]>([]);
  const load = async () => {
    if (!id) return;
    if (fundingFromDate && fundingToDate && new Date(`${fundingFromDate}T00:00:00`) > new Date(`${fundingToDate}T00:00:00`)) {
      toast.error(t("fundingAnalytics.validation.dateRange"));
      return;
    }
    setLoading(true);
    try {
      const result = await agentContractsService.getAdvance(id);
      setAdvance(result);
      if (String(result.advanceType ?? "Cash").toLowerCase().includes("product")) {
        setSources([]);
        setExtensions([]);
      } else {
        const [sourceResult, extensionResult] = await Promise.all([
          capitalSourcesService.listCapitalSources({
            page: 1,
            pageSize: 200,
            status: "Active",
          }),
          agentContractsService.getAdvanceExtensions(id),
        ]);
        setSources(sourceResult.results ?? []);
        setExtensions(extensionResult);
        try {
          const analytics = await fundingAnalyticsService.getAgentAdvanceFundingAnalytics(id, {
            fromDate: toDateTimeRange(fundingFromDate, false),
            toDate: toDateTimeRange(fundingToDate, true),
          });
          setFundingAnalytics(analytics);
          setFundingHistory(analytics.dailyHistory ?? []);
        } catch (error) {
          setFundingAnalytics(null);
          setFundingHistory([]);
          toast.error(getApiErrorMessage(error, t("fundingAnalytics.errors.advanceLoadFailed")));
        }
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("agentAdvances.errors.loadDetailsFailed")));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [id]);
  if (loading || !advance)
    return (
      <div className={styles.page}>
        <SectionHeader title={t("agentAdvances.detailsTitle")} goBack />
        {t("common.loading")}
      </div>
    );
  if (String(advance.advanceType ?? "Cash").toLowerCase().includes("product")) {
    return (
      <div className={styles.page}>
        <SectionHeader
          title={advance.advanceNumber}
          goBack
          actions={(
            <Button
              variant="secondary"
              onClick={() => navigate(`/agents/product-credit/contracts/${advance.agentContractId}`)}
            >
              {t("agentAdvances.actions.viewContract")}
            </Button>
          )}
        />
        <section className={styles.section}>
          <h2>{t("agentWorkspace.productCredit")}</h2>
          <div className={styles.detailGrid}>
            <Detail label={t("agentAdvances.fields.advanceType")} value={t("agentAdvances.fields.productAdvance")} />
            <Detail label={t("agentAdvances.fields.productSaleId")} value={advance.productSaleId ?? "-"} />
            <Detail label={t("agentAdvances.fields.agent")} value={`${advance.agent.code} - ${advance.agent.fullName}`} />
            <Detail label={t("agentAdvances.fields.contract")} value={advance.agentContractId} />
            <Detail label={t("agentAdvances.fields.advancedAmount")} value={`${money(advance.advancedAmount)} AMD`} />
            <Detail label={t("agentAdvances.fields.advanceDate")} value={datetime(advance.advanceDate)} />
            <Detail label={t("agentAdvances.fields.status")} value={<StatusBadge status={advance.status} />} />
            <Detail label={t("agentAdvances.fields.notes")} value={advance.notes} />
          </div>
        </section>
      </div>
    );
  }
  const deadline = deadlineFor(advance, advance.repaymentTerms);
  const extensionCount = advance.extensionCount ?? extensions.length;
  const maximumExtensions =
    advance.maximumExtensions ?? advance.repaymentTerms?.maximumExtensions ?? 0;
  const remaining = Math.max(
    0,
    advance.advancedAmount - advance.allocatedAmount,
  );
  const draft = isDraftAgentStatus(advance.status);
  const active = isActiveAgentStatus(advance.status);
  const fundingStatus = isActiveAgentStatus(advance.status)
    ? t("agentAdvances.statuses.active")
    : advance.allocatedAmount >= advance.advancedAmount
      ? t("agentAdvances.fundingStatuses.fullyAllocated")
      : advance.allocatedAmount > 0
        ? t("agentAdvances.fundingStatuses.partiallyFunded")
        : t("agentAdvances.fundingStatuses.notFunded");
  const addAllocation = async () => {
    const parsed = Number(amount);
    if (!sourceId || !(parsed > 0) || parsed > remaining) {
      toast.error(
        t("agentAdvances.allocation.amountError"),
      );
      return;
    }
    if (!id) return;
    setSaving(true);
    try {
      await agentContractsService.addAllocation(id, {
        capitalSourceId: sourceId,
        amount: parsed,
        description: description.trim() || undefined,
      });
      toast.success(t("agentAdvances.messages.allocationAdded"));
      setAllocationOpen(false);
      setSourceId("");
      setAmount("");
      setDescription("");
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("agentAdvances.errors.addAllocationFailed")));
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (!id || !removeId) return;
    try {
      await agentContractsService.removeAllocation(id, removeId);
      toast.success(t("agentAdvances.messages.allocationRemoved"));
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("agentAdvances.errors.removeAllocationFailed")));
    } finally {
      setRemoveId(null);
    }
  };
  const activate = async () => {
    if (!id) return;
    try {
      await agentContractsService.activateAdvance(id);
      toast.success(t("agentAdvances.messages.activated"));
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("agentAdvances.errors.activateFailed")));
    }
  };
  const createExtension = async (request: {
    newDeadline: string;
    reason?: string | null;
  }) => {
    if (!id) return;
    setExtensionLoading(true);
    try {
      await agentContractsService.createAdvanceExtension(id, request);
      toast.success(t("agentAdvances.messages.extensionGranted"));
      setExtensionOpen(false);
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("agentAdvances.errors.extensionFailed")));
    } finally {
      setExtensionLoading(false);
    }
  };
  const allocationColumns = [
    { accessorKey: "capitalSourceCode", header: t("agentAdvances.fields.capitalSourceCode") },
    { accessorKey: "capitalSourceName", header: t("agentAdvances.fields.capitalSource") },
    {
      id: "amount",
      header: t("agentAdvances.allocation.amount"),
      cell: ({ row }: any) => money(row.original.amount),
    },
    { accessorKey: "createdBy", header: t("agentAdvances.fields.createdBy") },
    {
      id: "actions",
      header: t("agentAdvances.fields.actions"),
      cell: ({ row }: any) =>
        draft && (
          <Button
            size="small"
            variant="danger"
            onClick={() => setRemoveId(row.original.id)}
          >
            {t("agentAdvances.actions.remove")}
          </Button>
        ),
    },
  ];
  const fundingAllocationColumns = [
    {
      id: "source",
      header: t("fundingAnalytics.fields.capitalSource"),
      cell: ({ row }: any) => {
        const source = sources.find((item) => item.id === row.original.capitalSourceId);
        return source ? `${source.code} - ${source.name}` : row.original.capitalSourceId;
      },
    },
    { accessorKey: "allocatedPrincipal", header: t("fundingAnalytics.fields.allocatedPrincipal"), cell: ({ row }: any) => `${money(row.original.allocatedPrincipal)} AMD` },
    { accessorKey: "outstandingPrincipal", header: t("fundingAnalytics.fields.outstandingPrincipal"), cell: ({ row }: any) => `${money(row.original.outstandingPrincipal)} AMD` },
    { accessorKey: "annualInterestRate", header: t("fundingAnalytics.fields.annualInterestRate"), cell: ({ row }: any) => `${row.original.annualInterestRate}%` },
    { accessorKey: "fundingCost", header: t("fundingAnalytics.fields.fundingCost"), cell: ({ row }: any) => `${money(row.original.fundingCost)} AMD` },
    { accessorKey: "daysOutstanding", header: t("fundingAnalytics.fields.daysOutstanding") },
  ];
  const fundingHistoryColumns = [
    { accessorKey: "date", header: t("fundingAnalytics.fields.date"), cell: ({ row }: any) => date(row.original.date) },
    { id: "source", header: t("fundingAnalytics.fields.capitalSource"), cell: ({ row }: any) => sources.find((item) => item.id === row.original.capitalSourceId)?.name ?? row.original.capitalSourceId },
    { accessorKey: "outstandingPrincipal", header: t("fundingAnalytics.fields.outstandingPrincipal"), cell: ({ row }: any) => `${money(row.original.outstandingPrincipal)} AMD` },
    { accessorKey: "annualInterestRate", header: t("fundingAnalytics.fields.annualInterestRate"), cell: ({ row }: any) => `${row.original.annualInterestRate}%` },
    { accessorKey: "dailyFundingCost", header: t("fundingAnalytics.fields.dailyFundingCost"), cell: ({ row }: any) => `${money(row.original.dailyFundingCost)} AMD` },
    { accessorKey: "cumulativeFundingCost", header: t("fundingAnalytics.fields.cumulativeFundingCost"), cell: ({ row }: any) => `${money(row.original.cumulativeFundingCost)} AMD` },
  ];
  return (
    <div className={styles.page}>
      <SectionHeader
        title={advance.advanceNumber}
        goBack
        actions={
          <div className={styles.headerActions}>
            <Button
              variant="secondary"
              onClick={() =>
                navigate(`/agents/cash-powder/contracts/${advance.agentContractId}`)
              }
            >
              {t("agentAdvances.actions.viewContract")}
            </Button>
            {draft && (
              <Button onClick={() => setAllocationOpen(true)}>
                {t("agentAdvances.actions.allocateCapital")}
              </Button>
            )}
            {draft && (
              <Button
                disabled={remaining !== 0}
                onClick={() => setActivateOpen(true)}
              >
                {t("agentAdvances.actions.activate")}
              </Button>
            )}
            {canRequest && active && extensionCount < maximumExtensions && (
              <Button onClick={() => setExtensionOpen(true)}>
                {t("agentAdvances.actions.requestExtension")}
              </Button>
            )}
          </div>
        }
      />
      <div className={styles.detailGrid}>
        <Detail
          label={t("agentAdvances.fields.status")}
          value={<StatusBadge status={advance.status} />}
        />
        <Detail label={t("agentAdvances.fields.advanceDate")} value={datetime(advance.advanceDate)} />
        <Detail
          label={t("agentAdvances.fields.agent")}
          value={`${advance.agent.code} - ${advance.agent.fullName}`}
        />
        <Detail
          label={t("agentAdvances.fields.advancedAmount")}
          value={`${money(advance.advancedAmount)} AMD`}
        />
      </div>
      {fundingAnalytics && (
        <section className={styles.section}>
          <h2>{t("fundingAnalytics.advance.title")}</h2>
          <div className={styles.inlineForm}>
            <TextField label={t("fundingAnalytics.filters.fromDate")} type="date" value={fundingFromDate} onChange={(event) => setFundingFromDate(event.target.value)} />
            <TextField label={t("fundingAnalytics.filters.toDate")} type="date" value={fundingToDate} onChange={(event) => setFundingToDate(event.target.value)} />
            <Button variant="secondary" onClick={() => void load()} disabled={loading}>{t("common.apply")}</Button>
          </div>
          <div className={styles.fundingMetrics}>
            <Detail label={t("fundingAnalytics.fields.originalAdvanceAmount")} value={`${money(fundingAnalytics.originalAdvanceAmount)} AMD`} />
            <Detail label={t("fundingAnalytics.fields.currentOutstandingAdvance")} value={`${money(fundingAnalytics.currentOutstandingAdvance)} AMD`} />
            <Detail label={t("fundingAnalytics.fields.advanceStatus")} value={fundingAnalytics.status ?? "-"} />
            <Detail label={t("fundingAnalytics.fields.advanceDate")} value={datetime(fundingAnalytics.advanceDate)} />
            <Detail label={t("fundingAnalytics.fields.closedDate")} value={datetime(fundingAnalytics.closedDate)} />
            <Detail label={t("fundingAnalytics.fields.totalDaysOutstanding")} value={fundingAnalytics.totalDaysOutstanding} />
            <Detail label={t("fundingAnalytics.fields.totalAcceptedPowderValue")} value={`${money(fundingAnalytics.totalAcceptedPowderValue)} AMD`} />
            <Detail label={t("fundingAnalytics.fields.totalKitcoValue")} value={`${money(fundingAnalytics.totalKitcoValue)} AMD`} />
            <Detail label={t("fundingAnalytics.fields.totalAgentPayout")} value={`${money(fundingAnalytics.totalAgentPayout)} AMD`} />
            <Detail label={t("fundingAnalytics.fields.grossCatalystMargin")} value={<span className={fundingAnalytics.grossCatalystMargin < 0 ? styles.profitNegative : ""}>{money(fundingAnalytics.grossCatalystMargin)} AMD</span>} />
            <Detail label={t("fundingAnalytics.fields.fundingCost")} value={`${money(fundingAnalytics.fundingCost)} AMD`} />
            <Detail label={t("fundingAnalytics.fields.netProfitLoss")} value={<span className={fundingAnalytics.netProfitLoss < 0 ? styles.profitNegative : styles.profitPositive}>{money(fundingAnalytics.netProfitLoss)} AMD</span>} />
            <Detail label={t("fundingAnalytics.fields.roi")} value={<span className={fundingAnalytics.roiPercent < 0 ? styles.profitNegative : ""}>{fundingAnalytics.roiPercent}%</span>} />
          </div>
          <h3>{t("fundingAnalytics.advance.allocations")}</h3>
          <DataTable columns={fundingAllocationColumns as any} data={fundingAnalytics.allocations ?? []} noResultsText={t("fundingAnalytics.advance.noAllocations")} />
          <h3>{t("fundingAnalytics.advance.dailyFundingHistory")}</h3>
          <div className={styles.fundingChart}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={fundingHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} stroke="#94a3b8" />
                <YAxis yAxisId="daily" stroke="#c4a96a" />
                <YAxis yAxisId="cumulative" orientation="right" stroke="#6ee7b7" />
                <Tooltip formatter={(value) => `${money(Number(value))} AMD`} labelFormatter={(value) => new Date(String(value)).toLocaleDateString()} />
                <Line yAxisId="daily" type="monotone" dataKey="dailyFundingCost" stroke="#c4a96a" strokeWidth={2} dot={false} name={t("fundingAnalytics.fields.dailyFundingCost")} />
                <Line yAxisId="cumulative" type="monotone" dataKey="cumulativeFundingCost" stroke="#6ee7b7" strokeWidth={2} dot={false} name={t("fundingAnalytics.fields.cumulativeFundingCost")} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <DataTable columns={fundingHistoryColumns as any} data={fundingHistory} noResultsText={t("fundingAnalytics.advance.noHistory")} />
        </section>
      )}
      <section className={styles.section}>
        <h2>{t("agentAdvances.sections.repaymentInformation")}</h2>
        <div className={styles.detailGrid}>
          <Detail
            label={t("agentAdvances.fields.currentDeadline")}
            value={<DeadlineWarning deadline={deadline} />}
          />
          <Detail
            label={t("agentAdvances.fields.extensionsGranted")}
            value={`${extensionCount}/${maximumExtensions}`}
          />
          <Detail
            label={t("agentAdvances.fields.extendedUntil")}
            value={extensionCount > 0 ? date(deadline.toISOString()) : "-"}
          />
          <Detail label={t("agentAdvances.fields.notes")} value={advance.notes} />
        </div>
      </section>
      <ExtensionHistory extensions={extensions} loading={extensionLoading} />
      <section className={styles.section}>
        <h2>{t("agentAdvances.sections.fundingSummary")}</h2>
        <div className={styles.financials}>
          <Detail label={t("agentAdvances.fields.fundingStatus")} value={fundingStatus} />
          <Detail
            label={t("agentAdvances.fields.advancedAmount")}
            value={money(advance.advancedAmount)}
          />
          <Detail
            label={t("agentAdvances.fields.allocatedAmount")}
            value={money(advance.allocatedAmount)}
          />
          <Detail label={t("agentAdvances.fields.remainingAmount")} value={money(remaining)} />
        </div>
        <div className={styles.progress}>
          <span
            style={{
              width: `${advance.advancedAmount ? Math.min(100, (advance.allocatedAmount / advance.advancedAmount) * 100) : 0}%`,
            }}
          />
        </div>
      </section>
      <section className={styles.section}>
        <h2>{t("agentAdvances.sections.allocations")}</h2>
        <DataTable
          columns={allocationColumns as any}
          data={advance.allocations ?? []}
          noResultsText={t("agentAdvances.allocation.empty")}
        />
      </section>
      <ExtensionModal
        open={extensionOpen}
        advance={advance}
        deadline={deadline}
        extensionCount={extensionCount}
        maximumExtensions={maximumExtensions}
        onClose={() => setExtensionOpen(false)}
        onSubmit={createExtension}
        saving={extensionLoading}
      />
      <ConfirmationModal
        open={allocationOpen}
        onOpenChange={setAllocationOpen}
        title={t("agentAdvances.allocation.title")}
        description={t("agentAdvances.allocation.description", { amount: money(remaining) })}
        confirmText={t("agentAdvances.actions.addAllocation")}
        confirmLoading={saving}
        preventClose
        onConfirm={() => void addAllocation()}
      >
        <div className={styles.modalFields}>
          <Select
            value={sourceId}
            onChange={(event) => setSourceId(event.target.value)}
          >
            <option value="">{t("agentAdvances.allocation.selectSource")}</option>
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.code} - {t("agentAdvances.allocation.currentBalance", { amount: money(source.currentBalance) })}
              </option>
            ))}
          </Select>
          <TextField
            label={t("agentAdvances.allocation.amount")}
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <Textarea
            label={t("agentAdvances.allocation.descriptionField")}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
      </ConfirmationModal>
      <ConfirmationModal
        open={Boolean(removeId)}
        onOpenChange={(value) => !value && setRemoveId(null)}
        title={t("agentAdvances.allocation.removeTitle")}
        description={t("agentAdvances.allocation.removeDescription")}
        confirmText={t("agentAdvances.actions.remove")}
        onConfirm={() => void remove()}
      />
      <ConfirmationModal
        open={activateOpen}
        onOpenChange={setActivateOpen}
        title={t("agentAdvances.activation.title")}
        description={t("agentAdvances.activation.description")}
        confirmText={t("agentAdvances.activation.confirm")}
        onConfirm={() => void activate()}
      />
    </div>
  );
};
