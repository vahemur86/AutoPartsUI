import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Eye, RefreshCw, X, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import { Button, TextField } from "@/ui-kit";
import { agentPortalService } from "@/services/agentPortal";
import { agentContractsService } from "@/services/agentContracts";
import { CashierNotifications } from "./CashierNotifications";
import { getProducts } from "@/services/products";
import { getShops } from "@/services/settings/shop";
import i18n from "@/i18n/config";
import { getCashRegisterId } from "@/utils";
import { useAppSelector } from "@/store/hooks";
import type { Product } from "@/types/products";
import type { Shop } from "@/types/settings";
import type { PagedResult } from "@/types/agents";
import type { AgentProductContractSelectionDto } from "@/types/agentContracts";
import type {
  AgentOrderRequest,
  AgentOrderRequestStatus,
  CashierOrderPricePreview,
  CashierPOSSale,
} from "@/types/agentPortal";
import styles from "./AgentPortal.module.css";

const PAGE_SIZE = 50;

const getStatus = (status: AgentOrderRequest["status"]): AgentOrderRequestStatus | "Unknown" => {
  if (typeof status === "number") return (["Pending", "Approved", "Rejected"] as const)[status] ?? "Unknown";
  const value = String(status).toLowerCase();
  return value === "pending" ? "Pending" : value === "approved" ? "Approved" : value === "rejected" ? "Rejected" : "Unknown";
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const language = i18n.resolvedLanguage?.split("-")[0];
  if (language === "am") {
    const parts = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
    const getPart = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
    const months = [
      "հունվարի", "փետրվարի", "մարտի", "ապրիլի", "մայիսի", "հունիսի",
      "հուլիսի", "օգոստոսի", "սեպտեմբերի", "հոկտեմբերի", "նոյեմբերի", "դեկտեմբերի",
    ];
    const month = Number(getPart("month"));
    return `${getPart("day")} ${months[month - 1]} ${getPart("year")} թ., ${getPart("hour")}:${getPart("minute")}`;
  }
  const locale = language === "ru" ? "ru-RU" : "en-US";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const formatMoney = (value: number, currency = "AMD") => {
  if (!Number.isFinite(value)) return "—";
  const locale = i18n.resolvedLanguage?.startsWith("am")
    ? "hy-AM"
    : i18n.resolvedLanguage?.startsWith("ru")
      ? "ru-RU"
      : "en-US";
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)} ${currency}`;
};

const isProduct = (value: unknown): value is Product => {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "number" && typeof item.code === "string";
};

export const CashierAgentOrderRequests = () => {
  const { t } = useTranslation();
  const user = useAppSelector((state) => state.auth.user);
  const accessToken = useAppSelector((state) => state.auth.token);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedOrderId = searchParams.get("requestId");
  const cashRegisterId = useMemo(() => getCashRegisterId(user?.cashRegisterId ?? 0), [user?.cashRegisterId]);
  const [page, setPage] = useState<PagedResult<AgentOrderRequest> | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [filter, setFilter] = useState<AgentOrderRequestStatus | "Pending" | "">("Pending");
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [rejectingId, setRejectingId] = useState("");
  const [approvalConfirmationId, setApprovalConfirmationId] = useState("");
  const [rejectionConfirmationId, setRejectionConfirmationId] = useState("");
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [contracts, setContracts] = useState<AgentProductContractSelectionDto[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [contractsError, setContractsError] = useState("");
  const [contractRefreshKey, setContractRefreshKey] = useState(0);
  const [selectedContractId, setSelectedContractId] = useState("");
  const [pricePreview, setPricePreview] = useState<CashierOrderPricePreview | null>(null);
  const [pricePreviewLoading, setPricePreviewLoading] = useState(false);
  const [pricePreviewError, setPricePreviewError] = useState("");
  const [priceRefreshKey, setPriceRefreshKey] = useState(0);
  const [completedSale, setCompletedSale] = useState<CashierPOSSale | null>(null);
  const [completedSaleError, setCompletedSaleError] = useState("");
  const [orderActionError, setOrderActionError] = useState("");
  useEffect(() => {
    setCompletedSale(null);
    setCompletedSaleError("");
  }, [requestedOrderId]);
  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let result = await agentPortalService.getCashierOrderRequests(
        filter || undefined,
        requestedOrderId ? 1 : page?.page ?? 1,
        PAGE_SIZE,
      );
      if (requestedOrderId && !result.results.some((item) => item.id === requestedOrderId)) {
        const requestedOrder = await agentPortalService.getCashierOrderRequest(requestedOrderId);
        result = { ...result, results: [requestedOrder, ...result.results] };
      }
      setPage(result);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : t("agentPortal.loadError"));
    } finally {
      setLoading(false);
    }
  }, [filter, page?.page, requestedOrderId, t]);

  const refreshPendingQueue = useCallback(async () => {
    try {
      const pendingRequests = await agentPortalService.getCashierOrderRequests("Pending", 1, PAGE_SIZE);
      setPendingRequestCount(pendingRequests.totalItems);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : t("agentPortal.loadError"));
    }
  }, [t]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests, retry]);

  useEffect(() => {
    void refreshPendingQueue();
  }, [refreshPendingQueue, retry]);

  const openRequest = useCallback((requestId: string) => {
    setSearchParams({ requestId });
  }, [setSearchParams]);
  const closeRequest = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    params.delete("requestId");
    setSearchParams(params);
  }, [searchParams, setSearchParams]);
  useEffect(() => {
    if (!requestedOrderId) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRequest();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeRequest, requestedOrderId]);
  const refreshPendingRequests = useCallback(async () => {
    await refreshPendingQueue();
    await loadRequests();
  }, [loadRequests, refreshPendingQueue]);

  useEffect(() => {
    let active = true;
    const loadLookups = async () => {
      try {
        if (!cashRegisterId) {
          throw new Error(t("agentPortal.cashRegisterMissing"));
        }
        const [shopsResult, productsResult] = await Promise.allSettled([
          getShops(cashRegisterId),
          getProducts(cashRegisterId),
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
  const openedOrder = useMemo(
    () => page?.results.find((order) => order.id === requestedOrderId) ?? null,
    [page?.results, requestedOrderId],
  );
  const openedOrderStatus = openedOrder ? getStatus(openedOrder.status) : "Unknown";
  const openedOrderId = openedOrder?.id;
  const openedOrderAgentId = openedOrder?.agentId;
  const openedOrderShopId = openedOrder?.shopId;

  useEffect(() => {
    if (!openedOrderId || !openedOrderAgentId || openedOrderStatus !== "Pending" || !openedOrderShopId) {
      setContracts([]);
      setSelectedContractId("");
      setPricePreview(null);
      setContractsLoading(false);
      setContractsError("");
      setPricePreviewError("");
      return;
    }

    let active = true;
    setContracts([]);
    setSelectedContractId("");
    setPricePreview(null);
    setContractsError("");
    setPricePreviewError("");
    setContractsLoading(true);
    agentContractsService.getShopProductCreditContracts(
      openedOrderAgentId,
      openedOrderShopId,
      cashRegisterId,
    ).then((result) => {
      if (!active) return;
      setContracts(result);
      setSelectedContractId(result[0]?.contractId ?? "");
    }).catch((contractError: unknown) => {
      if (!active) return;
      setContractsError(contractError instanceof Error ? contractError.message : t("agentPortal.contractsLoadError"));
    }).finally(() => {
      if (active) setContractsLoading(false);
    });

    return () => { active = false; };
  }, [
    cashRegisterId,
    contractRefreshKey,
    openedOrderAgentId,
    openedOrderId,
    openedOrderShopId,
    openedOrderStatus,
    t,
  ]);

  useEffect(() => {
    if (!openedOrderId || openedOrderStatus !== "Pending" || !selectedContractId) {
      setPricePreview(null);
      setPricePreviewError("");
      setPricePreviewLoading(false);
      return;
    }

    let active = true;
    setPricePreview(null);
    setPricePreviewError("");
    setPricePreviewLoading(true);
    agentPortalService.getCashierOrderPricePreview(openedOrderId, selectedContractId)
      .then((preview) => {
        if (!active) return;
        if (
          preview.orderRequestId !== openedOrderId
          || preview.shopId !== openedOrderShopId
          || preview.agentContractId !== selectedContractId
        ) {
          setPricePreviewError(t("agentPortal.pricePreviewMismatch"));
          return;
        }
        setPricePreview(preview);
      })
      .catch((previewError: unknown) => {
        if (active) {
          setPricePreviewError(previewError instanceof Error ? previewError.message : t("agentPortal.pricePreviewError"));
        }
      })
      .finally(() => {
        if (active) setPricePreviewLoading(false);
      });

    return () => { active = false; };
  }, [openedOrderId, openedOrderShopId, openedOrderStatus, priceRefreshKey, selectedContractId, t]);

  const approve = async (order: AgentOrderRequest) => {
    if (
      !order.shopId
      || getStatus(order.status) !== "Pending"
      || !selectedContractId
      || !pricePreview
      || pricePreview.orderRequestId !== order.id
      || pricePreview.shopId !== order.shopId
      || pricePreview.agentContractId !== selectedContractId
      || !pricePreview.canApprove
    ) return;
    setActionId(order.id);
    setError("");
    setOrderActionError("");
    setCompletedSale(null);
    setCompletedSaleError("");
    try {
      const approved = await agentPortalService.approveOrderRequest(order.id, selectedContractId);
      setPage((current) => current ? {
        ...current,
        results: current.results.map((item) => item.id === approved.id ? approved : item),
      } : current);
      setApprovalConfirmationId("");
      toast.success(t("agentPortal.approved"));
      if (approved.posSaleId != null) {
        try {
          const sale = await agentPortalService.getCashierPOSSale(approved.posSaleId);
          setCompletedSale(sale);
        } catch (saleError: unknown) {
          setCompletedSaleError(saleError instanceof Error ? saleError.message : t("agentPortal.saleDetailsError"));
        }
      } else {
        setCompletedSaleError(t("agentPortal.saleReferenceMissing"));
      }
      setRetry((current) => current + 1);
    } catch (actionError: unknown) {
      const message = actionError instanceof Error ? actionError.message : t("agentPortal.actionError");
      await loadRequests();
      setOrderActionError(message);
      setPriceRefreshKey((current) => current + 1);
    } finally {
      setActionId("");
    }
  };

  const reject = async (order: AgentOrderRequest) => {
    const reason = (reasons[order.id] ?? "").trim();
    if (!reason || getStatus(order.status) !== "Pending") return;
    setActionId(order.id);
    setError("");
    setOrderActionError("");
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
      setRejectionConfirmationId("");
      setReasons((current) => ({ ...current, [order.id]: "" }));
      toast.success(t("agentPortal.rejected"));
    } catch (actionError: unknown) {
      setOrderActionError(actionError instanceof Error ? actionError.message : t("agentPortal.actionError"));
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
      {!requestedOrderId && <header className={styles.header}>
        <div><span className={styles.eyebrow}>{t("agentPortal.cashierArea")}</span><h1>{t("agentPortal.cashierOrdersTitle")}</h1><p>{t("agentPortal.cashierOrdersDescription")}</p></div>
        <div className={styles.requestHeaderActions}>
          {requestedOrderId && (
            <Button variant="secondary" size="small" onClick={closeRequest}>
              <ArrowLeft size={15} aria-hidden="true" />
              {t("agentPortal.backToRequests")}
            </Button>
          )}
          <CashierNotifications
            accessToken={accessToken}
            onOpenRequest={openRequest}
            onRefreshPendingRequests={() => void refreshPendingRequests()}
          />
          <Button variant="secondary" size="small" onClick={() => setRetry((current) => current + 1)}><RefreshCw size={15} aria-hidden="true" />{t("agentPortal.refresh")}</Button>
        </div>
      </header>}
      {!requestedOrderId && <div className={styles.listHeading}>
        <h2>{t("agentPortal.orderRequests")}<span className={styles.requestCount} aria-label={t("agentPortal.cashierNotifications.pendingRequestsCount", { count: pendingRequestCount })}>{pendingRequestCount}</span></h2>
        <select aria-label={t("agentPortal.filterStatus")} value={filter} onChange={(event) => { setFilter(event.target.value as AgentOrderRequestStatus | ""); setPage(null); }}>
          <option value="">{t("agentPortal.allStatuses")}</option>
          <option value="Pending">{t("agentPortal.statuses.Pending")}</option>
          <option value="Approved">{t("agentPortal.statuses.Approved")}</option>
          <option value="Rejected">{t("agentPortal.statuses.Rejected")}</option>
        </select>
      </div>}
      {!requestedOrderId && error && <div className={styles.error} role="alert"><span>{error}</span><Button variant="secondary" size="small" onClick={() => setRetry((current) => current + 1)}>{t("agentPortal.retry")}</Button></div>}
      {requestedOrderId && !openedOrder && (
        <div className={styles.requestModalOverlay}>
          <section className={styles.requestModal} role="dialog" aria-modal="true" aria-label={t("agentPortal.orderRequestDetails")}>
            <div className={styles.requestModalHeader}>
              <span>{t("agentPortal.orderRequestDetails")}</span>
              <button type="button" aria-label={t("agentPortal.closeRequest")} onClick={closeRequest} autoFocus>
                <X size={19} aria-hidden="true" />
              </button>
            </div>
            {loading ? (
              <p className={styles.loading} role="status">{t("agentPortal.loading")}</p>
            ) : error ? (
              <div className={styles.error} role="alert">
                <span>{error}</span>
                <Button variant="secondary" size="small" onClick={() => setRetry((current) => current + 1)}>{t("agentPortal.retry")}</Button>
              </div>
            ) : (
              <p className={styles.emptyState}>{t("agentPortal.noRequests")}</p>
            )}
          </section>
        </div>
      )}
      {!requestedOrderId && loading && <div className={styles.loading} role="status">{t("agentPortal.loading")}</div>}
      {!loading && page?.results.length ? (
        <div className={styles.cardList}>{page.results
          .filter((order) => !requestedOrderId || order.id === requestedOrderId)
          .map((order) => {
          const status = getStatus(order.status);
          const isPending = status === "Pending";
          const orderShopId = order.shopId;
          const orderShop = shops.find((shop) => shop.id === orderShopId);
          const reason = reasons[order.id] ?? "";
          const isOpen = order.id === requestedOrderId;
          return <div
            className={isOpen ? styles.requestModalOverlay : styles.requestCardSlot}
            key={order.id}
            onMouseDown={isOpen ? (event) => {
              if (event.target === event.currentTarget) closeRequest();
            } : undefined}
          >
            <section
              className={isOpen ? styles.requestModal : styles.requestCardSlot}
              role={isOpen ? "dialog" : undefined}
              aria-modal={isOpen ? true : undefined}
              aria-label={isOpen ? t("agentPortal.orderRequestDetails") : undefined}
              onMouseDown={isOpen ? (event) => event.stopPropagation() : undefined}
            >
              {isOpen && (
                <div className={styles.requestModalHeader}>
                  <span>{t("agentPortal.orderRequestDetails")}</span>
                  <button type="button" aria-label={t("agentPortal.closeRequest")} onClick={closeRequest} autoFocus>
                    <X size={19} aria-hidden="true" />
                  </button>
                </div>
              )}
            <article
              className={`${styles.dataCard} ${isOpen ? styles.focusedRequest : ""}`}
            >
            <div className={styles.cardTitle}><strong>{order.agentName} · {order.agentCode}</strong><span className={`${styles.statusBadge} ${styles[`status${status}`] || ""}`}>{t(`agentPortal.statuses.${status}`)}</span></div>
            <p>{t("agentPortal.requestedAt")}: {formatDate(order.requestedAt)}</p>
            {order.shopId != null && <p>{t("agentPortal.requestedShop")}: {orderShop?.code ?? `#${order.shopId}`}</p>}
            {!isOpen && (
              <div className={styles.requestCardSummary}>
                <span>{t("agentPortal.itemCount", { count: order.items.length })}</span>
                <Button variant="secondary" size="small" onClick={() => openRequest(order.id)}>
                  <Eye size={15} aria-hidden="true" />
                  {t("agentPortal.viewDetails")}
                </Button>
              </div>
            )}
            {isOpen && <>
            <div className={styles.orderDetail}>
              {order.items.map((item, index) => {
                const product = productById.get(item.productId);
                const productName = item.productName || product?.code || item.productCode || `#${item.productId}`;
                const productMeta = product?.brandName || item.productCode;
                return (
                  <div className={styles.cashierOrderItem} key={`${item.productId}-${index}`}>
                    <span className={styles.cashierOrderItemIndex}>{String(index + 1).padStart(2, "0")}</span>
                    <span className={styles.cashierOrderProduct}>
                      <strong>{productName}</strong>
                      {productMeta && productMeta !== productName && <small>{productMeta}</small>}
                    </span>
                    <strong className={styles.cashierOrderQuantity}>{t("agentPortal.quantity")}: {item.quantity}</strong>
                  </div>
                );
              })}
            </div>
            {order.notes && <p className={styles.notice}>{t("agentPortal.agentNote")}: {order.notes}</p>}
            {order.decisionNote && status === "Rejected" && <p className={styles.decisionNote}>{order.decisionNote}</p>}
            {status === "Approved" && <>
              <p className={styles.notice}>
                {order.approvedShopId != null && t("agentPortal.approvedShop", { shop: shops.find((shop) => shop.id === order.approvedShopId)?.code || `#${order.approvedShopId}` })}
                {order.posSaleId != null && ` · ${t("agentPortal.saleReference", { id: order.posSaleId })}`}
              </p>
              {completedSale && order.posSaleId === completedSale.id && (
                <div className={styles.cashierCompletedSale}>
                  <div className={styles.cashierSaleTotal}>
                    <span>{t("agentPortal.completedSaleTotal")}</span>
                    <strong>{formatMoney(completedSale.totalAmount)}</strong>
                  </div>
                  <div className={styles.cashierSaleLines}>
                    {completedSale.items.map((item, index) => (
                      <div key={`${item.productId}-${index}`}>
                        <span>#{item.productId} · {t("agentPortal.quantity")}: {item.quantity}</span>
                        <span>{t("agentPortal.regularPrice")}: {formatMoney(item.originalUnitPrice)}</span>
                        <span>{t("agentPortal.discountedUnitPrice")}: {formatMoney(item.unitPrice)}</span>
                        <strong>{t("agentPortal.lineTotal")}: {formatMoney(item.lineTotal)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {completedSaleError && (
                <div className={styles.error} role="alert">
                  <span>{completedSaleError}</span>
                  {order.posSaleId != null && (
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={async () => {
                        const saleId = order.posSaleId;
                        if (saleId == null) return;
                        setCompletedSaleError("");
                        try {
                          setCompletedSale(await agentPortalService.getCashierPOSSale(saleId));
                        } catch (saleError: unknown) {
                          setCompletedSaleError(saleError instanceof Error ? saleError.message : t("agentPortal.saleDetailsError"));
                        }
                      }}
                    >
                      {t("agentPortal.retry")}
                    </Button>
                  )}
                </div>
              )}
            </>}
            {isPending && <>
              {!orderShopId && <p className={styles.error} role="alert">{t("agentPortal.legacyRequestShopMissing")}</p>}
              {orderActionError && <p className={styles.error} role="alert">{orderActionError}</p>}
              {orderShopId && <>
                <div className={styles.cashierPricingPanel}>
                  {contractsLoading ? (
                    <p className={styles.orderDetailLoading} role="status">{t("agentPortal.loadingPricePreview")}</p>
                  ) : contractsError ? (
                    <div className={styles.error} role="alert">
                      <span>{contractsError}</span>
                      <Button variant="secondary" size="small" onClick={() => setContractRefreshKey((current) => current + 1)}>
                        {t("agentPortal.retry")}
                      </Button>
                    </div>
                  ) : contracts.length === 0 ? (
                    <p className={styles.cashierPriceWarning}>{t("agentPortal.pricePreviewUnavailable")}</p>
                  ) : (
                    <>
                      {pricePreviewLoading ? (
                        <p className={styles.orderDetailLoading} role="status">{t("agentPortal.loadingPricePreview")}</p>
                      ) : pricePreviewError ? (
                        <div className={styles.error} role="alert">
                          <span>{pricePreviewError}</span>
                          <Button variant="secondary" size="small" onClick={() => setPriceRefreshKey((current) => current + 1)}>
                            {t("agentPortal.retry")}
                          </Button>
                        </div>
                      ) : pricePreview && pricePreview.agentContractId === selectedContractId ? (
                        <div className={styles.cashierPricePreview}>
                          <div className={styles.cashierPriceHeading}>
                            <strong>{t("agentPortal.pricePreview")}</strong>
                            <Button
                              variant="secondary"
                              size="small"
                              disabled={pricePreviewLoading || !!actionId}
                              onClick={() => setPriceRefreshKey((current) => current + 1)}
                            >
                              <RefreshCw size={14} aria-hidden="true" />
                              {t("agentPortal.refreshPricePreview")}
                            </Button>
                          </div>
                          <div className={styles.cashierPreviewItems}>
                            {pricePreview.items.map((item) => (
                              <div className={styles.cashierPreviewItem} key={item.productId}>
                                <div className={styles.cashierPreviewProduct}>
                                  <strong>{item.productCode || item.productSku || `#${item.productId}`}</strong>
                                  {item.productSku && item.productSku !== item.productCode && <small>{item.productSku}</small>}
                                  <span>{t("agentPortal.quantity")}: {item.quantity}</span>
                                </div>
                                <div className={styles.cashierPreviewAmounts}>
                                  <span>{t("agentPortal.regularPrice")}: <b>{formatMoney(item.shopSalePriceAmd, pricePreview.currency)}</b></span>
                                  <span>{t("agentPortal.discountAmount")}: <b>−{formatMoney(item.discountAmountAmd, pricePreview.currency)}</b></span>
                                  <span>{t("agentPortal.discountedUnitPrice")}: <b>{formatMoney(item.discountedUnitPriceAmd, pricePreview.currency)}</b></span>
                                  <span>{t("agentPortal.lineTotal")}: <b>{formatMoney(item.lineTotalAmd, pricePreview.currency)}</b></span>
                                  <span className={item.hasSufficientStock ? styles.cashierStockOk : styles.cashierPriceWarning}>
                                    {t("agentPortal.availableStock")}: {item.availableStock}
                                    {!item.hasSufficientStock && ` · ${t("agentPortal.insufficientStock")}`}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className={styles.cashierPriceSummary}>
                            <div><span>{t("agentPortal.subtotal")}</span><strong>{formatMoney(pricePreview.subtotalAmd, pricePreview.currency)}</strong></div>
                            <div><span>{t("agentPortal.discount")}</span><strong>−{formatMoney(pricePreview.discountAmountAmd, pricePreview.currency)}</strong></div>
                            <div className={styles.cashierGrandTotal}><span>{t("agentPortal.orderTotal")}</span><strong>{formatMoney(pricePreview.totalAmountAmd, pricePreview.currency)}</strong></div>
                          </div>
                          <p className={styles.cashierPriceCheckedAt}>
                            {t("agentPortal.priceCheckedAt")}: {formatDate(pricePreview.priceCheckedAtUtc)}
                          </p>
                          <p className={styles.cashierPriceNotice}>{t("agentPortal.pricePreviewNotReservation")}</p>
                          {!pricePreview.hasSufficientCredit && <p className={styles.cashierPriceWarning}>{t("agentPortal.insufficientCredit")}</p>}
                          {!pricePreview.hasSufficientStock && <p className={styles.cashierPriceWarning}>{t("agentPortal.orderHasInsufficientStock")}</p>}
                          {!pricePreview.canApprove && !pricePreview.hasSufficientCredit && !pricePreview.hasSufficientStock && (
                            <p className={styles.cashierPriceWarning}>{t("agentPortal.orderCannotApprove")}</p>
                          )}
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
                <div className={styles.orderFooter}>
                {approvalConfirmationId === order.id ? (
                  <div className={styles.confirmPanel} role="group" aria-label={t("agentPortal.confirmOrderApproval")}>
                    <p>{t("agentPortal.confirmOrderApproval")}</p>
                    <div className={styles.orderFooter}>
                      <Button
                        variant="secondary"
                        size="small"
                        disabled={actionId === order.id}
                        onClick={() => setApprovalConfirmationId("")}
                      >
                        {t("common.cancel")}
                      </Button>
                      <Button
                        variant="primary"
                        size="small"
                        className={styles.cashierApproveButton}
                        disabled={!!actionId}
                        onClick={() => void approve(order)}
                      >
                        <Check size={16} aria-hidden="true" />
                        {actionId === order.id ? t("agentPortal.processing") : t("agentPortal.confirmApproval")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="small"
                    className={styles.cashierApproveButton}
                    disabled={
                      !!actionId
                      || !selectedContractId
                      || !pricePreview
                      || pricePreview.orderRequestId !== order.id
                      || pricePreview.shopId !== orderShopId
                      || pricePreview.agentContractId !== selectedContractId
                      || !pricePreview.canApprove
                    }
                    onClick={() => {
                      setRejectingId("");
                      setRejectionConfirmationId("");
                      setApprovalConfirmationId(order.id);
                    }}
                  >
                    <Check size={16} aria-hidden="true" />
                    {t("agentPortal.confirmApproval")}
                  </Button>
                )}
                {rejectingId === order.id ? (
                  <div className={styles.rejectBox}>
                    <TextField label={t("agentPortal.rejectionReason")} value={reason} onChange={(event) => setReasons((current) => ({ ...current, [order.id]: event.target.value }))} />
                    {rejectionConfirmationId === order.id ? (
                      <div className={styles.confirmPanel} role="group" aria-label={t("agentPortal.confirmOrderRejection")}>
                        <p>{t("agentPortal.confirmOrderRejection")}</p>
                        <div className={styles.orderFooter}>
                          <Button
                            variant="secondary"
                            size="small"
                            disabled={actionId === order.id}
                            onClick={() => setRejectionConfirmationId("")}
                          >
                            {t("common.cancel")}
                          </Button>
                          <Button
                            variant="secondary"
                            size="small"
                            className={styles.cashierRejectButton}
                            disabled={!!actionId || !reason.trim()}
                            onClick={() => void reject(order)}
                          >
                            <XCircle size={16} aria-hidden="true" />
                            {actionId === order.id ? t("agentPortal.processing") : t("agentPortal.reject")}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Button
                          variant="secondary"
                          size="small"
                          className={styles.cashierRejectButton}
                          disabled={!!actionId || !orderShopId || !reason.trim()}
                          onClick={() => setRejectionConfirmationId(order.id)}
                        >
                          <XCircle size={16} aria-hidden="true" />
                          {t("agentPortal.reject")}
                        </Button>
                        <Button
                          variant="secondary"
                          size="small"
                          disabled={!!actionId}
                          onClick={() => {
                            setRejectingId("");
                            setRejectionConfirmationId("");
                          }}
                        >
                          {t("common.cancel")}
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="small"
                    className={styles.cashierRejectButton}
                    disabled={!!actionId || !orderShopId}
                    onClick={() => {
                      setApprovalConfirmationId("");
                      setRejectionConfirmationId("");
                      setRejectingId(order.id);
                    }}
                  >
                    <XCircle size={16} aria-hidden="true" />
                    {t("agentPortal.reject")}
                  </Button>
                )}
                </div>
              </>}
            </>}
            </>}
            </article>
            </section>
          </div>;
        })}</div>
      ) : !requestedOrderId && !error && !loading && <div className={styles.section}><div className={styles.emptyState}>{t("agentPortal.noRequests")}</div></div>}
      {!requestedOrderId && page && page.totalItems > page.pageSize && <div className={styles.pager}>
        <Button variant="secondary" size="small" disabled={loading || page.page <= 1} onClick={() => changePage(page.page - 1)}><ChevronLeft size={16} aria-hidden="true" /></Button>
        <span>{page.page} / {Math.max(1, Math.ceil(page.totalItems / page.pageSize))}</span>
        <Button variant="secondary" size="small" disabled={loading || page.page * page.pageSize >= page.totalItems} onClick={() => changePage(page.page + 1)}><ChevronRight size={16} aria-hidden="true" /></Button>
      </div>}
      {!requestedOrderId && <footer className={styles.footer}><Link className={styles.cashierReturnButton} to="/shop-operator"><ArrowLeft size={16} aria-hidden="true" />{t("agentPortal.backToCashier")}</Link></footer>}
    </main>
  );
};
