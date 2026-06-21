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

// utils
import { getCashRegisterId } from "@/utils";

// services
import { createPOSSale } from "@/services/shops/posSale";

// types
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
  const skuInputRef = useRef<HTMLInputElement | null>(null);

  const cashRegister = useMemo(() => getCashRegisterId(), []);
  const currentShopId = shops[0]?.id ?? null;
  const currentShopCode = shops[0]?.code ?? "";

  useEffect(() => {
    dispatch(fetchShops({ cashRegisterId: cashRegisterId || cashRegister }));
  }, [dispatch, cashRegisterId, cashRegister]);

  useEffect(() => {
    skuInputRef.current?.focus();
  }, [currentShopId]);

  useEffect(() => {
    if (!currentShopId) return;
    dispatch(
      fetchShopProducts({
        shopId: currentShopId,
        cashRegisterId: cashRegisterId || cashRegister,
      }),
    );
    setCartItems([]);
  }, [dispatch, currentShopId, cashRegisterId, cashRegister]);

  const totalAmount = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + Number(item.unitPrice) * item.quantity,
        0,
      ),
    [cartItems],
  );

  const cashPaidNum = useMemo(() => parseFloat(cashPaid) || 0, [cashPaid]);
  const nonCashPaidNum = useMemo(() => parseFloat(nonCashPaid) || 0, [nonCashPaid]);

  const resolvedCashPaid = useMemo(() => {
    if (paymentMode === "cash") return totalAmount;
    if (paymentMode === "non-cash") return 0;
    return cashPaidNum;
  }, [paymentMode, totalAmount, cashPaidNum]);

  const resolvedNonCashPaid = useMemo(() => {
    if (paymentMode === "non-cash") return totalAmount;
    if (paymentMode === "cash") return 0;
    return nonCashPaidNum;
  }, [paymentMode, totalAmount, nonCashPaidNum]);

  const change = useMemo(() => {
    if (paymentMode === "cash") return Math.max(0, cashPaidNum - totalAmount);
    if (paymentMode === "mixed") return Math.max(0, cashPaidNum + nonCashPaidNum - totalAmount);
    return 0;
  }, [paymentMode, cashPaidNum, nonCashPaidNum, totalAmount]);

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
      const crId = cashRegisterId || cashRegister;
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
    cashRegisterId,
    cashRegister,
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

  const handleCompleteSale = useCallback(async () => {
    if (cartItems.length === 0 || !currentShopId) return;

    const crId = cashRegisterId || cashRegister;

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
      setCartItems([]);
      setCashPaid("0");
      setNonCashPaid("0");
      setNonCashReference("");
      setPaymentMode("cash");
    } catch (error) {
      const msg = error instanceof Error ? error.message : t("operatorPage.cashier.saleError");
      toast.error(msg);
    } finally {
      setIsSaleLoading(false);
    }
  }, [
    cartItems,
    currentShopId,
    cashRegisterId,
    cashRegister,
    paymentMode,
    nonCashReference,
    resolvedCashPaid,
    resolvedNonCashPaid,
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
      {searchMessage ? (
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
            <h3>{t("operatorPage.cashier.cartTitle")}</h3>
          </div>

          <div className={styles.cartContent}>
            {cartItems.length === 0 ? (
              <div className={styles.emptyState}>
                {t("operatorPage.cashier.emptyCart")}
              </div>
            ) : (
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
            )}

            <div className={styles.paymentPanel}>
              <div className={styles.totalRow}>
                <span>{t("operatorPage.cashier.total")}</span>
                <strong>{totalAmount.toFixed(2)}</strong>
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

              {(paymentMode === "non-cash" || paymentMode === "mixed") && (
                <TextField
                  label={t("operatorPage.cashier.nonCashPaid")}
                  value={paymentMode === "non-cash" ? totalAmount.toFixed(2) : nonCashPaid}
                  onChange={(e) => setNonCashPaid(e.target.value)}
                  inputMode="numeric"
                  disabled={paymentMode === "non-cash"}
                />
              )}

              {(paymentMode === "non-cash" || paymentMode === "mixed") && (
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
                  disabled={cartItems.length === 0 || totalAmount === 0 || isSaleLoading}
                  onClick={handleCompleteSale}
                >
                  {isSaleLoading
                    ? t("operatorPage.cashier.processing")
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
