import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { createColumnHelper } from "@tanstack/react-table";
import { ChevronDown, TrendingUp, Wallet, Users } from "lucide-react";

// ui-kit
import { Button, DataTable, DatePicker, Select } from "@/ui-kit";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchShops } from "@/store/slices/shopsSlice";

// services
import { getSalesRevenueFull } from "@/services/financeReports";

// utils
import { getApiErrorMessage, getCashRegisterId } from "@/utils";

// types
import type {
  SalesRevenueByEmployeeItem,
  SalesRevenueByPaymentMethodItem,
  SalesRevenueByPeriodItem,
  SalesRevenueFullResponse,
} from "@/types/financeReports";

// local
import styles from "./FinanceReports.module.css";

const periodColumnHelper = createColumnHelper<SalesRevenueByPeriodItem>();
const employeeColumnHelper = createColumnHelper<SalesRevenueByEmployeeItem>();
const paymentColumnHelper = createColumnHelper<SalesRevenueByPaymentMethodItem>();

const GROUP_BY_OPTIONS = [
  { value: 0, key: "day" },
  { value: 1, key: "week" },
  { value: 2, key: "month" },
  { value: 3, key: "year" },
] as const;

const toDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDate = (value: string): Date | null => {
  if (!value) return null;
  return new Date(`${value}T00:00:00`);
};

const toDateTimeRange = (value: string, isEnd: boolean): string | undefined => {
  if (!value) return undefined;

  const localDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(localDate.getTime())) {
    return undefined;
  }

  if (isEnd) {
    localDate.setHours(23, 59, 59, 999);
  }

  return localDate.toISOString();
};

const money = (value: number): string => {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDateTime = (value?: string): string => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

export const SalesReports = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { shops } = useAppSelector((state) => state.shops);

  const [shopId, setShopId] = useState<number>(0);
  const [groupBy, setGroupBy] = useState<number>(0);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<SalesRevenueFullResponse | null>(null);

  const [isSummaryOpen, setIsSummaryOpen] = useState(true);
  const [isByPeriodOpen, setIsByPeriodOpen] = useState(true);
  const [isByEmployeeOpen, setIsByEmployeeOpen] = useState(true);
  const [isByPaymentOpen, setIsByPaymentOpen] = useState(true);

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
    setIsLoading(true);
    try {
      const fromDateTime = toDateTimeRange(fromDate, false);
      const toDateTime = toDateTimeRange(toDate, true);

      const response = await getSalesRevenueFull({
        groupBy,
        shopId: shopId > 0 ? shopId : undefined,
        fromDate: fromDateTime,
        toDate: toDateTime,
        cashRegisterId,
      });

      setReport(response);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, t("financeReports.error.failedToLoad")));
    } finally {
      setIsLoading(false);
    }
  }, [groupBy, shopId, fromDate, toDate, cashRegisterId, t]);

  const periodColumns = useMemo(
    () => [
      periodColumnHelper.display({
        id: "periodLabel",
        header: t("financeReports.salesReports.columns.period"),
        cell: ({ row }) => row.original.periodLabel || "-",
      }),
      periodColumnHelper.display({
        id: "periodStart",
        header: t("financeReports.salesReports.columns.periodStart"),
        cell: ({ row }) => formatDateTime(row.original.periodStart),
      }),
      periodColumnHelper.display({
        id: "periodEnd",
        header: t("financeReports.salesReports.columns.periodEnd"),
        cell: ({ row }) => formatDateTime(row.original.periodEnd),
      }),
      periodColumnHelper.display({
        id: "productRevenue",
        header: t("financeReports.salesReports.columns.productSalesRevenue"),
        cell: ({ row }) => money(Number(row.original.productSalesRevenue || 0)),
      }),
      periodColumnHelper.display({
        id: "serviceRevenue",
        header: t("financeReports.salesReports.columns.serviceOrdersRevenue"),
        cell: ({ row }) => money(Number(row.original.serviceOrdersRevenue || 0)),
      }),
      periodColumnHelper.display({
        id: "totalRevenue",
        header: t("financeReports.salesReports.columns.totalRevenue"),
        cell: ({ row }) => money(Number(row.original.totalRevenue || 0)),
      }),
      periodColumnHelper.display({
        id: "productCount",
        header: t("financeReports.salesReports.columns.productSalesCount"),
        cell: ({ row }) => Number(row.original.productSalesCount || 0).toLocaleString(),
      }),
      periodColumnHelper.display({
        id: "serviceCount",
        header: t("financeReports.salesReports.columns.serviceOrdersCount"),
        cell: ({ row }) => Number(row.original.serviceOrdersCount || 0).toLocaleString(),
      }),
    ],
    [t],
  );

  const employeeColumns = useMemo(
    () => [
      employeeColumnHelper.display({
        id: "employeeId",
        header: t("financeReports.salesReports.columns.employeeId"),
        cell: ({ row }) => row.original.employeeId || "-",
      }),
      employeeColumnHelper.display({
        id: "employeeProductRevenue",
        header: t("financeReports.salesReports.columns.productSalesRevenue"),
        cell: ({ row }) => money(Number(row.original.productSalesRevenue || 0)),
      }),
      employeeColumnHelper.display({
        id: "employeeServiceRevenue",
        header: t("financeReports.salesReports.columns.serviceOrdersRevenue"),
        cell: ({ row }) => money(Number(row.original.serviceOrdersRevenue || 0)),
      }),
      employeeColumnHelper.display({
        id: "employeeTotalRevenue",
        header: t("financeReports.salesReports.columns.totalRevenue"),
        cell: ({ row }) => money(Number(row.original.totalRevenue || 0)),
      }),
      employeeColumnHelper.display({
        id: "transactionCount",
        header: t("financeReports.salesReports.columns.transactionCount"),
        cell: ({ row }) => Number(row.original.transactionCount || 0).toLocaleString(),
      }),
    ],
    [t],
  );

  const paymentColumns = useMemo(
    () => [
      paymentColumnHelper.display({
        id: "paymentMethod",
        header: t("financeReports.salesReports.columns.paymentMethod"),
        cell: ({ row }) => row.original.paymentMethod || "-",
      }),
      paymentColumnHelper.display({
        id: "paymentAmount",
        header: t("financeReports.salesReports.columns.amount"),
        cell: ({ row }) => money(Number(row.original.amount || 0)),
      }),
      paymentColumnHelper.display({
        id: "paymentPercentage",
        header: t("financeReports.salesReports.columns.percentage"),
        cell: ({ row }) => `${Number(row.original.percentage || 0).toFixed(2)}%`,
      }),
    ],
    [t],
  );

  const byPeriodChartData = useMemo(() => {
    const rows = report?.revenueByPeriod || [];
    return rows.slice(-10).map((item) => ({
      label: item.periodLabel || "-",
      value: Number(item.totalRevenue || 0),
    }));
  }, [report]);

  const maxPeriodRevenue = useMemo(() => {
    return Math.max(1, ...byPeriodChartData.map((item) => item.value));
  }, [byPeriodChartData]);

  const hasData = !!report;

  return (
    <div className={`${styles.panel} ${styles.shopReportsPanel}`}>
      <div className={styles.filters}>
        <Select
          label={t("financeReports.filters.shop")}
          value={shopId > 0 ? String(shopId) : ""}
          onChange={(e) => setShopId(Number(e.target.value) || 0)}
        >
          <option value="0">{t("financeReports.salesReports.filters.allShops")}</option>
          {shops.map((shop) => (
            <option key={shop.id} value={shop.id}>
              {shop.code}
            </option>
          ))}
        </Select>

        <Select
          label={t("financeReports.salesReports.filters.groupBy")}
          value={String(groupBy)}
          onChange={(e) => setGroupBy(Number(e.target.value) || 0)}
        >
          {GROUP_BY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {t(`financeReports.salesReports.groupBy.${option.key}`)}
            </option>
          ))}
        </Select>

        <DatePicker
          selected={parseDate(fromDate)}
          onChange={(date) => setFromDate(date ? toDateString(date) : "")}
          placeholder={t("financeReports.filters.fromDate")}
          dateFormat="yyyy-MM-dd"
        />

        <DatePicker
          selected={parseDate(toDate)}
          onChange={(date) => setToDate(date ? toDateString(date) : "")}
          placeholder={t("financeReports.filters.toDate")}
          dateFormat="yyyy-MM-dd"
        />
      </div>

      <div className={styles.actions}>
        <Button variant="primary" size="medium" onClick={handleLoad} disabled={isLoading}>
          {isLoading ? t("common.loading") : t("financeReports.actions.load")}
        </Button>
      </div>

      {!hasData ? (
        <div className={styles.info}>{t("financeReports.salesReports.empty")}</div>
      ) : (
        <div className={styles.shopSections}>
          <section className={styles.reportSection}>
            <button
              type="button"
              className={styles.sectionHeader}
              onClick={() => setIsSummaryOpen((prev) => !prev)}
            >
              <span>{t("financeReports.salesReports.sections.summary")}</span>
              <ChevronDown className={!isSummaryOpen ? styles.rotate180 : ""} size={16} />
            </button>
            {isSummaryOpen && report?.summary && (
              <div className={styles.sectionBody}>
                <div className={styles.kpiGrid}>
                  <article className={styles.kpiCard}>
                    <span>{t("financeReports.salesReports.kpi.totalRevenue")}</span>
                    <strong>{money(Number(report.summary.totalRevenue || 0))}</strong>
                  </article>
                  <article className={styles.kpiCard}>
                    <span>{t("financeReports.salesReports.kpi.totalProductSalesRevenue")}</span>
                    <strong>{money(Number(report.summary.totalProductSalesRevenue || 0))}</strong>
                  </article>
                  <article className={styles.kpiCard}>
                    <span>{t("financeReports.salesReports.kpi.totalServiceOrdersRevenue")}</span>
                    <strong>{money(Number(report.summary.totalServiceOrdersRevenue || 0))}</strong>
                  </article>
                  <article className={styles.kpiCard}>
                    <span>{t("financeReports.salesReports.kpi.totalCashRevenue")}</span>
                    <strong>{money(Number(report.summary.totalCashRevenue || 0))}</strong>
                  </article>
                  <article className={styles.kpiCard}>
                    <span>{t("financeReports.salesReports.kpi.totalNonCashRevenue")}</span>
                    <strong>{money(Number(report.summary.totalNonCashRevenue || 0))}</strong>
                  </article>
                  <article className={styles.kpiCard}>
                    <span>{t("financeReports.salesReports.kpi.productSalesCount")}</span>
                    <strong>{Number(report.summary.productSalesCount || 0).toLocaleString()}</strong>
                  </article>
                  <article className={styles.kpiCard}>
                    <span>{t("financeReports.salesReports.kpi.serviceOrdersCount")}</span>
                    <strong>{Number(report.summary.serviceOrdersCount || 0).toLocaleString()}</strong>
                  </article>
                </div>
              </div>
            )}
          </section>

          <section className={styles.reportSection}>
            <button
              type="button"
              className={styles.sectionHeader}
              onClick={() => setIsByPeriodOpen((prev) => !prev)}
            >
              <span>{t("financeReports.salesReports.sections.byPeriod")}</span>
              <ChevronDown className={!isByPeriodOpen ? styles.rotate180 : ""} size={16} />
            </button>
            {isByPeriodOpen && (
              <div className={styles.sectionBody}>
                <div className={styles.chartCard}>
                  <div className={styles.chartTitleRow}>
                    <TrendingUp size={16} />
                    <h4>{t("financeReports.salesReports.charts.byPeriod")}</h4>
                  </div>
                  {byPeriodChartData.length === 0 ? (
                    <p className={styles.chartEmpty}>{t("financeReports.salesReports.noRows")}</p>
                  ) : (
                    <div className={styles.barChart}>
                      {byPeriodChartData.map((item) => (
                        <div key={item.label} className={styles.barRow}>
                          <span className={styles.barLabel}>{item.label}</span>
                          <div className={styles.barTrack}>
                            <div
                              className={styles.barFillPrimary}
                              style={{ width: `${(item.value / maxPeriodRevenue) * 100}%` }}
                            />
                          </div>
                          <span className={styles.barValue}>{money(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <DataTable
                  data={report?.revenueByPeriod || []}
                  columns={periodColumns}
                  pageSize={15}
                />
              </div>
            )}
          </section>

          <section className={styles.reportSection}>
            <button
              type="button"
              className={styles.sectionHeader}
              onClick={() => setIsByEmployeeOpen((prev) => !prev)}
            >
              <span>{t("financeReports.salesReports.sections.byEmployee")}</span>
              <ChevronDown className={!isByEmployeeOpen ? styles.rotate180 : ""} size={16} />
            </button>
            {isByEmployeeOpen && (
              <div className={styles.sectionBody}>
                <div className={styles.chartCard}>
                  <div className={styles.chartTitleRow}>
                    <Users size={16} />
                    <h4>{t("financeReports.salesReports.charts.byEmployee")}</h4>
                  </div>
                </div>
                <DataTable
                  data={report?.revenueByEmployee || []}
                  columns={employeeColumns}
                  pageSize={15}
                />
              </div>
            )}
          </section>

          <section className={styles.reportSection}>
            <button
              type="button"
              className={styles.sectionHeader}
              onClick={() => setIsByPaymentOpen((prev) => !prev)}
            >
              <span>{t("financeReports.salesReports.sections.byPaymentMethod")}</span>
              <ChevronDown className={!isByPaymentOpen ? styles.rotate180 : ""} size={16} />
            </button>
            {isByPaymentOpen && (
              <div className={styles.sectionBody}>
                <div className={styles.chartCard}>
                  <div className={styles.chartTitleRow}>
                    <Wallet size={16} />
                    <h4>{t("financeReports.salesReports.charts.byPaymentMethod")}</h4>
                  </div>
                </div>
                <DataTable
                  data={report?.revenueByPaymentMethod || []}
                  columns={paymentColumns}
                  pageSize={15}
                />
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
