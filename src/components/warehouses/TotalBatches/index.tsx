import { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useMinimumLoadingDuration } from "@/hooks/useMinimumLoadingDuration";
import { Boxes, Calculator, Filter, Scale, Sparkles } from "lucide-react";

// ui-kit
import { DataTable, Select, Button } from "@/ui-kit";

// components
import { getInventoryLotColumns } from "./columns";
import { InventoryLotDetails } from "./InventoryLotDetails";
import { SalesLotPreviewModal } from "./actions/SalesLotPreviewModal";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchInventoryLotsReport } from "@/store/slices/warehouses/reportsSlice";
import { fetchWarehouses } from "@/store/slices/warehousesSlice";
import {
  createNewSalesLot,
  clearPreviewData,
} from "@/store/slices/warehouses/salesLotsSlice";

// utils
import { getCashRegisterId, getApiErrorMessage, checkIsToday } from "@/utils";

// styles
import styles from "./TotalBatches.module.css";

export const TotalBatches = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { inventoryLots, isLoading, error } = useAppSelector(
    (state) => state.warehousesReports,
  );
  const showTableSkeleton = useMinimumLoadingDuration(isLoading);
  const { warehouses } = useAppSelector((state) => state.warehouses);
  const { isLoading: isCreatingSalesLot } = useAppSelector(
    (state) => state.salesLots,
  );

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(
    null,
  );
  const [selectedKg, setSelectedKg] = useState<Record<number, number>>({});
  const [selectedItems, setSelectedItems] = useState<
    Array<{ inventoryLotId: number; powderKg: number }>
  >([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [showGeneralLots, setShowGeneralLots] = useState(true);
  const [showSpecialLots, setShowSpecialLots] = useState(true);
  const [selectedSpecialCustomerId, setSelectedSpecialCustomerId] = useState<
    number | null
  >(null);

  const cashRegisterId = useMemo(() => getCashRegisterId(), []);

  const specialCustomers = useMemo(() => {
    const map = new Map<number, string>();
    inventoryLots.forEach((lot) => {
      if (lot.isSpecialCustomerLot && lot.specialCustomerId) {
        map.set(
          lot.specialCustomerId,
          lot.specialCustomerName ?? `#${lot.specialCustomerId}`,
        );
      }
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [inventoryLots]);

  const filteredLots = useMemo(
    () =>
      inventoryLots.filter((lot) => {
        const isSpecial = !!lot.isSpecialCustomerLot;
        if (isSpecial && !showSpecialLots) return false;
        if (!isSpecial && !showGeneralLots) return false;
        if (
          selectedSpecialCustomerId !== null &&
          lot.specialCustomerId !== selectedSpecialCustomerId
        ) {
          return false;
        }
        return true;
      }),
    [
      inventoryLots,
      showGeneralLots,
      showSpecialLots,
      selectedSpecialCustomerId,
    ],
  );

  const totalKgCount = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + item.powderKg, 0);
  }, [selectedItems]);

  const selectedMap = useMemo(() => {
    return new Set(selectedItems.map((i) => i.inventoryLotId));
  }, [selectedItems]);

  useEffect(() => {
    dispatch(fetchWarehouses());
  }, [dispatch]);

  useEffect(() => {
    if (warehouses.length > 0 && selectedWarehouseId === null) {
      // Prefer warehouse with id === 1 (as requested). If not present, fall back to the first one.
      const preferred = warehouses.find((w) => w.id === 1);
      setSelectedWarehouseId(preferred ? preferred.id : warehouses[0].id);
    }
  }, [warehouses, selectedWarehouseId]);

  useEffect(() => {
    if (selectedWarehouseId) {
      dispatch(
        fetchInventoryLotsReport({
          id: selectedWarehouseId,
          cashRegisterId,
        }),
      );
    }
  }, [selectedWarehouseId, cashRegisterId, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleKgChange = useCallback(
    (inventoryLotId: number, powderKg: number) => {
      setSelectedKg((prev) => ({
        ...prev,
        [inventoryLotId]: powderKg,
      }));

      if (powderKg <= 0) {
        setSelectedItems((prev) =>
          prev.filter((item) => item.inventoryLotId !== inventoryLotId),
        );
      }
    },
    [],
  );

  const handleAdd = useCallback(
    (inventoryLotId: number, powderKg: number) => {
      if (powderKg > 0) {
        setSelectedItems((prev) => {
          const existingIndex = prev.findIndex(
            (item) => item.inventoryLotId === inventoryLotId,
          );
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = { inventoryLotId, powderKg };
            return updated;
          }
          return [...prev, { inventoryLotId, powderKg }];
        });
        setSelectedKg((prev) => {
          const next = { ...prev };
          delete next[inventoryLotId];
          return next;
        });
        toast.success(
          t("warehouses.totalBatches.success.itemAdded", {
            id: inventoryLotId,
            kg: powderKg,
          }),
        );
      }
    },
    [t],
  );

  const handleRemoveItem = useCallback((inventoryLotId: number) => {
    setSelectedItems((prev) =>
      prev.filter((item) => item.inventoryLotId !== inventoryLotId),
    );
    setSelectedKg((prev) => {
      const next = { ...prev };
      delete next[inventoryLotId];
      return next;
    });
  }, []);

  const handleConfirmSale = async (
    updatedItems: Array<{ inventoryLotId: number; powderKg: number }>,
  ) => {
    if (!selectedWarehouseId) return;

    try {
      await dispatch(
        createNewSalesLot({
          warehouseId: selectedWarehouseId,
          items: updatedItems,
          cashRegisterId,
        }),
      ).unwrap();

      toast.success(t("warehouses.totalBatches.success.saleCreated"));

      setIsPreviewModalOpen(false);
      setSelectedItems([]);
      setSelectedKg({});
      dispatch(clearPreviewData());

      dispatch(
        fetchInventoryLotsReport({ id: selectedWarehouseId, cashRegisterId }),
      );
    } catch (error) {
      const errorMessage = getApiErrorMessage(
        error,
        t("warehouses.totalBatches.error.failedToCreateSale"),
      );
      toast.error(errorMessage);
    }
  };


  const columns = useMemo(() => getInventoryLotColumns(), []);

  return (
    <div className={styles.totalBatchesWrapper}>
      <div className={styles.actionBar}>
        <div className={styles.totalCounter}>
          <span className={styles.counterIcon} aria-hidden="true">
            <Scale size={19} />
          </span>
          <span className={styles.counterCopy}>
            <span className={styles.counterLabel}>
              {t("warehouses.totalBatches.selectedWeight")}
            </span>
            <strong>
              {totalKgCount.toLocaleString()} <span>{t("warehouses.totalBatches.unitKg")}</span>
            </strong>
          </span>
        </div>

        <Button
          variant="primary"
          size="medium"
          className={styles.previewButton}
          onClick={() => setIsPreviewModalOpen(true)}
          disabled={
            isCreatingSalesLot ||
            selectedItems.length === 0 ||
            !selectedWarehouseId
          }
        >
          {!isCreatingSalesLot && <Calculator size={17} aria-hidden="true" />}
          <span>
            {isCreatingSalesLot
              ? t("warehouses.totalBatches.creating")
              : t("warehouses.totalBatches.previewAndCreateSale")}
          </span>
        </Button>
      </div>

      <div className={styles.lotFilters}>
        <div className={styles.filterHeading}>
          <Filter size={15} aria-hidden="true" />
          <span>{t("common.filters")}</span>
        </div>

        <label
          className={`${styles.lotFilterItem} ${showGeneralLots ? `${styles.lotFilterItemActive} ${styles.lotFilterGeneralActive}` : ""}`}
          title={t("warehouses.totalBatches.filters.showGeneralLots")}
        >
          <input
            type="checkbox"
            checked={showGeneralLots}
            onChange={(e) => setShowGeneralLots(e.target.checked)}
          />
          <Boxes size={16} aria-hidden="true" />
          <span>{t("warehouses.totalBatches.lotType.generalShort")}</span>
        </label>

        <label
          className={`${styles.lotFilterItem} ${showSpecialLots ? `${styles.lotFilterItemActive} ${styles.lotFilterSpecialActive}` : ""}`}
          title={t("warehouses.totalBatches.filters.showSpecialLots")}
        >
          <input
            type="checkbox"
            checked={showSpecialLots}
            onChange={(e) => setShowSpecialLots(e.target.checked)}
          />
          <Sparkles size={16} aria-hidden="true" />
          <span>{t("warehouses.totalBatches.lotType.specialShort")}</span>
        </label>

        <div className={styles.lotFilterSelect}>
          <Select
            aria-label={t("warehouses.totalBatches.filters.allSpecialCustomers")}
            value={
              selectedSpecialCustomerId === null
                ? ""
                : String(selectedSpecialCustomerId)
            }
            onChange={(e) =>
              setSelectedSpecialCustomerId(
                e.target.value ? Number(e.target.value) : null,
              )
            }
          >
            <option value="">
              {t("warehouses.totalBatches.filters.allSpecialCustomers")}
            </option>
            {specialCustomers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className={styles.tableSection}>
        {showTableSkeleton ? (
          <div className={styles.tableSkeleton} aria-busy="true" aria-live="polite">
            <div className={styles.tableSkeletonHeader}>
              <div className={`${styles.skeletonLine} ${styles.skeletonLineWide}`} />
              <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
            </div>
            <div className={styles.tableSkeletonRows}>
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className={styles.tableSkeletonRow}>
                  <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
                  <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
                  <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                </div>
              ))}
            </div>
          </div>
        ) : inventoryLots.length === 0 ? (
          <div className={styles.emptyState}>
            {t("warehouses.totalBatches.emptyState")}
          </div>
        ) : (
          <DataTable
            data={filteredLots}
            columns={columns}
            pageSize={10}
            meta={{
              selectedKg,
              selectedMap,
              onKgChange: handleKgChange,
              onAdd: handleAdd,
            }}
            getRowClassName={(row) =>
              row.isSpecialCustomerLot
                ? styles.specialRow
                : checkIsToday(row.createdAt)
                  ? styles.todayRow
                  : ""
            }
            renderSubComponent={({ row }) => (
              <InventoryLotDetails lot={row.original} />
            )}
            frozenConfig={{
              right: ["actions"],
            }}
          />
        )}
      </div>

      {isPreviewModalOpen && selectedWarehouseId && (
        <SalesLotPreviewModal
          open={isPreviewModalOpen}
          onOpenChange={setIsPreviewModalOpen}
          warehouseId={selectedWarehouseId}
          items={selectedItems}
          cashRegisterId={cashRegisterId}
          onConfirm={handleConfirmSale}
          onRemoveItem={handleRemoveItem}
          isCreating={isCreatingSalesLot}
        />
      )}
    </div>
  );
};
