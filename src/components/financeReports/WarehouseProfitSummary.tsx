import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Banknote,
  CircleDollarSign,
  Coins,
  Percent,
  PackageCheck,
  TriangleAlert,
} from "lucide-react";

import { DatePicker, Select } from "@/ui-kit";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchWarehouses } from "@/store/slices/warehousesSlice";
import { getWarehouseSummary } from "@/services/financeReports";
import type { WarehouseSummaryReportResponse } from "@/types/financeReports";
import { getCashRegisterId, getApiErrorMessage } from "@/utils";

import { FinanceFilterHeading } from "./FinanceFilterHeading";
import { FinanceReportLoadButton } from "./FinanceReportLoadButton";
import { FinanceReportState } from "./FinanceReportState";
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

const emptySummary: WarehouseSummaryReportResponse = {
  fromDate: null,
  toDate: null,
  totalRevenue: 0,
  totalCost: 0,
  grossProfit: 0,
  averageProfitMargin: 0,
  totalSales: 0,
};

export const WarehouseProfitSummary = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const { warehouses, error: warehousesError } = useAppSelector(
    (state) => state.warehouses,
  );

  const [warehouseId, setWarehouseId] = useState<number>(0);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<WarehouseSummaryReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cashRegisterId = useMemo(() => getCashRegisterId(0), []);
  const numberLocale =
    i18n.resolvedLanguage === "am"
      ? "hy-AM"
      : i18n.resolvedLanguage === "ru"
        ? "ru-RU"
        : "en-US";
  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(numberLocale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [numberLocale],
  );

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
      setError(t("financeReports.validation.selectWarehouse"));
      return;
    }

    setError(null);
    setData(null);
    setIsLoading(true);
    try {
      const response = await getWarehouseSummary(
        {
          warehouseId,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        },
        cashRegisterId,
      );
      setData({
        ...emptySummary,
        ...response,
        totalRevenue: Number(response?.totalRevenue) || 0,
        totalCost: Number(response?.totalCost) || 0,
        grossProfit: Number(response?.grossProfit) || 0,
        averageProfitMargin: Number(response?.averageProfitMargin) || 0,
        totalSales: Number(response?.totalSales) || 0,
      });
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(
          requestError,
          t("financeReports.warehouseProfit.failedToLoad"),
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [warehouseId, fromDate, toDate, cashRegisterId, t]);

  const visibleError = error || (warehousesError
    ? t("financeReports.warehouseProfit.failedToLoadWarehouses")
    : null);

  const metrics = data
    ? [
        {
          key: "totalRevenue",
          label: t("financeReports.warehouseProfit.totalRevenue"),
          value: `${numberFormatter.format(data.totalRevenue)} AMD`,
          icon: CircleDollarSign,
        },
        {
          key: "totalCost",
          label: t("financeReports.warehouseProfit.totalCost"),
          value: `${numberFormatter.format(data.totalCost)} AMD`,
          icon: Banknote,
        },
        {
          key: "grossProfit",
          label: t("financeReports.warehouseProfit.grossProfit"),
          value: `${numberFormatter.format(data.grossProfit)} AMD`,
          icon: Coins,
        },
        {
          key: "averageProfitMargin",
          label: t("financeReports.warehouseProfit.averageProfitMargin"),
          value: `${data.averageProfitMargin.toFixed(2)}%`,
          icon: Percent,
        },
        {
          key: "totalSales",
          label: t("financeReports.warehouseProfit.totalSales"),
          value: new Intl.NumberFormat(numberLocale).format(data.totalSales),
          icon: PackageCheck,
        },
      ]
    : [];

  return (
    <div className={styles.panel}>
      <div className={styles.filters}>
        <FinanceFilterHeading />
        <Select
          label={t("financeReports.filters.warehouse")}
          value={warehouseId > 0 ? String(warehouseId) : ""}
          onChange={(event) => setWarehouseId(Number(event.target.value) || 0)}
        >
          <option value="">{t("financeReports.filters.selectWarehouse")}</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.code}
            </option>
          ))}
        </Select>
        <DatePicker
          selected={parseDate(fromDate)}
          onChange={(date) => setFromDate(date ? formatDateForApi(date) : "")}
          placeholder={t("financeReports.filters.fromDate")}
          dateFormat="yyyy-MM-dd"
          maxDate={parseDate(toDate) || undefined}
        />
        <DatePicker
          selected={parseDate(toDate)}
          onChange={(date) => setToDate(date ? formatDateForApi(date) : "")}
          placeholder={t("financeReports.filters.toDate")}
          dateFormat="yyyy-MM-dd"
          minDate={parseDate(fromDate) || undefined}
        />
      </div>

      <div className={styles.actions}>
        <FinanceReportLoadButton
          loading={isLoading}
          label={t("financeReports.actions.load")}
          onClick={handleLoad}
        />
      </div>

      {visibleError ? (
        <div className={`${styles.reportState} ${styles.reportStateError}`} role="alert">
          <TriangleAlert size={20} aria-hidden="true" />
          <span>{visibleError}</span>
        </div>
      ) : isLoading ? (
        <FinanceReportState loading label={t("common.loading")} />
      ) : !data ? (
        <FinanceReportState
          loading={false}
          label={t("financeReports.warehouseProfit.selectFilters")}
        />
      ) : (
        <>
          <div className={styles.warehouseProfitGrid}>
            {metrics.map(({ key, label, value, icon: Icon }) => (
              <article className={styles.warehouseProfitCard} key={key}>
                <span className={styles.warehouseProfitLabel}>
                  <Icon size={15} aria-hidden="true" />
                  {label}
                </span>
                <strong>{value}</strong>
              </article>
            ))}
          </div>
          {data.totalSales === 0 && (
            <FinanceReportState
              loading={false}
              label={t("financeReports.warehouseProfit.noTransfers")}
            />
          )}
        </>
      )}
    </div>
  );
};