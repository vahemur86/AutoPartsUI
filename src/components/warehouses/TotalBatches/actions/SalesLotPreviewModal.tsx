import {
  useCallback,
  useEffect,
  useState,
  useMemo,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { debounce } from "lodash";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchSalesLotPreview } from "@/store/slices/warehouses/salesLotsSlice";
import type { InventoryLot } from "@/types/warehouses/reports";
import type { SalesLotPreviewItem } from "@/types/warehouses/salesLots";

// ui-kit
import { Modal, Button, TextField } from "@/ui-kit";

// icons
import {
  Atom,
  Calculator,
  Check,
  CircleDollarSign,
  GripVertical,
  Layers3,
  LoaderCircle,
  Package,
  Scale,
  Trash2,
  TrendingUp,
  WalletCards,
  X,
} from "lucide-react";

// styles
import styles from "../TotalBatches.module.css";

interface SalesLotPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: number;
  inventoryLots: InventoryLot[];
  items: Array<{ inventoryLotId: number; powderKg: number }>;
  cashRegisterId: number;
  onConfirm: (
    updatedItems: Array<{ inventoryLotId: number; powderKg: number }>,
    sealNumber: string,
  ) => void;
  onRemoveItem: (id: number) => void;
  isCreating: boolean;
}

export const SalesLotPreviewModal = ({
  open,
  onOpenChange,
  warehouseId,
  inventoryLots = [],
  items,
  cashRegisterId,
  onConfirm,
  onRemoveItem,
  isCreating,
}: SalesLotPreviewModalProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { previewData, isLoading, error } = useAppSelector(
    (state) => state.salesLots,
  );

  const [localWeights, setLocalWeights] = useState<Record<number, string>>({});
  const [sealNumber, setSealNumber] = useState("");
  const [orderedItems, setOrderedItems] = useState(items);
  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
  const [draggedPointerId, setDraggedPointerId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);

  const debouncedFetch = useMemo(
    () =>
      debounce((updatedItems) => {
        if (updatedItems.length === 0) return;
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
      setOrderedItems((currentItems) => {
        const availableIds = new Set(items.map((item) => item.inventoryLotId));
        const retainedItems = currentItems.filter((item) =>
          availableIds.has(item.inventoryLotId),
        );
        const retainedIds = new Set(
          retainedItems.map((item) => item.inventoryLotId),
        );
        return [
          ...retainedItems,
          ...items.filter((item) => !retainedIds.has(item.inventoryLotId)),
        ];
      });
      setLocalWeights((currentWeights) => {
        const nextWeights: Record<number, string> = {};
        items.forEach((item) => {
          nextWeights[item.inventoryLotId] =
            currentWeights[item.inventoryLotId] ??
            initialWeights[item.inventoryLotId];
        });
        return nextWeights;
      });

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

  const handleRemove = (id: number) => {
    onRemoveItem(id);
    setOrderedItems((currentItems) =>
      currentItems.filter((item) => item.inventoryLotId !== id),
    );
    const updatedItems = orderedItems.filter(
      (item) => item.inventoryLotId !== id,
    );

    if (updatedItems.length === 0) {
      onOpenChange(false);
      return;
    }

    dispatch(
      fetchSalesLotPreview({
        warehouseId,
        items: updatedItems.map((item) => ({
          ...item,
          powderKg: parseFloat(localWeights[item.inventoryLotId]) || 0,
        })),
        cashRegisterId,
      }),
    );
  };

  const reorderItems = useCallback((sourceId: number, targetId: number) => {
    if (sourceId === targetId) return;

    setOrderedItems((currentItems) => {
      const sourceIndex = currentItems.findIndex(
        (item) => item.inventoryLotId === sourceId,
      );
      const targetIndex = currentItems.findIndex(
        (item) => item.inventoryLotId === targetId,
      );
      if (sourceIndex < 0 || targetIndex < 0) return currentItems;

      const nextItems = [...currentItems];
      const [movedItem] = nextItems.splice(sourceIndex, 1);
      nextItems.splice(targetIndex, 0, movedItem);
      return nextItems;
    });
  }, []);

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLSpanElement>,
    id: number,
  ) => {
    if (event.button !== 0) return;
    event.preventDefault();
    setDraggedItemId(id);
    setDraggedPointerId(event.pointerId);
    setDropTargetId(id);
  };

  useEffect(() => {
    if (draggedItemId === null || draggedPointerId === null) return;

    const getTargetId = (event: PointerEvent) => {
      const target = document.elementFromPoint(event.clientX, event.clientY);
      const card = target?.closest<HTMLElement>("[data-inventory-lot-id]");
      const id = Number(card?.dataset.inventoryLotId);
      return Number.isInteger(id) && id > 0 ? id : null;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId === draggedPointerId) {
        setDropTargetId(getTargetId(event));
      }
    };

    const finishPointerDrag = (event: PointerEvent) => {
      if (event.pointerId !== draggedPointerId) return;

      const targetId = getTargetId(event);
      if (targetId !== null) reorderItems(draggedItemId, targetId);
      setDraggedItemId(null);
      setDraggedPointerId(null);
      setDropTargetId(null);
    };

    const cancelPointerDrag = (event: PointerEvent) => {
      if (event.pointerId !== draggedPointerId) return;
      setDraggedItemId(null);
      setDraggedPointerId(null);
      setDropTargetId(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishPointerDrag);
    window.addEventListener("pointercancel", cancelPointerDrag);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishPointerDrag);
      window.removeEventListener("pointercancel", cancelPointerDrag);
    };
  }, [draggedItemId, draggedPointerId, reorderItems]);

  const handleCardKeyDown = (
    event: KeyboardEvent<HTMLElement>,
    id: number,
  ) => {
    if (
      event.target !== event.currentTarget ||
      !event.altKey ||
      (event.key !== "ArrowLeft" && event.key !== "ArrowRight")
    ) {
      return;
    }

    event.preventDefault();
    const currentIndex = orderedItems.findIndex(
      (item) => item.inventoryLotId === id,
    );
    const targetItem = orderedItems[
      currentIndex + (event.key === "ArrowLeft" ? -1 : 1)
    ];
    if (targetItem) reorderItems(id, targetItem.inventoryLotId);
  };

  const formatValue = (val: number, decimals = 2) =>
    val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  const compositionRows = useMemo(() => {
    const previewItems = previewData?.items ?? [];
    const totalKg = previewItems.reduce((sum, i) => sum + i.powderKg, 0);

    const generalKg = previewItems
      .filter((i) => !i.fromSpecialCustomerLot)
      .reduce((sum, i) => sum + i.powderKg, 0);

    const specialMap = new Map<
      number,
      { key: string; label: string; totalKg: number; isSpecial: boolean }
    >();

    previewItems
      .filter((i) => i.fromSpecialCustomerLot)
      .forEach((item) => {
        const customerId = item.specialCustomerId ?? 0;
        const existing = specialMap.get(customerId);
        if (existing) {
          existing.totalKg += item.powderKg;
        } else {
          specialMap.set(customerId, {
            key: `special-${customerId}`,
            label:
              item.specialCustomerName ??
              t("warehouses.totalBatches.lotType.special"),
            totalKg: item.powderKg,
            isSpecial: true,
          });
        }
      });

    const rows = [
      {
        key: "general",
        label: t("warehouses.totalBatches.lotType.general"),
        totalKg: generalKg,
        isSpecial: false,
      },
      ...Array.from(specialMap.values()),
    ];

    return rows
      .filter((row) => row.totalKg > 0)
      .map((row) => ({
        ...row,
        percent: totalKg > 0 ? (row.totalKg / totalKg) * 100 : 0,
      }));
  }, [previewData, t]);

  const inventoryLotsById = useMemo(
    () => new Map(inventoryLots.map((lot) => [lot.id, lot])),
    [inventoryLots],
  );

  const previewItemsById = useMemo(
    () => {
      const itemsById = new Map<number, SalesLotPreviewItem>();
      previewData?.items.forEach((item) =>
        itemsById.set(item.inventoryLotId, item),
      );
      return itemsById;
    },
    [previewData],
  );

  const getFinalItems = () =>
    orderedItems.map((item) => ({
      ...item,
      powderKg: parseFloat(localWeights[item.inventoryLotId]) || 0,
    }));

  const footer = (
    <>
      <Button
        variant="secondary"
        className={styles.previewCancelButton}
        onClick={() => onOpenChange(false)}
        disabled={isCreating}
      >
        <X size={16} aria-hidden="true" />
        <span>{t("common.cancel")}</span>
      </Button>
      <Button
        variant="primary"
        className={styles.previewConfirmButton}
        onClick={() => onConfirm(getFinalItems(), sealNumber.trim())}
        disabled={
          isCreating ||
          isLoading ||
          !!error ||
          !sealNumber.trim() ||
          sealNumber.trim().length > 50 ||
          orderedItems.length === 0 ||
          getFinalItems().some((i) => i.powderKg <= 0)
        }
      >
        {isCreating ? (
          <LoaderCircle size={16} className={styles.spinIcon} aria-hidden="true" />
        ) : (
          <Check size={16} aria-hidden="true" />
        )}
        <span>
          {isCreating
            ? t("common.loading")
            : t("warehouses.totalBatches.createSale")}
        </span>
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={
        <span className={styles.previewModalTitle}>
          <span className={styles.previewModalTitleIcon} aria-hidden="true">
            <Calculator size={17} />
          </span>
          <span>{t("warehouses.totalBatches.previewTitle")}</span>
        </span>
      }
      footer={footer}
      width="min(920px, calc(100vw - 32px))"
      className={styles.previewModal}
    >
      <div className={styles.previewContainer}>
        <div className={styles.previewItemsHeader}>
          <div className={styles.previewSectionTitle}>
            <Package size={16} aria-hidden="true" />
            <h4>{t("warehouses.totalBatches.details.individualIntakes")}</h4>
          </div>
          <TextField
            className={styles.sealNumberField}
            label={`${t("warehouses.totalBatches.sealNumber")} *`}
            value={sealNumber}
            onChange={(e) => setSealNumber(e.target.value)}
            maxLength={50}
            required
            autoComplete="off"
          />
        </div>

        <div className={styles.editableItemsList}>
          {orderedItems.map((item) => {
            const inventoryLot = inventoryLotsById.get(item.inventoryLotId);
            const previewItem = previewItemsById.get(item.inventoryLotId);
            const selectedPowderKg =
              parseFloat(localWeights[item.inventoryLotId]) || 0;
            const selfCostAmd =
              inventoryLot && inventoryLot.remainingPowderKg > 0
                ? (inventoryLot.remainingCostAmd / inventoryLot.remainingPowderKg) *
                  selectedPowderKg
                : null;

            const formatMetalWeight = (weightPerKg: number | undefined) =>
              weightPerKg === undefined
                ? "-"
                : `${formatValue(weightPerKg * selectedPowderKg, 2)} g`;

            return (
              <article
                key={item.inventoryLotId}
                className={[
                  styles.editableItemCard,
                  draggedItemId === item.inventoryLotId
                    ? styles.draggingItem
                    : "",
                  dropTargetId === item.inventoryLotId
                    ? styles.dropTarget
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                tabIndex={0}
                aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight"
                data-inventory-lot-id={item.inventoryLotId}
                aria-label={t(
                  "warehouses.totalBatches.details.reorderHelp",
                  { id: item.inventoryLotId },
                )}
                onKeyDown={(event) =>
                  handleCardKeyDown(event, item.inventoryLotId)
                }
              >
                <div className={styles.itemCardHeader}>
                  <span className={styles.itemIdentity}>
                    <span
                      className={styles.dragHandle}
                      title={t(
                        "warehouses.totalBatches.details.reorderHelp",
                        { id: item.inventoryLotId },
                      )}
                      onPointerDown={(event) =>
                        handlePointerDown(event, item.inventoryLotId)
                      }
                    >
                      <GripVertical size={14} aria-hidden="true" />
                    </span>
                    <span className={styles.itemId}>
                      #{item.inventoryLotId}
                    </span>
                  </span>
                  <button
                    type="button"
                    className={styles.deleteIconButton}
                    onClick={() => handleRemove(item.inventoryLotId)}
                    aria-label={t("common.delete")}
                    title={t("common.delete")}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className={styles.itemCardDetails}>
                  <TextField
                    className={styles.itemWeightField}
                    containerClassName={styles.itemWeightInput}
                    type="text"
                    inputMode="decimal"
                    label={t("warehouses.totalBatches.columns.selectedKg")}
                    value={localWeights[item.inventoryLotId] || ""}
                    onChange={(e) =>
                      handleWeightChange(item.inventoryLotId, e.target.value)
                    }
                    suffix={t("warehouses.totalBatches.unitKg")}
                  />
                  <div className={styles.itemCost}>
                    <span>{t("warehouses.totalBatches.details.itemCost")}</span>
                    <strong>
                      {selfCostAmd !== null
                        ? `${formatValue(selfCostAmd, 0)} AMD`
                        : "-"}
                    </strong>
                  </div>
                </div>

                <div className={styles.itemMetals}>
                  {[
                    { label: "Pt", value: previewItem?.ptPerKg_g },
                    { label: "Pd", value: previewItem?.pdPerKg_g },
                    { label: "Rh", value: previewItem?.rhPerKg_g },
                  ].map((metal) => (
                    <div className={styles.itemMetal} key={metal.label}>
                      <span>{metal.label}</span>
                      <strong>{formatMetalWeight(metal.value)}</strong>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>

        <div className={styles.summaryDivider} />

        <div className={styles.stableSummaryWrapper}>
          {isLoading && (
            <div className={styles.loadingOverlay}>
              <div className={styles.spinner} />
            </div>
          )}

          {error && !isLoading && (
            <div className={styles.errorContainer}>
              <p className={styles.errorMessage}>{error}</p>
            </div>
          )}

          <div
            className={`${styles.summaryDropdownInner} ${
              isLoading || error ? styles.dimmed : ""
            }`}
          >
            {previewData && !error && (
              <>
                <div className={styles.summaryCardsGrid}>
                  <div className={styles.summaryCard}>
                    <div className={styles.summaryCardHeader}>
                      <Scale size={16} aria-hidden="true" />
                      <span className={styles.summaryCardLabel}>
                        {t("warehouses.totalBatches.preview.totalPowderKg")}
                      </span>
                    </div>
                    <strong className={styles.summaryCardValue}>
                      {previewData.totalPowderKg} {t("warehouses.totalBatches.unitKg")}
                    </strong>
                  </div>

                  <div className={styles.summaryCard}>
                    <div className={styles.summaryCardHeader}>
                      <CircleDollarSign size={16} aria-hidden="true" />
                      <span className={styles.summaryCardLabel}>
                        {t("warehouses.totalBatches.preview.totalCost")}
                      </span>
                    </div>
                    <strong className={styles.summaryCardValue}>
                      {formatValue(previewData.totalCost, 0)} AMD
                    </strong>
                  </div>
                   <div className={styles.summaryCard}>
                    <div className={styles.summaryCardHeader}>
                      <WalletCards size={16} aria-hidden="true" />
                      <span className={styles.summaryCardLabel}>
                        {t("warehouses.totalBatches.preview.totalCostAmd")}
                      </span>
                    </div>
                    <strong className={styles.summaryCardValue}>
                      {formatValue(previewData.totalCostAmd, 0)} AMD
                    </strong>
                  </div>

                  <div className={styles.summaryCard}>
                    <div className={styles.summaryCardHeader}>
                      <TrendingUp size={16} aria-hidden="true" />
                      <span className={styles.summaryCardLabel}>
                        {t("warehouses.totalBatches.preview.totalRevenueAmd")}
                      </span>
                    </div>
                    <strong
                      className={`${styles.summaryCardValue} ${styles.revenueValue}`}
                    >
                      {formatValue(previewData.totalRevenueAmd, 0)} AMD
                    </strong>
                  </div>
                </div>

                <div className={styles.summaryMetalsSection}>
                  <div className={styles.previewSectionTitle}>
                    <Layers3 size={16} aria-hidden="true" />
                    <h4>{t("warehouses.totalBatches.preview.composition")}</h4>
                  </div>
                  <div className={styles.summaryMetalsList}>
                    {compositionRows.map((row) => (
                      <div key={row.key} className={styles.summaryMetalRow}>
                        <div className={styles.summaryMetalInfo}>
                          <span
                            className={`${styles.badge} ${
                              row.isSpecial
                                ? styles.badgeWarning
                                : styles.badgeInfo
                            }`}
                          >
                            {row.label}
                          </span>
                        </div>
                        <strong className={styles.summaryMetalValue}>
                          {formatValue(row.totalKg, 3)} kg (
                          {formatValue(row.percent, 1)}%)
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.summaryMetalsSection}>
                  <div className={styles.previewSectionTitle}>
                    <Atom size={16} aria-hidden="true" />
                    <h4>{t("cashbox.powderBatches.summary.metalsTitle")}</h4>
                  </div>
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
