import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { debounce } from "lodash";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchSalesLotPreview } from "@/store/slices/warehouses/salesLotsSlice";

// ui-kit
import { Modal, Button, TextField } from "@/ui-kit";

// styles
import styles from "../TotalBatches.module.css";

interface SalesLotPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: number;
  items: Array<{ inventoryLotId: number; powderKg: number }>;
  cashRegisterId: number;
  onConfirm: (
    updatedItems: Array<{ inventoryLotId: number; powderKg: number }>,
  ) => void;
  isCreating: boolean;
}

export const SalesLotPreviewModal = ({
  open,
  onOpenChange,
  warehouseId,
  items,
  cashRegisterId,
  onConfirm,
  isCreating,
}: SalesLotPreviewModalProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  // Extract previewData, isLoading, and error from Redux state
  const { previewData, isLoading, error } = useAppSelector(
    (state) => state.salesLots,
  );

  const [localWeights, setLocalWeights] = useState<Record<number, string>>({});

  const debouncedFetch = useMemo(
    () =>
      debounce((updatedItems) => {
        dispatch(
          fetchSalesLotPreview({
            warehouseId,
            items: updatedItems,
            cashRegisterId,
          }),
        );
      }, 500),
    [warehouseId, cashRegisterId, dispatch],
  );

  useEffect(() => {
    if (open) {
      const initialWeights: Record<number, string> = {};
      items.forEach((item) => {
        initialWeights[item.inventoryLotId] = item.powderKg.toString();
      });
      setLocalWeights(initialWeights);

      dispatch(
        fetchSalesLotPreview({
          warehouseId,
          items,
          cashRegisterId,
        }),
      );
    }
  }, [open, items, warehouseId, cashRegisterId, dispatch]);

  useEffect(() => {
    return () => {
      debouncedFetch.cancel();
    };
  }, [debouncedFetch]);

  const handleWeightChange = (id: number, val: string) => {
    if (val !== "" && !/^\d*\.?\d{0,4}$/.test(val)) return;
    if (val.length > 1 && val.startsWith("0") && val[1] !== ".") {
      val = val.replace(/^0+/, "") || "0";
    }
    if (val === ".") val = "0.";

    const newWeights = { ...localWeights, [id]: val };
    setLocalWeights(newWeights);

    const updatedItemsForApi = items.map((item) => ({
      ...item,
      powderKg: parseFloat(newWeights[item.inventoryLotId]) || 0,
    }));

    debouncedFetch(updatedItemsForApi);
  };

  const formatValue = (val: number, decimals = 2) =>
    val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  const getFinalItems = () =>
    items.map((item) => ({
      ...item,
      powderKg: parseFloat(localWeights[item.inventoryLotId]) || 0,
    }));

  const footer = (
    <>
      <Button
        variant="secondary"
        onClick={() => onOpenChange(false)}
        disabled={isCreating}
      >
        {t("common.cancel")}
      </Button>
      <Button
        variant="primary"
        onClick={() => onConfirm(getFinalItems())}
        disabled={
          isCreating ||
          isLoading ||
          !!error || // Disable button if there's an error
          getFinalItems().some((i) => i.powderKg <= 0)
        }
      >
        {isCreating
          ? t("common.loading")
          : t("warehouses.totalBatches.createSale")}
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t("warehouses.totalBatches.previewTitle")}
      footer={footer}
    >
      <div className={styles.previewContainer}>
        <div className={styles.editableItemsList}>
          <h4 className={styles.summaryMetalsTitle}>
            {t("warehouses.totalBatches.details.individualIntakes")}
          </h4>
          {items.map((item) => (
            <div key={item.inventoryLotId} className={styles.editableItemRow}>
              <span className={styles.itemId}>#{item.inventoryLotId}</span>
              <div className={styles.inputWrapper}>
                <TextField
                  type="text"
                  inputMode="decimal"
                  value={localWeights[item.inventoryLotId] || ""}
                  onChange={(e) =>
                    handleWeightChange(item.inventoryLotId, e.target.value)
                  }
                  suffix="kg"
                />
              </div>
            </div>
          ))}
        </div>

        <div className={styles.summaryDivider} />

        <div className={styles.stableSummaryWrapper}>
          {isLoading && (
            <div className={styles.loadingOverlay}>
              <div className={styles.spinner} />
            </div>
          )}

          {/* Error Message Display */}
          {error && !isLoading && (
            <div className={styles.errorContainer}>
              <p className={styles.errorMessage}>{error}</p>
            </div>
          )}

          <div
            className={`${styles.summaryDropdownInner} ${isLoading || error ? styles.dimmed : ""}`}
          >
            {previewData && !error && (
              <>
                <div className={styles.summaryCardsGrid}>
                  <div className={styles.summaryCard}>
                    <span className={styles.summaryCardLabel}>
                      {t("warehouses.totalBatches.columns.totalPowderKg")}
                    </span>
                    <strong className={styles.summaryCardValue}>
                      {previewData.totalPowderKg} kg
                    </strong>
                  </div>
                  <div className={styles.summaryCard}>
                    <span className={styles.summaryCardLabel}>
                      {t("warehouses.totalBatches.columns.initialCostAmd")}
                    </span>
                    <strong className={styles.summaryCardValue}>
                      {formatValue(previewData.totalCostAmd, 0)} AMD
                    </strong>
                  </div>
                </div>

                <div className={styles.summaryMetalsSection}>
                  <h4 className={styles.summaryMetalsTitle}>
                    {t("cashbox.powderBatches.summary.metalsTitle")}
                  </h4>
                  <div className={styles.summaryMetalsList}>
                    {[
                      { label: "Pt", val: previewData.ptTotal_g },
                      { label: "Pd", val: previewData.pdTotal_g },
                      { label: "Rh", val: previewData.rhTotal_g },
                    ].map((m) => (
                      <div key={m.label} className={styles.summaryMetalRow}>
                        <div className={styles.summaryMetalInfo}>
                          <span className={styles.summaryMetalSymbol}>
                            {m.label}
                          </span>
                        </div>
                        <strong className={styles.summaryMetalValue}>
                          {m.val} g
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            {!previewData && !error && !isLoading && (
              <div className={styles.emptyState}>{t("common.noData")}</div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
