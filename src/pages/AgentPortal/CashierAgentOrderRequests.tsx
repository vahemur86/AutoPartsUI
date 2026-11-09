import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { Button, TextField } from "@/ui-kit";
import { agentPortalService } from "@/services/agentPortal";
import { getProducts } from "@/services/products";
import { getShops } from "@/services/settings/shop";
import i18n from "@/i18n/config";
import { getCashRegisterId } from "@/utils";
import { useAppSelector } from "@/store/hooks";
import type { Product } from "@/types/products";
import type { Shop } from "@/types/settings";
import type { PagedResult } from "@/types/agents";
import type { AgentOrderRequest, AgentOrderRequestStatus } from "@/types/agentPortal";
import styles from "./AgentPortal.module.css";

const PAGE_SIZE = 10;

const getStatus = (status: AgentOrderRequest["status"]): AgentOrderRequestStatus | "Unknown" => {
  if (typeof status === "number") return (["Pending", "Approved", "Rejected"] as const)[status] ?? "Unknown";
  const value = String(status).toLowerCase();
  return value === "pending" ? "Pending" : value === "approved" ? "Approved" : value === "rejected" ? "Rejected" : "Unknown";
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat(i18n.resolvedLanguage || undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const isProduct = (value: unknown): value is Product => {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "number" && typeof item.code === "string";
};

export const CashierAgentOrderRequests = () => {
  const { t } = useTranslation();
  const user = useAppSelector((state) => state.auth.user);
  const cashRegisterId = useMemo(() => getCashRegisterId(user?.cashRegisterId ?? 0), [user?.cashRegisterId]);
  const [page, setPage] = useState<PagedResult<AgentOrderRequest> | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<AgentOrderRequestStatus | "Pending" | "">("Pending");
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [selectedShops, setSelectedShops] = useState<Record<string, string>>({});
  const [confirmingId, setConfirmingId] = useState("");
  const [rejectingId, setRejectingId] = useState("");
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await agentPortalService.getCashierOrderRequests(
        filter || undefined,
        page?.page ?? 1,
        PAGE_SIZE,
      );
      setPage(result);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : t("agentPortal.loadError"));
    } finally {
      setLoading(false);
    }
  }, [filter, page?.page, t]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests, retry]);

  useEffect(() => {
    let active = true;
    const loadLookups = async () => {
      try {
        if (!cashRegisterId) {
          throw new Error(t("agentPortal.cashRegisterMissing"));
        }
        const [shopsResult, productsResult] = await Promise.allSettled([
          getShops(cashRegisterId),
          getProducts(),
        ]);
        if (!active) return;
        if (shopsResult.status === "fulfilled") {
          setShops(Array.isArray(shopsResult.value) ? shopsResult.value : []);
        } else {
          setError(shopsResult.reason instanceof Error ? shopsResult.reason.message : t("agentPortal.lookupError"));
        }
        if (productsResult.status === "fulfilled") {
          setProducts(Array.isArray(productsResult.value) ? productsResult.value.filter(isProduct) : []);
        } else {
          setError(productsResult.reason instanceof Error ? productsResult.reason.message : t("agentPortal.lookupError"));
        }
      } catch (lookupError: unknown) {
        if (active) setError(lookupError instanceof Error ? lookupError.message : t("agentPortal.lookupError"));
      }
    };
    void loadLookups();
    return () => { active = false; };
  }, [cashRegisterId, retry, t]);

  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  const approve = async (order: AgentOrderRequest) => {
    const shopId = Number(selectedShops[order.id]);
    if (!Number.isInteger(shopId) || shopId <= 0 || getStatus(order.status) !== "Pending") return;
    setActionId(order.id);
    setError("");
    try {
      const approved = await agentPortalService.approveOrderRequest(order.id, shopId);
      setPage((current) => current ? {
        ...current,
        results: current.results.map((item) => item.id === approved.id ? approved : item),
      } : current);
      setConfirmingId("");
      toast.success(t("agentPortal.approved"));
    } catch (actionError: unknown) {
      setError(actionError instanceof Error ? actionError.message : t("agentPortal.actionError"));
    } finally {
      setActionId("");
    }
  };

  const reject = async (order: AgentOrderRequest) => {
    const reason = (reasons[order.id] ?? "").trim();
    if (!reason || getStatus(order.status) !== "Pending") return;
    setActionId(order.id);
    setError("");
    try {
      await agentPortalService.rejectOrderRequest(order.id, reason);
      setPage((current) => current ? {
        ...current,
        results: current.results.map((item) => item.id === order.id ? {
          ...item,
          status: "Rejected",
          decisionNote: reason,
        } : item),
      } : current);
      setRejectingId("");
      setReasons((current) => ({ ...current, [order.id]: "" }));
      toast.success(t("agentPortal.rejected"));
    } catch (actionError: unknown) {
      setError(actionError instanceof Error ? actionError.message : t("agentPortal.actionError"));
    } finally {
      setActionId("");
    }
  };

  const changePage = (nextPage: number) => {
    if (!page) return;
    setPage({ ...page, page: nextPage });
  };

  return (
    <main className={`${styles.page} ${styles.cashierPage}`}>
      <header className={styles.header}>
        <div><span className={styles.eyebrow}>{t("agentPortal.cashierArea")}</span><h1>{t("agentPortal.cashierOrdersTitle")}</h1><p>{t("agentPortal.cashierOrdersDescription")}</p></div>
        <Button variant="secondary" size="small" onClick={() => setRetry((current) => current + 1)}><RefreshCw size={15} aria-hidden="true" />{t("agentPortal.refresh")}</Button>
      </header>
      <div className={styles.listHeading}>
        <h2>{t("agentPortal.orderRequests")}</h2>
        <select aria-label={t("agentPortal.filterStatus")} value={filter} onChange={(event) => { setFilter(event.target.value as AgentOrderRequestStatus | ""); setPage(null); }}>
          <option value="">{t("agentPortal.allStatuses")}</option>
          <option value="Pending">{t("agentPortal.statuses.Pending")}</option>
          <option value="Approved">{t("agentPortal.statuses.Approved")}</option>
          <option value="Rejected">{t("agentPortal.statuses.Rejected")}</option>
        </select>
      </div>
      {error && <div className={styles.error} role="alert"><span>{error}</span><Button variant="secondary" size="small" onClick={() => setRetry((current) => current + 1)}>{t("agentPortal.retry")}</Button></div>}
      {loading ? <div className={styles.loading} role="status">{t("agentPortal.loading")}</div> : page?.results.length ? (
        <div className={styles.cardList}>{page.results.map((order) => {
          const status = getStatus(order.status);
          const isPending = status === "Pending";
          const selectedShopId = selectedShops[order.id] ?? "";
          const reason = reasons[order.id] ?? "";
          return <article className={styles.dataCard} key={order.id}>
            <div className={styles.cardTitle}><strong>{order.agentName} · {order.agentCode}</strong><span className={`${styles.statusBadge} ${styles[`status${status}`] || ""}`}>{t(`agentPortal.statuses.${status}`)}</span></div>
            <p>{t("agentPortal.requestedAt")}: {formatDate(order.requestedAt)}</p>
            <div className={styles.orderDetail}>
              {order.items.map((item, index) => {
                const product = productById.get(item.productId);
                return <div key={`${item.productId}-${index}`}><span>{product ? `${product.code}${product.brandName ? ` · ${product.brandName}` : ""}` : item.productCode || `#${item.productId}`}</span><strong>× {item.quantity}</strong></div>;
              })}
            </div>
            {order.notes && <p className={styles.notice}>{t("agentPortal.agentNote")}: {order.notes}</p>}
            {order.decisionNote && status === "Rejected" && <p className={styles.decisionNote}>{order.decisionNote}</p>}
            {status === "Approved" && <p className={styles.notice}>
              {order.approvedShopId != null && t("agentPortal.approvedShop", { shop: shops.find((shop) => shop.id === order.approvedShopId)?.code || `#${order.approvedShopId}` })}
              {order.posSaleId != null && ` · ${t("agentPortal.saleReference", { id: order.posSaleId })}`}
            </p>}
            {isPending && <>
              <label className={styles.filter}>{t("agentPortal.chooseShop")}
                <select value={selectedShopId} onChange={(event) => { setSelectedShops((current) => ({ ...current, [order.id]: event.target.value })); setConfirmingId(""); }}>
                  <option value="">{t("agentPortal.selectShop")}</option>
                  {shops.map((shop) => <option key={shop.id} value={shop.id}>{shop.code}</option>)}
                </select>
              </label>
              {confirmingId === order.id ? (
                <div className={styles.confirmPanel}>
                  <p>{t("agentPortal.approveConfirmation", { shop: shops.find((shop) => String(shop.id) === selectedShopId)?.code ?? "" })}</p>
                  <p>{t("agentPortal.noPriceNotice")}</p>
                  <div className={styles.orderFooter}>
                    <Button variant="secondary" size="small" disabled={actionId === order.id} onClick={() => setConfirmingId("")}>{t("common.cancel")}</Button>
                    <Button variant="primary" size="small" disabled={actionId === order.id} onClick={() => void approve(order)}>{actionId === order.id ? t("agentPortal.processing") : t("agentPortal.confirmApproval")}</Button>
                  </div>
                </div>
              ) : <div className={styles.orderFooter}>
                <Button variant="primary" size="small" disabled={!!actionId || !selectedShopId} onClick={() => setConfirmingId(order.id)}>{t("agentPortal.reviewApproval")}</Button>
                {rejectingId === order.id ? (
                  <div className={styles.rejectBox}>
                    <TextField label={t("agentPortal.rejectionReason")} value={reason} onChange={(event) => setReasons((current) => ({ ...current, [order.id]: event.target.value }))} />
                    <Button variant="secondary" size="small" disabled={!!actionId || !reason.trim()} onClick={() => void reject(order)}>{actionId === order.id ? t("agentPortal.processing") : t("agentPortal.reject")}</Button>
                    <Button variant="secondary" size="small" disabled={!!actionId} onClick={() => setRejectingId("")}>{t("common.cancel")}</Button>
                  </div>
                ) : <Button variant="secondary" size="small" disabled={!!actionId} onClick={() => { setRejectingId(order.id); setConfirmingId(""); }}>{t("agentPortal.reject")}</Button>}
              </div>}
            </>}
          </article>;
        })}</div>
      ) : !error && <div className={styles.section}><div className={styles.emptyState}>{t("agentPortal.noRequests")}</div></div>}
      {page && page.totalItems > page.pageSize && <div className={styles.pager}>
        <Button variant="secondary" size="small" disabled={loading || page.page <= 1} onClick={() => changePage(page.page - 1)}><ChevronLeft size={16} aria-hidden="true" /></Button>
        <span>{page.page} / {Math.max(1, Math.ceil(page.totalItems / page.pageSize))}</span>
        <Button variant="secondary" size="small" disabled={loading || page.page * page.pageSize >= page.totalItems} onClick={() => changePage(page.page + 1)}><ChevronRight size={16} aria-hidden="true" /></Button>
      </div>}
      <footer className={styles.footer}><Link to="/shop-operator"><ArrowLeft size={15} aria-hidden="true" />{t("agentPortal.backToCashier")}</Link></footer>
    </main>
  );
};
