import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Plus } from "lucide-react";
import { SectionHeader } from "@/components/common";
import {
  Button,
  ConfirmationModal,
  DataTable,
  Select,
  Textarea,
  TextField,
} from "@/ui-kit";
import { agentsService } from "@/services/agents";
import { agentContractsService } from "@/services/agentContracts";
import { capitalSourcesService } from "@/services/capitalSources";
import { powderDeliveriesService } from "@/services/powderDeliveries";
import { repaymentRulesService } from "@/services/repaymentRules";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { AgentDto } from "@/types/agents";
import type { CapitalSourceDto } from "@/types/capitalSources";
import type {
  RepaymentRule,
  RepaymentRuleVersion,
} from "@/types/repaymentRules";
import type {
  AgentAdvanceDto,
  AgentContractDto,
  AgentContractListItemDto,
  AgentContractStatus,
} from "@/types/agentContracts";
import {
  isDraftAgentStatus,
  isActiveAgentStatus,
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
const agentName = (agent: AgentDto) =>
  `${agent.code} - ${agent.customer?.fullName || "—"}`;
const isDraft = (status: string) => isDraftAgentStatus(status);
const isActiveRuleVersion = (status: RepaymentRuleVersion["status"]) => {
  const value = String(status ?? "")
    .trim()
    .toLowerCase();
  return (
    value === "active" ||
    value === "1" ||
    value === "enabled" ||
    value === "true"
  );
};

const StatusBadge = ({ status }: { status: string | number }) => {
  const { t } = useTranslation();
  const label = normalizeAgentStatus(status) || String(status ?? "");
  return (
    <span className={`${styles.status} ${styles[`status${label}`] ?? ""}`}>
      {t(`agentContracts.statuses.${label.toLowerCase()}`, { defaultValue: label })}
    </span>
  );
};

const useAgents = () => {
  const [agents, setAgents] = useState<AgentDto[]>([]);
  useEffect(() => {
    void agentsService
      .getAgents({ page: 1, pageSize: 200, status: 0 })
      .then((result) => setAgents(result.results ?? []));
  }, []);
  return agents;
};

export const AgentContractsList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<AgentContractListItemDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || 10);
  const status = searchParams.get("status") || "";
  const contractNumber = searchParams.get("contractNumber") || "";
  const agentId = searchParams.get("agentId") || "";
  const from = searchParams.get("contractDateFrom") || "";
  const to = searchParams.get("contractDateTo") || "";
  const agents = useAgents();
  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    value ? next.set(key, value) : next.delete(key);
    next.set("page", "1");
    setSearchParams(next);
  };
  const load = async () => {
    setLoading(true);
    try {
      const result = await agentContractsService.listContracts({
        page,
        pageSize,
        status: status || undefined,
        agentId: agentId || undefined,
        contractNumber: contractNumber || undefined,
        contractDateFrom: from || undefined,
        contractDateTo: to || undefined,
      });
      setItems(result.results ?? []);
      setTotal(result.totalItems);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("agentContracts.errors.loadFailed")));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [page, pageSize, status, agentId, contractNumber, from, to]);
  const columns = useMemo(
    () => [
      { accessorKey: "contractNumber", header: t("agentContracts.fields.contractNumber") },
      {
        id: "agent",
        header: t("agentContracts.fields.agent"),
        cell: ({ row }: any) =>
          `${row.original.agent.code} - ${row.original.agent.fullName}`,
      },
      {
        id: "contractDate",
        header: t("agentContracts.fields.contractDate"),
        cell: ({ row }: any) => date(row.original.contractDate),
      },
      {
        accessorKey: "status",
        header: t("agentContracts.fields.status"),
        cell: ({ row }: any) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "advanced",
        header: t("agentContracts.fields.advanced"),
        cell: ({ row }: any) => money(row.original.totalAdvancedAmount),
      },
      {
        id: "repaid",
        header: t("agentContracts.fields.repaid"),
        cell: ({ row }: any) => money(row.original.totalRepaidAmount),
      },
      {
        id: "outstanding",
        header: t("agentContracts.fields.outstanding"),
        cell: ({ row }: any) => money(row.original.outstandingAmount),
      },
      {
        id: "created",
        header: t("agentContracts.fields.createdAt"),
        cell: ({ row }: any) => datetime(row.original.createdAt),
      },
      {
        id: "actions",
        header: t("agentContracts.fields.actions"),
        cell: ({ row }: any) => (
          <Button
            size="small"
            variant="secondary"
             onClick={() => navigate(`/agents/cash-powder/contracts/${row.original.id}`)}
          >
            {t("agentContracts.actions.view")}
          </Button>
        ),
      },
    ],
    [navigate, t],
  );
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className={styles.page}>
      <SectionHeader
        title={t("agentContracts.title")}
        actions={
          <Button onClick={() => navigate("/agents/cash-powder/contracts/create")}>
            <Plus size={14} /> {t("agentContracts.actions.createContract")}
          </Button>
        }
      />
      <div className={styles.filters}>
        <Select
          value={agentId}
          onChange={(event) => setFilter("agentId", event.target.value)}
        >
          <option value="">{t("agentContracts.filters.allAgents")}</option>
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
          <option value="">{t("agentContracts.filters.allStatuses")}</option>
          {statuses.map((item) => (
            <option key={item} value={item}>{t(`agentContracts.statuses.${item.toLowerCase()}`)}</option>
          ))}
        </Select>
        <TextField
          label={t("agentContracts.fields.contractNumber")}
          value={contractNumber}
          onChange={(event) => setFilter("contractNumber", event.target.value)}
        />
        <TextField
          label={t("agentContracts.fields.from")}
          type="date"
          value={from}
          onChange={(event) =>
            setFilter("contractDateFrom", event.target.value)
          }
        />
        <TextField
          label={t("agentContracts.fields.to")}
          type="date"
          value={to}
          onChange={(event) => setFilter("contractDateTo", event.target.value)}
        />
      </div>
      <div className={styles.summary}>
        <span>{t("agentContracts.list.count", { count: total })}</span>
        <Button
          size="small"
          variant="secondary"
          onClick={() =>
            setSearchParams({ page: "1", pageSize: String(pageSize) })
          }
        >
          {t("common.reset")}
        </Button>
      </div>
      <DataTable
        columns={columns as any}
        data={items}
        isLoading={loading}
        manualPagination
        pageCount={totalPages}
        pageIndex={page - 1}
        onPaginationChange={(index) => setFilter("page", String(index + 1))}
        noResultsText={t("agentContracts.list.empty")}
        loadingText={t("agentContracts.list.loading")}
      />
    </div>
  );
};

export const CreateAgentContract = ({ productCreditMode = false }: { productCreditMode?: boolean }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id: contractId } = useParams();
  const agents = useAgents();
  const [rules, setRules] = useState<RepaymentRule[]>([]);
  const [versions, setVersions] = useState<RepaymentRuleVersion[]>([]);
  const [existingContract, setExistingContract] = useState<AgentContractDto | null>(null);
  const [contractLoading, setContractLoading] = useState(Boolean(contractId));
  const [agentId, setAgentId] = useState("");
  const [versionId, setVersionId] = useState("");
  const [allowsProductAdvance, setAllowsProductAdvance] = useState(productCreditMode);
  const [contractDate, setContractDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!contractId) return;
    let isCancelled = false;
    void agentContractsService
      .getContract(contractId)
      .then((contract) => {
        if (isCancelled) return;
        setExistingContract(contract);
        setAgentId(contract.agent.id);
        setVersionId(contract.repaymentTerms.repaymentRuleVersionId);
        setContractDate(new Date(contract.contractDate).toISOString().slice(0, 10));
        setNotes(contract.notes ?? "");
        setAllowsProductAdvance(contract.allowsProductAdvance === true);
      })
      .catch((error) => {
        toast.error(getApiErrorMessage(error, t("agentContracts.errors.loadDetailsFailed")));
      })
      .finally(() => {
        if (!isCancelled) setContractLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [contractId, t]);
  useEffect(() => {
    void repaymentRulesService
      .getRepaymentRules()
      .then(setRules)
      .catch((error) =>
        toast.error(
          getApiErrorMessage(error, t("agentContracts.errors.loadRulesFailed")),
        ),
      );
  }, []);
  useEffect(() => {
    void Promise.all(
      rules.map((rule) =>
        repaymentRulesService.getRepaymentRuleVersions(rule.id),
      ),
    )
      .then((lists) =>
        setVersions(
          lists.flat().filter((version) => isActiveRuleVersion(version.status)),
        ),
      )
      .catch(() => setVersions([]));
  }, [rules]);
  const selected = versions.find((version) => version.id === versionId);
  const currentVersionMissing = Boolean(
    existingContract &&
      !versions.some((version) => version.id === existingContract.repaymentTerms.repaymentRuleVersionId),
  );
  const label = (version: RepaymentRuleVersion) =>
    t("agentContracts.form.ruleVersion", { name: rules.find((rule) => rule.id === version.ruleId)?.name ?? t("common.unknown"), version: version.version });
  const submit = async () => {
    const next: Record<string, string> = {};
    if (!agentId) next.agent = t("agentContracts.form.agentRequired");
    if (!versionId) next.rule = t("agentContracts.form.ruleRequired");
    if (!contractDate) next.date = t("agentContracts.form.dateRequired");
    setErrors(next);
    if (Object.keys(next).length) return;
    setSubmitting(true);
    try {
      const request = {
        agentId,
        repaymentRuleVersionId: versionId,
        contractDate: new Date(contractDate).toISOString(),
        allowsProductAdvance,
        notes: notes.trim() || undefined,
      };
      if (contractId) {
        await agentContractsService.updateContract(contractId, request);
        toast.success(t("agentContracts.messages.updated"));
        navigate(productCreditMode
          ? `/agents/product-credit/contracts/${contractId}`
          : `/agents/cash-powder/contracts/${contractId}`);
      } else {
        const createdId = await agentContractsService.createContract(request);
        toast.success(t("agentContracts.messages.created"));
        navigate(productCreditMode
          ? `/agents/product-credit/contracts/${createdId}`
          : `/agents/cash-powder/contracts/${createdId}`);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("agentContracts.errors.createFailed")));
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className={styles.page}>
      <SectionHeader
        title={t(contractId ? "agentContracts.actions.editContract" : "agentContracts.createTitle")}
        goBack
      />
      {contractLoading ? (
        <div>{t("agentContracts.details.loading")}</div>
      ) : contractId && !existingContract ? (
        <div className={styles.error}>{t("agentContracts.errors.loadDetailsFailed")}</div>
      ) : (
      <div className={`${styles.form} ${productCreditMode ? styles.productCreditForm : ""}`}>
        <div className={productCreditMode ? styles.productContractFields : styles.contractFields}>
          <div>
            <label>{t("agentContracts.fields.agent")}</label>
            <Select
              value={agentId}
              onChange={(event) => setAgentId(event.target.value)}
              disabled={Boolean(contractId)}
            >
              <option value="">{t("agentContracts.form.selectAgent")}</option>
              {existingContract && !agents.some((agent) => agent.id === existingContract.agent.id) && (
                <option value={existingContract.agent.id}>
                  {existingContract.agent.code} - {existingContract.agent.fullName}
                </option>
              )}
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agentName(agent)}
                </option>
              ))}
            </Select>
            {errors.agent && <span className={styles.error}>{errors.agent}</span>}
          </div>
          <div>
            <label>{t("agentContracts.form.repaymentRuleVersion")}</label>
            <Select
              value={versionId}
              onChange={(event) => setVersionId(event.target.value)}
            >
              <option value="">{t("agentContracts.form.selectActiveRuleVersion")}</option>
              {currentVersionMissing && existingContract && (
                <option value={existingContract.repaymentTerms.repaymentRuleVersionId}>
                  {t("agentContracts.form.ruleVersion", {
                    name: existingContract.repaymentTerms.repaymentRuleId,
                    version: existingContract.repaymentTerms.ruleVersion,
                  })}
                </option>
              )}
              {versions.map((version) => (
                <option key={version.id} value={version.id}>
                  {label(version)}
                </option>
              ))}
            </Select>
            {errors.rule && <span className={styles.error}>{errors.rule}</span>}
          </div>
          <TextField
            label={t("agentContracts.fields.contractDate")}
            type="date"
            value={contractDate}
            onChange={(event) => setContractDate(event.target.value)}
            error={Boolean(errors.date)}
            helperText={errors.date}
          />
          <Textarea
            label={t("common.notes")}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>
        {productCreditMode ? (
          <aside className={styles.productCreditAside}>
            <section className={`${styles.productCreditConfig} ${allowsProductAdvance ? styles.productCreditEnabled : ""}`}>
              <div>
                <span className={styles.productCreditEyebrow}>{t("agentContracts.productCredit.title")}</span>
                <h2>{t("agentContracts.productCredit.allowProductAdvance")}</h2>
                <p>{t("agentContracts.productCredit.configurationDescription")}</p>
              </div>
              <label className={styles.productCreditToggle}>
                <span>{t(allowsProductAdvance ? "agentContracts.productCredit.enabled" : "agentContracts.productCredit.disabled")}</span>
                <input
                  type="checkbox"
                  checked={allowsProductAdvance}
                  onChange={(event) => setAllowsProductAdvance(event.target.checked)}
                />
              </label>
            </section>
            {selected && <ProductTermsPreview terms={selected} />}
          </aside>
        ) : (
          selected && <Terms terms={selected} title={t("agentContracts.form.termsPreview")} />
        )}
        <div className={`${styles.actions} ${productCreditMode ? styles.productCreditActions : ""}`}>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={submitting || Boolean(contractId && !existingContract)}>
            {submitting
              ? t(contractId ? "agentContracts.form.saving" : "agentContracts.form.creating")
              : t(contractId ? "agentContracts.actions.saveChanges" : "agentContracts.actions.createContract")}
          </Button>
        </div>
      </div>
      )}
    </div>
  );
};

const ProductTermsPreview = ({
  terms,
}: {
  terms:
    | Omit<
        RepaymentRuleVersion,
        "id" | "ruleId" | "status" | "effectiveFrom" | "createdAt"
      >
    | AgentContractDto["repaymentTerms"];
}) => {
  const { t } = useTranslation();
  const rows: Array<[string, React.ReactNode]> = [
    [t("agentContracts.terms.debtRepayment"), `${terms.debtRepaymentPercent}%`],
    [t("agentContracts.terms.agentPayout"), `${terms.agentPayoutPercent}%`],
    [
      t("agentContracts.terms.repaymentPeriod"),
      `${terms.defaultRepaymentPeriodDays} ${t("repaymentRules.fields.days")}`,
    ],
    [t("agentContracts.terms.maximumExtensions"), terms.maximumExtensions],
    ...("ruleVersion" in terms
      ? [[t("agentContracts.terms.ruleVersion"), terms.ruleVersion] as [string, React.ReactNode]]
      : []),
  ];

  return (
    <section className={styles.productCreditTerms}>
      <h3>{t("agentContracts.form.termsPreview")}</h3>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} className={styles.productCreditTerm}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

const Terms = ({
  terms,
  title,
}: {
  terms:
    | Omit<
        RepaymentRuleVersion,
        "id" | "ruleId" | "status" | "effectiveFrom" | "createdAt"
      >
    | AgentContractDto["repaymentTerms"];
  title?: string;
}) => {
  const { t } = useTranslation();
  return (
    <section className={styles.section}>
      <h2>{title ?? t("agentContracts.form.termsTitle")}</h2>
      <div className={styles.detailGrid}>
        <Detail label={t("agentContracts.terms.debtRepayment")} value={`${terms.debtRepaymentPercent}%`} />
        <Detail label={t("agentContracts.terms.agentPayout")} value={`${terms.agentPayoutPercent}%`} />
        <Detail label={t("agentContracts.terms.excessBusiness")} value={`${terms.excessBusinessPercent}%`} />
        <Detail label={t("agentContracts.terms.excessAgent")} value={`${terms.excessAgentPercent}%`} />
        <Detail label={t("agentContracts.terms.repaymentPeriod")} value={`${terms.defaultRepaymentPeriodDays} ${t("repaymentRules.fields.days")}`} />
        <Detail label={t("agentContracts.terms.maximumExtensions")} value={terms.maximumExtensions} />
        {"ruleVersion" in terms && <Detail label={t("agentContracts.terms.ruleVersion")} value={terms.ruleVersion} />}
      </div>
    </section>
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

export const AgentContractDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState<AgentContractDto | null>(null);
  const [capitalSources, setCapitalSources] = useState<CapitalSourceDto[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceDate, setAdvanceDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [advanceNotes, setAdvanceNotes] = useState("");
  const [advanceSaving, setAdvanceSaving] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [contractResult, sourceResult] = await Promise.all([
        agentContractsService.getContract(id),
        capitalSourcesService.listCapitalSources({ page: 1, pageSize: 200 }),
      ]);

      setContract(contractResult);
      setCapitalSources(sourceResult.results ?? []);

      if (contractResult?.agent?.id) {
        const deliveryResult = await powderDeliveriesService.listForAgent(
          contractResult.agent.id,
          { page: 1, pageSize: 200 },
        );
        setDeliveries(deliveryResult.results ?? []);
      } else {
        setDeliveries([]);
      }
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, t("agentContracts.errors.loadDetailsFailed")),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const cancel = async () => {
    if (!id) return;
    try {
      await agentContractsService.cancelContract(id);
      toast.success(t("agentContracts.messages.cancelled"));
      void load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("agentContracts.errors.cancelFailed")));
    }
  };

  const createAdvance = async () => {
    if (!id || !advanceAmount || Number(advanceAmount) <= 0) {
      toast.error(t("agentContracts.validation.advanceAmount"));
      return;
    }

    setAdvanceSaving(true);
    try {
      await agentContractsService.createAdvance(id, {
        amount: Number(advanceAmount),
        advanceDate: new Date(advanceDate).toISOString(),
        notes: advanceNotes.trim() || undefined,
      });

      toast.success(t("agentContracts.messages.advanceCreated"));
      setAdvanceOpen(false);
      setAdvanceAmount("");
      setAdvanceNotes("");
      setAdvanceDate(new Date().toISOString().slice(0, 10));
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("agentContracts.errors.advanceCreateFailed")));
    } finally {
      setAdvanceSaving(false);
    }
  };

  const fundingRows = useMemo(() => {
    if (!contract)
      return [] as Array<{
        id: string;
        name: string;
        status: string;
        amount: number;
        usedAmount: number;
        remainingAmount: number;
        contributionPercent: number;
      }>;

    const map = new Map<
      string,
      {
        id: string;
        name: string;
        status: string;
        amount: number;
        usedAmount: number;
        remainingAmount: number;
        contributionPercent: number;
      }
    >();

    const cashAdvances = (contract.advances ?? []).filter((advance) => {
      const type = String(advance.advanceType ?? "Cash").toLowerCase();
      return !type || type.includes("cash");
    });

    for (const advance of cashAdvances) {
      for (const allocation of advance.allocations ?? []) {
        const existing = map.get(allocation.capitalSourceId) ?? {
          id: allocation.capitalSourceId,
          name: allocation.capitalSourceName,
          status: "Active",
          amount: 0,
          usedAmount: 0,
          remainingAmount: 0,
          contributionPercent: 0,
        };

        existing.amount += allocation.amount;
        existing.usedAmount += Math.min(
          allocation.amount,
          contract.financials.totalAdvancedAmount || allocation.amount,
        );
        existing.remainingAmount = Math.max(
          0,
          existing.amount - existing.usedAmount,
        );

        const source = capitalSources.find(
          (item) => item.id === allocation.capitalSourceId,
        );
        if (source) {
          existing.name = source.name || allocation.capitalSourceName;
          existing.status = source.status;
        }

        map.set(allocation.capitalSourceId, existing);
      }
    }

    return Array.from(map.values()).map((row) => ({
      ...row,
      contributionPercent: contract.financials.totalAdvancedAmount
        ? Number(
            (
              (row.usedAmount / contract.financials.totalAdvancedAmount) *
              100
            ).toFixed(2),
          )
        : 0,
    }));
  }, [capitalSources, contract]);

  const totalAllocatedCapital = fundingRows.reduce(
    (sum, row) => sum + row.amount,
    0,
  );
  const totalUsedCapital = fundingRows.reduce(
    (sum, row) => sum + row.usedAmount,
    0,
  );
  const totalRemainingCapital = Math.max(
    0,
    totalAllocatedCapital - totalUsedCapital,
  );

  const deliveryColumns = useMemo(
    () => [
      { accessorKey: "deliveryNumber", header: t("agentContracts.fields.deliveryId") },
      {
        id: "date",
        header: t("agentContracts.fields.date"),
        cell: ({ row }: any) => date(row.original.deliveryDate),
      },
      {
        id: "weight",
        header: t("agentContracts.fields.powderWeight"),
        cell: ({ row }: any) => money(row.original.netWeightKg),
      },
      {
        id: "value",
        header: t("agentContracts.fields.kitcoValue"),
        cell: ({ row }: any) => money(row.original.totalValueAmd),
      },
      {
        id: "status",
        header: t("agentContracts.fields.status"),
        cell: ({ row }: any) => <StatusBadge status={row.original.status} />,
      },
    ],
    [],
  );

  if (loading || !contract)
    return (
      <div className={styles.page}>
        <SectionHeader title={t("agentContracts.detailsTitle")} goBack />
        {t("agentContracts.details.loading")}
      </div>
    );

  const activeRule = contract.repaymentTerms;
  const hasActiveContract = isActiveAgentStatus(contract.status);
  const hasActiveRule = Boolean(
    activeRule &&
      (activeRule.debtRepaymentPercent > 0 ||
        activeRule.agentPayoutPercent > 0 ||
        activeRule.excessBusinessPercent > 0 ||
        activeRule.excessAgentPercent > 0),
  );
  const hasFunding = fundingRows.length > 0 && totalAllocatedCapital > 0;
  const cashAdvances = (contract.advances ?? []).filter((advance) => {
    const type = String(advance.advanceType ?? "Cash").toLowerCase();
    return !type || type.includes("cash");
  });

  return (
    <div className={styles.page}>
      <SectionHeader
        title={contract.contractNumber}
        goBack
        actions={
          <div className={styles.headerActions}>
            <Button
              variant="secondary"
              onClick={() => navigate(`/agents/cash-powder/contracts/${contract.id}/edit`)}
            >
              {t("agentContracts.actions.editContract")}
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                navigate(`/agents/cash-powder/contracts/${contract.id}/powder-deliveries`)
              }
            >
              {t("agentContracts.actions.deliveryHistory")}
            </Button>
            {isDraft(contract.status) && (
              <Button onClick={() => setAdvanceOpen(true)}>
                <Plus size={14} /> {t("agentContracts.actions.createAdvance")}
              </Button>
            )}
            {isDraft(contract.status) && (
              <Button variant="danger" onClick={() => setCancelOpen(true)}>
                {t("agentContracts.actions.cancelContract")}
              </Button>
            )}
          </div>
        }
      />
      {!hasActiveContract || !hasActiveRule || !hasFunding ? (
        <div className={styles.notice} style={{ marginBottom: 16 }}>
          <strong>{t("agentContracts.details.automaticComplianceCheck")}</strong>
          {!hasActiveContract && ` ${t("agentContracts.compliance.noActiveContract")} `}
          {!hasActiveRule && ` ${t("agentContracts.compliance.noActiveRule")} `}
          {!hasFunding && ` ${t("agentContracts.compliance.noFunding")} `}
        </div>
      ) : null}

      <section className={styles.section}>
        <h2>{t("agentContracts.details.automaticFlow")}</h2>
        <div className={styles.detailGrid}>
          <div className={styles.detail}>
            <span>{t("agentContracts.details.customerPurchase")}</span>
            <strong>{t("agentContracts.details.completed")}</strong>
          </div>
          <div className={styles.detail}>
            <span>{t("agentContracts.details.agentDetected")}</span>
            <strong>{contract.agent.fullName}</strong>
          </div>
          <div className={styles.detail}>
            <span>{t("agentContracts.details.powderDeliveryCreated")}</span>
            <strong>{t("agentContracts.details.automatic")}</strong>
          </div>
          <div className={styles.detail}>
            <span>{t("agentContracts.details.adminConfirms")}</span>
            <strong>{t("agentContracts.details.settlementStep")}</strong>
          </div>
          <div className={styles.detail}>
            <span>{t("agentContracts.details.contractRuleApplied")}</span>
            <strong>{t(hasActiveRule ? "agentContracts.compliance.applied" : "agentContracts.compliance.missing")}</strong>
          </div>
          <div className={styles.detail}>
            <span>{t("agentContracts.details.capitalSourceUpdated")}</span>
            <strong>{t(hasFunding ? "agentContracts.compliance.available" : "agentContracts.compliance.missing")}</strong>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>{t("agentContracts.details.agentInformation")}</h2>
        <div className={styles.detailGrid}>
          <Detail
            label={t("agentContracts.fields.agent")}
            value={`${contract.agent.code} - ${contract.agent.fullName}`}
          />
          <Detail label={t("agentContracts.fields.phone")} value="-" />
          <Detail label={t("agentContracts.fields.agentType")} value="-" />
          <Detail label={t("agentContracts.fields.contractNumber")} value={contract.contractNumber} />
          <Detail
            label={t("agentContracts.fields.contractStatus")}
            value={<StatusBadge status={contract.status} />}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2>{t("agentContracts.details.activeContractRule")}</h2>
        <div className={styles.detailGrid}>
          <Detail label={t("agentContracts.terms.ruleVersion")} value={activeRule.ruleVersion} />
          <Detail
            label={t("repaymentRules.fields.debtRepaymentPercent")}
            value={`${activeRule.debtRepaymentPercent}%`}
          />
          <Detail
            label={t("repaymentRules.fields.agentPayoutPercent")}
            value={`${activeRule.agentPayoutPercent}%`}
          />
          <Detail
            label={t("repaymentRules.fields.excessBusinessPercent")}
            value={`${activeRule.excessBusinessPercent}%`}
          />
          <Detail
            label={t("repaymentRules.fields.excessAgentPercent")}
            value={`${activeRule.excessAgentPercent}%`}
          />
          <Detail
            label={t("agentContracts.terms.repaymentPeriod")}
            value={`${activeRule.defaultRepaymentPeriodDays} ${t("repaymentRules.fields.days")}`}
          />
          <Detail
            label={t("agentContracts.terms.maximumExtensions")}
            value={activeRule.maximumExtensions}
          />
          <Detail label={t("repaymentRules.fields.effectiveFrom")} value={date(contract.contractDate)} />
          <Detail label={t("repaymentRules.fields.effectiveTo")} value="-" />
        </div>
      </section>

      <section className={styles.section}>
        <h2>{t("agentContracts.details.capitalFunding")}</h2>
        {fundingRows.length ? (
          <DataTable
            columns={[
              { accessorKey: "name", header: t("agentContracts.fields.capitalSource") },
              { accessorKey: "status", header: t("capitalSources.fields.status"), cell: ({ row }: any) => t(`capitalSources.statuses.${row.original.status}`, { defaultValue: row.original.status }) },
              {
                id: "contribution",
                header: t("agentContracts.fields.contributionPercent"),
                cell: ({ row }: any) => `${row.original.contributionPercent}%`,
              },
              {
                id: "allocated",
                header: t("agentContracts.fields.allocated"),
                cell: ({ row }: any) => money(row.original.amount),
              },
              {
                id: "used",
                header: t("agentContracts.fields.used"),
                cell: ({ row }: any) => money(row.original.usedAmount),
              },
              {
                id: "remaining",
                header: t("agentContracts.fields.remaining"),
                cell: ({ row }: any) => money(row.original.remainingAmount),
              },
            ]}
            data={fundingRows as any}
            noResultsText={t("agentContracts.details.noCapitalFundingRows")}
          />
        ) : (
          <div className={styles.muted}>
            {t("agentContracts.details.noCapitalFunding")}
          </div>
        )}
        <div className={styles.financials} style={{ marginTop: 16 }}>
          <Detail
            label={t("agentContracts.details.totalAllocatedCapital")}
            value={money(totalAllocatedCapital)}
          />
          <Detail label={t("agentContracts.details.totalUsedCapital")} value={money(totalUsedCapital)} />
          <Detail
            label={t("agentContracts.details.totalRemainingCapital")}
            value={money(totalRemainingCapital)}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2>{t("agentContracts.details.advanceFunding")}</h2>
        {isDraft(contract.status) && (
          <div style={{ marginBottom: 12 }}>
            <Button onClick={() => setAdvanceOpen(true)}>
              <Plus size={14} /> {t("agentContracts.actions.createAdvance")}
            </Button>
          </div>
        )}
        {cashAdvances.length ? (
          <DataTable
            columns={[
              { accessorKey: "advanceNumber", header: t("agentContracts.fields.advance") },
              {
                id: "amount",
                header: t("agentContracts.fields.advanced"),
                cell: ({ row }: any) => money(row.original.advancedAmount),
              },
              {
                id: "allocated",
                header: t("agentContracts.fields.allocated"),
                cell: ({ row }: any) => money(row.original.allocatedAmount),
              },
              {
                accessorKey: "status",
                header: t("agentContracts.fields.status"),
                cell: ({ row }: any) => (
                  <StatusBadge status={row.original.status} />
                ),
              },
              {
                id: "actions",
                header: t("agentContracts.fields.actions"),
                cell: ({ row }: any) => (
                  <div className={styles.inlineActions}>
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={() =>
                        navigate(`/agents/cash-powder/advances/${row.original.id}`)
                      }
                    >
                      {t("agentContracts.actions.view")}
                    </Button>
                    {isDraftAgentStatus(row.original.status) && (
                      <Button
                        size="small"
                        onClick={() =>
                          navigate(`/agents/cash-powder/advances/${row.original.id}`)
                        }
                      >
                        {t("agentContracts.actions.addAllocation")}
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
            data={cashAdvances}
            noResultsText={t("agentContracts.details.noAdvances")}
          />
        ) : (
          <div className={styles.muted}>
            {t("agentContracts.details.noAdvancesHint")}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2>{t("agentContracts.details.automaticPowderDeliveries")}</h2>
        {deliveries.length ? (
          <DataTable
            columns={deliveryColumns as any}
            data={deliveries}
            noResultsText={t("agentContracts.details.noConfirmedPowderDeliveries")}
          />
        ) : (
          <div className={styles.muted}>
            {t("agentContracts.details.noPowderDeliveries")}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2>{t("agentContracts.details.repaymentSummary")}</h2>
        <div className={styles.financials}>
          <Detail
            label={t("agentContracts.fields.initialDebt")}
            value={money(contract.financials.outstandingAmount)}
          />
          <Detail
            label={t("agentContracts.fields.totalDeliveredValue")}
            value={money(
              deliveries.reduce(
                (sum, item) => sum + (item.totalValueAmd ?? 0),
                0,
              ),
            )}
          />
          <Detail
            label={t("agentContracts.fields.totalRepaid")}
            value={money(contract.financials.totalRepaidAmount)}
          />
          <Detail
            label={t("agentContracts.fields.remainingDebt")}
            value={money(contract.financials.outstandingAmount)}
          />
          <Detail label={t("agentContracts.fields.nextDeadline")} value="-" />
          <Detail label={t("agentContracts.fields.extensionsUsed")} value="0" />
          <Detail
            label={t("agentContracts.fields.remainingExtensions")}
            value={activeRule.maximumExtensions}
          />
        </div>
      </section>

      <ConfirmationModal
        open={advanceOpen}
        onOpenChange={setAdvanceOpen}
        title={t("agentContracts.actions.createAdvance")}
        description={t("agentContracts.details.advanceDescription")}
        confirmText={t("agentContracts.actions.createAdvance")}
        confirmLoading={advanceSaving}
        onConfirm={createAdvance}
      >
        <div className={styles.modalFields}>
          <TextField
            label={t("agentContracts.fields.advanceAmount")}
            type="number"
            min="0.01"
            value={advanceAmount}
            onChange={(event) => setAdvanceAmount(event.target.value)}
          />
          <TextField
            label={t("agentContracts.fields.advanceDate")}
            type="date"
            value={advanceDate}
            onChange={(event) => setAdvanceDate(event.target.value)}
          />
          <Textarea
            label={t("common.notes")}
            value={advanceNotes}
            onChange={(event) => setAdvanceNotes(event.target.value)}
          />
        </div>
      </ConfirmationModal>

      <ConfirmationModal
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={t("agentContracts.actions.cancelContract")}
        description={t("agentContracts.details.cancelDescription")}
        confirmText={t("agentContracts.actions.cancelContract")}
        onConfirm={cancel}
      />
    </div>
  );
};

export const AgentAdvancesList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<AgentAdvanceDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const agents = useAgents();
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || 10);
  const status = searchParams.get("status") || "";
  const agentId = searchParams.get("agentId") || "";
  const contractId = searchParams.get("contractId") || "";
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
    const load = async () => {
      setLoading(true);
      try {
        const result = await agentContractsService.listAdvances({
          page,
          pageSize,
          status: status || undefined,
          agentId: agentId || undefined,
          contractId: contractId || undefined,
          advanceNumber: advanceNumber || undefined,
          advanceDateFrom: from || undefined,
          advanceDateTo: to || undefined,
        });
        setItems(result.results ?? []);
        setTotal(result.totalItems);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Failed to load advances."));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [page, pageSize, status, agentId, contractId, advanceNumber, from, to]);
  const columns = useMemo(
    () => [
      { accessorKey: "advanceNumber", header: "Advance Number" },
      {
        id: "agent",
        header: "Agent",
        cell: ({ row }: any) =>
          `${row.original.agent.code} - ${row.original.agent.fullName}`,
      },
      { accessorKey: "agentContractId", header: "Contract" },
      {
        id: "amount",
        header: "Advanced",
        cell: ({ row }: any) => money(row.original.advancedAmount),
      },
      {
        id: "allocated",
        header: "Allocated",
        cell: ({ row }: any) => money(row.original.allocatedAmount),
      },
      {
        id: "date",
        header: "Advance Date",
        cell: ({ row }: any) => datetime(row.original.advanceDate),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }: any) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "created",
        header: "Created At",
        cell: ({ row }: any) => datetime(row.original.createdAt),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: any) => (
          <Button
            size="small"
            variant="secondary"
            onClick={() => navigate(`/agents/cash-powder/advances/${row.original.id}`)}
          >
            View
          </Button>
        ),
      },
    ],
    [navigate],
  );
  return (
    <div className={styles.page}>
      <SectionHeader
        title="Agent Advances"
        actions={
          <Button
            variant="secondary"
            onClick={() => navigate("/agents/cash-powder/contracts")}
          >
            Contracts
          </Button>
        }
      />
      <div className={styles.filters}>
        <Select
          value={agentId}
          onChange={(event) => setFilter("agentId", event.target.value)}
        >
          <option value="">All agents</option>
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
          <option value="">All statuses</option>
          {statuses.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </Select>
        <TextField
          label="Contract ID"
          value={contractId}
          onChange={(event) => setFilter("contractId", event.target.value)}
        />
        <TextField
          label="Advance Number"
          value={advanceNumber}
          onChange={(event) => setFilter("advanceNumber", event.target.value)}
        />
        <TextField
          label="From"
          type="date"
          value={from}
          onChange={(event) => setFilter("advanceDateFrom", event.target.value)}
        />
        <TextField
          label="To"
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
        noResultsText="No advances found"
        loadingText="Loading advances..."
      />
    </div>
  );
};

export const AgentAdvanceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [advance, setAdvance] = useState<AgentAdvanceDto | null>(null);
  const [sources, setSources] = useState<CapitalSourceDto[]>([]);
  const [sourceId, setSourceId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [allocationOpen, setAllocationOpen] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [activateOpen, setActivateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const load = async () => {
    if (!id) return;
    try {
      const [result, sourceResult] = await Promise.all([
        agentContractsService.getAdvance(id),
        capitalSourcesService.listCapitalSources({
          page: 1,
          pageSize: 200,
          status: "Active",
        }),
      ]);
      setAdvance(result);
      setSources(sourceResult.results ?? []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load advance."));
    }
  };
  useEffect(() => {
    void load();
  }, [id]);
  if (!advance)
    return (
      <div className={styles.page}>
        <SectionHeader title="Advance Details" goBack />
        Loading advance...
      </div>
    );
  const remaining = Math.max(
    0,
    advance.advancedAmount - advance.allocatedAmount,
  );
  const draft = isDraft(advance.status);
  const addAllocation = async () => {
    const parsed = Number(amount);
    if (!sourceId || !(parsed > 0) || parsed > remaining) {
      toast.error(
        "Choose a capital source and enter an amount up to the remaining balance.",
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
      toast.success("Allocation added.");
      setSourceId("");
      setAmount("");
      setDescription("");
      setAllocationOpen(false);
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to add allocation."));
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (!id || !removeId) return;
    try {
      await agentContractsService.removeAllocation(id, removeId);
      toast.success("Allocation removed.");
      void load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to remove allocation."));
    } finally {
      setRemoveId(null);
    }
  };
  const activate = async () => {
    if (!id) return;
    try {
      await agentContractsService.activateAdvance(id);
      toast.success("Advance activated.");
      void load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to activate advance."));
    }
  };
  const columns = [
    { accessorKey: "capitalSourceCode", header: "Capital Source Code" },
    { accessorKey: "capitalSourceName", header: "Capital Source" },
    {
      id: "amount",
      header: "Amount",
      cell: ({ row }: any) => money(row.original.amount),
    },
    {
      id: "created",
      header: "Created At",
      cell: ({ row }: any) => datetime(row.original.createdAt),
    },
    { accessorKey: "createdBy", header: "Created By" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) =>
        draft && (
          <Button
            size="small"
            variant="danger"
            onClick={() => setRemoveId(row.original.id)}
          >
            Remove
          </Button>
        ),
    },
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
              View Contract
            </Button>
            {draft && (
              <Button onClick={() => setAllocationOpen(true)}>
                Add Allocation
              </Button>
            )}
            {draft && (
              <Button
                disabled={remaining !== 0}
                onClick={() => setActivateOpen(true)}
              >
                Activate Advance
              </Button>
            )}
          </div>
        }
      />
      <div className={styles.detailGrid}>
        <Detail
          label="Status"
          value={<StatusBadge status={advance.status} />}
        />
        <Detail label="Advance date" value={datetime(advance.advanceDate)} />
        <Detail
          label="Agent"
          value={`${advance.agent.code} - ${advance.agent.fullName}`}
        />
        <Detail label="Notes" value={advance.notes} />
      </div>
      <section className={styles.section}>
        <h2>Funding Summary</h2>
        <div className={styles.financials}>
          <Detail
            label="Advanced amount"
            value={money(advance.advancedAmount)}
          />
          <Detail
            label="Allocated amount"
            value={money(advance.allocatedAmount)}
          />
          <Detail label="Remaining amount" value={money(remaining)} />
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
        <h2>Allocations</h2>
        <DataTable
          columns={columns as any}
          data={advance.allocations ?? []}
          noResultsText="No allocations yet"
        />
      </section>
      <ConfirmationModal
        open={allocationOpen}
        onOpenChange={setAllocationOpen}
        title="Add Allocation"
        description={`Remaining to allocate: ${money(remaining)}`}
        confirmText="Add Allocation"
        confirmLoading={saving}
        preventClose
        onConfirm={addAllocation}
      >
        <div className={styles.modalFields}>
          <Select
            value={sourceId}
            onChange={(event) => setSourceId(event.target.value)}
          >
            <option value="">Select capital source</option>
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.code} - current balance: {money(source.currentBalance)}
              </option>
            ))}
          </Select>
          <TextField
            label="Amount"
            type="number"
            min="0.01"
            max={remaining}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          <TextField
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
      </ConfirmationModal>
      <ConfirmationModal
        open={Boolean(removeId)}
        onOpenChange={(open) => !open && setRemoveId(null)}
        title="Remove allocation"
        description="The allocated funds will be returned to the capital source."
        confirmText="Remove Allocation"
        onConfirm={remove}
      />
      <ConfirmationModal
        open={activateOpen}
        onOpenChange={setActivateOpen}
        title="Activate advance"
        description="Activation makes the advance and its allocations read-only."
        confirmText="Activate Advance"
        onConfirm={activate}
      />
    </div>
  );
};
