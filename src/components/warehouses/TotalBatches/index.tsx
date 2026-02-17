import { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { DataTable, Select, Button } from "@/ui-kit";

// components
import { getInventoryLotColumns } from "./columns";
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
import { checkIsToday } from "@/utils/checkIsToday.utils";
import { getCashRegisterId, getApiErrorMessage } from "@/utils";

// styles
import styles from "./TotalBatches.module.css";

export const TotalBatches = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { inventoryLots, isLoading, error } = useAppSelector(
    (state) => state.warehousesReports,
  );
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

  const cashRegisterId = useMemo(() => getCashRegisterId(), []);

  useEffect(() => {
    dispatch(fetchWarehouses());
  }, [dispatch]);

  useEffect(() => {
    if (warehouses.length > 0 && selectedWarehouseId === null) {
      setSelectedWarehouseId(warehouses[0].id);
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

  const handleWarehouseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const warehouseId = Number(e.target.value);
    setSelectedWarehouseId(warehouseId || null);
    setSelectedItems([]);
    setSelectedKg({});
    setIsPreviewModalOpen(false);
  };

  const columns = useMemo(() => getInventoryLotColumns(), []);

  return (
    <div className={styles.totalBatchesWrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {t("warehouses.navigation.totalBatches")}
        </h2>
        <div className={styles.warehouseSelector}>
          <Select
            label={t("warehouses.form.warehouse")}
            placeholder={t("warehouses.form.selectWarehouse")}
            value={selectedWarehouseId ? selectedWarehouseId.toString() : ""}
            onChange={handleWarehouseChange}
            disabled={isLoading}
          >
            <option value="">{t("warehouses.form.selectWarehouse")}</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.code}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className={styles.tableSection}>
        {!selectedWarehouseId ? (
          <div className={styles.emptyState}>
            {t("warehouses.form.selectWarehouse")}
          </div>
        ) : isLoading ? (
          <div className={styles.loading}>
            {t("warehouses.totalBatches.loading")}
          </div>
        ) : inventoryLots.length === 0 ? (
          <div className={styles.emptyState}>
            {t("warehouses.totalBatches.emptyState")}
          </div>
        ) : (
          <>
            <DataTable
              data={inventoryLots}
              columns={columns}
              pageSize={10}
              meta={{
                selectedKg,
                onKgChange: handleKgChange,
                onAdd: handleAdd,
              }}
              getRowClassName={(row) =>
                checkIsToday(row.createdAt) ? styles.todayRow : ""
              }
              frozenConfig={{
                right: ["actions"],
              }}
            />
            <div className={styles.createSaleSection}>
              <Button
                variant="primary"
                size="medium"
                onClick={() => setIsPreviewModalOpen(true)}
                disabled={
                  isCreatingSalesLot ||
                  selectedItems.length === 0 ||
                  !selectedWarehouseId
                }
              >
                {isCreatingSalesLot
                  ? t("warehouses.totalBatches.creating")
                  : t("warehouses.totalBatches.previewAndCreateSale")}
              </Button>
            </div>
          </>
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
          isCreating={isCreatingSalesLot}
        />
      )}
    </div>
  );
};
