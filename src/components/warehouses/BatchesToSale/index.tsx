import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { DataTable, Select } from "@/ui-kit";

// components
import { getSalesLotColumns } from "./columns";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchSalesLots } from "@/store/slices/warehouses/salesLotsSlice";
import { fetchWarehouses } from "@/store/slices/warehousesSlice";

// styles
import styles from "./BatchesToSale.module.css";

const PAGE_SIZE = 10;

export const BatchesToSale = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { lots, isLoading, error, totalItems } = useAppSelector(
    (state) => state.salesLots,
  );
  const { warehouses } = useAppSelector((state) => state.warehouses);

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(
    null,
  );
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // const cashRegisterId = useMemo(() => {
  //   try {
  //     const rawData = localStorage.getItem("user_data");
  //     const userData = rawData ? JSON.parse(rawData) : {};
  //     return userData.cashRegisterId
  //       ? Number(userData.cashRegisterId)
  //       : undefined;
  //   } catch {
  //     return undefined;
  //   }
  // }, []);
  const cashRegisterId = 1;

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
      console.log("Cash Register ID:", cashRegisterId); // Debug log

      dispatch(
        fetchSalesLots({
          warehouseId: selectedWarehouseId,
          // status: 1, // Status 1 typically means "available for sale"
          // page: currentPageIndex + 1,
          // pageSize: PAGE_SIZE,
          cashRegisterId: cashRegisterId || 1,
        }),
      );
    }
  }, [selectedWarehouseId, cashRegisterId, currentPageIndex, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const columns = useMemo(() => getSalesLotColumns(), []);

  const handleWarehouseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const warehouseId = Number(e.target.value);
    setSelectedWarehouseId(warehouseId || null);
    setCurrentPageIndex(0);
  };

  const handlePaginationChange = (pageIndex: number) => {
    setCurrentPageIndex(pageIndex);
  };

  const pageCount = Math.ceil(totalItems / PAGE_SIZE);

  return (
    <div className={styles.batchesToSaleWrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {t("warehouses.navigation.batchesToSale")}
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
            {t("warehouses.batchesToSale.loading")}
          </div>
        ) : lots.length === 0 ? (
          <div className={styles.emptyState}>
            {t("warehouses.batchesToSale.emptyState")}
          </div>
        ) : (
          <DataTable
            data={lots}
            columns={columns}
            pageSize={PAGE_SIZE}
            manualPagination={true}
            pageCount={pageCount}
            pageIndex={currentPageIndex}
            onPaginationChange={handlePaginationChange}
          />
        )}
      </div>
    </div>
  );
};
