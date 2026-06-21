import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { Button, DataTable, DatePicker, Select } from "@/ui-kit";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchShops } from "@/store/slices/shopsSlice";

// services
import { getProfitDetailed } from "@/services/financeReports";

// utils
import { getApiErrorMessage, getCashRegisterId } from "@/utils";

// local
import { getDynamicColumns, toDynamicRows } from "./tableUtils";
import styles from "./FinanceReports.module.css";

const formatDateForApi = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDate = (value: string): Date | null => {
  if (!value) return null;
  return new Date(`${value}T00:00:00`);
};

export const ProfitDetailed = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { shops } = useAppSelector((state) => state.shops);

  const [shopId, setShopId] = useState<number>(0);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
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

    setIsLoading(true);
    try {
      const response = await getProfitDetailed(
        {
          shopId,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        },
        cashRegisterId,
      );
      setData(response);
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(error, t("financeReports.error.failedToLoad")),
      );
    } finally {
      setIsLoading(false);
    }
  }, [shopId, fromDate, toDate, cashRegisterId, t]);

  const rows = useMemo(() => toDynamicRows(data), [data]);
  const columns = useMemo(
    () =>
      getDynamicColumns(rows, {
        preferredKeys: [
          "id",
          "saleId",
          "shopId",
          "productId",
          "productCode",
          "quantity",
          "salePrice",
          "costPrice",
          "totalSales",
          "totalCost",
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

        <DatePicker
          selected={parseDate(fromDate)}
          onChange={(date) => setFromDate(date ? formatDateForApi(date) : "")}
          placeholder={t("financeReports.filters.fromDate")}
          dateFormat="yyyy-MM-dd"
        />

        <DatePicker
          selected={parseDate(toDate)}
          onChange={(date) => setToDate(date ? formatDateForApi(date) : "")}
          placeholder={t("financeReports.filters.toDate")}
          dateFormat="yyyy-MM-dd"
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
