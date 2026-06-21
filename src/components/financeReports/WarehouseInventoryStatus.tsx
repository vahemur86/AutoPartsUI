import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { Button, DataTable, Select, TextField } from "@/ui-kit";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchWarehouses } from "@/store/slices/warehousesSlice";

// services
import { getWarehouseInventoryStatus } from "@/services/financeReports";

// utils
import { getApiErrorMessage, getCashRegisterId } from "@/utils";

// local
import { getDynamicColumns, toDynamicRows } from "./tableUtils";
import styles from "./FinanceReports.module.css";

export const WarehouseInventoryStatus = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { warehouses } = useAppSelector((state) => state.warehouses);

  const [warehouseId, setWarehouseId] = useState<number>(0);
  const [productId, setProductId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<unknown>(null);

  const cashRegisterId = useMemo(() => getCashRegisterId(0), []);

  useEffect(() => {
    dispatch(fetchWarehouses());
  }, [dispatch]);

  useEffect(() => {
    if (warehouses.length > 0 && warehouseId === 0) {
      setWarehouseId(warehouses[0].id);
    }
  }, [warehouses, warehouseId]);

  const handleLoad = useCallback(async () => {
    if (!warehouseId) {
      toast.error(t("financeReports.validation.selectWarehouse"));
      return;
    }

    const parsedProductId = Number(productId);
    const hasProductFilter =
      productId.trim().length > 0 && !Number.isNaN(parsedProductId) && parsedProductId > 0;

    setIsLoading(true);
    try {
      const response = await getWarehouseInventoryStatus(warehouseId, {
        productId: hasProductFilter ? parsedProductId : undefined,
        cashRegisterId,
      });
      setData(response);
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(error, t("financeReports.error.failedToLoad")),
      );
    } finally {
      setIsLoading(false);
    }
  }, [warehouseId, productId, cashRegisterId, t]);

  const rows = useMemo(() => toDynamicRows(data), [data]);
  const columns = useMemo(
    () =>
      getDynamicColumns(rows, {
        preferredKeys: [
          "id",
          "warehouseId",
          "productId",
          "productCode",
          "quantity",
          "originalPrice",
          "salePrice",
          "costPrice",
          "profit",
          "profitPercentage",
          "createdAt",
          "updatedAt",
        ],
      }),
    [rows],
  );

  return (
    <div className={styles.panel}>
      <div className={styles.filters}>
        <Select
          label={t("financeReports.filters.warehouse")}
          value={warehouseId > 0 ? String(warehouseId) : ""}
          onChange={(e) => setWarehouseId(Number(e.target.value) || 0)}
        >
          <option value="">{t("financeReports.filters.selectWarehouse")}</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.code}
            </option>
          ))}
        </Select>

        <TextField
          label={t("financeReports.filters.productId")}
          placeholder={t("financeReports.filters.productIdOptional")}
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        />
      </div>

      <div className={styles.actions}>
        <Button variant="primary" size="medium" onClick={handleLoad} disabled={isLoading}>
          {isLoading ? t("common.loading") : t("financeReports.actions.load")}
        </Button>
      </div>

      <div className={styles.result}>
        {!data ? (
          <div className={styles.info}>{t("financeReports.empty")}</div>
        ) : (
          <DataTable data={rows} columns={columns} pageSize={10} />
        )}
      </div>
    </div>
  );
};
