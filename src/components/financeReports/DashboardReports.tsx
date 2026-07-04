import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { createColumnHelper } from "@tanstack/react-table";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Boxes,
  CalendarClock,
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
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ui-kit
import { Button, DataTable, Select, TextField } from "@/ui-kit";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchShops } from "@/store/slices/shopsSlice";
import { fetchWarehouses } from "@/store/slices/warehousesSlice";

// services
import { getAdminDashboardReport } from "@/services/financeReports";

// utils
import { getApiErrorMessage, getCashRegisterId } from "@/utils";

// types
import type { DashboardReportResponse, DashboardStockAlertItem } from "@/types/financeReports";

// local
import styles from "./FinanceReports.module.css";

const alertColumnHelper = createColumnHelper<DashboardStockAlertItem>();

const CHART_COLORS = ["#22d3ee", "#f97316", "#38bdf8", "#f43f5e"];

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

export const DashboardReports = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { shops } = useAppSelector((state) => state.shops);
  const { warehouses } = useAppSelector((state) => state.warehouses);

  const [shopId, setShopId] = useState<number>(0);
  const [warehouseId, setWarehouseId] = useState<number>(0);
  const [lowStockThreshold, setLowStockThreshold] = useState<string>("5");

  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<DashboardReportResponse | null>(null);

  const cashRegisterId = useMemo(() => getCashRegisterId(0), []);

  useEffect(() => {
    dispatch(fetchShops({ cashRegisterId }));
    dispatch(fetchWarehouses());
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

    const parsedThreshold = Number(lowStockThreshold);
    const resolvedThreshold =
      Number.isFinite(parsedThreshold) && parsedThreshold > 0 ? parsedThreshold : 5;

    setIsLoading(true);
    try {
      const response = await getAdminDashboardReport({
        shopId,
        warehouseId: warehouseId > 0 ? warehouseId : undefined,
        lowStockThreshold: resolvedThreshold,
        cashRegisterId,
      });

      setReport(response);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, t("financeReports.error.failedToLoad")));
    } finally {
      setIsLoading(false);
    }
  }, [shopId, warehouseId, lowStockThreshold, cashRegisterId, t]);

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
      } catch (error: unknown) {
        toast.error(getApiErrorMessage(error, t("financeReports.error.failedToLoad")));
      } finally {
        setIsLoading(false);
      }
    };

    void loadInitialDashboard();
  }, [shopId, warehouseId, cashRegisterId, t]);

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

        <Select
          label={t("financeReports.dashboard.filters.warehouse")}
          value={warehouseId > 0 ? String(warehouseId) : "0"}
          onChange={(e) => setWarehouseId(Number(e.target.value) || 0)}
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
          onChange={(e) => setLowStockThreshold(e.target.value)}
          placeholder={t("financeReports.dashboard.filters.lowStockThresholdPlaceholder")}
          helperText={t("financeReports.dashboard.filters.lowStockThresholdHelp")}
          type="number"
          min="1"
        />
      </div>

      <div className={styles.actions}>
        <Button variant="primary" size="medium" onClick={handleLoad} disabled={isLoading}>
          {isLoading ? t("common.loading") : t("financeReports.actions.load")}
        </Button>
      </div>

      {!hasData ? (
        <div className={styles.info}>{t("financeReports.dashboard.empty")}</div>
      ) : (
        <>
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

          <section className={styles.kpiGrid}>
            <article className={`${styles.kpiCard} ${styles.kpiCardCyan}`}>
              <span>{t("financeReports.dashboard.kpi.todayRevenue")}</span>
              <strong>{money(Number(report?.todayRevenue || 0))}</strong>
            </article>
            <article className={`${styles.kpiCard} ${styles.kpiCardBlue}`}>
              <span>{t("financeReports.dashboard.kpi.todayProfit")}</span>
              <strong>{money(Number(report?.todayProfit || 0))}</strong>
            </article>
            <article className={`${styles.kpiCard} ${styles.kpiCardOrange}`}>
              <span>{t("financeReports.dashboard.kpi.monthlyRevenue")}</span>
              <strong>{money(Number(report?.monthlyRevenue || 0))}</strong>
            </article>
            <article className={`${styles.kpiCard} ${styles.kpiCardPink}`}>
              <span>{t("financeReports.dashboard.kpi.monthlyProfit")}</span>
              <strong>{money(Number(report?.monthlyProfit || 0))}</strong>
            </article>
            <article className={`${styles.kpiCard} ${styles.kpiCardCyan}`}>
              <span>{t("financeReports.dashboard.kpi.totalProductRevenue")}</span>
              <strong>{money(Number(report?.totalProductRevenue || 0))}</strong>
            </article>
            <article className={`${styles.kpiCard} ${styles.kpiCardBlue}`}>
              <span>{t("financeReports.dashboard.kpi.totalServiceRevenue")}</span>
              <strong>{money(Number(report?.totalServiceRevenue || 0))}</strong>
            </article>
            <article className={styles.kpiCard}>
              <span>{t("financeReports.dashboard.kpi.totalRevenue")}</span>
              <strong>{money(Number(report?.totalRevenue || 0))}</strong>
            </article>
            <article className={styles.kpiCard}>
              <span>{t("financeReports.dashboard.kpi.lowStockAlertsCount")}</span>
              <strong>{Number(report?.lowStockAlertsCount || 0).toLocaleString()}</strong>
            </article>
            <article className={styles.kpiCard}>
              <span>{t("financeReports.dashboard.kpi.outOfStockCount")}</span>
              <strong>{Number(report?.outOfStockCount || 0).toLocaleString()}</strong>
            </article>
            <article className={styles.kpiCard}>
              <span>{t("financeReports.dashboard.kpi.threshold")}</span>
              <strong>{Number(report?.lowStockThreshold || 0).toLocaleString()}</strong>
            </article>
          </section>

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
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                    <XAxis dataKey="period" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip formatter={(value) => money(Number(value || 0))} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#06b6d4" radius={[8, 8, 0, 0]} name={t("financeReports.dashboard.charts.revenue")} />
                    <Bar dataKey="profit" fill="#f97316" radius={[8, 8, 0, 0]} name={t("financeReports.dashboard.charts.profit")} />
                  </BarChart>
                </ResponsiveContainer>
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
        </>
      )}
    </div>
  );
};
