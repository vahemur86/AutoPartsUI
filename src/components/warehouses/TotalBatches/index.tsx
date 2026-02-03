import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { DataTable, Select } from "@/ui-kit";

// components
import { getInventoryLotColumns } from "./columns";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchInventoryLotsReport } from "@/store/slices/warehouses/reportsSlice";
import { fetchWarehouses } from "@/store/slices/warehousesSlice";

// utils
import { checkIsToday } from "@/utils/checkIsToday.utils";
import { getCashRegisterId } from "@/utils";

// styles
import styles from "./TotalBatches.module.css";

export const TotalBatches = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { inventoryLots, isLoading, error } = useAppSelector(
    (state) => state.warehousesReports,
  );
  const { warehouses } = useAppSelector((state) => state.warehouses);

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(
    null,
  );

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

  const columns = useMemo(() => getInventoryLotColumns(), []);

  const handleWarehouseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const warehouseId = Number(e.target.value);
    setSelectedWarehouseId(warehouseId || null);
  };

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
          <DataTable
            data={inventoryLots}
            columns={columns}
            pageSize={10}
            getRowClassName={(row) =>
              checkIsToday(row.createdAt) ? styles.todayRow : ""
            }
          />
        )}
      </div>
    </div>
  );
};
