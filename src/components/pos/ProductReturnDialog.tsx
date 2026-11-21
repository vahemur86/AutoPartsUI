import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Button, ConfirmationModal } from "@/ui-kit";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import { useAppDispatch } from "@/store/hooks";
import { fetchShopProducts } from "@/store/slices/shops/productsSlice";
import { agentPortalService } from "@/services/agentPortal";
import {
  confirmProductReturnItemLoss,
  createProductReturn,
  createProductReturnIdempotencyKey,
  getProductReturns,
  inspectProductReturnItem,
} from "@/services/productReturns";
import type {
  CashierPOSSale,
  CashierPOSSaleItem,
} from "@/types/agentPortal";
import type {
  CreateProductReturnRequest,
  ProductReturn,
  ProductReturnCondition,
} from "@/types/productReturns";
import styles from "./ProductReturnDialog.module.css";

interface ProductReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saleId: number;
  shopId: number;
  cashRegisterId: number;
}

const CONDITION_VALUES: ProductReturnCondition[] = [1, 2, 3];
const pendingCreateRequests = new Map<number, CreateProductReturnRequest>();

const getDateLabel = (value: string | null | undefined, locale: string) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const getAmountLabel = (value: number | null | undefined, locale: string) =>
  `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0))} AMD`;

const getReturnErrorMessage = (error: unknown, fallback: string) => {
  const isAxiosNetworkError = Boolean(
  error
    && typeof error === "object"
    && "isAxiosError" in error
    && (error as { isAxiosError?: boolean }).isAxiosError
    && !("response" in error && (error as { response?: unknown }).response),
  );
  return isAxiosNetworkError ? fallback : getApiErrorMessage(error, fallback);
};

const getSaleItemId = (item: CashierPOSSaleItem): number | null =>
  Number.isInteger(item.id) && item.id > 0 ? item.id : null;

export const ProductReturnDialog = ({
  open,
  onOpenChange,
  saleId,
  shopId,
  cashRegisterId,
}: ProductReturnDialogProps) => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const [sale, setSale] = useState<CashierPOSSale | null>(null);
  const [returns, setReturns] = useState<ProductReturn[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [itemActionId, setItemActionId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [reasonTouched, setReasonTouched] = useState(false);
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [conditions, setConditions] = useState<Record<number, string>>({});
  const [lossNotes, setLossNotes] = useState<Record<number, string>>({});
  const [pendingRequest, setPendingRequest] = useState<CreateProductReturnRequest | null>(null);
  const [outcomeUnknown, setOutcomeUnknown] = useState(false);

  const locale = i18n.resolvedLanguage ?? i18n.language;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [saleResult, returnResult] = await Promise.all([
        agentPortalService.getCashierPOSSale(
          saleId,
          cashRegisterId,
          t("productReturns.errors.loadFailed"),
        ),
        getProductReturns(saleId, cashRegisterId),
      ]);
      if (
        !Array.isArray(saleResult.items)
        || saleResult.items.length === 0
        || saleResult.items.some((item) => !getSaleItemId(item))
      ) {
        throw new Error(t("productReturns.errors.saleItemsUnavailable"));
      }
      setSale(saleResult);
      setReturns(returnResult);
      setOutcomeUnknown(false);
    } catch (loadError: unknown) {
      setError(getReturnErrorMessage(loadError, t("productReturns.errors.loadFailed")));
    } finally {
      setLoading(false);
    }
  }, [cashRegisterId, saleId, t]);

  useEffect(() => {
    if (!open) return;
    setSale(null);
    setReturns([]);
    setReason("");
    setReasonTouched(false);
    setQuantities({});
    setConditions({});
    setLossNotes({});
    setPendingRequest(pendingCreateRequests.get(saleId) ?? null);
    setOutcomeUnknown(false);
    setItemActionId(null);
    void loadData();
  }, [loadData, open, saleId]);

  const returnedQuantities = useMemo(() => {
    const quantityBySaleItemId = new Map<number, number>();
    for (const productReturn of returns) {
      for (const item of productReturn.items) {
        quantityBySaleItemId.set(
          item.posSaleItemId,
          (quantityBySaleItemId.get(item.posSaleItemId) ?? 0) + item.quantity,
        );
      }
    }
    return quantityBySaleItemId;
  }, [returns]);

  const selectedItems = useMemo(() => {
    if (!sale) return [];
    return sale.items.flatMap((item) => {
      const saleItemId = getSaleItemId(item);
      if (saleItemId === null) return [];
      const rawQuantity = quantities[saleItemId]?.trim();
      if (!rawQuantity) return [];
      return [{
        item,
        saleItemId,
        quantity: Number(rawQuantity),
        condition: Number(conditions[saleItemId]),
      }];
    });
  }, [conditions, quantities, sale]);

  const selectedItemsValid = selectedItems.length > 0 && selectedItems.every(({ saleItemId, quantity, condition }) => {
    const remaining = Math.max(
      0,
      (sale?.items.find((item) => getSaleItemId(item) === saleItemId)?.quantity ?? 0)
        - (returnedQuantities.get(saleItemId) ?? 0),
    );
    return Number.isInteger(quantity)
      && quantity > 0
      && quantity <= remaining
      && CONDITION_VALUES.includes(condition as ProductReturnCondition);
  });
  const canSubmit = Boolean(
    sale
      && !loading
      && !saving
      && cashRegisterId > 0
      && reason.trim()
      && selectedItemsValid,
  );

  const refreshReturns = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setReturns(await getProductReturns(saleId, cashRegisterId));
      setOutcomeUnknown(false);
    } catch (refreshError: unknown) {
      setError(getReturnErrorMessage(refreshError, t("productReturns.errors.historyFailed")));
    } finally {
      setLoading(false);
    }
  }, [cashRegisterId, saleId, t]);

  const handleCreateReturn = async () => {
    if (!canSubmit || saving) return;
    const requestBody = {
      reason: reason.trim(),
      items: selectedItems.map(({ saleItemId, quantity, condition }) => ({
        posSaleItemId: saleItemId,
        quantity,
        condition: condition as ProductReturnCondition,
      })),
    };
    const fingerprint = JSON.stringify(requestBody);
    const pendingFingerprint = pendingRequest
      ? JSON.stringify({
          reason: pendingRequest.reason,
          items: pendingRequest.items,
        })
      : "";
    const request = pendingRequest && pendingFingerprint === fingerprint
      ? pendingRequest
      : { ...requestBody, idempotencyKey: createProductReturnIdempotencyKey() };

    setPendingRequest(request);
    pendingCreateRequests.set(saleId, request);
    setSaving(true);
    setError("");
    setOutcomeUnknown(false);
    try {
      const created = await createProductReturn(saleId, request, cashRegisterId);
      setPendingRequest(null);
      pendingCreateRequests.delete(saleId);
      setReason("");
      setQuantities({});
      setConditions({});
      setReturns((current) => [created, ...current.filter((item) => item.id !== created.id)]);
      toast.success(t("productReturns.messages.created", { id: created.id }));
      dispatch(fetchShopProducts({ shopId, cashRegisterId }));
      await refreshReturns();
    } catch (submitError: unknown) {
      const response = submitError
        && typeof submitError === "object"
        && "response" in submitError
        ? (submitError as { response?: { status?: number } }).response
        : undefined;
      const unknownResult = !response || (response.status ?? 0) >= 500;
      setOutcomeUnknown(unknownResult);
      setError(getReturnErrorMessage(
        submitError,
        unknownResult ? t("productReturns.errors.networkFailed") : t("productReturns.errors.createFailed"),
      ));
    } finally {
      setSaving(false);
    }
  };

  const handleInspect = async (
    productReturn: ProductReturn,
    itemId: number,
    condition: 1 | 2,
  ) => {
    if (itemActionId !== null) return;
    const label = t(condition === 1 ? "productReturns.conditions.saleable" : "productReturns.conditions.nonSaleable");
    if (!window.confirm(t("productReturns.confirm.inspect", { condition: label }))) return;
    setItemActionId(itemId);
    setError("");
    try {
      await inspectProductReturnItem(productReturn.id, itemId, { condition });
      toast.success(t("productReturns.messages.inspectionSaved"));
      await refreshReturns();
      dispatch(fetchShopProducts({ shopId, cashRegisterId }));
    } catch (inspectError: unknown) {
      setError(getReturnErrorMessage(inspectError, t("productReturns.errors.inspectionFailed")));
    } finally {
      setItemActionId(null);
    }
  };

  const handleConfirmLoss = async (productReturn: ProductReturn, itemId: number) => {
    if (itemActionId !== null) return;
    if (!window.confirm(t("productReturns.confirm.loss"))) return;
    setItemActionId(itemId);
    setError("");
    try {
      await confirmProductReturnItemLoss(productReturn.id, itemId, {
        notes: lossNotes[itemId] ?? "",
      });
      setLossNotes((current) => ({ ...current, [itemId]: "" }));
      toast.success(t("productReturns.messages.lossConfirmed"));
      await refreshReturns();
    } catch (lossError: unknown) {
      setError(getReturnErrorMessage(lossError, t("productReturns.errors.lossFailed")));
    } finally {
      setItemActionId(null);
    }
  };

  const conditionLabel = (condition: ProductReturnCondition) => {
    const key = condition === 1
      ? "saleable"
      : condition === 2
        ? "nonSaleable"
        : "pendingInspection";
    return t(`productReturns.conditions.${key}`);
  };

  return (
    <ConfirmationModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("productReturns.title")}
      description={t("productReturns.description")}
      confirmText={pendingRequest ? t("productReturns.retrySameRequest") : t("productReturns.create")}
      cancelText={t("common.close")}
      confirmVariant="primary"
      confirmLoading={saving}
      confirmDisabled={!canSubmit}
      preventClose
      onConfirm={() => void handleCreateReturn()}
      onCancel={() => onOpenChange(false)}
      className={styles.modal}
      bodyClassName={styles.modalBody}
    >
      {loading && !sale ? (
        <p className={styles.message} role="status">{t("productReturns.loading")}</p>
      ) : (
        <>
          {error && (
            <div className={styles.error} role="alert">
              <span>{error}</span>
              <Button type="button" size="small" variant="secondary" onClick={() => void loadData()}>
                {t("productReturns.refreshHistory")}
              </Button>
            </div>
          )}
          {outcomeUnknown && (
            <p className={styles.warning} role="status">{t("productReturns.unknownOutcome")}</p>
          )}
          <section className={styles.saleSummary} aria-labelledby="product-return-sale-title">
            <h4 id="product-return-sale-title">{t("productReturns.originalSale")}</h4>
            {sale ? (
              <div className={styles.summaryGrid}>
                <span>{t("productReturns.receiptNumber")}: <strong>{sale.saleNumber ?? `#${sale.id}`}</strong></span>
                <span>{t("productReturns.date")}: <strong>{getDateLabel(sale.createdAt, locale)}</strong></span>
                <span>{t("productReturns.shop")}: <strong>{sale.shopId ?? shopId}</strong></span>
                {sale.cashierName && <span>{t("productReturns.cashier")}: <strong>{sale.cashierName}</strong></span>}
                {sale.customerName && <span>{t("productReturns.customer")}: <strong>{sale.customerName}</strong></span>}
                {sale.agentName && <span>{t("productReturns.agent")}: <strong>{sale.agentName}</strong></span>}
                {sale.paymentType && <span>{t("productReturns.paymentType")}: <strong>{sale.paymentType}</strong></span>}
                <span>{t("productReturns.cashPaid")}: <strong>{getAmountLabel(sale.cashPaid, locale)}</strong></span>
                <span>{t("productReturns.nonCashPaid")}: <strong>{getAmountLabel(sale.nonCashPaid, locale)}</strong></span>
              </div>
            ) : !loading && !error && <p className={styles.message}>{t("productReturns.errors.saleItemsUnavailable")}</p>}
          </section>

          <section className={styles.createSection} aria-labelledby="product-return-create-title">
            <h4 id="product-return-create-title">{t("productReturns.create")}</h4>
            <label className={styles.field}>
              <span>{t("productReturns.reason")}</span>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                onBlur={() => setReasonTouched(true)}
                disabled={saving || outcomeUnknown}
                required
                rows={2}
                aria-required="true"
                aria-invalid={reasonTouched && !reason.trim()}
              />
            </label>
            {reasonTouched && !reason.trim() && (
              <p className={styles.validation} role="alert">{t("productReturns.validation.reasonRequired")}</p>
            )}
            <div className={styles.tableWrap}>
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th>{t("productReturns.item")}</th>
                    <th>{t("productReturns.originalQuantity")}</th>
                    <th>{t("productReturns.unitPrice")}</th>
                    <th>{t("productReturns.remainingQuantity")}</th>
                    <th>{t("productReturns.returnQuantity")}</th>
                    <th>{t("productReturns.condition")}</th>
                  </tr>
                </thead>
                <tbody>
                  {sale?.items.map((item) => {
                    const itemId = getSaleItemId(item);
                    if (itemId === null) return null;
                    const returned = returnedQuantities.get(itemId) ?? 0;
                    const remaining = Math.max(0, item.quantity - returned);
                    const quantityValue = quantities[itemId] ?? "";
                    const parsedQuantity = Number(quantityValue);
                    const quantityError = quantityValue.trim()
                      ? !Number.isInteger(parsedQuantity) || parsedQuantity <= 0
                        ? "quantityWhole"
                        : parsedQuantity > remaining
                          ? "quantityExceeds"
                          : null
                      : null;
                    return (
                      <tr key={itemId}>
                        <td>
                          <strong>{item.productName || item.productCode || `#${item.productId}`}</strong>
                          <small>{t("productReturns.productId", { id: item.productId })}</small>
                        </td>
                        <td>{item.quantity}</td>
                        <td>
                          {getAmountLabel(item.unitPrice, locale)}
                          {item.originalUnitPrice != null && item.originalUnitPrice !== item.unitPrice && (
                            <small>{t("productReturns.originalPrice")}: {getAmountLabel(item.originalUnitPrice, locale)}</small>
                          )}
                          <small>{t("agentPortal.lineTotal")}: {getAmountLabel(item.lineTotal, locale)}</small>
                        </td>
                        <td>{remaining}</td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            max={remaining}
                            step="1"
                            inputMode="numeric"
                            aria-label={t("productReturns.returnQuantityFor", { item: item.productName || item.productCode || item.productId })}
                            value={quantities[itemId] ?? ""}
                            onChange={(event) => setQuantities((current) => ({ ...current, [itemId]: event.target.value }))}
                            disabled={saving || outcomeUnknown || remaining < 1}
                            aria-invalid={Boolean(quantityError)}
                          />
                          {quantityError && <small className={styles.validation}>{t(`productReturns.validation.${quantityError}`, { remaining })}</small>}
                        </td>
                        <td>
                          <select
                            aria-label={t("productReturns.conditionFor", { item: item.productName || item.productCode || item.productId })}
                            value={conditions[itemId] ?? ""}
                            onChange={(event) => setConditions((current) => ({ ...current, [itemId]: event.target.value }))}
                            disabled={saving || outcomeUnknown || !quantities[itemId]}
                            aria-invalid={Boolean(quantities[itemId]) && !conditions[itemId]}
                          >
                            <option value="">{t("productReturns.selectCondition")}</option>
                            {CONDITION_VALUES.map((condition) => (
                              <option key={condition} value={condition}>{conditionLabel(condition)}</option>
                            ))}
                          </select>
                          {quantities[itemId] && !conditions[itemId] && (
                            <small className={styles.validation}>{t("productReturns.validation.conditionRequired")}</small>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {sale && !sale.items.some((item) => item.quantity > (returnedQuantities.get(getSaleItemId(item) ?? -1) ?? 0)) && (
              <p className={styles.message}>{t("productReturns.fullyReturned")}</p>
            )}
            <p className={styles.note}>{t("productReturns.conditionNotice")}</p>
            {selectedItems.length > 0 && (
              <div className={styles.review} aria-live="polite">
                <strong>{t("productReturns.review")}</strong>
                {selectedItems.map(({ item, saleItemId, quantity, condition }) => (
                  <span key={saleItemId}>
                      {item.productName || item.productCode || `#${item.productId}`} × {quantity} · {
                        CONDITION_VALUES.includes(condition as ProductReturnCondition)
                          ? conditionLabel(condition as ProductReturnCondition)
                          : t("productReturns.selectCondition")
                      }
                  </span>
                ))}
                <small>{t("productReturns.serverRefundNotice")}</small>
              </div>
            )}
          </section>

          <section className={styles.historySection} aria-labelledby="product-return-history-title">
            <div className={styles.historyHeading}>
              <h4 id="product-return-history-title">{t("productReturns.history")}</h4>
              <Button type="button" size="small" variant="secondary" onClick={() => void refreshReturns()} disabled={loading || saving}>
                {t("productReturns.refreshHistory")}
              </Button>
            </div>
            {returns.length === 0 && !loading ? (
              <p className={styles.message}>{t("productReturns.historyEmpty")}</p>
            ) : (
              <div className={styles.returnList}>
                {returns.map((productReturn) => (
                  <article className={styles.returnCard} key={productReturn.id}>
                    <div className={styles.returnHeader}>
                      <strong>{t("productReturns.returnId", { id: productReturn.id })}</strong>
                      <time dateTime={productReturn.createdAt}>{getDateLabel(productReturn.createdAt, locale)}</time>
                    </div>
                    <p>{productReturn.reason}</p>
                    <div className={styles.refundBreakdown}>
                      <span>{t("productReturns.totalRefund")}: <strong>{getAmountLabel(productReturn.totalRefundAmountAmd, locale)}</strong></span>
                      <span>{t("productReturns.cashRefund")}: <strong>{getAmountLabel(productReturn.cashRefundAmountAmd, locale)}</strong></span>
                      <span>{t("productReturns.nonCashRefund")}: <strong>{getAmountLabel(productReturn.nonCashRefundAmountAmd, locale)}</strong></span>
                    </div>
                    <small>{t("productReturns.operator")}: {productReturn.createdBy}</small>
                    <ul className={styles.returnItemList}>
                      {productReturn.items.map((item) => {
                        const saleItem = sale?.items.find((saleLine) => getSaleItemId(saleLine) === item.posSaleItemId);
                        const pendingInspection = item.condition === 3;
                        const inspectedNonSaleable = item.condition === 2 && Boolean(item.inspectedAt);
                        const lossConfirmed = Boolean(item.lossConfirmedAt);
                        return (
                          <li key={item.id}>
                            <div className={styles.returnItemHeading}>
                              <strong>{saleItem?.productName || saleItem?.productCode || `#${item.productId}`}</strong>
                              <span>{t("productReturns.quantity")}: {item.quantity}</span>
                            </div>
                            <div className={styles.returnItemDetails}>
                              <span>{t("productReturns.initialCondition")}: {conditionLabel(item.initialCondition)}</span>
                              {item.initialCondition !== item.condition && (
                                <span>{t("productReturns.currentCondition")}: {conditionLabel(item.condition)}</span>
                              )}
                              <span>{t("productReturns.itemRefund")}: {getAmountLabel(item.refundAmountAmd, locale)}</span>
                              <span>{t("productReturns.itemCost")}: {getAmountLabel(item.costAmountAmd, locale)}</span>
                            </div>
                            {item.inspectedAt && (
                              <p className={styles.auditText}>
                                {t("productReturns.inspectedAudit", {
                                  user: item.inspectedBy || "—",
                                  date: getDateLabel(item.inspectedAt, locale),
                                })}
                                {item.inspectionNotes ? ` · ${item.inspectionNotes}` : ""}
                              </p>
                            )}
                            {item.lossConfirmedAt && (
                              <p className={styles.auditText}>
                                {t("productReturns.lossAudit", {
                                  user: item.lossConfirmedBy || "—",
                                  date: getDateLabel(item.lossConfirmedAt, locale),
                                })}
                                {item.lossConfirmationNotes ? ` · ${item.lossConfirmationNotes}` : ""}
                              </p>
                            )}
                            {pendingInspection && (
                              <div className={styles.itemActions}>
                                <span>{t("productReturns.notSaleableYet")}</span>
                                <Button type="button" size="small" variant="secondary" disabled={itemActionId !== null} onClick={() => void handleInspect(productReturn, item.id, 1)}>
                                  {t("productReturns.inspectSaleable")}
                                </Button>
                                <Button type="button" size="small" variant="secondary" disabled={itemActionId !== null} onClick={() => void handleInspect(productReturn, item.id, 2)}>
                                  {t("productReturns.inspectNonSaleable")}
                                </Button>
                              </div>
                            )}
                            {inspectedNonSaleable && !lossConfirmed && (
                              <div className={styles.itemActions}>
                                <label className={styles.lossNotes}>
                                  <span>{t("productReturns.lossNotes")}</span>
                                  <input
                                    value={lossNotes[item.id] ?? ""}
                                    disabled={itemActionId !== null}
                                    onChange={(event) => setLossNotes((current) => ({ ...current, [item.id]: event.target.value }))}
                                  />
                                </label>
                                <Button type="button" size="small" variant="secondary" disabled={itemActionId !== null} onClick={() => void handleConfirmLoss(productReturn, item.id)}>
                                  {t("productReturns.confirmLoss")}
                                </Button>
                              </div>
                            )}
                            {lossConfirmed && <span className={styles.lossComplete}>{t("productReturns.lossComplete")}</span>}
                          </li>
                        );
                      })}
                    </ul>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </ConfirmationModal>
  );
};
