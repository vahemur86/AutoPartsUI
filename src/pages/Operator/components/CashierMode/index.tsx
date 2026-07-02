import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Button, TextField } from "@/ui-kit";
import { Trash2 } from "lucide-react";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchShops } from "@/store/slices/shopsSlice";
import { fetchShopProducts } from "@/store/slices/shops/productsSlice";

// services
import { searchShopProductsBySku } from "@/services/warehouses/warehouseProduct";
import {
  convertServiceEstimateToOrder,
  getServiceEstimateByNumber,
} from "@/services/operator";

// utils
import { getCashRegisterId } from "@/utils";

// services
import { createPOSSale } from "@/services/shops/posSale";

// types
import type { ServiceEstimateLookupResponse } from "@/types/operator";
import type { ShopProductItem } from "@/types/warehouses/warehouseProduct";

// styles
import styles from "./CashierMode.module.css";

interface CashierModeProps {
  cashRegisterId?: number;
}

type CashierProductRow = ShopProductItem & {
  productCode: string;
  sku: string;
};

type PaymentMode = "cash" | "non-cash" | "mixed";

type CartItem = {
  productId: number;
  shopStockId: number;
  productCode: string;
  unitPrice: number;
  quantity: number;
};

export const CashierMode = ({ cashRegisterId }: CashierModeProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { shops } = useAppSelector((state) => state.shops);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");
  const [cashPaid, setCashPaid] = useState("0");
  const [nonCashPaid, setNonCashPaid] = useState("0");
  const [nonCashReference, setNonCashReference] = useState("");
  const [isSaleLoading, setIsSaleLoading] = useState(false);
  const [searchSku, setSearchSku] = useState("");
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [searchMessageType, setSearchMessageType] = useState<"success" | "error" | null>(null);
  const [estimateNumberInput, setEstimateNumberInput] = useState("");
  const [isEstimateLoading, setIsEstimateLoading] = useState(false);
  const [isEstimateConverting, setIsEstimateConverting] = useState(false);
  const [selectedEstimate, setSelectedEstimate] =
    useState<ServiceEstimateLookupResponse | null>(null);
  const skuInputRef = useRef<HTMLInputElement | null>(null);

  const cashRegister = useMemo(() => getCashRegisterId(0), []);
  const resolvedCashRegisterId = useMemo(() => {
    const fromProp = Number(cashRegisterId || 0);
    if (Number.isFinite(fromProp) && fromProp > 0) {
      return fromProp;
    }

    const fromLocal = Number(cashRegister || 0);
    if (Number.isFinite(fromLocal) && fromLocal > 0) {
      return fromLocal;
    }

    return 0;
  }, [cashRegisterId, cashRegister]);
  const currentShopId = shops[0]?.id ?? null;
  const currentShopCode = shops[0]?.code ?? "";

  useEffect(() => {
    if (!resolvedCashRegisterId) return;
    dispatch(fetchShops({ cashRegisterId: resolvedCashRegisterId }));
  }, [dispatch, resolvedCashRegisterId]);

  useEffect(() => {
    skuInputRef.current?.focus();
  }, [currentShopId]);

  useEffect(() => {
    if (!currentShopId || !resolvedCashRegisterId) return;
    dispatch(
      fetchShopProducts({
        shopId: currentShopId,
        cashRegisterId: resolvedCashRegisterId,
      }),
    );
    setCartItems([]);
  }, [dispatch, currentShopId, resolvedCashRegisterId]);

  const totalAmount = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + Number(item.unitPrice) * item.quantity,
        0,
      ),
    [cartItems],
  );

  const isEstimateMode = !!selectedEstimate;

  const estimateServiceLines = useMemo(
    () => (selectedEstimate?.lines ?? selectedEstimate?.services ?? []),
    [selectedEstimate],
  );

  const estimateProductLines = useMemo(
    () => selectedEstimate?.productLines ?? selectedEstimate?.products ?? [],
    [selectedEstimate],
  );

  const estimateServicesTotal = useMemo(() => {
    const fromField = Number(selectedEstimate?.servicesTotal || 0);
    if (fromField > 0) return fromField;

    return estimateServiceLines.reduce(
      (sum, line) => sum + Number(line.customerPrice || 0),
      0,
    );
  }, [selectedEstimate, estimateServiceLines]);

  const estimateProductsTotal = useMemo(() => {
    const fromField = Number(selectedEstimate?.productsTotal || 0);
    if (fromField > 0) return fromField;

    return estimateProductLines.reduce((sum, line) => {
      const lineTotal = Number((line as { totalPrice?: number; lineTotal?: number }).lineTotal ?? (line as { totalPrice?: number; lineTotal?: number }).totalPrice ?? 0);
      if (lineTotal > 0) return sum + lineTotal;
      return sum + Number(line.quantity || 0) * Number(line.unitPrice || 0);
    }, 0);
  }, [selectedEstimate, estimateProductLines]);

  const estimateTotalAmount = useMemo(() => {
    const fromField = Number(selectedEstimate?.grandTotal || selectedEstimate?.totalAmount || 0);
    if (fromField > 0) return fromField;
    return estimateServicesTotal + estimateProductsTotal;
  }, [selectedEstimate, estimateServicesTotal, estimateProductsTotal]);

  const activeTotalAmount = isEstimateMode ? estimateTotalAmount : totalAmount;

  const cashPaidNum = useMemo(() => parseFloat(cashPaid) || 0, [cashPaid]);
  const nonCashPaidNum = useMemo(() => parseFloat(nonCashPaid) || 0, [nonCashPaid]);

  const resolvedCashPaid = useMemo(() => {
    if (paymentMode === "cash") return activeTotalAmount;
    if (paymentMode === "non-cash") return 0;
    return cashPaidNum;
  }, [paymentMode, activeTotalAmount, cashPaidNum]);

  const resolvedNonCashPaid = useMemo(() => {
    if (paymentMode === "non-cash") return activeTotalAmount;
    if (paymentMode === "cash") return 0;
    return nonCashPaidNum;
  }, [paymentMode, activeTotalAmount, nonCashPaidNum]);

  const change = useMemo(() => {
    if (paymentMode === "cash") return Math.max(0, cashPaidNum - activeTotalAmount);
    if (paymentMode === "mixed") return Math.max(0, cashPaidNum + nonCashPaidNum - activeTotalAmount);
    return 0;
  }, [paymentMode, cashPaidNum, nonCashPaidNum, activeTotalAmount]);

  const handleAddToCart = useCallback(
    (product: CashierProductRow) => {
      const resolvedProductId = product.productId ?? product.product?.id;
      const shopStockId = product.id;
      if (!resolvedProductId || !shopStockId) return;

      setCartItems((prevItems) => {
        const existing = prevItems.find(
          (item) => item.productId === resolvedProductId,
        );
        if (existing) {
          return prevItems.map((item) =>
            item.productId === resolvedProductId
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          );
        }

        return [
          ...prevItems,
          {
            productId: resolvedProductId,
            shopStockId,
            productCode: product.productCode,
            unitPrice: product.salePrice,
            quantity: 1,
          },
        ];
      });
    },
    [],
  );

  const handleSkuSearch = useCallback(async () => {
    const sku = searchSku.trim();
    if (!sku) {
      setSearchMessageType("error");
      setSearchMessage(t("operatorPage.cashier.enterSku"));
      return;
    }
    if (!currentShopId) {
      setSearchMessageType("error");
      setSearchMessage(t("operatorPage.cashier.loadingShop"));
      return;
    }

    try {
      const crId = resolvedCashRegisterId;
      if (!crId) {
        setSearchMessageType("error");
        setSearchMessage("Missing or invalid X-CashRegister-Id header.");
        return;
      }
      const results = await searchShopProductsBySku({
        shopId: currentShopId,
        cashRegisterId: crId,
        sku,
      });

      const shopProduct = results[0];
      if (!shopProduct) {
        setSearchMessageType("error");
        setSearchMessage(t("operatorPage.cashier.productNotFound"));
        return;
      }

      const productCode = shopProduct.product?.code || String(shopProduct.productId || "-");
      const productSku = shopProduct.product?.sku || sku;

      handleAddToCart({
        ...shopProduct,
        productCode,
        sku: productSku,
      });

      setSearchSku("");
      setSearchMessageType("success");
      setSearchMessage(
        t("operatorPage.cashier.addedToCart", {
          sku: productSku,
        }),
      );
      skuInputRef.current?.focus();
    } catch {
      setSearchMessageType("error");
      setSearchMessage(t("operatorPage.cashier.productNotFound"));
    }
  }, [
    searchSku,
    currentShopId,
    resolvedCashRegisterId,
    handleAddToCart,
    t,
  ]);

  const handleQuantityChange = useCallback(
    (productId: number, value: string) => {
      const quantity = Number(value);
      if (Number.isNaN(quantity) || quantity < 0) return;
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(0, quantity) }
            : item,
        ),
      );
    },
    [],
  );

  const handleRemoveFromCart = useCallback((productId: number) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.productId !== productId),
    );
  }, []);

  const resetCheckoutState = useCallback(() => {
    setCartItems([]);
    setCashPaid("0");
    setNonCashPaid("0");
    setNonCashReference("");
    setPaymentMode("cash");
    setSearchSku("");
    setSearchMessage(null);
    setSearchMessageType(null);
    setEstimateNumberInput("");
    setSelectedEstimate(null);
  }, []);

  const handleCompleteSale = useCallback(async () => {
    if (cartItems.length === 0 || !currentShopId) return;

    const crId = resolvedCashRegisterId;
    if (!crId) {
      toast.error("Missing or invalid X-CashRegister-Id header.");
      return;
    }

    if (paymentMode === "mixed" && !nonCashReference.trim()) {
      toast.error(t("operatorPage.cashier.nonCashReferenceRequired"));
      return;
    }
    if (paymentMode === "non-cash" && !nonCashReference.trim()) {
      toast.error(t("operatorPage.cashier.nonCashReferenceRequired"));
      return;
    }

    setIsSaleLoading(true);
    try {
      await createPOSSale(
        {
          shopId: currentShopId,
          cashPaid: resolvedCashPaid,
          nonCashPaid: resolvedNonCashPaid,
          nonCashPaymentReference: nonCashReference.trim() || undefined,
          items: cartItems.map((item) => ({
            productId: item.productId,
            shopStockId: item.shopStockId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
        crId,
      );
      toast.success(t("operatorPage.cashier.saleCompleted"));
      resetCheckoutState();
    } catch (error) {
      const msg = error instanceof Error ? error.message : t("operatorPage.cashier.saleError");
      toast.error(msg);
    } finally {
      setIsSaleLoading(false);
    }
  }, [
    cartItems,
    currentShopId,
    resolvedCashRegisterId,
    paymentMode,
    nonCashReference,
    resolvedCashPaid,
    resolvedNonCashPaid,
    resetCheckoutState,
    t,
  ]);

  const handleFindEstimate = useCallback(async () => {
    const estimateNumber = estimateNumberInput.trim();
    if (!estimateNumber) {
      toast.error(t("operatorPage.cashier.estimate.enterNumber"));
      return;
    }

    setIsEstimateLoading(true);
    try {
      const result = await getServiceEstimateByNumber({
        estimateNumber,
        cashRegisterId: resolvedCashRegisterId,
      });
      setSelectedEstimate(result);
      setPaymentMode("cash");
      setCashPaid("0");
      setNonCashPaid("0");
      setNonCashReference("");
      toast.success(t("operatorPage.cashier.estimate.found"));
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : t("operatorPage.cashier.estimate.notFound");
      setSelectedEstimate(null);
      toast.error(msg);
    } finally {
      setIsEstimateLoading(false);
    }
  }, [estimateNumberInput, resolvedCashRegisterId, t]);

  const handleConvertEstimate = useCallback(async () => {
    if (!selectedEstimate?.id) return;

    if (estimateTotalAmount <= 0) {
      toast.error(t("operatorPage.cashier.estimate.invalidAmount"));
      return;
    }

    const paidTotal = resolvedCashPaid + resolvedNonCashPaid;
    if (paidTotal < estimateTotalAmount) {
      toast.error(t("operatorPage.cashier.estimate.insufficientPayment"));
      return;
    }

    setIsEstimateConverting(true);
    try {
      await convertServiceEstimateToOrder({
        payload: {
          serviceEstimateId: Number(selectedEstimate.id),
          cashPaid: Number(resolvedCashPaid || 0),
          nonCashPaid: Number(resolvedNonCashPaid || 0),
          products: [],
        },
        cashRegisterId: resolvedCashRegisterId,
      });

      toast.success(t("operatorPage.cashier.estimate.confirmed"));
      resetCheckoutState();
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : t("operatorPage.cashier.estimate.confirmFailed");
      toast.error(msg);
    } finally {
      setIsEstimateConverting(false);
    }
  }, [
    selectedEstimate,
    resolvedCashPaid,
    resolvedNonCashPaid,
    resolvedCashRegisterId,
    estimateTotalAmount,
    resetCheckoutState,
    t,
  ]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{t("operatorPage.cashier.title")}</h2>
          <p className={styles.description}>
            {t("operatorPage.cashier.description")}
          </p>
        </div>

        <div className={styles.shopBadgeContainer}>
          <div className={styles.shopBadge}>
            <span>{t("operatorPage.cashier.shopLabel")}</span>
            <strong>{currentShopCode || t("operatorPage.cashier.loadingShop")}</strong>
          </div>
        </div>
      </div>

      <div className={styles.estimateSearchRow}>
        <TextField
          className={styles.searchTextField}
          label={t("operatorPage.cashier.estimate.label")}
          value={estimateNumberInput}
          onChange={(event) => setEstimateNumberInput(event.target.value)}
          placeholder={t("operatorPage.cashier.estimate.placeholder")}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleFindEstimate();
            }
          }}
          inputMode="text"
        />
        <Button type="button" onClick={handleFindEstimate} disabled={isEstimateLoading}>
          {isEstimateLoading
            ? t("operatorPage.cashier.processing")
            : t("operatorPage.cashier.estimate.findButton")}
        </Button>
      </div>

      {selectedEstimate && (
        <div className={styles.estimateCard}>
          <div className={styles.estimateHeader}>
            <strong>
              {t("operatorPage.cashier.estimate.number")}: {selectedEstimate.estimateNumber}
            </strong>
            <span>
              {t("operatorPage.cashier.estimate.status")}: {selectedEstimate.status || "Pending"}
            </span>
          </div>

          <div className={styles.estimateGrid}>
            <div>
              {t("operatorPage.cashier.estimate.vehicle")}: {selectedEstimate.vehicleBrandName || "-"} {selectedEstimate.vehicleModelName || ""} {selectedEstimate.vehicleYear || ""}
            </div>
            <div>
              {t("operatorPage.cashier.estimate.vin")}: {selectedEstimate.vinCode || "-"}
            </div>
            <div>
              {t("operatorPage.cashier.estimate.amount")}: {Number(selectedEstimate.grandTotal || estimateTotalAmount || 0).toLocaleString()} AMD
            </div>
          </div>

          <div className={styles.estimateGrid}>
            <div>
              <strong>{t("operatorPage.cashier.estimate.servicesSection")}</strong>
            </div>
            {estimateServiceLines.length === 0 ? (
              <div>{t("operatorPage.cashier.estimate.noServices")}</div>
            ) : (
              estimateServiceLines.map((line, index) => (
                <div key={`${line.id || line.serviceId || index}`}>
                  {(line.serviceName || `#${line.serviceId || "-"}`)} - {Number(line.customerPrice || 0).toLocaleString()} AMD
                </div>
              ))
            )}
            <div>
              {t("operatorPage.cashier.estimate.servicesTotal")}: {estimateServicesTotal.toLocaleString()} AMD
            </div>
          </div>

          <div className={styles.estimateGrid}>
            <div>
              <strong>{t("operatorPage.cashier.estimate.productsSection")}</strong>
            </div>
            {estimateProductLines.length === 0 ? (
              <div>{t("operatorPage.cashier.estimate.noProducts")}</div>
            ) : (
              estimateProductLines.map((line, index) => {
                const productLine = line as {
                  totalPrice?: number;
                  lineTotal?: number;
                  productName?: string;
                  sku?: string;
                };
                const lineTotal =
                  Number(productLine.lineTotal || productLine.totalPrice || 0) ||
                  Number(line.quantity || 0) * Number(line.unitPrice || 0);
                const lineLabel =
                  productLine.productName ||
                  line.productCode ||
                  productLine.sku ||
                  `#${line.productId || "-"}`;

                return (
                  <div key={`${line.id || line.productId || index}`}>
                    {lineLabel} x {Number(line.quantity || 0)} - {lineTotal.toLocaleString()} AMD
                  </div>
                );
              })
            )}
            <div>
              {t("operatorPage.cashier.estimate.productsTotal")}: {estimateProductsTotal.toLocaleString()} AMD
            </div>
            <div>
              <strong>
                {t("operatorPage.cashier.estimate.orderTotal")}: {estimateTotalAmount.toLocaleString()} AMD
              </strong>
            </div>
          </div>

          <div className={styles.estimateActions}>
            <Button
              type="button"
              onClick={() => {
                setSelectedEstimate(null);
                setEstimateNumberInput("");
              }}
              variant="secondary"
            >
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      )}

      {!isEstimateMode && (
        <div className={styles.searchRow}>
        <TextField
          ref={skuInputRef}
          className={styles.searchTextField}
          label={t("operatorPage.cashier.scanOrEnterSku")}
          value={searchSku}
          onChange={(event) => {
            setSearchSku(event.target.value);
            setSearchMessage(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSkuSearch();
            }
          }}
          placeholder={t("operatorPage.cashier.scanPlaceholder")}
          inputMode="text"
        />
        <Button
          type="button"
          onClick={handleSkuSearch}
          disabled={!searchSku.trim()}
        >
          {t("operatorPage.cashier.searchButton")}
        </Button>
        </div>
      )}
      {!isEstimateMode && searchMessage ? (
        <div
          className={`${styles.searchMessage} ${
            searchMessageType === "success"
              ? styles.successMessage
              : styles.errorMessage
          }`}
        >
          {searchMessage}
        </div>
      ) : null}

      <div className={styles.grid}>
        <aside className={styles.cartSection}>
          <div className={styles.sectionHeader}>
            <h3>
              {isEstimateMode
                ? t("operatorPage.cashier.estimate.summaryTitle")
                : t("operatorPage.cashier.cartTitle")}
            </h3>
          </div>

          <div className={styles.cartContent}>
            {!isEstimateMode && cartItems.length === 0 ? (
              <div className={styles.emptyState}>
                {t("operatorPage.cashier.emptyCart")}
              </div>
            ) : !isEstimateMode ? (
              <div className={styles.cartItems}>
                {cartItems.map((item) => (
                  <div key={item.productId} className={styles.cartItem}>
                    <div>
                      <strong>{item.productCode}</strong>
                      <div className={styles.cartItemMeta}>
                        {t("operatorPage.cashier.unitPrice")}:
                        <span>{item.unitPrice.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className={styles.cartItemControls}>
                      <TextField
                        aria-label={t("operatorPage.cashier.quantity")}
                        className={styles.quantityField}
                        value={item.quantity.toString()}
                        onChange={(event) =>
                          handleQuantityChange(item.productId, event.target.value)
                        }
                        inputMode="numeric"
                      />
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => handleRemoveFromCart(item.productId)}
                      >
                        <Trash2 size={14} />
                        {t("operatorPage.cashier.remove")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.cartItems}>
                <div className={styles.cartItem}>
                  <div>
                    <strong>{t("operatorPage.cashier.estimate.servicesTotal")}</strong>
                  </div>
                  <div className={styles.cartItemMeta}>{estimateServicesTotal.toLocaleString()} AMD</div>
                </div>
                <div className={styles.cartItem}>
                  <div>
                    <strong>{t("operatorPage.cashier.estimate.productsTotal")}</strong>
                  </div>
                  <div className={styles.cartItemMeta}>{estimateProductsTotal.toLocaleString()} AMD</div>
                </div>
                <div className={styles.cartItem}>
                  <div>
                    <strong>{t("operatorPage.cashier.estimate.orderTotal")}</strong>
                  </div>
                  <div className={styles.cartItemMeta}>{estimateTotalAmount.toLocaleString()} AMD</div>
                </div>
              </div>
            )}

            <div className={styles.paymentPanel}>
              <div className={styles.totalRow}>
                <span>{t("operatorPage.cashier.total")}</span>
                <strong>{activeTotalAmount.toFixed(2)}</strong>
              </div>

              <div className={styles.paymentMethods}>
                {(["cash", "non-cash", "mixed"] as PaymentMode[]).map((mode) => (
                  <label
                    key={mode}
                    className={`${styles.paymentOption} ${
                      paymentMode === mode ? styles.activePaymentOption : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMode"
                      value={mode}
                      checked={paymentMode === mode}
                      onChange={() => setPaymentMode(mode)}
                    />
                    {t(`operatorPage.cashier.paymentMethods.${mode === "non-cash" ? "nonCash" : mode}`)}
                  </label>
                ))}
              </div>

              {(paymentMode === "cash" || paymentMode === "mixed") && (
                <TextField
                  label={t("operatorPage.cashier.cashPaid")}
                  value={cashPaid}
                  onChange={(e) => setCashPaid(e.target.value)}
                  inputMode="numeric"
                />
              )}

              {!isEstimateMode && (paymentMode === "non-cash" || paymentMode === "mixed") && (
                <TextField
                  label={t("operatorPage.cashier.nonCashPaid")}
                  value={paymentMode === "non-cash" ? activeTotalAmount.toFixed(2) : nonCashPaid}
                  onChange={(e) => setNonCashPaid(e.target.value)}
                  inputMode="numeric"
                  disabled={paymentMode === "non-cash"}
                />
              )}

              {!isEstimateMode && (paymentMode === "non-cash" || paymentMode === "mixed") && (
                <TextField
                  label={t("operatorPage.cashier.nonCashReference")}
                  placeholder={t("operatorPage.cashier.nonCashReferencePlaceholder")}
                  value={nonCashReference}
                  onChange={(e) => setNonCashReference(e.target.value)}
                />
              )}

              <div className={styles.actions}>
                <Button
                  fullWidth
                  disabled={
                    activeTotalAmount === 0 ||
                    isSaleLoading ||
                    isEstimateConverting ||
                    (!isEstimateMode && cartItems.length === 0) ||
                    (isEstimateMode && !selectedEstimate?.id)
                  }
                  onClick={isEstimateMode ? handleConvertEstimate : handleCompleteSale}
                >
                  {isSaleLoading || isEstimateConverting
                    ? t("operatorPage.cashier.processing")
                    : isEstimateMode
                      ? t("operatorPage.cashier.estimate.confirmButton")
                      : t("operatorPage.cashier.completeSale")}
                </Button>
              </div>

              <div className={styles.paymentInfo}>
                {(paymentMode === "cash" || paymentMode === "mixed") && (
                  <div className={styles.paymentInfoRow}>
                    <span>{t("operatorPage.cashier.cashPaid")}:</span>
                    <strong>{resolvedCashPaid.toFixed(2)}</strong>
                  </div>
                )}
                {(paymentMode === "non-cash" || paymentMode === "mixed") && (
                  <div className={styles.paymentInfoRow}>
                    <span>{t("operatorPage.cashier.nonCashPaid")}:</span>
                    <strong>{resolvedNonCashPaid.toFixed(2)}</strong>
                  </div>
                )}
                {change > 0 && (
                  <div className={`${styles.paymentInfoRow} ${styles.changeRow}`}>
                    <span>{t("operatorPage.cashier.change")}:</span>
                    <strong>{change.toFixed(2)}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
