import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { RefreshCw } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { Button, DataTable, Select } from "@/ui-kit";
import { agentsService } from "@/services/agents";
import { agentContractsService } from "@/services/agentContracts";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { AgentContractListItemDto } from "@/types/agentContracts";
import type { AgentProductCreditSaleDto, AgentProductCreditSaleItemDto } from "@/types/agents";
import styles from "./Agents.module.css";

const PAGE_SIZE = 50;

const formatAmd = (value: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatSaleDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "—";

const getErrorStatus = (error: unknown) =>
  (error as { response?: { status?: number } } | null)?.response?.status;

const getProductDisplayName = (item: AgentProductCreditSaleItemDto) => {
  const productCode = item.productCode?.trim();
  const productSku = item.productSku?.trim();

  if (productCode) return productSku ? `${productCode} · ${productSku}` : productCode;
  if (productSku) return productSku;
  return `#${item.productId}`;
};

export const AgentProductCreditSaleItems = ({ items }: { items: AgentProductCreditSaleItemDto[] }) => {
  const { t } = useTranslation();

  return (
    <div className={styles.productPurchaseItems}>
      <div className={`${styles.productPurchaseItem} ${styles.productPurchaseItemHeader}`}>
        <span>{t("agents.productCredit.product")}</span>
        <span>{t("agents.productCredit.quantity")}</span>
        <span>{t("agents.productCredit.unitPrice")}</span>
        <span>{t("agents.productCredit.lineTotal")}</span>
      </div>
      {items.map((item, index) => (
        <div className={styles.productPurchaseItem} key={`${item.productId}-${index}`}>
          <span>{getProductDisplayName(item)}</span>
          <span>{item.quantity}</span>
          <span>֏ {formatAmd(item.unitPrice)}</span>
          <strong>֏ {formatAmd(item.lineTotal)}</strong>
        </div>
      ))}
    </div>
  );
};

export const AgentProductCreditPurchases = ({ agentId }: { agentId: string }) => {
  const { t } = useTranslation();
  const [contracts, setContracts] = useState<AgentContractListItemDto[]>([]);
  const [sales, setSales] = useState<AgentProductCreditSaleDto[]>([]);
  const [contractId, setContractId] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<{ status?: number; message: string } | null>(null);

  const loadContracts = useCallback(async () => {
    if (!agentId) {
      setContracts([]);
      return;
    }

    try {
      const result = await agentContractsService.listProductCreditContracts({
        agentId,
        page: 1,
        pageSize: 500,
      });
      setContracts(result.results ?? []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("agents.productCredit.loadFailed")));
    }
  }, [agentId, t]);

  useEffect(() => {
    void loadContracts();
  }, [loadContracts]);

  useEffect(() => {
    window.addEventListener("agent-product-contract-changed", loadContracts);
    return () => window.removeEventListener("agent-product-contract-changed", loadContracts);
  }, [loadContracts]);

  const loadPurchases = useCallback(async (isRefresh = false) => {
    if (!agentId) {
      setLoadError({ message: t("agents.productCredit.salesNotFound") });
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (isRefresh) setRefreshing(true);
    else {
      setLoading(true);
      setSales([]);
    }
    setLoadError(null);

    try {
      const salesResult = await agentsService.getAgentProductCreditSales(agentId, {
        contractId: contractId || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setSales(salesResult);
    } catch (error) {
      const status = getErrorStatus(error);
      const message = status === 404
        ? t("agents.productCredit.salesNotFound")
        : status === 401
          ? t("agents.productCredit.salesUnauthorized")
          : status === 403
            ? t("agents.productCredit.salesForbidden")
            : getApiErrorMessage(error, t("agents.productCredit.salesLoadFailed"));
      setLoadError({ status, message });
      if (status !== 401 && status !== 403 && status !== 404) toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [agentId, contractId, page, t]);

  useEffect(() => {
    void loadPurchases();
  }, [loadPurchases]);

  useEffect(() => {
    const handleActivityChanged = (event: Event) => {
      const changedAgentId = (event as CustomEvent<{ agentId?: string }>).detail?.agentId;
      if (!changedAgentId || changedAgentId === agentId) void loadPurchases(true);
    };
    window.addEventListener("agent-product-credit-activity-changed", handleActivityChanged);
    return () => window.removeEventListener("agent-product-credit-activity-changed", handleActivityChanged);
  }, [agentId, loadPurchases]);

  const hasNextPage = sales.length === PAGE_SIZE;
  const visibleContracts = contracts;

  const columns = useMemo<ColumnDef<AgentProductCreditSaleDto, unknown>[]>(
    () => [
      { accessorKey: "saleId", header: t("agents.productCredit.saleId") },
      {
        id: "saleDate",
        header: t("agents.productCredit.saleDate"),
        cell: ({ row }: { row: { original: AgentProductCreditSaleDto } }) =>
          formatSaleDate(row.original.saleDate),
      },
      {
        id: "status",
        header: t("agents.productCredit.saleStatus"),
        cell: ({ row }: { row: { original: AgentProductCreditSaleDto } }) => {
          const status = row.original.status || "—";
          const normalized = status.toLowerCase();
          const tone = ["completed", "paid", "success"].some((value) => normalized.includes(value))
            ? styles.statusActive
            : ["failed", "default", "cancel"].some((value) => normalized.includes(value))
              ? styles.statusBlocked
              : styles.statusInactive;
          return <span className={`${styles.statusBadge} ${tone}`}>{status}</span>;
        },
      },
      {
        id: "totalAmount",
        header: t("agents.productCredit.totalAmount"),
        cell: ({ row }: { row: { original: AgentProductCreditSaleDto } }) =>
          `֏ ${formatAmd(row.original.totalAmount)}`,
      },
      {
        id: "paidAmount",
        header: t("agents.productCredit.paidAmount"),
        cell: ({ row }: { row: { original: AgentProductCreditSaleDto } }) =>
          <span className={styles.productPurchasePaid}>֏ {formatAmd(row.original.paidAmount)}</span>,
      },
      {
        id: "outstandingAmount",
        header: t("agents.productCredit.outstandingAmount"),
        cell: ({ row }: { row: { original: AgentProductCreditSaleDto } }) =>
          <span className={row.original.outstandingAmount > 0 ? styles.productPurchaseOutstanding : styles.productPurchasePaid}>
            ֏ {formatAmd(row.original.outstandingAmount)}
          </span>,
      },
      {
        id: "productCount",
        header: t("agents.productCredit.products"),
        cell: ({ row }: { row: { original: AgentProductCreditSaleDto } }) => row.original.items?.length ?? 0,
      },
      {
        id: "details",
        header: t("agents.productCredit.saleDetails"),
        cell: ({ row }: { row: { original: AgentProductCreditSaleDto; getIsExpanded: () => boolean; getToggleExpandedHandler: () => () => void } }) => (
          <Button size="small" variant="secondary" onClick={row.getToggleExpandedHandler()}>
            {t(row.getIsExpanded() ? "agents.productCredit.hideDetails" : "agents.productCredit.showDetails")}
          </Button>
        ),
      },
    ],
    [t],
  );

  const handleContractChange = (value: string) => {
    setContractId(value);
    setPage(1);
  };

  const salesErrorAction = loadError
    ? <Button size="small" variant="secondary" onClick={() => void loadPurchases(true)}>{t("agents.productCredit.retrySales")}</Button>
    : null;

  return (
    <section className={styles.productPurchases}>
      <div className={styles.productPurchasesHeader}>
        <h4>{t("agents.productCredit.purchasesTitle")}</h4>
        <Button size="small" variant="secondary" disabled={loading || refreshing} onClick={() => void loadPurchases(true)}>
          <RefreshCw size={15} aria-hidden="true" />
          {refreshing ? t("common.loading") : t("common.refresh")}
        </Button>
      </div>
      {visibleContracts.length > 1 && (
        <div className={styles.productPurchasesFilter}>
          <Select value={contractId} onChange={(event) => handleContractChange(event.target.value)}>
            <option value="">{t("agents.productCredit.allProductContracts")}</option>
            {visibleContracts.map((contract) => (
              <option key={contract.id} value={contract.id}>{contract.contractNumber}</option>
            ))}
          </Select>
        </div>
      )}
      {loadError ? (
        <div className={styles.banner} role="alert">
          <span>{loadError.message}</span>
          {salesErrorAction}
        </div>
      ) : null}
      <DataTable
        columns={columns}
        data={sales}
        isLoading={loading}
        loadingText={t("agents.productCredit.loadingSales")}
        noResultsText={t("agents.productCredit.noSales")}
        renderSubComponent={({ row }) => <AgentProductCreditSaleItems items={row.original.items ?? []} />}
        manualPagination
        pageSize={PAGE_SIZE}
        pageCount={hasNextPage ? page + 1 : page}
        pageIndex={page - 1}
        canNextPage={hasNextPage}
        paginationLabel={<>{t("common.page")} {page}</>}
        getRowId={(sale) => String(sale.saleId)}
        onPaginationChange={(index) => setPage(index + 1)}
      />
    </section>
  );
};