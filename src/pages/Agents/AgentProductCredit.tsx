import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { ChevronDown, CircleCheck, Eye, Plus, Power } from "lucide-react";

import { SectionHeader } from "@/components/common";
import { Button, ConfirmationModal, DataTable, Select, Textarea, TextField } from "@/ui-kit";
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
  AgentProductDebtReturnDto,
} from "@/types/agents";
import { AgentProductCreditSaleItems } from "./AgentProductCreditPurchases";
import { AgentActionButton, AgentIconButton } from "./AgentActionButton";
import { AgentTableDetails } from "./AgentTableDetails";
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

const PaymentHistory = ({ items, loading, contractNumber }: { items: AgentProductDebtPaymentDto[]; loading: boolean; contractNumber: string }) => {
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
      { id: "contractNumber", header: t("agents.productCredit.contract"), cell: () => contractNumber },
      { accessorKey: "cashRegisterId", header: t("agents.productCredit.cashRegister") },
      {
        id: "details",
        header: t("common.actions"),
        cell: ({ row }: any) => (
          <AgentIconButton
            size="medium"
            tone="secondary"
            icon={<ChevronDown size={16} />}
            ariaLabel={`${t("common.details")} ${row.original.agentContractId}`}
            title={t("common.details")}
            aria-expanded={row.getIsExpanded()}
            onClick={row.getToggleExpandedHandler()}
          />
        ),
      },
    ],
    [contractNumber, t],
  );

  return (
    <DataTable
      columns={columns as any}
      data={items}
      isLoading={loading}
      fitContainer
      renderSubComponent={({ row }) => (
        <AgentTableDetails
          fields={[
            { label: t("agents.productCredit.cashSession"), value: row.original.cashSessionId || "—" },
            { label: t("agents.productCredit.cashLedgerEntry"), value: row.original.cashLedgerEntryId || "—" },
            { label: t("agents.productCredit.createdBy"), value: row.original.createdBy || "—" },
          ]}
        />
      )}
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
                <AgentIconButton size="medium" tone="primary" icon={<CircleCheck size={16} />} ariaLabel={`${t("agentContracts.actions.activateProductContract")} ${contract.contractNumber}`} title={t("agentContracts.actions.activateProductContract")} disabled={isPending} onClick={() => setConfirmActivationId(contract.id)} />
              )}
              {canManageContracts && canDeactivate && (
                <AgentIconButton size="medium" tone="danger" icon={<Power size={16} />} ariaLabel={`${t("agentContracts.actions.deactivateProductContract")} ${contract.contractNumber}`} title={t("agentContracts.actions.deactivateProductContract")} disabled={isPending} onClick={() => setConfirmDeactivationId(contract.id)} />
              )}
              <AgentIconButton size="medium" tone="secondary" icon={<Eye size={16} />} ariaLabel={`${t("agentContracts.actions.view")} ${contract.contractNumber}`} title={t("agentContracts.actions.view")} onClick={() => navigate(`/agents/product-credit/contracts/${contract.id}`)} />
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
        actions={
          <AgentActionButton icon={<Plus size={16} />} onClick={() => navigate("/agents/product-credit/contracts/create")}>
            {t("agentContracts.actions.createContract")}
          </AgentActionButton>
        }
      />
      <DataTable
        columns={columns as any}
        data={items}
        isLoading={loading}
        fitContainer
        renderSubComponent={({ row }) => (
          <AgentTableDetails
            fields={[
              { label: t("agentContracts.productCredit.allowProductAdvance"), value: t(row.original.allowsProductAdvance ? "agentContracts.productCredit.allowed" : "agentContracts.productCredit.notAllowed") },
              { label: t("agentContracts.productCredit.repaymentRule"), value: row.original.repaymentTerms?.ruleVersion != null ? t("agentContracts.productCredit.ruleVersionNumber", { version: row.original.repaymentTerms.ruleVersion }) : "—" },
              { label: t("agentContracts.fields.contractDate"), value: date(row.original.contractDate) },
              { label: t("agentContracts.fields.repaymentDeadline"), value: date(row.original.repaymentDeadline) },
              { label: t("agents.productCredit.deadline"), value: date(row.original.productCreditDeadline) },
              { label: t("agentContracts.fields.advanced"), value: `${money(row.original.totalAdvancedAmount)} AMD` },
              { label: t("agentContracts.fields.repaid"), value: `${money(row.original.totalRepaidAmount)} AMD` },
              { label: t("agentContracts.fields.outstanding"), value: `${money(row.original.outstandingAmount)} AMD` },
            ]}
          />
        )}
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
      {
        accessorKey: "productSaleId",
        header: t("agents.productCredit.saleId"),
        cell: ({ row }: { row: { original: AgentAdvanceDto } }) => row.original.productSaleId ?? "—",
      },
      {
        id: "agent",
        header: t("agentAdvances.fields.agent"),
        cell: ({ row }: { row: { original: AgentAdvanceDto } }) => `${row.original.agent.code} - ${row.original.agent.fullName}`,
      },
      {
        id: "products",
        header: t("agents.productCredit.products"),
        cell: ({ row }: { row: { original: AgentAdvanceDto } }) => {
          const sale = row.original.productSaleId == null ? undefined : salesById[String(row.original.productSaleId)];
          if (salesLoading) return t("agents.productCredit.loadingSales");
          if (!sale) return t(salesLoadFailed ? "agents.productCredit.productItemsUnavailable" : "agents.productCredit.noProductItems");
          return sale.items?.length
            ? sale.items.map((item) => {
              const productCode = item.productCode?.trim();
              const productSku = item.productSku?.trim();
              const productName = productCode
                ? productSku ? `${productCode} · ${productSku}` : productCode
                : productSku || t("agents.productCredit.productId", { id: item.productId });
              return `${productName} × ${item.quantity}`;
            }).join(", ")
            : t("agents.productCredit.noProductItems");
        },
      },
      {
        id: "productValue",
        header: t("agents.productCredit.productValue"),
        cell: ({ row }: { row: { original: AgentAdvanceDto } }) => `${money(row.original.advancedAmount)} AMD`,
      },
      {
        accessorKey: "status",
        header: t("agentAdvances.fields.status"),
        cell: ({ row }: { row: { original: AgentAdvanceDto } }) => <Status value={String(row.original.status)} />,
      },
      {
        id: "details",
        header: t("common.actions"),
        cell: ({ row }: any) => (
          <AgentIconButton
            size="medium"
            tone="secondary"
            icon={<ChevronDown size={16} className={row.getIsExpanded() ? styles.chevronExpanded : ""} />}
            ariaLabel={`${t("common.details")} ${t("agents.productCredit.saleId")} ${row.original.productSaleId ?? ""}`}
            title={t("common.details")}
            aria-expanded={row.getIsExpanded()}
            onClick={row.getToggleExpandedHandler()}
          />
        ),
      },
    ],
    [salesById, salesLoadFailed, salesLoading, t],
  );

  return (
    <div className={styles.page}>
      <SectionHeader title={t("agentWorkspace.productAdvances")} />
      {salesLoadFailed && <div className={styles.notice} role="alert">{t("agents.productCredit.salesLoadFailed")}</div>}
      <DataTable
        columns={columns as any}
        data={items}
        isLoading={loading}
        fitContainer
        noResultsText={t("agentWorkspace.noProductAdvances")}
        loadingText={t("agentAdvances.list.loading")}
        getRowId={(advance) => advance.id}
        renderSubComponent={({ row }) => {
          const sale = row.original.productSaleId == null ? undefined : salesById[String(row.original.productSaleId)];
          if (salesLoading) return <><AgentTableDetails fields={[
            { label: t("agentAdvances.fields.contract"), value: row.original.agentContractId },
            { label: t("agents.productCredit.saleDate"), value: date(row.original.advanceDate) },
            { label: t("agentAdvances.fields.notes"), value: row.original.notes || "—" },
          ]} /><div>{t("agents.productCredit.loadingSales")}</div></>;
          if (!sale) {
            return <><AgentTableDetails fields={[
              { label: t("agentAdvances.fields.contract"), value: row.original.agentContractId },
              { label: t("agents.productCredit.saleDate"), value: date(row.original.advanceDate) },
              { label: t("agentAdvances.fields.notes"), value: row.original.notes || "—" },
            ]} /><div>{t(salesLoadFailed ? "agents.productCredit.productItemsUnavailable" : "agents.productCredit.noProductItems")}</div></>;
          }
          return <><AgentTableDetails fields={[
            { label: t("agentAdvances.fields.contract"), value: row.original.agentContractId },
            { label: t("agentAdvances.fields.advanceDate"), value: date(row.original.advanceDate) },
            { label: t("agentAdvances.fields.notes"), value: row.original.notes || "—" },
          ]} /><AgentProductCreditSaleItems items={sale.items ?? []} /></>;
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
  const [creditLimitAmd, setCreditLimitAmd] = useState("0");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [restoreCreditLimit, setRestoreCreditLimit] = useState(true);
  const [acceptsNewPurchases, setAcceptsNewPurchases] = useState(true);
  const [termsSaving, setTermsSaving] = useState(false);
  const [extensionOpen, setExtensionOpen] = useState(false);
  const [extensionDeadline, setExtensionDeadline] = useState("");
  const [extensionReason, setExtensionReason] = useState("");
  const [extensionSaving, setExtensionSaving] = useState(false);
  const [selectedReturnAdvanceId, setSelectedReturnAdvanceId] = useState("");
  const [returnAmount, setReturnAmount] = useState("");
  const [pendingReturn, setPendingReturn] = useState<{ agentAdvanceId: string; amountAmd: number; idempotencyKey: string } | null>(null);
  const [returnSaving, setReturnSaving] = useState(false);
  const [returnResult, setReturnResult] = useState<AgentProductDebtReturnDto | null>(null);

  const loadContract = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await agentContractsService.getContract(id);
      setContract(data);
      setCreditLimitAmd(String(data.productCreditLimitAmd ?? 0));
      setDiscountPercent(String(data.productCreditDiscountPercent ?? 0));
      setRestoreCreditLimit(data.restoreProductCreditLimitAfterRepayment ?? true);
      setAcceptsNewPurchases(data.acceptsNewProductPurchases ?? true);
      setExtensionDeadline("");
      setExtensionReason("");
      const summary = await agentsService.getAgentProductDebt(data.agent.id, data.id, getCashRegisterId()).catch(() => null);
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

  const saveProductTerms = async () => {
    if (!id || !contract || !canManageContracts || termsSaving) return;
    const limit = Number(creditLimitAmd);
    const discount = Number(discountPercent);
    if (!Number.isFinite(limit) || limit < 0) {
      toast.error(t("agents.productCredit.invalidCreditLimit"));
      return;
    }
    if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
      toast.error(t("agents.productCredit.invalidDiscount"));
      return;
    }
    setTermsSaving(true);
    try {
      if (contract.status === "Draft") await agentContractsService.activateProductAdvanceContract(id);
      await agentContractsService.updateProductCreditTerms(id, {
        creditLimitAmd: limit,
        discountPercent: discount,
        restoreCreditLimitAfterRepayment: restoreCreditLimit,
        acceptsNewPurchases,
      });
      toast.success(t("agents.productCredit.termsUpdated"));
      window.dispatchEvent(new CustomEvent("agent-product-contract-changed"));
      setRefreshToken((value) => value + 1);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("agents.productCredit.loadFailed")));
    } finally {
      setTermsSaving(false);
    }
  };

  const submitDeadlineExtension = async () => {
    if (!id || !contract || !canManageContracts || extensionSaving) return;
    const nextDeadline = new Date(`${extensionDeadline}T23:59:59`);
    const currentDeadline = contract.productCreditDeadline ? new Date(contract.productCreditDeadline) : null;
    if (!extensionDeadline || Number.isNaN(nextDeadline.getTime()) || nextDeadline.getTime() <= Date.now() ||
      (currentDeadline && nextDeadline.getTime() <= currentDeadline.getTime())) {
      toast.error(t("agents.productCredit.deadlineMustBeFuture"));
      return;
    }
    if (!extensionReason.trim()) {
      toast.error(t("agents.productCredit.extensionReasonRequired"));
      return;
    }
    setExtensionSaving(true);
    try {
      await agentContractsService.extendProductCreditDeadline(id, {
        newDeadline: nextDeadline.toISOString(),
        reason: extensionReason.trim(),
      });
      toast.success(t("agents.productCredit.extensionSuccess"));
      setExtensionOpen(false);
      setExtensionDeadline("");
      setExtensionReason("");
      window.dispatchEvent(new CustomEvent("agent-product-contract-changed"));
      setRefreshToken((value) => value + 1);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("agents.productCredit.loadFailed")));
    } finally {
      setExtensionSaving(false);
    }
  };

  const submitProductReturn = async () => {
    if (!contract || !selectedReturnAdvanceId || !canManageContracts || returnSaving) return;
    const amount = Number(returnAmount);
    if (!pendingReturn && (!Number.isFinite(amount) || amount <= 0)) {
      toast.error(t("agents.productCredit.returnAmountRequired"));
      return;
    }
    const operation = pendingReturn ?? {
      agentAdvanceId: selectedReturnAdvanceId,
      amountAmd: amount,
      idempotencyKey: crypto.randomUUID(),
    };
    if (operation.agentAdvanceId !== selectedReturnAdvanceId || operation.amountAmd !== amount) return;
    setPendingReturn(operation);
    setReturnSaving(true);
    try {
      const result = await agentsService.returnAgentProductDebt(
        contract.agent.id,
        operation,
        getCashRegisterId(),
      );
      setReturnResult(result);
      setPendingReturn(null);
      setSelectedReturnAdvanceId("");
      setReturnAmount("");
      toast.success(t("agents.productCredit.returnSuccess"));
      window.dispatchEvent(new CustomEvent("agent-product-credit-activity-changed", {
        detail: { agentId: contract.agent.id },
      }));
      setRefreshToken((value) => value + 1);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("agents.productCredit.loadFailed")));
    } finally {
      setReturnSaving(false);
    }
  };

  if (loading || !contract) {
    return <div className={styles.page}>{t(loading ? "agentContracts.details.loading" : "agentContracts.errors.loadDetailsFailed")}</div>;
  }

  const productAdvances = (contract.advances ?? []).filter(isProductAdvance);
  const canActivateContract = contract.allowsProductAdvance === true && contract.status === "Draft";
  const canDeactivateContract = contract.allowsProductAdvance === true && contract.status === "Active" && (contract.financials.outstandingAmount ?? 0) === 0;
  const contractOutstanding = debt?.outstandingAmountAmd ?? contract.financials.outstandingAmount;
  const availableCredit = contract.availableProductCreditAmd ?? (
    contract.restoreProductCreditLimitAfterRepayment && contract.productCreditLimitAmd != null
      ? Math.max(0, contract.productCreditLimitAmd - contractOutstanding)
      : null
  );
  const selectedReturnAdvance = productAdvances.find((advance) => advance.id === selectedReturnAdvanceId);

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
          <div className={styles.detail}><span>{t("agentContracts.fields.repaymentDeadline")}</span><strong>{date(contract.repaymentDeadline)}</strong></div>
          <div className={styles.detail}><span>{t("agentContracts.productCredit.repaymentRule")}</span><strong>{t("agentContracts.productCredit.ruleVersionNumber", { version: contract.repaymentTerms.ruleVersion })}</strong></div>
          <div className={styles.detail}><span>{t("common.notes")}</span><strong>{contract.notes || "-"}</strong></div>
          <div className={styles.detail}><span>{t("agents.productCredit.creditLimit")}</span><strong>{contract.productCreditLimitAmd == null ? "—" : `${money(contract.productCreditLimitAmd)} AMD`}</strong></div>
          <div className={styles.detail}><span>{t("agents.productCredit.outstandingDebt")}</span><strong>{money(contractOutstanding)} AMD</strong></div>
          {availableCredit != null && <div className={styles.detail}><span>{t("agents.productCredit.availableCredit")}</span><strong>{money(availableCredit)} AMD</strong></div>}
          <div className={styles.detail}><span>{t("agents.productCredit.discountPercent")}</span><strong>{contract.productCreditDiscountPercent == null ? "—" : `${contract.productCreditDiscountPercent}%`}</strong></div>
          <div className={styles.detail}><span>{t("agents.productCredit.deadline")}</span><strong>{date(contract.productCreditDeadline)}</strong></div>
          <div className={styles.detail}><span>{t("agents.productCredit.purchasePermission")}</span><strong>{t(contract.acceptsNewProductPurchases ? "agentContracts.productCredit.allowed" : "agentContracts.productCredit.notAllowed")}</strong></div>
          <div className={styles.detail}><span>{t("agents.productCredit.approvedShops")}</span><strong>{contract.approvedShopIds?.length ? contract.approvedShopIds.join(", ") : t("agents.productCredit.noApprovedShops")}</strong></div>
          {debt && (
            <>
              <div className={styles.detail}><span>{t("agents.productCredit.totalAdvanced")}</span><strong>{money(debt.totalAdvancedAmountAmd)} AMD</strong></div>
              <div className={styles.detail}><span>{t("agents.productCredit.totalPaid")}</span><strong>{money(debt.totalPaidAmountAmd)} AMD</strong></div>
              <div className={styles.detail}><span>{t("agents.productCredit.outstandingDebt")}</span><strong>{money(debt.outstandingAmountAmd)} AMD</strong></div>
            </>
          )}
        </div>
        {canManageContracts && (canActivateContract || (contract.allowsProductAdvance === true && contract.status === "Active")) && (
          <div className={styles.contractManagement}>
            <div className={styles.contractManagementCopy}>
              <span>{t("agentContracts.fields.actions")}</span>
              <strong>
                {t(canActivateContract
                  ? "agentContracts.actions.activateProductContract"
                  : "agentContracts.actions.deactivateProductContract")}
              </strong>
              <p>{t(canActivateContract
                ? "agentContracts.details.activateProductDescription"
                : "agentContracts.details.deactivateProductDescription")}</p>
            </div>
            <Button
              className={`${styles.productContractAction} ${styles.contractManagementButton} ${canActivateContract ? styles.contractActivateButton : styles.contractDeactivateButton}`}
              size="small"
              variant={canActivateContract ? "primary" : "secondary"}
              disabled={pendingAction !== null || (!canActivateContract && !canDeactivateContract)}
              onClick={() => setConfirmAction(canActivateContract ? "activate" : "deactivate")}
            >
              <Power size={15} aria-hidden="true" />
              {t(canActivateContract
                ? "agentContracts.actions.activateProductContract"
                : "agentContracts.actions.deactivateProductContract")}
            </Button>
          </div>
        )}
      </section>
      <section className={styles.section}>
        <h2>{t("agentContracts.productCredit.title")}</h2>
        <div className={styles.detailGrid}>
          <div className={styles.detail}><span>{t("agents.productCredit.creditLimit")}</span>
            <TextField type="number" min="0" step="0.01" value={creditLimitAmd} onChange={(event) => setCreditLimitAmd(event.target.value)} helperText={t("agents.productCredit.creditLimitDescription")} disabled={!canManageContracts || termsSaving} />
          </div>
          <div className={styles.detail}><span>{t("agents.productCredit.discountPercent")}</span>
            <TextField type="number" min="0" max="100" step="0.01" value={discountPercent} onChange={(event) => setDiscountPercent(event.target.value)} disabled={!canManageContracts || termsSaving} />
          </div>
          <label className={styles.productCreditOption}>
            <input type="checkbox" checked={restoreCreditLimit} onChange={(event) => setRestoreCreditLimit(event.target.checked)} disabled={!canManageContracts || termsSaving} />
            <span>{t("agents.productCredit.restoreCreditLimit")}</span>
          </label>
          <label className={styles.productCreditOption}>
            <input type="checkbox" checked={acceptsNewPurchases} onChange={(event) => setAcceptsNewPurchases(event.target.checked)} disabled={!canManageContracts || termsSaving} />
            <span>{t("agents.productCredit.acceptsNewPurchases")}</span>
          </label>
        </div>
        {canManageContracts && <div className={styles.headerActions}>
          <Button variant="primary" size="small" disabled={termsSaving} onClick={() => void saveProductTerms()}>
            {termsSaving ? t("common.loading") : t("agentContracts.actions.saveChanges")}
          </Button>
          {contract.productCreditDeadline && <Button variant="secondary" size="small" disabled={termsSaving} onClick={() => setExtensionOpen((open) => !open)}>
            {t("agents.productCredit.extendDeadline")}
          </Button>}
        </div>}
        {extensionOpen && <div className={styles.productCreditTermsForm}>
          <TextField
            label={t("agents.productCredit.newDeadline")}
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={extensionDeadline}
            onChange={(event) => setExtensionDeadline(event.target.value)}
            disabled={extensionSaving}
          />
          <Textarea
            label={t("agents.productCredit.extensionReason")}
            value={extensionReason}
            onChange={(event) => setExtensionReason(event.target.value)}
            disabled={extensionSaving}
          />
          <div className={styles.headerActions}>
            <Button variant="secondary" size="small" disabled={extensionSaving} onClick={() => setExtensionOpen(false)}>{t("common.cancel")}</Button>
            <Button variant="primary" size="small" disabled={extensionSaving} onClick={() => void submitDeadlineExtension()}>
              {extensionSaving ? t("common.loading") : t("agents.productCredit.extendDeadline")}
            </Button>
          </div>
        </div>}
      </section>
      <section className={styles.section}>
        <h2>{t("agentWorkspace.productAdvances")}</h2>
        {returnResult && <div className={styles.notice} role="status">
          <div>{t("agents.productCredit.returnApplied")}: {money(returnResult.appliedAmountAmd)} AMD</div>
          <strong>{t("agents.productCredit.unresolvedExcess")}: {money(returnResult.unresolvedExcessAmd)} AMD</strong>
          <p>{t("agents.productCredit.noReturnsRefund")}</p>
        </div>}
        {selectedReturnAdvance && <div className={styles.productCreditTermsForm}>
          <strong>{t("agents.productCredit.saleId")}: {selectedReturnAdvance.productSaleId ?? "—"} · {t("agents.productCredit.productValue")}: {money(selectedReturnAdvance.advancedAmount)} AMD</strong>
          <TextField
            label={t("agents.productCredit.returnAmount")}
            type="number"
            min="0.01"
            step="0.01"
            value={pendingReturn?.amountAmd ?? returnAmount}
            onChange={(event) => setReturnAmount(event.target.value)}
            disabled={Boolean(pendingReturn) || returnSaving}
          />
          <div className={styles.headerActions}>
            <Button variant="primary" size="small" disabled={returnSaving} onClick={() => void submitProductReturn()}>
              {returnSaving ? t("common.loading") : pendingReturn ? t("agents.productCredit.retryReturn") : t("agents.productCredit.return")}
            </Button>
          </div>
        </div>}
        <DataTable
          columns={[
            {
              accessorKey: "productSaleId",
              header: t("agents.productCredit.saleId"),
              cell: ({ row }: { row: { original: AgentAdvanceDto } }) => row.original.productSaleId ?? "—",
            },
            { accessorKey: "advancedAmount", header: t("agents.productCredit.productValue"), cell: ({ row }: { row: { original: AgentAdvanceDto } }) => `${money(row.original.advancedAmount)} AMD` },
            { accessorKey: "advanceDate", header: t("agents.productCredit.saleDate"), cell: ({ row }: { row: { original: AgentAdvanceDto } }) => date(row.original.advanceDate) },
            { accessorKey: "status", header: t("agentAdvances.fields.status"), cell: ({ row }: { row: { original: AgentAdvanceDto } }) => <Status value={String(row.original.status)} /> },
            ...(canManageContracts ? [{
              id: "return",
              header: t("agents.productCredit.return"),
              cell: ({ row }: { row: { original: AgentAdvanceDto } }) => (
                <Button
                  variant="secondary"
                  size="small"
                  disabled={Boolean(pendingReturn) || returnSaving}
                  onClick={() => {
                    setSelectedReturnAdvanceId(row.original.id);
                    setReturnAmount("");
                    setReturnResult(null);
                  }}
                >
                  {t("agents.productCredit.return")}
                </Button>
              ),
            }] : []),
          ] as any}
          data={productAdvances}
          fitContainer
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
  const [debtError, setDebtError] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [pendingPayment, setPendingPayment] = useState<{ amountAmd: number; contractId: string; idempotencyKey: string } | null>(null);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
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
      setDebtError(null);
      setLoading(false);
      return;
    }
    let isCancelled = false;
    setLoading(true);
    setContracts([]);
    setDebt(null);
    setPayments([]);
    setDebtError(null);
    void agentContractsService
      .listProductCreditContracts({ agentId, page: 1, pageSize: 500 })
      .then(async (contractResult) => {
        if (isCancelled) return;
        const productContracts = contractResult.results ?? [];
        setContracts(productContracts);
        if (!contractId || !productContracts.some((item) => item.id === contractId)) return;
        const [debtResult, paymentResult] = await Promise.all([
          agentsService.getAgentProductDebt(agentId, contractId),
          agentsService.getAgentProductDebtPayments(agentId, contractId),
        ]);
        if (isCancelled) return;
        setDebt(debtResult);
        setPayments(paymentResult);
      })
      .catch((error) => {
        if (!isCancelled) {
          const message = getApiErrorMessage(error, t("agents.productCredit.loadFailed"));
          setDebtError(message);
          toast.error(message);
        }
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [agentId, contractId, paymentsOnly, refreshToken, t]);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };
  const setAgentFilter = (value: string) => {
    if (pendingPayment) return;
    const next = new URLSearchParams(searchParams);
    if (value) next.set("agentId", value);
    else next.delete("agentId");
    next.delete("contractId");
    setSearchParams(next);
  };
  const submitPayment = async () => {
    if (!agentId || !contractId || paymentSaving) return;
    const amount = Number(paymentAmount);
    if (!pendingPayment && (!Number.isFinite(amount) || amount <= 0 || amount > Number(debt?.outstandingAmountAmd ?? 0))) {
      toast.error(t("agents.productCredit.invalidPaymentAmount"));
      return;
    }
    const operation = pendingPayment ?? {
      amountAmd: amount,
      contractId,
      idempotencyKey: crypto.randomUUID(),
    };
    if (operation.contractId !== contractId || operation.amountAmd !== amount) return;
    setPendingPayment(operation);
    setPaymentSaving(true);
    try {
      await agentsService.payAgentProductDebt(agentId, operation, getCashRegisterId());
      toast.success(t("agents.productCredit.paymentRecorded"));
      window.dispatchEvent(new CustomEvent("agent-product-credit-activity-changed", { detail: { agentId } }));
      setPaymentAmount("");
      setPendingPayment(null);
      setRefreshToken((value) => value + 1);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("agents.productCredit.paymentFailed")));
    } finally {
      setPaymentSaving(false);
    }
  };
  const titleKey = paymentsOnly ? "agentWorkspace.productPayments" : "agentWorkspace.productDebt";
  const selectedContract = contracts.find((item) => item.id === contractId);

  return (
    <div className={styles.page}>
      <SectionHeader title={t(titleKey)} />
      <div className={styles.agentWorkspaceFilters}>
        <Select value={agentId} onChange={(event) => setAgentFilter(event.target.value)} disabled={Boolean(pendingPayment)}>
          <option value="">{t("agentWorkspace.selectAgent")}</option>
          {agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.code} - {agent.customer?.fullName || agent.phone || agent.code}</option>)}
        </Select>
        <AgentPhoneLookup agents={agents} onAgentFound={setAgentFilter} />
        {agentId && (
          <Select value={contractId} onChange={(event) => setFilter("contractId", event.target.value)} disabled={Boolean(pendingPayment)}>
            <option value="">{t("agentWorkspace.selectProductContract")}</option>
            {contracts.map((item) => <option key={item.id} value={item.id}>{item.contractNumber}</option>)}
          </Select>
        )}
      </div>
      {!agentId ? (
        <div className={styles.notice}>{t("agentWorkspace.selectAgentPrompt")}</div>
      ) : debtError ? (
        <div className={styles.notice} role="alert">{debtError}</div>
      ) : contracts.length === 0 && !loading ? (
        <div className={styles.notice}>{t("agents.productCredit.noContracts")}</div>
      ) : !selectedContract ? (
        <div className={styles.notice}>{t("agents.productCredit.selectContractPrompt")}</div>
      ) : paymentsOnly ? (
        <>
          <div className={styles.detail}><span>{t("agents.productCredit.contract")}</span><strong>{selectedContract.contractNumber}</strong></div>
          <PaymentHistory
            items={payments}
            loading={loading}
            contractNumber={selectedContract.contractNumber}
          />
        </>
      ) : (
        <section className={styles.section}>
          <h2>{t("agentWorkspace.productDebt")}</h2>
          <div className={styles.detailGrid}>
            <div className={styles.detail}><span>{t("agents.productCredit.agent")}</span><strong>{agents.find((agent) => agent.id === agentId)?.code ?? agentId}</strong></div>
            <div className={styles.detail}><span>{t("agents.productCredit.contract")}</span><strong>{selectedContract.contractNumber}</strong></div>
            <div className={styles.detail}><span>{t("agents.productCredit.totalAdvanced")}</span><strong>{loading ? t("common.loading") : `${money(debt?.totalAdvancedAmountAmd)} AMD`}</strong></div>
            <div className={styles.detail}><span>{t("agents.productCredit.totalPaid")}</span><strong>{loading ? t("common.loading") : `${money(debt?.totalPaidAmountAmd)} AMD`}</strong></div>
            <div className={styles.detail}><span>{t("agents.productCredit.outstandingDebt")}</span><strong>{loading ? t("common.loading") : `${money(debt?.outstandingAmountAmd)} AMD`}</strong></div>
          </div>
          <div className={styles.inlineForm}>
            <TextField
              label={t("agents.productCredit.paymentAmount")}
              type="number"
              min="0.01"
              max={debt?.outstandingAmountAmd ?? 0}
              step="0.01"
              value={pendingPayment?.amountAmd ?? paymentAmount}
              onChange={(event) => setPaymentAmount(event.target.value)}
              disabled={Boolean(pendingPayment) || loading || !debt?.outstandingAmountAmd}
            />
            <Button
              variant="primary"
              disabled={paymentSaving || loading || !debt || Number(pendingPayment?.amountAmd ?? paymentAmount) <= 0 ||
                Number(pendingPayment?.amountAmd ?? paymentAmount) > debt.outstandingAmountAmd}
              onClick={() => void submitPayment()}
            >
              {paymentSaving ? t("common.loading") : pendingPayment ? t("agents.productCredit.retryPayment") : t("agents.productCredit.submitPayment")}
            </Button>
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
  const selectedContract = contracts.find((contract) => contract.id === contractId);

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
      setLoading(false);
      return;
    }

    let isCancelled = false;
    setLoading(true);
    setSalesError(null);
    setItems([]);
    void agentContractsService
      .listProductCreditContracts({ agentId, page: 1, pageSize: 500 })
      .then(async (contractResult) => {
        if (isCancelled) return;
        const productContracts = contractResult.results ?? [];
        setContracts(productContracts);
        if (!contractId || !productContracts.some((contract) => contract.id === contractId)) return;
        const salesResult = await agentsService.getAgentProductCreditSales(agentId, {
          contractId,
          page,
          pageSize,
        });
        if (isCancelled) return;
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
        id: "contractNumber",
        header: t("agents.productCredit.contract"),
        cell: ({ row }: { row: { original: AgentProductCreditSaleDto } }) =>
          contracts.find((contract) => contract.id === row.original.contractId)?.contractNumber ?? row.original.contractId,
      },
      {
        id: "saleDate",
        header: t("agents.productCredit.saleDate"),
        cell: ({ row }: { row: { original: AgentProductCreditSaleDto } }) => date(row.original.saleDate),
      },
      {
        id: "total",
        header: t("agents.productCredit.totalAmount"),
        cell: ({ row }: { row: { original: AgentProductCreditSaleDto } }) => `${money(row.original.totalAmount)} AMD`,
      },
      {
        id: "outstanding",
        header: t("agents.productCredit.outstandingDebt"),
        cell: ({ row }: { row: { original: AgentProductCreditSaleDto } }) => `${money(row.original.outstandingAmount)} AMD`,
      },
      { accessorKey: "status", header: t("agents.productCredit.saleStatus") },
      {
        id: "details",
        header: t("common.actions"),
        cell: ({ row }: any) => (
          <AgentIconButton
            size="medium"
            tone="secondary"
            icon={<ChevronDown size={16} className={row.getIsExpanded() ? styles.chevronExpanded : ""} />}
            ariaLabel={`${t("common.details")} ${row.original.saleId}`}
            title={t("common.details")}
            aria-expanded={row.getIsExpanded()}
            onClick={row.getToggleExpandedHandler()}
          />
        ),
      },
    ],
    [contracts, t],
  );

  return (
    <div className={styles.page}>
      <SectionHeader title={t("agentWorkspace.productSales")} />
      <div className={styles.agentWorkspaceFilters}>
        <Select value={agentId} onChange={(event) => setAgentFilter(event.target.value)}>
          <option value="">{t("agentWorkspace.selectAgent")}</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.code} - {agent.customer?.fullName || agent.phone || agent.code}
            </option>
          ))}
        </Select>
        <AgentPhoneLookup agents={agents} onAgentFound={setAgentFilter} />
        {agentId && (
          <Select value={contractId} onChange={(event) => setContractFilter(event.target.value)}>
            <option value="">{t("agentWorkspace.selectProductContract")}</option>
            {contracts.map((contract) => (
              <option key={contract.id} value={contract.id}>{contract.contractNumber}</option>
            ))}
          </Select>
        )}
      </div>
      {!agentId ? (
        <div className={styles.notice}>{t("agentWorkspace.selectAgentPrompt")}</div>
      ) : loading && contracts.length === 0 ? (
        <div className={styles.notice}>{t("common.loading")}</div>
      ) : salesError && contracts.length === 0 ? (
        <div className={styles.notice} role="alert">{salesError}</div>
      ) : contracts.length === 0 ? (
        <div className={styles.notice}>{t("agents.productCredit.noContracts")}</div>
      ) : !selectedContract ? (
        <div className={styles.notice}>{t("agents.productCredit.selectContractPrompt")}</div>
      ) : (
        <>
          {salesError && <div className={styles.notice} role="alert">{salesError}</div>}
          <DataTable
            columns={columns as any}
            data={items}
            isLoading={loading}
            fitContainer
            manualPagination
            pageCount={items.length === pageSize ? page + 1 : page}
            pageIndex={page - 1}
            canNextPage={items.length === pageSize}
            paginationLabel={<>{t("common.page")} {page}</>}
            getRowId={(sale) => String(sale.saleId)}
            renderSubComponent={({ row }) => (
              <>
                <AgentTableDetails fields={[
                  { label: t("agents.productCredit.agent"), value: agents.find((agent) => agent.id === row.original.agentId)?.customer?.fullName || row.original.agentId },
                              { label: t("agents.productCredit.contract"), value: contracts.find((contract) => contract.id === row.original.contractId)?.contractNumber ?? row.original.contractId },
                  { label: t("agents.productCredit.paymentAmount"), value: `${money(row.original.paidAmount)} AMD` },
                  { label: t("agents.productCredit.products"), value: row.original.items?.length ?? 0 },
                ]} />
                <AgentProductCreditSaleItems items={row.original.items ?? []} />
              </>
            )}
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
