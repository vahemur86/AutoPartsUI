import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { createColumnHelper } from "@tanstack/react-table";
import { useMinimumLoadingDuration } from "@/hooks/useMinimumLoadingDuration";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Boxes,
  CalendarClock,
  ChevronDown,
  CircleDollarSign,
  PackageX,
  ShoppingCart,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ui-kit
import { DatePicker, Select, TextField } from "@/ui-kit";
import { FinanceDataTable as DataTable } from "./FinanceDataTable";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchShops } from "@/store/slices/shopsSlice";
import { fetchWarehouses } from "@/store/slices/warehousesSlice";

// services
import { getAdminDashboardReport } from "@/services/financeReports";
import {
  getDailyProfitReport,
  getProfitReport,
} from "@/services/warehouses/reports";

// utils
import { getApiErrorMessage, getCashRegisterId } from "@/utils";

// types
import type { DashboardReportResponse, DashboardStockAlertItem } from "@/types/financeReports";
import type { DailyProfitReportItem } from "@/types/warehouses/reports";

// local
import styles from "./FinanceReports.module.css";
import { FinanceFilterHeading } from "./FinanceFilterHeading";
import { FinanceReportLoadButton } from "./FinanceReportLoadButton";

const alertColumnHelper = createColumnHelper<DashboardStockAlertItem>();

const CHART_COLORS = ["#D2BF8A", "#A8C3A2", "#B98170", "#7F9B88"];

const money = (value: number): string => {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatMargin = (profit: number, revenue: number): string =>
  revenue === 0 ? "—" : `${((profit / revenue) * 100).toFixed(1)}%`;

const formatDateTime = (value?: string): string => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

const DashboardSkeleton = () => (
  <div className={`${styles.panel} ${styles.dashboardSkeleton}`} aria-busy="true" aria-live="polite" aria-label="Dashboard is loading">
    <div className={styles.dashboardPrpLoader} aria-hidden="true">
        <div className={styles.dashboardPrpCore}>
          <span className={styles.dashboardPrpLetters}>PRP</span>
          <span className={styles.dashboardServiceText}>Service</span>
        </div>
    </div>
    <div className={`${styles.dashboardHero} ${styles.dashboardSkeletonHero}`}>
      <div className={styles.dashboardSkeletonHeroContent}>
        <div className={`${styles.skeletonText} ${styles.skeletonTextXL} ${styles.skeleton}`} />
        <div className={`${styles.skeletonText} ${styles.skeletonTextMd} ${styles.skeleton}`} />
        <div className={styles.dashboardSkeletonBadges}>
          <div className={`${styles.skeletonChip} ${styles.skeleton}`} />
          <div className={`${styles.skeletonChip} ${styles.skeleton}`} />
        </div>
      </div>
      <div className={styles.dashboardSkeletonHeroActions}>
        <div className={`${styles.skeletonCircle} ${styles.skeleton}`} />
        <div className={`${styles.skeletonCircle} ${styles.skeleton}`} />
      </div>
    </div>

    <div className={styles.kpiGrid}>
      {Array.from({ length: 4 }).map((_, index) => (
        <article key={index} className={`${styles.kpiCard} ${styles.dashboardSkeletonCard} ${styles.skeleton}`}>
          <div className={`${styles.skeletonText} ${styles.skeletonTextSm}`} />
          <div className={`${styles.skeletonText} ${styles.skeletonTextLg}`} />
        </article>
      ))}
    </div>

    <section className={styles.dashboardChartsGrid}>
      {Array.from({ length: 3 }).map((_, index) => (
        <article key={index} className={`${styles.dashboardChartCard} ${styles.dashboardSkeletonChartCard} ${styles.skeleton}`}>
          <div className={`${styles.skeletonText} ${styles.skeletonTextMd} ${styles.dashboardSkeletonChartTitle}`} />
          <div className={`${styles.skeletonChart} ${styles.skeleton}`} />
        </article>
      ))}
    </section>

    <section className={styles.inventoryTablesGrid}>
      <article className={`${styles.chartCard} ${styles.dashboardSkeletonTableCard} ${styles.skeleton}`}>
        <div className={`${styles.skeletonText} ${styles.skeletonTextSm}`} />
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={styles.dashboardSkeletonTableRow}>
            <div className={`${styles.skeletonText} ${styles.skeletonTextXs}`} />
            <div className={`${styles.skeletonText} ${styles.skeletonTextXs}`} />
          </div>
        ))}
      </article>
      <article className={`${styles.chartCard} ${styles.dashboardSkeletonTableCard} ${styles.skeleton}`}>
        <div className={`${styles.skeletonText} ${styles.skeletonTextSm}`} />
        <div className={styles.dashboardSkeletonTableRows}>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className={styles.dashboardSkeletonTableRow}>
              <div className={`${styles.skeletonText} ${styles.skeletonTextXs}`} />
              <div className={`${styles.skeletonText} ${styles.skeletonTextXs}`} />
              <div className={`${styles.skeletonText} ${styles.skeletonTextXs}`} />
            </div>
          ))}
        </div>
      </article>
    </section>
  </div>
);

export const DashboardReports = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { shops } = useAppSelector((state) => state.shops);
  const { warehouses } = useAppSelector((state) => state.warehouses);

  const [shopId, setShopId] = useState<number>(0);
  const [shopError, setShopError] = useState(false);
  const [warehouseId, setWarehouseId] = useState<number>(0);
  const [lowStockThreshold, setLowStockThreshold] = useState<string>("5");
  const [thresholdError, setThresholdError] = useState(false);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const showLoading = useMinimumLoadingDuration(isLoading, 650);
  const [report, setReport] = useState<DashboardReportResponse | null>(null);
  const [isLoadingWarehouseTrend, setIsLoadingWarehouseTrend] = useState(false);
  const [warehouseProfitTrend, setWarehouseProfitTrend] = useState<
    DailyProfitReportItem[]
  >([]);

  const cashRegisterId = useMemo(() => getCashRegisterId(0), []);

  useEffect(() => {
    dispatch(fetchShops({ cashRegisterId }));
    dispatch(fetchWarehouses());
  }, [dispatch, cashRegisterId]);

  useEffect(() => {
    if (shops.length > 0 && shopId === 0) {
      setShopId(shops[0].id);
      setShopError(false);
    }
  }, [shops, shopId]);

  const toSafeISO = useCallback((value: Date | null) => {
    if (!value) return undefined;
    const safeDate = new Date(value);
    safeDate.setHours(12, 0, 0, 0);
    return safeDate.toISOString();
  }, []);

  const loadWarehouseProfitData = useCallback(
    async (selectedWarehouseId: number, fromUtc?: string, toUtc?: string) => {
      const [, daily] = await Promise.all([
        getProfitReport({
          warehouseId: selectedWarehouseId > 0 ? selectedWarehouseId : undefined,
          fromUtc,
          toUtc,
          cashRegisterId,
        }),
        getDailyProfitReport({
          warehouseId: selectedWarehouseId > 0 ? selectedWarehouseId : undefined,
          fromUtc,
          toUtc,
          cashRegisterId,
        }),
      ]);

      setWarehouseProfitTrend(daily || []);
    },
    [cashRegisterId],
  );

  const handleLoadWarehouseTrend = useCallback(async () => {
    setIsLoadingWarehouseTrend(true);
    try {
      await loadWarehouseProfitData(
        warehouseId,
        toSafeISO(fromDate),
        toSafeISO(toDate),
      );
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, t("financeReports.error.failedToLoad")));
    } finally {
      setIsLoadingWarehouseTrend(false);
    }
  }, [warehouseId, fromDate, toDate, loadWarehouseProfitData, t, toSafeISO]);

  const handleLoad = useCallback(async () => {
    if (!shopId) {
      setShopError(true);
      return;
    }

    const hasThreshold = lowStockThreshold.trim().length > 0;
    const parsedThreshold = Number(lowStockThreshold);
    if (hasThreshold && (!Number.isFinite(parsedThreshold) || parsedThreshold < 1)) {
      setThresholdError(true);
      return;
    }

    setShopError(false);
    setThresholdError(false);
    const resolvedThreshold = hasThreshold ? parsedThreshold : 5;
    const fromUtc = toSafeISO(fromDate);
    const toUtc = toSafeISO(toDate);

    setIsLoading(true);
    try {
      const response = await getAdminDashboardReport({
        shopId,
        warehouseId: warehouseId > 0 ? warehouseId : undefined,
        lowStockThreshold: resolvedThreshold,
        cashRegisterId,
      });

      setReport(response);

      try {
        await loadWarehouseProfitData(warehouseId, fromUtc, toUtc);
      } catch (profitError: unknown) {
        toast.error(
          getApiErrorMessage(profitError, t("financeReports.error.failedToLoad")),
        );
      }
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, t("financeReports.error.failedToLoad")));
    } finally {
      setIsLoading(false);
    }
  }, [shopId, warehouseId, lowStockThreshold, fromDate, toDate, cashRegisterId, loadWarehouseProfitData, t, toSafeISO]);

  useEffect(() => {
    if (!shopId) return;

    const loadInitialDashboard = async () => {
      setIsLoading(true);
      try {
        const response = await getAdminDashboardReport({
          shopId,
          warehouseId: warehouseId > 0 ? warehouseId : undefined,
          lowStockThreshold: 5,
          cashRegisterId,
        });

        setReport(response);

        try {
          await loadWarehouseProfitData(warehouseId);
        } catch (profitError: unknown) {
          toast.error(
            getApiErrorMessage(profitError, t("financeReports.error.failedToLoad")),
          );
        }
      } catch (error: unknown) {
        toast.error(getApiErrorMessage(error, t("financeReports.error.failedToLoad")));
      } finally {
        setIsLoading(false);
      }
    };

    void loadInitialDashboard();
  }, [shopId, warehouseId, cashRegisterId, t, loadWarehouseProfitData]);

  const revenueMixData = useMemo(() => {
    if (!report) return [];

    return [
      {
        name: t("financeReports.dashboard.charts.products"),
        value: Number(report.totalProductRevenue || 0),
      },
      {
        name: t("financeReports.dashboard.charts.services"),
        value: Number(report.totalServiceRevenue || 0),
      },
    ];
  }, [report, t]);

  const ordersData = useMemo(() => {
    if (!report) return [];

    return [
      {
        name: t("financeReports.dashboard.charts.pendingOrders"),
        value: Number(report.pendingOrders || 0),
      },
      {
        name: t("financeReports.dashboard.charts.completedOrders"),
        value: Number(report.completedOrders || 0),
      },
    ];
  }, [report, t]);

  const performanceData = useMemo(() => {
    if (!report) return [];

    return [
      {
        period: t("financeReports.dashboard.charts.today"),
        revenue: Number(report.todayRevenue || 0),
        profit: Number(report.todayProfit || 0),
      },
      {
        period: t("financeReports.dashboard.charts.month"),
        revenue: Number(report.monthlyRevenue || 0),
        profit: Number(report.monthlyProfit || 0),
      },
    ];
  }, [report, t]);

  const warehouseProfitChartData = useMemo(() => {
    if (!warehouseProfitTrend.length) return [];

    return warehouseProfitTrend.map((item) => ({
      name: item.date
        ? new Date(item.date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })
        : t("financeReports.dashboard.charts.period"),
      revenue: Number(item.revenueAmd || 0),
      cost: Number(item.costAmd || 0),
      profit: Number(item.profitAmd || 0),
    }));
  }, [t, warehouseProfitTrend]);

  const alertColumns = useMemo(
    () => [
      alertColumnHelper.display({
        id: "productCode",
        header: t("financeReports.dashboard.columns.productCode"),
        cell: ({ row }) => row.original.productCode || "-",
      }),
      alertColumnHelper.display({
        id: "productSku",
        header: t("financeReports.dashboard.columns.productSku"),
        cell: ({ row }) => row.original.productSku || "-",
      }),
      alertColumnHelper.display({
        id: "quantity",
        header: t("financeReports.dashboard.columns.quantity"),
        cell: ({ row }) => Number(row.original.quantity || 0).toLocaleString(),
      }),
      alertColumnHelper.display({
        id: "salePrice",
        header: t("financeReports.dashboard.columns.salePrice"),
        cell: ({ row }) => money(Number(row.original.salePrice || 0)),
      }),
      alertColumnHelper.display({
        id: "stockValue",
        header: t("financeReports.dashboard.columns.stockValue"),
        cell: ({ row }) => money(Number(row.original.quantity || 0) * Number(row.original.salePrice || 0)),
      }),
    ],
    [t],
  );

  const hasData = !!report;

  return (
    <div className={`${styles.panel} ${styles.dashboardPanel}`}>
      <div className={`${styles.filters} ${styles.dashboardFilters}`}>
        <FinanceFilterHeading />
        <Select
          label={t("financeReports.filters.shop")}
          value={shopId > 0 ? String(shopId) : ""}
          onChange={(e) => {
            const nextShopId = Number(e.target.value) || 0;
            setShopId(nextShopId);
            if (nextShopId) setShopError(false);
          }}
          error={shopError}
          helperText={shopError ? t("financeReports.validation.selectShop") : undefined}
          searchable
          searchPlaceholder={t("common.search")}
        >
          <option value="">{t("financeReports.filters.selectShop")}</option>
          {shops.map((shop) => (
            <option key={shop.id} value={shop.id}>
              {shop.code}
            </option>
          ))}
        </Select>

        <Select
          label={t("financeReports.dashboard.filters.warehouse")}
          value={warehouseId > 0 ? String(warehouseId) : "0"}
          onChange={(e) => setWarehouseId(Number(e.target.value) || 0)}
          searchable
          searchPlaceholder={t("common.search")}
        >
          <option value="0">{t("financeReports.dashboard.filters.allWarehouses")}</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.code}
            </option>
          ))}
        </Select>

        <TextField
          label={t("financeReports.dashboard.filters.lowStockThreshold")}
          value={lowStockThreshold}
          onChange={(e) => {
            setLowStockThreshold(e.target.value);
            setThresholdError(false);
          }}
          placeholder={t("financeReports.dashboard.filters.lowStockThresholdPlaceholder")}
          title={t("financeReports.dashboard.filters.lowStockThresholdHelp")}
          error={thresholdError}
          helperText={
            thresholdError
              ? t("financeReports.validation.lowStockThresholdMinimum")
              : undefined
          }
          type="number"
          min="1"
        />

        <div className={styles.dashboardAction}>
          <FinanceReportLoadButton
            loading={showLoading}
            label={t("financeReports.actions.load")}
            onClick={handleLoad}
            className={styles.dashboardApplyButton}
          />
        </div>
      </div>

      {showLoading ? (
        <DashboardSkeleton />
      ) : !hasData ? (
        <div className={styles.info}>{t("financeReports.dashboard.empty")}</div>
      ) : (
        <div className={styles.fadeIn}>
          <section className={styles.dashboardHero}>
            <div className={styles.dashboardHeroTitle}>
              <h3>{t("financeReports.dashboard.sections.overview")}</h3>
              <p>
                <CalendarClock size={14} />
                {t("financeReports.dashboard.generatedAt")}: {formatDateTime(report?.generatedAt)}
              </p>
            </div>
            <div className={styles.dashboardHeroBadges}>
              <span className={styles.dashboardBadge}>
                <ShoppingCart size={14} />
                {t("financeReports.dashboard.kpi.todaySalesCount")}: {Number(report?.todaySalesCount || 0).toLocaleString()}
              </span>
              <span className={styles.dashboardBadge}>
                <Activity size={14} />
                {t("financeReports.dashboard.kpi.monthlySalesCount")}: {Number(report?.monthlySalesCount || 0).toLocaleString()}
              </span>
            </div>
          </section>

          <section className={`${styles.kpiGrid} ${styles.dashboardPrimaryGrid}`}>
            <article className={`${styles.kpiCard} ${styles.dashboardPrimaryCard} ${styles.dashboardRevenueCard}`}>
              <div className={styles.dashboardPrimaryLabel}>
                <span>{t("financeReports.dashboard.kpi.todayRevenue")}</span>
                <CircleDollarSign size={18} />
              </div>
              <strong>{money(Number(report?.todayRevenue || 0))}</strong>
            </article>
            <article className={`${styles.kpiCard} ${styles.dashboardPrimaryCard} ${styles.dashboardProfitCard}`}>
              <div className={styles.dashboardPrimaryLabel}>
                <span>{t("financeReports.dashboard.kpi.todayNetProfit")}</span>
                <Activity size={18} />
              </div>
              <strong className={Number(report?.todayNetProfit || 0) < 0 ? styles.negativeValue : styles.positiveValue}>
                {money(Number(report?.todayNetProfit || 0))}
              </strong>
              <small className={styles.dashboardKpiMeta}>
                {t("financeReports.dashboard.kpi.netMargin")}: {formatMargin(Number(report?.todayNetProfit || 0), Number(report?.todayRevenue || 0))}
              </small>
            </article>
            <article className={`${styles.kpiCard} ${styles.dashboardPrimaryCard} ${styles.dashboardRevenueCard}`}>
              <div className={styles.dashboardPrimaryLabel}>
                <span>{t("financeReports.dashboard.kpi.monthlyRevenue")}</span>
                <CircleDollarSign size={18} />
              </div>
              <strong>{money(Number(report?.monthlyRevenue || 0))}</strong>
            </article>
            <article className={`${styles.kpiCard} ${styles.dashboardPrimaryCard} ${styles.dashboardProfitCard}`}>
              <div className={styles.dashboardPrimaryLabel}>
                <span>{t("financeReports.dashboard.kpi.monthlyNetProfit")}</span>
                <Activity size={18} />
              </div>
              <strong className={Number(report?.monthlyNetProfit || 0) < 0 ? styles.negativeValue : styles.positiveValue}>
                {money(Number(report?.monthlyNetProfit || 0))}
              </strong>
              <small className={styles.dashboardKpiMeta}>
                {t("financeReports.dashboard.kpi.netMargin")}: {formatMargin(Number(report?.monthlyNetProfit || 0), Number(report?.monthlyRevenue || 0))}
              </small>
            </article>
          </section>

          <details className={styles.dashboardSecondary}>
            <summary>
              <span>{t("financeReports.dashboard.sections.moreMetrics")}</span>
              <ChevronDown size={16} aria-hidden="true" />
            </summary>
            <div className={styles.dashboardSecondaryGrid}>
              {[
                { label: t("financeReports.dashboard.kpi.todayProfit"), value: money(Number(report?.todayProfit || 0)) },
                { label: t("financeReports.dashboard.kpi.monthlyProfit"), value: money(Number(report?.monthlyProfit || 0)) },
                { label: t("financeReports.dashboard.kpi.totalRevenue"), value: money(Number(report?.totalRevenue || 0)) },
                { label: t("financeReports.dashboard.kpi.totalProductRevenue"), value: money(Number(report?.totalProductRevenue || 0)) },
                { label: t("financeReports.dashboard.kpi.totalServiceRevenue"), value: money(Number(report?.totalServiceRevenue || 0)) },
                { label: t("financeReports.dashboard.kpi.monthlyOtherExpenses"), value: money(Number(report?.monthlyOtherExpenses || 0)) },
                { label: t("financeReports.dashboard.kpi.lowStockAlertsCount"), value: Number(report?.lowStockAlertsCount || 0).toLocaleString() },
                { label: t("financeReports.dashboard.kpi.outOfStockCount"), value: Number(report?.outOfStockCount || 0).toLocaleString() },
                { label: t("financeReports.dashboard.kpi.threshold"), value: Number(report?.lowStockThreshold || 0).toLocaleString() },
              ].map((metric) => (
                <div key={metric.label} className={styles.dashboardMetricItem}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>
          </details>

          <section className={styles.dashboardChartsGrid}>
            <article className={styles.dashboardChartCard}>
              <div className={styles.chartTitleRow}>
                <CircleDollarSign size={16} />
                <h4>{t("financeReports.dashboard.charts.revenueMix")}</h4>
              </div>
              <div className={styles.dashboardChartWrap}>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={revenueMixData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={4}
                    >
                      {revenueMixData.map((entry, index) => (
                        <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => money(Number(value || 0))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className={styles.dashboardChartCard}>
              <div className={styles.chartTitleRow}>
                <BarChart3 size={16} />
                <h4>{t("financeReports.dashboard.charts.performance")}</h4>
              </div>
              <div className={styles.dashboardChartWrap}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(168,195,162,0.15)" />
                    <XAxis dataKey="period" stroke="#A8B3A7" tick={{ fill: "#A8B3A7", fontSize: 11 }} />
                    <YAxis stroke="#A8B3A7" tick={{ fill: "#A8B3A7", fontSize: 11 }} />
                    <Tooltip
                      formatter={(value) => money(Number(value || 0))}
                      contentStyle={{ backgroundColor: "#151C17", borderColor: "rgba(196,169,106,0.32)", borderRadius: 8, color: "#EEE9DB" }}
                      labelStyle={{ color: "#D2BF8A" }}
                    />
                    <Legend wrapperStyle={{ color: "#C6CEC3", fontSize: 11 }} />
                    <Bar dataKey="revenue" fill="#D2BF8A" radius={[8, 8, 0, 0]} name={t("financeReports.dashboard.charts.revenue")} />
                    <Bar dataKey="profit" fill="#A8C3A2" radius={[8, 8, 0, 0]} name={t("financeReports.dashboard.charts.profit")} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className={`${styles.dashboardChartCard} ${styles.dashboardChartWide}`}>
              <div className={styles.chartTitleRow}>
                <BarChart3 size={16} />
                <h4>{t("financeReports.dashboard.charts.warehouseProfit")}</h4>
              </div>
              <div className={styles.dashboardTrendControls}>
                <div>
                  <p className={styles.dashboardTrendPeriod}>
                    {t("financeReports.dashboard.filters.warehouseTrendPeriod")}
                  </p>
                  <div className={styles.dashboardDateRange}>
                    <div className={styles.dashboardDateField}>
                      <span className={styles.dashboardDateLabel}>{t("financeReports.filters.fromDate")}</span>
                      <DatePicker
                        selected={fromDate}
                        onChange={(date: Date | null) => setFromDate(date)}
                        dateFormat="MM/dd/yyyy"
                        placeholderText="MM/DD/YYYY"
                        isClearable
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        maxDate={toDate || undefined}
                      />
                    </div>
                    <div className={styles.dashboardDateField}>
                      <span className={styles.dashboardDateLabel}>{t("financeReports.filters.toDate")}</span>
                      <DatePicker
                        selected={toDate}
                        onChange={(date: Date | null) => setToDate(date)}
                        dateFormat="MM/dd/yyyy"
                        placeholderText="MM/DD/YYYY"
                        isClearable
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        minDate={fromDate || undefined}
                      />
                    </div>
                  </div>
                </div>
                <div className={styles.dashboardAction}>
                  <FinanceReportLoadButton
                    loading={isLoadingWarehouseTrend}
                    label={t("financeReports.actions.load")}
                    onClick={() => void handleLoadWarehouseTrend()}
                    className={styles.dashboardApplyButton}
                  />
                </div>
              </div>
              <div className={styles.dashboardChartWrap}>
                {warehouseProfitChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={warehouseProfitChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(168,195,162,0.15)" />
                      <XAxis dataKey="name" stroke="#A8B3A7" minTickGap={12} tick={{ fill: "#A8B3A7", fontSize: 11 }} />
                      <YAxis stroke="#A8B3A7" tick={{ fill: "#A8B3A7", fontSize: 11 }} />
                      <Tooltip
                        formatter={(value) => money(Number(value || 0))}
                        contentStyle={{ backgroundColor: "#151C17", borderColor: "rgba(196,169,106,0.32)", borderRadius: 8, color: "#EEE9DB" }}
                        labelStyle={{ color: "#D2BF8A" }}
                      />
                      <Legend wrapperStyle={{ color: "#C6CEC3", fontSize: 11 }} />
                      <Line type="monotone" dataKey="revenue" stroke="#D2BF8A" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name={t("financeReports.dashboard.charts.revenue")} />
                      <Line type="monotone" dataKey="cost" stroke="#B98170" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name={t("financeReports.dashboard.charts.cost")} />
                      <Line type="monotone" dataKey="profit" stroke="#A8C3A2" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name={t("financeReports.dashboard.charts.profit")} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className={styles.chartEmpty}>{t("financeReports.dashboard.charts.noWarehouseProfit")}</p>
                )}
              </div>
            </article>

            <article className={styles.dashboardChartCard}>
              <div className={styles.chartTitleRow}>
                <Boxes size={16} />
                <h4>{t("financeReports.dashboard.charts.orderStatus")}</h4>
              </div>
              <div className={styles.dashboardChartWrap}>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={ordersData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={88}
                      paddingAngle={5}
                    >
                      {ordersData.map((entry, index) => (
                        <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => Number(value || 0).toLocaleString()} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </article>
          </section>

          <section className={styles.inventoryTablesGrid}>
            <article className={styles.chartCard}>
              <h4 className={styles.subTitle}>
                <CircleDollarSign size={16} /> {t("financeReports.dashboard.sections.otherExpenses")}
              </h4>
              {!report?.otherExpenses?.length ? (
                <div className={styles.info}>{t("financeReports.dashboard.otherExpenses.empty")}</div>
              ) : (
                <div className={styles.dashboardList}>
                  {report.otherExpenses.map((expense, index) => (
                    <div key={`${expense.serviceName}-${expense.paymentDay}-${index}`} className={styles.dashboardListItem}>
                      <div>
                        <strong>{expense.serviceName || "-"}</strong>
                        <div className={styles.dashboardListMeta}>
                          {t("financeReports.dashboard.otherExpenses.paymentDay")}: {expense.paymentDay}
                        </div>
                      </div>
                      <strong>{money(Number(expense.amount || 0))}</strong>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className={styles.chartCard}>
              <h4 className={styles.subTitle}>
                <AlertTriangle size={16} /> {t("financeReports.dashboard.sections.lowStock")}
              </h4>
              <DataTable data={report?.lowStockAlerts || []} columns={alertColumns} pageSize={10} />
            </article>

            <article className={styles.chartCard}>
              <h4 className={styles.subTitle}>
                <PackageX size={16} /> {t("financeReports.dashboard.sections.outOfStock")}
              </h4>
              <DataTable data={report?.outOfStockAlerts || []} columns={alertColumns} pageSize={10} />
            </article>
          </section>
        </div>
      )}
    </div>
  );
};
