import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { SectionHeader } from "@/components/common";
import { Button, DataTable, Select } from "@/ui-kit";
import { agentContractsService } from "@/services/agentContracts";
import { agentsService } from "@/services/agents";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { AgentAdvanceDto, AgentContractDto, AgentContractListItemDto } from "@/types/agentContracts";
import type {
  AgentDto,
  AgentProductCreditSaleDto,
  AgentProductDebtDto,
  AgentProductDebtPaymentDto,
} from "@/types/agents";
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

const ProductContractList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<AgentContractListItemDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    void agentContractsService
      .listContracts({ page: 1, pageSize: 500 })
      .then((result) => {
        if (!isCancelled) {
          setItems((result.results ?? []).filter((contract) => contract.allowsProductAdvance === true));
        }
      })
      .catch((error) => toast.error(getApiErrorMessage(error, t("agentContracts.errors.loadFailed"))))
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [t]);

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
        cell: ({ row }: { row: { original: AgentContractListItemDto } }) => (
          <Button size="small" variant="secondary" onClick={() => navigate(`/agents/product-credit/contracts/${row.original.id}`)}>
            {t("agentContracts.actions.view")}
          </Button>
        ),
      },
    ],
    [navigate, t],
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
    </div>
  );
};

const ProductAdvanceList = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<AgentAdvanceDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    void agentContractsService
      .listAdvances({ page: 1, pageSize: 500, advanceType: "Product" })
      .then((result) => {
        if (!isCancelled) setItems((result.results ?? []).filter(isProductAdvance));
      })
      .catch((error) => toast.error(getApiErrorMessage(error, t("agentAdvances.errors.loadFailed"))))
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [t]);

  const columns = useMemo(
    () => [
      { accessorKey: "advanceNumber", header: t("agentAdvances.fields.advanceNumber") },
      { accessorKey: "productSaleId", header: t("agentAdvances.fields.productSaleId") },
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
      <DataTable
        columns={columns as any}
        data={items}
        isLoading={loading}
        noResultsText={t("agentWorkspace.noProductAdvances")}
        loadingText={t("agentAdvances.list.loading")}
      />
    </div>
  );
};

const ProductCreditContractDetails = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [contract, setContract] = useState<AgentContractDto | null>(null);
  const [debt, setDebt] = useState<AgentProductDebtDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let isCancelled = false;
    setLoading(true);
    void agentContractsService
      .getContract(id)
      .then(async (data) => {
        if (isCancelled) return;
        setContract(data);
        const summary = await agentsService.getAgentProductDebt(data.agent.id, data.id).catch(() => null);
        if (!isCancelled) setDebt(summary);
      })
      .catch((error) => toast.error(getApiErrorMessage(error, t("agentContracts.errors.loadDetailsFailed"))))
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [id, t]);

  if (loading || !contract) {
    return <div className={styles.page}>{t(loading ? "agentContracts.details.loading" : "agentContracts.errors.loadDetailsFailed")}</div>;
  }

  const productAdvances = (contract.advances ?? []).filter(isProductAdvance);

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
      agentContractsService.listContracts({ agentId, page: 1, pageSize: 500 }),
      paymentsOnly ? Promise.resolve(null) : agentsService.getAgentProductDebt(agentId, contractId || undefined),
      paymentsOnly ? agentsService.getAgentProductDebtPayments(agentId, contractId || undefined) : Promise.resolve([]),
    ])
      .then(([contractResult, debtResult, paymentResult]) => {
        if (isCancelled) return;
        const productContracts = (contractResult.results ?? []).filter((item) => item.allowsProductAdvance === true);
        setContracts(productContracts);
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
  const [total, setTotal] = useState(0);
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
      setTotal(0);
      return;
    }

    let isCancelled = false;
    setLoading(true);
    setSalesError(null);
    setItems([]);
    void Promise.all([
      agentContractsService.listContracts({ agentId, page: 1, pageSize: 500 }),
      agentsService.getAgentProductCreditSales(agentId, {
        contractId: contractId || undefined,
        page,
        pageSize,
      }),
    ])
      .then(([contractResult, salesResult]) => {
        if (isCancelled) return;
        setContracts((contractResult.results ?? []).filter((item) => item.allowsProductAdvance === true));
        setItems(salesResult.results ?? []);
        setTotal(salesResult.totalItems ?? 0);
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
            pageCount={Math.max(1, Math.ceil(total / pageSize))}
            pageIndex={page - 1}
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
