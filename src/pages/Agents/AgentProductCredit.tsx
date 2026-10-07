import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { parsePhoneNumberFromString } from "libphonenumber-js";

import { SectionHeader } from "@/components/common";
import { Button, ConfirmationModal, DataTable, Select, TextField } from "@/ui-kit";
import { agentContractsService } from "@/services/agentContracts";
import { agentsService } from "@/services/agents";
import { getCustomers } from "@/services/customers";
import { useAppSelector } from "@/store/hooks";
import { getCashRegisterId } from "@/utils/getCashRegisterId.util";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { AgentAdvanceDto, AgentContractDto, AgentContractListItemDto } from "@/types/agentContracts";
import type {
  AgentDto,
  AgentProductCreditSaleDto,
  AgentProductDebtDto,
  AgentProductDebtPaymentDto,
} from "@/types/agents";
import { AgentProductCreditSaleItems } from "./AgentProductCreditPurchases";
import styles from "@/pages/AgentContracts/AgentContracts.module.css";

export type AgentProductCreditView = "contracts" | "advances" | "sales" | "debt" | "payments";

const money = (amount?: number | null) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(amount ?? 0);
const date = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString() : "-";
const isProductAdvance = (advance: AgentAdvanceDto) =>
  String(advance.advanceType ?? "").toLowerCase().includes("product");

const Status = ({ value }: { value: string }) => {
  const { t } = useTranslation();
  return t(`agentContracts.statuses.${value.toLowerCase()}`, { defaultValue: value });
};

const PaymentHistory = ({ items, loading }: { items: AgentProductDebtPaymentDto[]; loading: boolean }) => {
  const { t } = useTranslation();
  const columns = useMemo(
    () => [
      {
        id: "date",
        header: t("agents.productCredit.paymentDate"),
        cell: ({ row }: { row: { original: AgentProductDebtPaymentDto } }) => {
          const value = row.original.paymentDate;
          return value ? new Date(value).toLocaleString() : "-";
        },
      },
      {
        accessorKey: "amountAmd",
        header: t("agents.productCredit.paymentAmount"),
        cell: ({ row }: { row: { original: AgentProductDebtPaymentDto } }) => `${money(row.original.amountAmd)} AMD`,
      },
      {
        id: "agent",
        header: t("agents.fields.fullName"),
        cell: ({ row }: { row: { original: AgentProductDebtPaymentDto } }) => row.original.agentId || "-",
      },
      { accessorKey: "agentContractId", header: t("agents.productCredit.contract") },
      { accessorKey: "cashRegisterId", header: t("agents.productCredit.cashRegister") },
      { accessorKey: "cashSessionId", header: t("agents.productCredit.cashSession") },
      { accessorKey: "cashLedgerEntryId", header: t("agents.productCredit.cashLedgerEntry") },
      { accessorKey: "createdBy", header: t("agents.productCredit.createdBy") },
    ],
    [t],
  );

  return (
    <DataTable
      columns={columns as any}
      data={items}
      isLoading={loading}
      noResultsText={t("agents.productCredit.noPayments")}
      loadingText={t("common.loading")}
    />
  );
};

const AgentPhoneLookup = ({
  agents,
  onAgentFound,
}: {
  agents: AgentDto[];
  onAgentFound: (agentId: string) => void;
}) => {
  const { t } = useTranslation();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const findAgent = async () => {
    const cleanedPhone = phone.trim();
    if (!cleanedPhone) {
      toast.error(t("operatorPage.cashier.customerLookup.phoneRequired"));
      return;
    }

    const parsedPhone = parsePhoneNumberFromString(cleanedPhone, "AM");
    if (!parsedPhone?.isValid()) {
      toast.error(t("operatorPage.cashier.customerLookup.invalidPhone"));
      return;
    }

    setLoading(true);
    try {
      const customersResponse = await getCustomers({
        phone: cleanedPhone,
        cashRegisterId: getCashRegisterId(),
      });
      const customer = customersResponse.results[0];
      if (!customer) {
        toast.error(t("operatorPage.cashier.customerLookup.customerNotFound"));
        return;
      }

      const agent = agents.find(
        (item) =>
          String(item.customerId) === String(customer.id) ||
          String(item.customer?.id) === String(customer.id),
      );
      if (!agent) {
        toast.error(t("operatorPage.cashier.customerLookup.notAnAgent"));
        return;
      }

      onAgentFound(agent.id);
      toast.success(t("operatorPage.cashier.customerLookup.agentIdentified"));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("operatorPage.cashier.customerLookup.failedToLoad")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.agentPhoneLookup}>
      <TextField
        label={t("operatorPage.cashier.customerLookup.phoneLabel")}
        placeholder={t("operatorPage.cashier.customerLookup.phonePlaceholder")}
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void findAgent();
          }
        }}
        inputMode="tel"
      />
      <Button type="button" onClick={() => void findAgent()} disabled={loading}>
        {loading ? t("operatorPage.cashier.processing") : t("operatorPage.cashier.customerLookup.lookupButton")}
      </Button>
    </div>
  );
};

const ProductContractList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const canManageContracts = user?.role === "Admin" || user?.role === "SuperAdmin";
  const [items, setItems] = useState<AgentContractListItemDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [confirmActivationId, setConfirmActivationId] = useState<string | null>(null);
  const [confirmDeactivationId, setConfirmDeactivationId] = useState<string | null>(null);

  const refreshContracts = () => setRefreshToken((value) => value + 1);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    void agentContractsService
      .listProductCreditContracts({ page: 1, pageSize: 500 })
      .then((result) => {
        if (!isCancelled) {
          setItems(result.results ?? []);
        }
      })
      .catch((error) => toast.error(getApiErrorMessage(error, t("agentContracts.errors.loadFailed"))))
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [refreshToken, t]);

  const handleProductAction = async (contract: AgentContractListItemDto, action: "activate" | "deactivate") => {
    if (!canManageContracts || pendingActionId) return;
    const isActivate = action === "activate";
    const actionMethod = isActivate
      ? agentContractsService.activateProductAdvanceContract
      : agentContractsService.deactivateProductAdvanceContract;
    setPendingActionId(contract.id);
    try {
      await actionMethod(contract.id);
      toast.success(isActivate
        ? t("agentContracts.messages.productContractActivated")
        : t("agentContracts.messages.productContractDeactivated"));
      refreshContracts();
    } catch (error) {
      toast.error(getApiErrorMessage(error, isActivate
        ? t("agentContracts.errors.activateProductContractFailed")
        : t("agentContracts.errors.deactivateProductContractFailed")));
    } finally {
      setPendingActionId(null);
      setConfirmActivationId(null);
      setConfirmDeactivationId(null);
    }
  };

  const columns = useMemo(
    () => [
      { accessorKey: "contractNumber", header: t("agentContracts.fields.contractNumber") },
      {
        id: "agent",
        header: t("agentContracts.fields.agent"),
        cell: ({ row }: { row: { original: AgentContractListItemDto } }) => `${row.original.agent.code} - ${row.original.agent.fullName}`,
      },
      {
        accessorKey: "status",
        header: t("agentContracts.fields.status"),
        cell: ({ row }: { row: { original: AgentContractListItemDto } }) => <Status value={String(row.original.status)} />,
      },
      {
        id: "permission",
        header: t("agentContracts.productCredit.allowProductAdvance"),
        cell: ({ row }: { row: { original: AgentContractListItemDto } }) => t(row.original.allowsProductAdvance ? "agentContracts.productCredit.allowed" : "agentContracts.productCredit.notAllowed"),
      },
      {
        id: "rule",
        header: t("agentContracts.productCredit.repaymentRule"),
        cell: ({ row }: { row: { original: AgentContractListItemDto } }) => row.original.repaymentTerms?.ruleVersion != null
          ? t("agentContracts.productCredit.ruleVersionNumber", { version: row.original.repaymentTerms.ruleVersion })
          : "-",
      },
      {
        id: "date",
        header: t("agentContracts.fields.contractDate"),
        cell: ({ row }: { row: { original: AgentContractListItemDto } }) => date(row.original.contractDate),
      },
      {
        id: "actions",
        header: t("agentContracts.fields.actions"),
        cell: ({ row }: { row: { original: AgentContractListItemDto } }) => {
          const contract = row.original;
          const canActivate = contract.status === "Draft" && contract.allowsProductAdvance === true;
          const canDeactivate = contract.status === "Active" && contract.allowsProductAdvance === true && contract.outstandingAmount === 0;
          const isPending = pendingActionId === contract.id;
          return (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {canManageContracts && canActivate && (
                <Button className={styles.productContractAction} size="small" variant="primary" disabled={isPending} onClick={() => setConfirmActivationId(contract.id)}>
                  {t("agentContracts.actions.activateProductContract")}
                </Button>
              )}
              {canManageContracts && canDeactivate && (
                <Button className={styles.productContractAction} size="small" variant="secondary" disabled={isPending} onClick={() => setConfirmDeactivationId(contract.id)}>
                  {t("agentContracts.actions.deactivateProductContract")}
                </Button>
              )}
              <Button size="small" variant="secondary" onClick={() => navigate(`/agents/product-credit/contracts/${contract.id}`)}>
                {t("agentContracts.actions.view")}
              </Button>
            </div>
          );
        },
      },
    ],
    [canManageContracts, navigate, pendingActionId, t],
  );

  return (
    <div className={styles.page}>
      <SectionHeader
        title={t("agentWorkspace.productContracts")}
        actions={<Button onClick={() => navigate("/agents/product-credit/contracts/create")}>{t("agentContracts.actions.createContract")}</Button>}
      />
      <DataTable
        columns={columns as any}
        data={items}
        isLoading={loading}
        noResultsText={t("agentWorkspace.noProductContracts")}
        loadingText={t("agentContracts.list.loading")}
      />
      {confirmActivationId && (
        <ConfirmationModal
          open={true}
          onOpenChange={(open) => !open && setConfirmActivationId(null)}
          title={t("agentContracts.actions.activateProductContract")}
          description={t("agentContracts.details.activateProductDescription")}
          confirmText={t("agentContracts.actions.activateProductContract")}
          confirmLoading={pendingActionId === confirmActivationId}
          onConfirm={() => {
            const contract = items.find((item) => item.id === confirmActivationId);
            if (contract) void handleProductAction(contract, "activate");
          }}
        />
      )}
      {confirmDeactivationId && (
        <ConfirmationModal
          open={true}
          onOpenChange={(open) => !open && setConfirmDeactivationId(null)}
          title={t("agentContracts.actions.deactivateProductContract")}
          description={t("agentContracts.details.deactivateProductDescription")}
          confirmText={t("agentContracts.actions.deactivateProductContract")}
          confirmLoading={pendingActionId === confirmDeactivationId}
          onConfirm={() => {
            const contract = items.find((item) => item.id === confirmDeactivationId);
            if (contract) void handleProductAction(contract, "deactivate");
          }}
        />
      )}
    </div>
  );
};

const ProductAdvanceList = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<AgentAdvanceDto[]>([]);
  const [salesById, setSalesById] = useState<Record<string, AgentProductCreditSaleDto>>({});
  const [loading, setLoading] = useState(false);
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesLoadFailed, setSalesLoadFailed] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const handleProductCreditActivityChanged = () => setRefreshToken((value) => value + 1);
    window.addEventListener("agent-product-credit-activity-changed", handleProductCreditActivityChanged);
    return () => window.removeEventListener("agent-product-credit-activity-changed", handleProductCreditActivityChanged);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setSalesLoading(true);
    setSalesLoadFailed(false);
    setSalesById({});
    void agentContractsService
      .listAdvances({ page: 1, pageSize: 500, allowsProductAdvance: true })
      .then(async (result) => {
        if (isCancelled) return;
        const productAdvances = result.results ?? [];
        setItems(productAdvances);

        const agentContracts = new Map<string, { agentId: string; contractId: string }>();
        productAdvances.forEach((advance) => {
          if (advance.productSaleId == null) return;
          const key = `${advance.agent.id}:${advance.agentContractId}`;
          agentContracts.set(key, { agentId: advance.agent.id, contractId: advance.agentContractId });
        });
        const salesResults = await Promise.allSettled(
          Array.from(agentContracts.values()).map(({ agentId, contractId }) =>
            agentsService.getAgentProductCreditSales(agentId, { contractId, page: 1, pageSize: 500 }),
          ),
        );
        if (isCancelled) return;

        const salesById: Record<string, AgentProductCreditSaleDto> = {};
        salesResults.forEach((salesResult) => {
          if (salesResult.status === "fulfilled") {
            salesResult.value.forEach((sale) => {
              salesById[String(sale.saleId)] = sale;
            });
          }
        });
        setSalesById(salesById);
        const hasFailedRequests = salesResults.some((salesResult) => salesResult.status === "rejected");
        setSalesLoadFailed(hasFailedRequests);
        if (hasFailedRequests) toast.error(t("agents.productCredit.salesLoadFailed"));
      })
      .catch((error) => toast.error(getApiErrorMessage(error, t("agentAdvances.errors.loadFailed"))))
      .finally(() => {
        if (!isCancelled) {
          setLoading(false);
          setSalesLoading(false);
        }
      });
    return () => {
      isCancelled = true;
    };
  }, [refreshToken, t]);

  const columns = useMemo(
    () => [
      { accessorKey: "advanceNumber", header: t("agentAdvances.fields.advanceNumber") },
      { accessorKey: "productSaleId", header: t("agentAdvances.fields.productSaleId") },
      {
        id: "products",
        header: t("agents.productCredit.products"),
        cell: ({ row }: { row: { original: AgentAdvanceDto; getIsExpanded: () => boolean; getToggleExpandedHandler: () => () => void } }) =>
          row.original.productSaleId == null ? "—" : (
            <Button size="small" variant="secondary" onClick={row.getToggleExpandedHandler()}>
              {t(row.getIsExpanded() ? "agents.productCredit.hideDetails" : "agents.productCredit.showDetails")}
            </Button>
          ),
      },
      {
        id: "agent",
        header: t("agentAdvances.fields.agent"),
        cell: ({ row }: { row: { original: AgentAdvanceDto } }) => `${row.original.agent.code} - ${row.original.agent.fullName}`,
      },
      { accessorKey: "agentContractId", header: t("agentAdvances.fields.contract") },
      {
        id: "amount",
        header: t("agentAdvances.fields.advancedAmount"),
        cell: ({ row }: { row: { original: AgentAdvanceDto } }) => `${money(row.original.advancedAmount)} AMD`,
      },
      {
        id: "date",
        header: t("agentAdvances.fields.advanceDate"),
        cell: ({ row }: { row: { original: AgentAdvanceDto } }) => date(row.original.advanceDate),
      },
      {
        accessorKey: "status",
        header: t("agentAdvances.fields.status"),
        cell: ({ row }: { row: { original: AgentAdvanceDto } }) => <Status value={String(row.original.status)} />,
      },
      { accessorKey: "notes", header: t("agentAdvances.fields.notes") },
    ],
    [t],
  );

  return (
    <div className={styles.page}>
      <SectionHeader title={t("agentWorkspace.productAdvances")} />
      {salesLoadFailed && <div className={styles.notice} role="alert">{t("agents.productCredit.salesLoadFailed")}</div>}
      <DataTable
        columns={columns as any}
        data={items}
        isLoading={loading}
        noResultsText={t("agentWorkspace.noProductAdvances")}
        loadingText={t("agentAdvances.list.loading")}
        getRowId={(advance) => advance.id}
        renderSubComponent={({ row }) => {
          const sale = row.original.productSaleId == null ? undefined : salesById[String(row.original.productSaleId)];
          if (salesLoading) return <div>{t("agents.productCredit.loadingSales")}</div>;
          if (!sale) {
            return <div>{t(salesLoadFailed ? "agents.productCredit.productItemsUnavailable" : "agents.productCredit.noProductItems")}</div>;
          }
          return <AgentProductCreditSaleItems items={sale.items ?? []} />;
        }}
      />
    </div>
  );
};

const ProductCreditContractDetails = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAppSelector((state) => state.auth);
  const canManageContracts = user?.role === "Admin" || user?.role === "SuperAdmin";
  const [contract, setContract] = useState<AgentContractDto | null>(null);
  const [debt, setDebt] = useState<AgentProductDebtDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);
  const [pendingAction, setPendingAction] = useState<"activate" | "deactivate" | null>(null);
  const [confirmAction, setConfirmAction] = useState<"activate" | "deactivate" | null>(null);

  const loadContract = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await agentContractsService.getContract(id);
      setContract(data);
      const summary = await agentsService.getAgentProductDebt(data.agent.id, data.id).catch(() => null);
      setDebt(summary);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("agentContracts.errors.loadDetailsFailed")));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadContract();
  }, [id, refreshToken, t]);

  useEffect(() => {
    const handleContractChanged = () => setRefreshToken((value) => value + 1);
    window.addEventListener("agent-product-contract-changed", handleContractChanged);
    return () => window.removeEventListener("agent-product-contract-changed", handleContractChanged);
  }, []);

  const handleProductAction = async (action: "activate" | "deactivate") => {
    if (!id || !canManageContracts || pendingAction) return;
    setPendingAction(action);
    try {
      if (action === "activate") {
        await agentContractsService.activateProductAdvanceContract(id);
        toast.success(t("agentContracts.messages.productContractActivated"));
      } else {
        await agentContractsService.deactivateProductAdvanceContract(id);
        toast.success(t("agentContracts.messages.productContractDeactivated"));
      }
      window.dispatchEvent(new CustomEvent("agent-product-contract-changed"));
    } catch (error) {
      toast.error(getApiErrorMessage(error, action === "activate"
        ? t("agentContracts.errors.activateProductContractFailed")
        : t("agentContracts.errors.deactivateProductContractFailed")));
    } finally {
      setPendingAction(null);
      setConfirmAction(null);
    }
  };

  if (loading || !contract) {
    return <div className={styles.page}>{t(loading ? "agentContracts.details.loading" : "agentContracts.errors.loadDetailsFailed")}</div>;
  }

  const productAdvances = (contract.advances ?? []).filter(isProductAdvance);
  const canActivateContract = contract.allowsProductAdvance === true && contract.status === "Draft";
  const canDeactivateContract = contract.allowsProductAdvance === true && contract.status === "Active" && (contract.financials.outstandingAmount ?? 0) === 0;

  return (
    <div className={styles.page}>
      <SectionHeader
        title={contract.contractNumber}
        goBack
        actions={<Button variant="secondary" onClick={() => navigate(`/agents/product-credit/contracts/${contract.id}/edit`)}>{t("agentContracts.actions.editContract")}</Button>}
      />
      <section className={styles.section}>
        <h2>{t("agentWorkspace.productCredit")}</h2>
        <div className={styles.detailGrid}>
          <div className={styles.detail}><span>{t("agentContracts.fields.agent")}</span><strong>{contract.agent.code} - {contract.agent.fullName}</strong></div>
          <div className={styles.detail}><span>{t("agentContracts.fields.contractStatus")}</span><strong><Status value={String(contract.status)} /></strong></div>
          <div className={styles.detail}><span>{t("agentContracts.productCredit.allowProductAdvance")}</span><strong>{t(contract.allowsProductAdvance ? "agentContracts.productCredit.allowed" : "agentContracts.productCredit.notAllowed")}</strong></div>
          <div className={styles.detail}><span>{t("agentContracts.fields.contractDate")}</span><strong>{date(contract.contractDate)}</strong></div>
          <div className={styles.detail}><span>{t("agentContracts.productCredit.repaymentRule")}</span><strong>{t("agentContracts.productCredit.ruleVersionNumber", { version: contract.repaymentTerms.ruleVersion })}</strong></div>
          <div className={styles.detail}><span>{t("common.notes")}</span><strong>{contract.notes || "-"}</strong></div>
          {canManageContracts && canActivateContract && (
            <div className={styles.detail}>
              <span>{t("agentContracts.fields.actions")}</span>
              <strong>
                <Button className={`${styles.productContractAction} ${styles.productContractDetailAction}`} size="small" variant="primary" disabled={pendingAction !== null} onClick={() => setConfirmAction("activate")}>
                  {t("agentContracts.actions.activateProductContract")}
                </Button>
              </strong>
            </div>
          )}
          {canManageContracts && contract.allowsProductAdvance === true && contract.status === "Active" && (
            <div className={styles.detail}>
              <span>{t("agentContracts.fields.actions")}</span>
              <strong>
                <Button className={`${styles.productContractAction} ${styles.productContractDetailAction}`} size="small" variant="secondary" disabled={pendingAction !== null || !canDeactivateContract} onClick={() => setConfirmAction("deactivate")}>
                  {t("agentContracts.actions.deactivateProductContract")}
                </Button>
              </strong>
            </div>
          )}
          {debt && (
            <>
              <div className={styles.detail}><span>{t("agents.productCredit.totalAdvanced")}</span><strong>{money(debt.totalAdvancedAmountAmd)} AMD</strong></div>
              <div className={styles.detail}><span>{t("agents.productCredit.totalPaid")}</span><strong>{money(debt.totalPaidAmountAmd)} AMD</strong></div>
              <div className={styles.detail}><span>{t("agents.productCredit.outstandingDebt")}</span><strong>{money(debt.outstandingAmountAmd)} AMD</strong></div>
            </>
          )}
        </div>
      </section>
      <section className={styles.section}>
        <h2>{t("agentWorkspace.productAdvances")}</h2>
        <DataTable
          columns={[
            { accessorKey: "advanceNumber", header: t("agentAdvances.fields.advanceNumber") },
            { accessorKey: "productSaleId", header: t("agentAdvances.fields.productSaleId") },
            { accessorKey: "advancedAmount", header: t("agentAdvances.fields.advancedAmount"), cell: ({ row }: { row: { original: AgentAdvanceDto } }) => `${money(row.original.advancedAmount)} AMD` },
            { accessorKey: "advanceDate", header: t("agentAdvances.fields.advanceDate"), cell: ({ row }: { row: { original: AgentAdvanceDto } }) => date(row.original.advanceDate) },
            { accessorKey: "status", header: t("agentAdvances.fields.status"), cell: ({ row }: { row: { original: AgentAdvanceDto } }) => <Status value={String(row.original.status)} /> },
          ] as any}
          data={productAdvances}
          noResultsText={t("agentWorkspace.noProductAdvances")}
        />
      </section>
      {confirmAction && (
        <ConfirmationModal
          open={true}
          onOpenChange={(open) => !open && setConfirmAction(null)}
          title={confirmAction === "activate"
            ? t("agentContracts.actions.activateProductContract")
            : t("agentContracts.actions.deactivateProductContract")}
          description={confirmAction === "activate"
            ? t("agentContracts.details.activateProductDescription")
            : t("agentContracts.details.deactivateProductDescription")}
          confirmText={confirmAction === "activate"
            ? t("agentContracts.actions.activateProductContract")
            : t("agentContracts.actions.deactivateProductContract")}
          confirmLoading={pendingAction === confirmAction}
          onConfirm={() => void handleProductAction(confirmAction)}
        />
      )}
    </div>
  );
};

const ProductDebtView = ({ paymentsOnly = false }: { paymentsOnly?: boolean }) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [agents, setAgents] = useState<AgentDto[]>([]);
  const [contracts, setContracts] = useState<AgentContractListItemDto[]>([]);
  const [debt, setDebt] = useState<AgentProductDebtDto | null>(null);
  const [payments, setPayments] = useState<AgentProductDebtPaymentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const agentId = searchParams.get("agentId") || "";
  const contractId = searchParams.get("contractId") || "";

  useEffect(() => {
    void agentsService.getAgents({ page: 1, pageSize: 500, status: 0 })
      .then((result) => setAgents(result.results ?? []))
      .catch((error) => toast.error(getApiErrorMessage(error, t("agents.errors.loadFailed"))));
  }, [t]);

  useEffect(() => {
    if (!agentId) {
      setContracts([]);
      setDebt(null);
      setPayments([]);
      return;
    }
    let isCancelled = false;
    setLoading(true);
    setContracts([]);
    setDebt(null);
    setPayments([]);
    void Promise.all([
      agentContractsService.listProductCreditContracts({ agentId, page: 1, pageSize: 500 }),
      paymentsOnly ? Promise.resolve(null) : agentsService.getAgentProductDebt(agentId, contractId || undefined),
      paymentsOnly ? agentsService.getAgentProductDebtPayments(agentId, contractId || undefined) : Promise.resolve([]),
    ])
      .then(([contractResult, debtResult, paymentResult]) => {
        if (isCancelled) return;
        setContracts(contractResult.results ?? []);
        setDebt(debtResult);
        setPayments(paymentResult);
      })
      .catch((error) => {
        if (!isCancelled) toast.error(getApiErrorMessage(error, t("agents.productCredit.loadFailed")));
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [agentId, contractId, paymentsOnly, t]);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };
  const setAgentFilter = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("agentId", value);
    else next.delete("agentId");
    next.delete("contractId");
    setSearchParams(next);
  };
  const titleKey = paymentsOnly ? "agentWorkspace.productPayments" : "agentWorkspace.productDebt";

  return (
    <div className={styles.page}>
      <SectionHeader title={t(titleKey)} />
      <div className={styles.filters}>
        <Select value={agentId} onChange={(event) => setAgentFilter(event.target.value)}>
          <option value="">{t("agentWorkspace.selectAgent")}</option>
          {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.code} - {agent.customer?.fullName || agent.phone || agent.code}</option>)}
        </Select>
        <AgentPhoneLookup agents={agents} onAgentFound={setAgentFilter} />
        {contracts.length > 1 && (
          <Select value={contractId} onChange={(event) => setFilter("contractId", event.target.value)}>
            <option value="">{t("agentWorkspace.allProductContracts")}</option>
            {contracts.map((item) => <option key={item.id} value={item.id}>{item.contractNumber}</option>)}
          </Select>
        )}
      </div>
      {!agentId ? (
        <div className={styles.notice}>{t("agentWorkspace.selectAgentPrompt")}</div>
      ) : paymentsOnly ? (
        <PaymentHistory items={payments} loading={loading} />
      ) : (
        <section className={styles.section}>
          <h2>{t("agentWorkspace.productDebt")}</h2>
          <div className={styles.detailGrid}>
            <div className={styles.detail}><span>{t("agents.productCredit.agent")}</span><strong>{agents.find((agent) => agent.id === agentId)?.code ?? agentId}</strong></div>
            {contractId && <div className={styles.detail}><span>{t("agents.productCredit.contract")}</span><strong>{contracts.find((item) => item.id === contractId)?.contractNumber ?? contractId}</strong></div>}
            <div className={styles.detail}><span>{t("agents.productCredit.totalAdvanced")}</span><strong>{loading ? t("common.loading") : `${money(debt?.totalAdvancedAmountAmd)} AMD`}</strong></div>
            <div className={styles.detail}><span>{t("agents.productCredit.totalPaid")}</span><strong>{loading ? t("common.loading") : `${money(debt?.totalPaidAmountAmd)} AMD`}</strong></div>
            <div className={styles.detail}><span>{t("agents.productCredit.outstandingDebt")}</span><strong>{loading ? t("common.loading") : `${money(debt?.outstandingAmountAmd)} AMD`}</strong></div>
          </div>
        </section>
      )}
    </div>
  );
};

const ProductSalesView = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [agents, setAgents] = useState<AgentDto[]>([]);
  const [contracts, setContracts] = useState<AgentContractListItemDto[]>([]);
  const [items, setItems] = useState<AgentProductCreditSaleDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [salesError, setSalesError] = useState<string | null>(null);
  const agentId = searchParams.get("agentId") || "";
  const contractId = searchParams.get("contractId") || "";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = 50;

  useEffect(() => {
    void agentsService
      .getAgents({ page: 1, pageSize: 500, status: 0 })
      .then((result) => setAgents(result.results ?? []))
      .catch((error) => toast.error(getApiErrorMessage(error, t("agents.errors.loadFailed"))));
  }, [t]);

  useEffect(() => {
    if (!agentId) {
      setContracts([]);
      setItems([]);
      return;
    }

    let isCancelled = false;
    setLoading(true);
    setSalesError(null);
    setItems([]);
    void Promise.all([
      agentContractsService.listProductCreditContracts({ agentId, page: 1, pageSize: 500 }),
      agentsService.getAgentProductCreditSales(agentId, {
        contractId: contractId || undefined,
        page,
        pageSize,
      }),
    ])
      .then(([contractResult, salesResult]) => {
        if (isCancelled) return;
        setContracts(contractResult.results ?? []);
        setItems(salesResult);
      })
      .catch((error) => {
        if (!isCancelled) {
          const message = getApiErrorMessage(error, t("agents.productCredit.salesLoadFailed"));
          setSalesError(message);
          toast.error(message);
        }
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [agentId, contractId, page, pageSize, t]);

  const setAgentFilter = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("agentId", value);
    else next.delete("agentId");
    next.delete("contractId");
    next.delete("page");
    setSearchParams(next);
  };
  const setContractFilter = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("contractId", value);
    else next.delete("contractId");
    next.delete("page");
    setSearchParams(next);
  };
  const columns = useMemo(
    () => [
      { accessorKey: "saleId", header: t("agents.productCredit.saleId") },
      {
        id: "saleDate",
        header: t("agents.productCredit.saleDate"),
        cell: ({ row }: { row: { original: AgentProductCreditSaleDto } }) => date(row.original.saleDate),
      },
      {
        id: "agent",
        header: t("agents.productCredit.agent"),
        cell: ({ row }: { row: { original: AgentProductCreditSaleDto } }) =>
          agents.find((agent) => agent.id === row.original.agentId)?.customer?.fullName || row.original.agentId,
      },
      { accessorKey: "contractId", header: t("agents.productCredit.contract") },
      {
        id: "products",
        header: t("agents.productCredit.products"),
        cell: ({ row }: { row: { original: AgentProductCreditSaleDto } }) => (
          <details className={styles.saleProducts}>
            <summary>{t("agents.productCredit.productCount", { count: row.original.items?.length ?? 0 })}</summary>
            <ul>
              {(row.original.items ?? []).map((item, index) => (
                <li key={`${item.productId}-${index}`}>
                  <span>{t("agents.productCredit.productId", { id: item.productId })}</span>
                  <span>{item.quantity} × {money(item.unitPrice)} AMD</span>
                  <strong>{t("agents.productCredit.lineTotal")}: {money(item.lineTotal)} AMD</strong>
                </li>
              ))}
            </ul>
          </details>
        ),
      },
      {
        id: "total",
        header: t("agents.productCredit.totalAmount"),
        cell: ({ row }: { row: { original: AgentProductCreditSaleDto } }) => `${money(row.original.totalAmount)} AMD`,
      },
      {
        id: "paid",
        header: t("agents.productCredit.paymentAmount"),
        cell: ({ row }: { row: { original: AgentProductCreditSaleDto } }) => `${money(row.original.paidAmount)} AMD`,
      },
      {
        id: "outstanding",
        header: t("agents.productCredit.outstandingDebt"),
        cell: ({ row }: { row: { original: AgentProductCreditSaleDto } }) => `${money(row.original.outstandingAmount)} AMD`,
      },
      { accessorKey: "status", header: t("agents.productCredit.saleStatus") },
    ],
    [agents, t],
  );

  return (
    <div className={styles.page}>
      <SectionHeader title={t("agentWorkspace.productSales")} />
      <div className={styles.filters}>
        <Select value={agentId} onChange={(event) => setAgentFilter(event.target.value)}>
          <option value="">{t("agentWorkspace.selectAgent")}</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.code} - {agent.customer?.fullName || agent.phone || agent.code}
            </option>
          ))}
        </Select>
        <AgentPhoneLookup agents={agents} onAgentFound={setAgentFilter} />
        {contracts.length > 1 && (
          <Select value={contractId} onChange={(event) => setContractFilter(event.target.value)}>
            <option value="">{t("agentWorkspace.allProductContracts")}</option>
            {contracts.map((contract) => (
              <option key={contract.id} value={contract.id}>{contract.contractNumber}</option>
            ))}
          </Select>
        )}
      </div>
      {!agentId ? (
        <div className={styles.notice}>{t("agentWorkspace.selectAgentPrompt")}</div>
      ) : (
        <>
          {salesError && <div className={styles.notice} role="alert">{salesError}</div>}
          <DataTable
            columns={columns as any}
            data={items}
            isLoading={loading}
            manualPagination
            pageCount={items.length === pageSize ? page + 1 : page}
            pageIndex={page - 1}
            canNextPage={items.length === pageSize}
            paginationLabel={<>{t("common.page")} {page}</>}
            getRowId={(sale) => String(sale.saleId)}
            onPaginationChange={(index) => {
              const next = new URLSearchParams(searchParams);
              next.set("page", String(index + 1));
              setSearchParams(next);
            }}
            noResultsText={t("agents.productCredit.noSales")}
            loadingText={t("common.loading")}
          />
        </>
      )}
    </div>
  );
};

export const AgentProductCreditPage = ({ view }: { view: AgentProductCreditView }) => {
  if (view === "contracts") return <ProductContractList />;
  if (view === "advances") return <ProductAdvanceList />;
  if (view === "sales") return <ProductSalesView />;
  if (view === "payments") return <ProductDebtView paymentsOnly />;
  return <ProductDebtView />;
};

export const AgentProductCreditContractDetails = ProductCreditContractDetails;
