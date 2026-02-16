import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { DataTable, Select } from "@/ui-kit";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchWarehouses } from "@/store/slices/warehousesSlice";
import { fetchWarehouseProducts } from "@/store/slices/warehouses/productsSlice";

// utils
import { getCashRegisterId } from "@/utils";

// columns
import { getWarehouseProductColumns } from "./columns";

// styles
import styles from "./WarehouseProducts.module.css";

export const WarehouseProducts = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { warehouses, isLoading: isLoadingWarehouses } = useAppSelector(
    (state) => state.warehouses,
  );
  const {
    items: warehouseProducts,
    isLoading: isLoadingProducts,
  } = useAppSelector((state) => state.warehouseProducts);

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
        fetchWarehouseProducts({
          warehouseId: selectedWarehouseId,
          cashRegisterId,
        }),
      );
    }
  }, [dispatch, selectedWarehouseId, cashRegisterId]);

  const handleWarehouseChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const warehouseId = Number(e.target.value);
      setSelectedWarehouseId(warehouseId || null);
    },
    [],
  );

  const columns = useMemo(() => getWarehouseProductColumns(), []);

  const renderContent = () => {
    if (!selectedWarehouseId) {
      return (
        <div className={styles.emptyState}>
          {t("warehouses.form.selectWarehouse")}
        </div>
      );
    }

    if (isLoadingProducts) {
      return (
        <div className={styles.loading}>
          {t("warehouses.products.loading")}
        </div>
      );
    }

    if (warehouseProducts.length === 0) {
      return (
        <div className={styles.emptyState}>
          {t("warehouses.products.emptyState")}
        </div>
      );
    }

    return (
      <DataTable
        data={warehouseProducts}
        columns={columns}
        pageSize={10}
        freezeHeader
      />
    );
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {t("warehouses.navigation.products")}
        </h2>
        <div className={styles.warehouseSelector}>
          <Select
            label={t("warehouses.form.warehouse")}
            placeholder={t("warehouses.form.selectWarehouse")}
            value={selectedWarehouseId?.toString() || ""}
            onChange={handleWarehouseChange}
            disabled={isLoadingWarehouses}
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

      <div className={styles.tableSection}>{renderContent()}</div>
    </div>
  );
};


