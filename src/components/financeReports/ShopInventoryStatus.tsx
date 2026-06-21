import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { Button, DataTable, Select, TextField } from "@/ui-kit";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchShops } from "@/store/slices/shopsSlice";

// services
import { getShopInventoryStatus } from "@/services/financeReports";

// utils
import { getApiErrorMessage, getCashRegisterId } from "@/utils";

// local
import { getDynamicColumns, toDynamicRows } from "./tableUtils";
import styles from "./FinanceReports.module.css";

export const ShopInventoryStatus = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { shops } = useAppSelector((state) => state.shops);

  const [shopId, setShopId] = useState<number>(0);
  const [productId, setProductId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<unknown>(null);

  const cashRegisterId = useMemo(() => getCashRegisterId(0), []);

  useEffect(() => {
    dispatch(fetchShops({ cashRegisterId }));
  }, [dispatch, cashRegisterId]);

  useEffect(() => {
    if (shops.length > 0 && shopId === 0) {
      setShopId(shops[0].id);
    }
  }, [shops, shopId]);

  const handleLoad = useCallback(async () => {
    if (!shopId) {
      toast.error(t("financeReports.validation.selectShop"));
      return;
    }

    const parsedProductId = Number(productId);
    const hasProductFilter =
      productId.trim().length > 0 && !Number.isNaN(parsedProductId) && parsedProductId > 0;

    setIsLoading(true);
    try {
      const response = await getShopInventoryStatus(shopId, {
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
  }, [shopId, productId, cashRegisterId, t]);

  const rows = useMemo(() => toDynamicRows(data), [data]);
  const columns = useMemo(
    () =>
      getDynamicColumns(rows, {
        preferredKeys: [
          "id",
          "shopId",
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
          label={t("financeReports.filters.shop")}
          value={shopId > 0 ? String(shopId) : ""}
          onChange={(e) => setShopId(Number(e.target.value) || 0)}
        >
          <option value="">{t("financeReports.filters.selectShop")}</option>
          {shops.map((shop) => (
            <option key={shop.id} value={shop.id}>
              {shop.code}
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
