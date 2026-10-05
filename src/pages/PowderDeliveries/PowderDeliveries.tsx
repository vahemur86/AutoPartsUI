import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "react-toastify";
import { SectionHeader } from "@/components/common";
import {
  Button,
  ConfirmationModal,
  DataTable,
  Select,
  Tab,
  TabGroup,
  Textarea,
  TextField,
} from "@/ui-kit";
import { agentsService } from "@/services/agents";
import { agentContractsService } from "@/services/agentContracts";
import { powderDeliveriesService } from "@/services/powderDeliveries";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { AgentDto } from "@/types/agents";
import type {
  AgentAdvanceDto,
  AgentContractListItemDto,
} from "@/types/agentContracts";
import {
  powderDeliveryStatusMap,
  type MonthlyAgentPowderWeightDto,
  type PowderDeliveryListItemDto,
  type PowderDeliveryStatus,
  type PowderDeliveryDto,
} from "@/types/powderDeliveries";
import styles from "./PowderDeliveries.module.css";

const statuses: PowderDeliveryStatus[] = [
  "Draft",
  "Valuated",
  "Confirmed",
  "Cancelled",
];
const toStatusLabel = (value?: unknown): PowderDeliveryStatus | "" => {
  if (typeof value === "number") {
    return (
      (powderDeliveryStatusMap[
        value as keyof typeof powderDeliveryStatusMap
      ] as PowderDeliveryStatus | undefined) ?? ""
    );
  }
  if (typeof value === "string") {
    const normalized = value.trim();
    if (normalized.toLowerCase() === "draft") return "Draft";
    if (normalized.toLowerCase() === "valuated") return "Valuated";
    if (normalized.toLowerCase() === "confirmed") return "Confirmed";
    if (normalized.toLowerCase() === "cancelled") return "Cancelled";
  }
  return "";
};
const normalizeStatus = (value?: unknown) =>
  toStatusLabel(value)?.toLowerCase() ?? "";
const amount = (value: number | null | undefined, currency = "") =>
  value == null
    ? "-"
    : `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)}${currency}`;
const timestamp = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "-";
const agentLabel = (agent: AgentDto) =>
  `${agent.code} - ${agent.customer?.fullName || "—"}`;
const active = (status: string) => status === "Active" || status === "1";

const DeliveryStatus = ({ status }: { status: PowderDeliveryStatus }) => {
  const { t } = useTranslation();
  return (
    <span className={`${styles.status} ${styles[`status${status}`]}`}>
      {t(`powderDeliveries.statuses.${status.toLowerCase()}`)}
    </span>
  );
};
const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className={styles.field}>
    <span>{label}</span>
    <strong>{value ?? "-"}</strong>
  </div>
);

const useActiveAgents = () => {
  const { t } = useTranslation();
  const [agents, setAgents] = useState<AgentDto[]>([]);
  useEffect(() => {
    void agentsService
      .getAgents({ page: 1, pageSize: 200, status: 0 })
      .then((response) => setAgents(response.results ?? []))
      .catch((error) =>
          toast.error(getApiErrorMessage(error, t("powderDeliveries.errors.loadAgentsFailed"))),
      );
        }, [t]);
  return agents;
};

const useDeliveryColumns = (
  confirmingId: string | null = null,
  onConfirm?: (id: string) => Promise<void>,
) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return useMemo(
    () => [
      { accessorKey: "deliveryNumber", header: t("powderDeliveries.fields.deliveryNumber") },
      {
        id: "date",
        header: t("powderDeliveries.fields.deliveryDate"),
        cell: ({ row }: any) => timestamp(row.original.deliveryDate),
      },
      {
        id: "agent",
        header: t("powderDeliveries.fields.agent"),
        cell: ({ row }: any) =>
          `${row.original.agent.code} - ${row.original.agent.fullName}`,
      },
      {
        id: "contract",
        header: t("powderDeliveries.fields.contract"),
        cell: ({ row }: any) => row.original.contract.contractNumber,
      },
      {
        id: "advance",
        header: t("powderDeliveries.fields.advance"),
        cell: ({ row }: any) => row.original.advance?.advanceNumber ?? "-",
      },
      {
        id: "weight",
        header: t("powderDeliveries.fields.netWeight"),
        cell: ({ row }: any) => amount(row.original.netWeightKg),
      },
      {
        id: "value",
        header: t("powderDeliveries.fields.totalValue"),
        cell: ({ row }: any) => amount(row.original.totalValueAmd),
      },
      {
        accessorKey: "status",
        header: t("powderDeliveries.fields.status"),
        cell: ({ row }: any) => {
          const label = toStatusLabel(row.original.status) || "Draft";
          return <DeliveryStatus status={label as PowderDeliveryStatus} />;
        },
      },
      {
        id: "created",
        header: t("powderDeliveries.fields.createdAt"),
        cell: ({ row }: any) => timestamp(row.original.createdAt),
      },
      {
        id: "actions",
        header: t("powderDeliveries.fields.actions"),
        cell: ({ row }: any) => (
          <div className={styles.inlineActions}>
            {onConfirm &&
            normalizeStatus(row.original.status) === "valuated" ? (
              <Button
                size="small"
                variant="primary"
                disabled={
                  confirmingId === row.original.id || confirmingId !== null
                }
                onClick={() => void onConfirm(row.original.id)}
              >
                {confirmingId === row.original.id ? t("common.loading") : t("powderDeliveries.actions.confirm")}
              </Button>
            ) : null}
            <Button
              size="small"
              variant="secondary"
              onClick={() => navigate(`/agents/cash-powder/deliveries/${row.original.id}`)}
            >
              {t("powderDeliveries.actions.view")}
            </Button>
          </div>
        ),
      },
    ],
    [confirmingId, navigate, onConfirm, t],
  );
};

const MonthlyPowderReport = ({ active }: { active: boolean }) => {
  const { t, i18n } = useTranslation();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [results, setResults] = useState<MonthlyAgentPowderWeightDto[]>([]);
  const rows = results.map((item) => ({ ...item, id: item.agentId }));
  const [loading, setLoading] = useState(false);
  const monthKeys = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ] as const;
  const monthOptions = Array.from({ length: 12 }, (_, index) => ({
    value: index + 1,
    label: t(`monthlyPowder.months.${monthKeys[index]}`),
  }));
  const yearOptions = Array.from(
    { length: 7 },
    (_, index) => now.getFullYear() - 5 + index,
  );
  const updatePeriod = (nextYear: number, nextMonth: number) => {
    setResults([]);
    setLoading(true);
    setYear(nextYear);
    setMonth(nextMonth);
  };

  useEffect(() => {
    if (!active) return;
    let currentRequest = true;
    setResults([]);
    setLoading(true);
    powderDeliveriesService
      .getMonthlyAgentPowder(year, month)
      .then((response) => {
        if (currentRequest) setResults(response ?? []);
      })
      .catch((error) => {
        if (currentRequest)
          toast.error(
            getApiErrorMessage(error, t("powderDeliveries.errors.monthlyReportFailed")),
          );
      })
      .finally(() => {
        if (currentRequest) setLoading(false);
      });
    return () => {
      currentRequest = false;
    };
  }, [active, month, year]);

  const columns = useMemo<ColumnDef<(typeof rows)[number]>[]>(
    () => [
      { id: "number", header: "#", cell: ({ row }) => row.index + 1 },
      {
        accessorKey: "agentName",
        header: t("monthlyPowder.agent"),
        cell: ({ row }) => row.original.agentName || t("common.noName"),
      },
      {
        id: "weight",
        header: t("monthlyPowder.powderWeight"),
        cell: ({ row }) =>
          `${new Intl.NumberFormat(i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(row.original.totalPowderKg)} kg`,
      },
    ],
    [i18n.language, t],
  );

  return (
    <div className={styles.monthlyReport}>
      <div className={styles.monthFilters}>
        <div className={styles.periodField}>
          <span>{t("monthlyPowder.month")}</span>
          <Select
            value={String(month)}
            onChange={(event) => updatePeriod(year, Number(event.target.value))}
          >
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div className={styles.periodField}>
          <span>{t("monthlyPowder.year")}</span>
          <Select
            value={String(year)}
            onChange={(event) =>
              updatePeriod(Number(event.target.value), month)
            }
          >
            {yearOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <h2 className={styles.reportTitle}>{t("monthlyPowder.totalPowder")}</h2>
      <DataTable
        columns={columns}
        data={rows}
        isLoading={loading}
        loadingText={t("monthlyPowder.loading")}
        noResultsText={t("monthlyPowder.noData")}
      />
    </div>
  );
};

export const PowderDeliveriesList = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"deliveries" | "monthly">(
    "deliveries",
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const agents = useActiveAgents();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [results, setResults] = useState<PowderDeliveryListItemDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || 10);
  const agentId = searchParams.get("agentId") || "";
  const contractId = searchParams.get("agentContractId") || "";
  const advanceId = searchParams.get("agentAdvanceId") || "";
  const status = searchParams.get("status") || "";
  const number = searchParams.get("deliveryNumber") || "";
  const from = searchParams.get("deliveryDateFrom") || "";
  const to = searchParams.get("deliveryDateTo") || "";
  const filter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    value ? next.set(key, value) : next.delete(key);
    next.set("page", "1");
    setSearchParams(next);
  };
  const load = async () => {
    setLoading(true);
    try {
      const response = await powderDeliveriesService.list({
        page,
        pageSize,
        agentId: agentId || undefined,
        agentContractId: contractId || undefined,
        agentAdvanceId: advanceId || undefined,
        status: status || undefined,
        deliveryNumber: number || undefined,
        deliveryDateFrom: from || undefined,
        deliveryDateTo: to || undefined,
      });
      setResults(response.results ?? []);
      setTotal(response.totalItems);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, t("powderDeliveries.errors.loadFailed")),
      );
    } finally {
      setLoading(false);
    }
  };
  const confirmDelivery = async (id: string) => {
    if (confirmingId) return;
    setConfirmingId(id);
    try {
      await powderDeliveriesService.confirm(id);
      toast.success(t("powderDeliveries.messages.confirmed"));
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("powderDeliveries.errors.confirmFailed")));
    } finally {
      setConfirmingId(null);
    }
  };
  const columns = useDeliveryColumns(confirmingId, confirmDelivery);
  useEffect(() => {
    void load();
  }, [
    page,
    pageSize,
    agentId,
    contractId,
    advanceId,
    status,
    number,
    from,
    to,
  ]);
  return (
    <div className={styles.page}>
      <SectionHeader title={t("powderDeliveries.title")} />
      <TabGroup variant="segmented" role="tablist">
        <Tab
          text={t("monthlyPowder.deliveriesTab")}
          active={activeTab === "deliveries"}
          onClick={() => setActiveTab("deliveries")}
        />
        <Tab
          text={t("monthlyPowder.title")}
          active={activeTab === "monthly"}
          onClick={() => setActiveTab("monthly")}
        />
      </TabGroup>
      <div role="tabpanel" hidden={activeTab !== "deliveries"}>
        <div className={styles.filters}>
          <Select
            value={agentId}
            onChange={(event) => filter("agentId", event.target.value)}
          >
            <option value="">{t("powderDeliveries.filters.allAgents")}</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agentLabel(agent)}
              </option>
            ))}
          </Select>
          <Select
            value={status}
            onChange={(event) => filter("status", event.target.value)}
          >
            <option value="">{t("powderDeliveries.filters.allStatuses")}</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {t(`powderDeliveries.statuses.${item.toLowerCase()}`)}
              </option>
            ))}
          </Select>
          <TextField
            label={t("powderDeliveries.fields.contractId")}
            value={contractId}
            onChange={(event) => filter("agentContractId", event.target.value)}
          />
          <TextField
            label={t("powderDeliveries.fields.advanceId")}
            value={advanceId}
            onChange={(event) => filter("agentAdvanceId", event.target.value)}
          />
          <TextField
            label={t("powderDeliveries.fields.deliveryNumber")}
            value={number}
            onChange={(event) => filter("deliveryNumber", event.target.value)}
          />
          <TextField
            label={t("powderDeliveries.fields.from")}
            type="date"
            value={from}
            onChange={(event) => filter("deliveryDateFrom", event.target.value)}
          />
          <TextField
            label={t("powderDeliveries.fields.to")}
            type="date"
            value={to}
            onChange={(event) => filter("deliveryDateTo", event.target.value)}
          />
        </div>
        <div className={styles.summary}>
          <span>{t("powderDeliveries.list.count", { count: total })}</span>
          <Button
            variant="secondary"
            size="small"
            onClick={() =>
              setSearchParams({ page: "1", pageSize: String(pageSize) })
            }
          >
            {t("common.reset")}
          </Button>
        </div>
        <DataTable
          columns={columns as any}
          data={results}
          isLoading={loading}
          manualPagination
          pageCount={Math.max(1, Math.ceil(total / pageSize))}
          pageIndex={page - 1}
          onPaginationChange={(index) => filter("page", String(index + 1))}
          noResultsText={t("powderDeliveries.list.empty")}
          loadingText={t("powderDeliveries.list.loading")}
        />
      </div>
      <div role="tabpanel" hidden={activeTab !== "monthly"}>
        <MonthlyPowderReport active={activeTab === "monthly"} />
      </div>
    </div>
  );
};

export const CreatePowderDelivery = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const agents = useActiveAgents();
  const [contracts, setContracts] = useState<AgentContractListItemDto[]>([]);
  const [advances, setAdvances] = useState<AgentAdvanceDto[]>([]);
  const [agentId, setAgentId] = useState("");
  const [contractId, setContractId] = useState("");
  const [advanceId, setAdvanceId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(
    new Date().toISOString().slice(0, 16),
  );
  const [gross, setGross] = useState("");
  const [net, setNet] = useState("");
  const [pt, setPt] = useState("");
  const [pd, setPd] = useState("");
  const [rh, setRh] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    setContractId("");
    setAdvanceId("");
    setAdvances([]);
    if (!agentId) {
      setContracts([]);
      return;
    }
    void agentContractsService
      .listContracts({ agentId, status: "Active", page: 1, pageSize: 200 })
      .then((response) => setContracts(response.results ?? []))
      .catch((error) =>
        toast.error(
          getApiErrorMessage(error, t("powderDeliveries.errors.loadContractsFailed")),
        ),
      );
  }, [agentId, t]);
  useEffect(() => {
    setAdvanceId("");
    if (!contractId) {
      setAdvances([]);
      return;
    }
    void agentContractsService
      .listContractAdvances(contractId)
      .then((response) =>
        setAdvances(response.filter((item) => active(item.status))),
      )
      .catch((error) =>
        toast.error(
          getApiErrorMessage(error, t("powderDeliveries.errors.loadAdvancesFailed")),
        ),
      );
  }, [contractId, t]);
  const submit = async () => {
    const grossValue = Number(gross);
    const netValue = Number(net);
    const ptValue = Number(pt || 0);
    const pdValue = Number(pd || 0);
    const rhValue = Number(rh || 0);
    const next: Record<string, string> = {};
    if (!agentId) next.agent = t("powderDeliveries.validation.agentRequired");
    if (!contractId) next.contract = t("powderDeliveries.validation.contractRequired");
    if (!deliveryDate) next.date = t("powderDeliveries.validation.dateRequired");
    if (!(grossValue > 0)) next.gross = t("powderDeliveries.validation.grossPositive");
    if (!(netValue > 0)) next.net = t("powderDeliveries.validation.netPositive");
    else if (netValue > grossValue)
      next.net = t("powderDeliveries.validation.netNotAboveGross");
    if (
      [ptValue, pdValue, rhValue].some((value) => value < 0) ||
      !(ptValue > 0 || pdValue > 0 || rhValue > 0)
    )
      next.metals = t("powderDeliveries.create.metalsValidation");
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      const id = await powderDeliveriesService.create({
        agentId,
        agentContractId: contractId,
        agentAdvanceId: advanceId || null,
        deliveryDate: new Date(deliveryDate).toISOString(),
        grossWeightKg: grossValue,
        netWeightKg: netValue,
        ptGrams: ptValue,
        pdGrams: pdValue,
        rhGrams: rhValue,
        notes: notes.trim() || null,
      });
      toast.success(t("powderDeliveries.messages.created"));
      navigate(`/agents/cash-powder/deliveries/${id}`);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, t("powderDeliveries.errors.createFailed")),
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className={styles.page}>
      <SectionHeader title={t("powderDeliveries.create.title")} goBack />
      <div className={styles.form}>
        <div>
          <label>{t("powderDeliveries.fields.agent")}</label>
          <Select
            value={agentId}
            onChange={(event) => setAgentId(event.target.value)}
          >
            <option value="">{t("powderDeliveries.create.selectActiveAgent")}</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agentLabel(agent)}
              </option>
            ))}
          </Select>
          {errors.agent && (
            <small className={styles.error}>{errors.agent}</small>
          )}
        </div>
        <div>
          <label>{t("powderDeliveries.create.activeContract")}</label>
          <Select
            value={contractId}
            disabled={!agentId}
            onChange={(event) => setContractId(event.target.value)}
          >
            <option value="">{t("powderDeliveries.create.selectActiveContract")}</option>
            {contracts.map((contract) => (
              <option key={contract.id} value={contract.id}>
                {contract.contractNumber}
              </option>
            ))}
          </Select>
          {errors.contract && (
            <small className={styles.error}>{errors.contract}</small>
          )}
        </div>
        <div>
          <label>{t("powderDeliveries.create.activeAdvanceOptional")}</label>
          <Select
            value={advanceId}
            disabled={!contractId}
            onChange={(event) => setAdvanceId(event.target.value)}
          >
            <option value="">{t("powderDeliveries.create.noAdvance")}</option>
            {advances.map((advance) => (
              <option key={advance.id} value={advance.id}>
                {advance.advanceNumber}
              </option>
            ))}
          </Select>
        </div>
        <TextField
          label={t("powderDeliveries.fields.deliveryDate")}
          type="datetime-local"
          value={deliveryDate}
          onChange={(event) => setDeliveryDate(event.target.value)}
          error={Boolean(errors.date)}
          helperText={errors.date}
        />
        <div className={styles.grid}>
          <TextField
            label={t("powderDeliveries.fields.grossWeight")}
            type="number"
            min="0.001"
            value={gross}
            onChange={(event) => setGross(event.target.value)}
            error={Boolean(errors.gross)}
            helperText={errors.gross}
          />
          <TextField
            label={t("powderDeliveries.fields.netWeight")}
            type="number"
            min="0.001"
            value={net}
            onChange={(event) => setNet(event.target.value)}
            error={Boolean(errors.net)}
            helperText={errors.net}
          />
        </div>
        <div className={styles.grid}>
          <TextField
            label={t("powderDeliveries.fields.pt")}
            type="number"
            min="0"
            value={pt}
            onChange={(event) => setPt(event.target.value)}
          />
          <TextField
            label={t("powderDeliveries.fields.pd")}
            type="number"
            min="0"
            value={pd}
            onChange={(event) => setPd(event.target.value)}
          />
          <TextField
            label={t("powderDeliveries.fields.rh")}
            type="number"
            min="0"
            value={rh}
            onChange={(event) => setRh(event.target.value)}
          />
        </div>
        {errors.metals && (
          <small className={styles.error}>{errors.metals}</small>
        )}
        <Textarea
          label={t("powderDeliveries.fields.notes")}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? t("powderDeliveries.actions.creating") : t("powderDeliveries.actions.create")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export const PowderDeliveryDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState<PowderDeliveryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"confirm" | "cancel" | null>(null);
  const [working, setWorking] = useState(false);
  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      setDelivery(await powderDeliveriesService.get(id));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("powderDeliveries.errors.detailsFailed")));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [id]);
  const valuate = async () => {
    if (!id) return;
    setWorking(true);
    try {
      await powderDeliveriesService.valuate(id);
      toast.success(t("powderDeliveries.messages.valuated"));
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("powderDeliveries.errors.valuateFailed")));
    } finally {
      setWorking(false);
    }
  };
  const execute = async () => {
    if (!id || !action) return;
    setWorking(true);
    try {
      if (action === "confirm") await powderDeliveriesService.confirm(id);
      else await powderDeliveriesService.cancel(id);
      toast.success(t(action === "confirm" ? "powderDeliveries.messages.confirmedDetails" : "powderDeliveries.messages.cancelled"));
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("powderDeliveries.errors.actionFailed", { action: t(action === "confirm" ? "powderDeliveries.actions.confirm" : "powderDeliveries.actions.cancelDelivery") })));
    } finally {
      setWorking(false);
      setAction(null);
    }
  };
  if (loading || !delivery)
    return (
      <div className={styles.page}>
        <SectionHeader title={t("powderDeliveries.details.title")} goBack />
        {t("powderDeliveries.details.loading")}
      </div>
    );
  const statusLabel = toStatusLabel(delivery.status) || "Draft";
  const draft = statusLabel === "Draft";
  const valuated = statusLabel === "Valuated";
  const snapshot = delivery.priceSnapshot;
  return (
    <div className={styles.page}>
      <SectionHeader
        title={delivery.deliveryNumber}
        goBack
        actions={
          <div className={styles.headerActions}>
            <Button
              variant="secondary"
              onClick={() =>
                navigate(`/agents/cash-powder/contracts/${delivery.contract.id}`)
              }
            >
              {t("powderDeliveries.actions.viewContract")}
            </Button>
            {draft && (
              <Button onClick={valuate} disabled={working}>
                {working ? t("powderDeliveries.actions.valuating") : t("powderDeliveries.actions.valuate")}
              </Button>
            )}
            {valuated && (
              <Button onClick={() => setAction("confirm")} disabled={working}>
                {t("powderDeliveries.actions.confirmDelivery")}
              </Button>
            )}
            {(draft || valuated) && (
              <Button
                variant="danger"
                onClick={() => setAction("cancel")}
                disabled={working}
              >
                {t("powderDeliveries.actions.cancelDelivery")}
              </Button>
            )}
          </div>
        }
      />
      <div className={styles.lifecycle}>
        {statuses.slice(0, 3).map((status) => (
          <span
            key={status}
            className={statusLabel === status ? styles.currentStep : ""}
          >
            {t(`powderDeliveries.statuses.${status.toLowerCase()}`)}
          </span>
        ))}
      </div>
      {statusLabel === "Cancelled" && (
        <div className={styles.cancelled}>
          {t("powderDeliveries.details.cancelledReadOnly")}
        </div>
      )}
      <section className={styles.section}>
        <h2>{t("powderDeliveries.details.delivery")}</h2>
        <div className={styles.detailGrid}>
          <Field
            label={t("powderDeliveries.fields.status")}
            value={
              <DeliveryStatus status={statusLabel as PowderDeliveryStatus} />
            }
          />
          <Field
            label={t("powderDeliveries.fields.deliveryDate")}
            value={timestamp(delivery.deliveryDate)}
          />
          <Field label={t("powderDeliveries.fields.notes")} value={delivery.notes} />
        </div>
      </section>
      <section className={styles.section}>
        <h2>{t("powderDeliveries.details.relations")}</h2>
        <div className={styles.detailGrid}>
          <Field
            label={t("powderDeliveries.fields.agent")}
            value={`${delivery.agent.code} - ${delivery.agent.fullName}`}
          />
          <Field label={t("powderDeliveries.fields.contract")} value={delivery.contract.contractNumber} />
          <Field label={t("powderDeliveries.fields.advance")} value={delivery.advance?.advanceNumber} />
        </div>
      </section>
      <section className={styles.section}>
        <h2>{t("powderDeliveries.details.weights")}</h2>
        <div className={styles.detailGrid}>
          <Field
            label={t("powderDeliveries.details.grossWeight")}
            value={`${amount(delivery.grossWeightKg)} kg`}
          />
          <Field
            label={t("powderDeliveries.details.netWeight")}
            value={`${amount(delivery.netWeightKg)} kg`}
          />
        </div>
      </section>
      <section className={styles.section}>
        <h2>{t("powderDeliveries.details.metalContent")}</h2>
        <div className={styles.detailGrid}>
          <Field label="Pt" value={`${amount(delivery.ptGrams)} g`} />
          <Field label="Pd" value={`${amount(delivery.pdGrams)} g`} />
          <Field label="Rh" value={`${amount(delivery.rhGrams)} g`} />
        </div>
      </section>
      <section className={styles.section}>
        <h2>{t("powderDeliveries.details.valuation")}</h2>
        <div className={styles.detailGrid}>
          <Field
            label={t("powderDeliveries.details.totalValue")}
            value={amount(delivery.totalValueUsd, " USD")}
          />
          <Field
            label={t("powderDeliveries.details.totalValue")}
            value={amount(delivery.totalValueAmd, " AMD")}
          />
        </div>
      </section>
      <section className={styles.section}>
        <h2>{t("powderDeliveries.details.frozenPriceSnapshot")}</h2>
        {snapshot ? (
          <div className={styles.detailGrid}>
            <Field label={t("powderDeliveries.fields.priceDate")} value={timestamp(snapshot.priceDate)} />
            <Field
              label={t("powderDeliveries.fields.ptPrice")}
              value={amount(snapshot.ptPriceUsdPerGram, " USD/g")}
            />
            <Field
              label={t("powderDeliveries.fields.pdPrice")}
              value={amount(snapshot.pdPriceUsdPerGram, " USD/g")}
            />
            <Field
              label={t("powderDeliveries.fields.rhPrice")}
              value={amount(snapshot.rhPriceUsdPerGram, " USD/g")}
            />
            <Field label={t("powderDeliveries.fields.usdAmdRate")} value={amount(snapshot.usdAmdRate)} />
            <Field label={t("powderDeliveries.fields.source")} value={snapshot.source} />
            <Field label={t("powderDeliveries.fields.capturedAt")} value={timestamp(snapshot.capturedAt)} />
            <Field label={t("powderDeliveries.fields.createdBy")} value={snapshot.createdBy} />
          </div>
        ) : (
          <div className={styles.muted}>{t("powderDeliveries.details.notValuated")}</div>
        )}
      </section>
      <ConfirmationModal
        open={Boolean(action)}
        onOpenChange={(open) => !open && setAction(null)}
        title={t(action === "confirm" ? "powderDeliveries.details.confirmTitle" : "powderDeliveries.details.cancelTitle")}
        description={
          action === "confirm"
            ? t("powderDeliveries.details.confirmDescription")
            : t("powderDeliveries.details.cancelDescription")
        }
        confirmText={
          action === "confirm" ? t("powderDeliveries.actions.confirmDelivery") : t("powderDeliveries.actions.cancelDelivery")
        }
        confirmLoading={working}
        onConfirm={execute}
      />
    </div>
  );
};

export const PowderDeliveryHistory = ({
  kind,
}: {
  kind: "agent" | "contract";
}) => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const columns = useDeliveryColumns();
  const [results, setResults] = useState<PowderDeliveryListItemDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || 10);
  const status = searchParams.get("status") || "";
  const number = searchParams.get("deliveryNumber") || "";
  const from = searchParams.get("deliveryDateFrom") || "";
  const to = searchParams.get("deliveryDateTo") || "";
  const filter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    value ? next.set(key, value) : next.delete(key);
    next.set("page", "1");
    setSearchParams(next);
  };
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const params = {
          page,
          pageSize,
          status: status || undefined,
          deliveryNumber: number || undefined,
          deliveryDateFrom: from || undefined,
          deliveryDateTo: to || undefined,
        };
        const response =
          kind === "agent"
            ? await powderDeliveriesService.listForAgent(id, params)
            : await powderDeliveriesService.listForContract(id, params);
        setResults(response.results ?? []);
        setTotal(response.totalItems);
      } catch (error) {
        toast.error(
          getApiErrorMessage(error, t("powderDeliveries.errors.historyFailed")),
        );
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id, kind, page, pageSize, status, number, from, to, t]);
  return (
    <div className={styles.page}>
      <SectionHeader
        title={
          kind === "agent"
            ? t("powderDeliveries.history.agentTitle")
            : t("powderDeliveries.history.contractTitle")
        }
        goBack
      />
      <div className={styles.filters}>
        <Select
          value={status}
          onChange={(event) => filter("status", event.target.value)}
        >
          <option value="">{t("powderDeliveries.filters.allStatuses")}</option>
          {statuses.map((item) => (
            <option key={item} value={item}>
              {t(`powderDeliveries.statuses.${item.toLowerCase()}`)}
            </option>
          ))}
        </Select>
        <TextField
          label={t("powderDeliveries.fields.deliveryNumber")}
          value={number}
          onChange={(event) => filter("deliveryNumber", event.target.value)}
        />
        <TextField
          label={t("powderDeliveries.fields.from")}
          type="date"
          value={from}
          onChange={(event) => filter("deliveryDateFrom", event.target.value)}
        />
        <TextField
          label={t("powderDeliveries.fields.to")}
          type="date"
          value={to}
          onChange={(event) => filter("deliveryDateTo", event.target.value)}
        />
      </div>
      <div className={styles.summary}>
          <span>{t("powderDeliveries.list.count", { count: total })}</span>
        <Button
          variant="secondary"
          size="small"
          onClick={() =>
            setSearchParams({ page: "1", pageSize: String(pageSize) })
          }
        >
            {t("common.reset")}
        </Button>
      </div>
      <DataTable
        columns={columns as any}
        data={results}
        isLoading={loading}
        manualPagination
        pageCount={Math.max(1, Math.ceil(total / pageSize))}
        pageIndex={page - 1}
        onPaginationChange={(index) => filter("page", String(index + 1))}
          noResultsText={t("powderDeliveries.list.empty")}
          loadingText={t("powderDeliveries.list.loading")}
      />
    </div>
  );
};
