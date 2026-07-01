import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { ChevronDown, ChartNoAxesColumnIncreasing, Wrench } from "lucide-react";
import { createColumnHelper } from "@tanstack/react-table";

// ui-kit
import { Button, DataTable, DatePicker, Select, TextField } from "@/ui-kit";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchShops } from "@/store/slices/shopsSlice";

// services
import {
  getServiceEstimateAnalytics,
  getServiceEstimateReport,
} from "@/services/financeReports";
import { getServiceCategories } from "@/services/settings/workshopPricing";

// utils
import { getApiErrorMessage, getCashRegisterId } from "@/utils";

// types
import type { ServiceCategoryItem } from "@/types/settings";
import type {
  ServiceEstimateReportResponse,
  ServiceReportOrderItem,
  ServiceReportProductLine,
  ServiceReportServiceLine,
} from "@/types/financeReports";

// local
import styles from "./FinanceReports.module.css";

type ServiceAggregateRow = {
  id: string;
  name: string;
  revenue: number;
  profit: number;
  count: number;
  averagePrice: number;
};

const serviceColumnHelper = createColumnHelper<ServiceAggregateRow>();
const orderColumnHelper = createColumnHelper<ServiceReportOrderItem>();

const money = (value: number): string => {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

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

const toServiceLines = (item: unknown): ServiceReportServiceLine[] => {
  if (!Array.isArray(item)) {
    return [];
  }

  return item
    .map((raw) => {
      if (!raw || typeof raw !== "object") {
        return null;
      }
      const line = raw as Record<string, unknown>;
      return {
        id: Number(line.id || 0),
        serviceId: Number(line.serviceId || 0),
        serviceName: String(line.serviceName || ""),
        serviceCategoryId: Number(line.serviceCategoryId || 0),
        serviceCategoryName: String(line.serviceCategoryName || ""),
        employeeId: Number(line.employeeId || 0),
        internalCost: Number(line.internalCost || 0),
        customerPrice: Number(line.customerPrice || 0),
        profit: Number(line.profit || 0),
      };
    })
    .filter((line): line is ServiceReportServiceLine => !!line);
};

const normalizeOrders = (payload: unknown): ServiceReportOrderItem[] => {
  const pickArray = (value: unknown): unknown[] => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const record = value as Record<string, unknown>;
      const candidates = [record.items, record.results, record.data, record.orders];
      for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
          return candidate;
        }
      }
    }
    return [];
  };

  const rows = pickArray(payload);

  return rows
    .map((row) => {
      if (!row || typeof row !== "object") {
        return null;
      }

      const record = row as Record<string, unknown>;
      const id = Number(record.id || 0);
      if (!id) return null;

      return {
        id,
        serviceEstimateId: Number(record.serviceEstimateId || 0),
        estimateNumber: String(record.estimateNumber || ""),
        vehicleBrandName: String(record.vehicleBrandName || ""),
        vehicleModelName: String(record.vehicleModelName || ""),
        vehicleYear: Number(record.vehicleYear || 0),
        vinCode: String(record.vinCode || ""),
        mileage: Number(record.mileage || 0),
        shopId: Number(record.shopId || 0),
        cashierUserId: Number(record.cashierUserId || 0),
        productsTotal: Number(record.productsTotal || 0),
        servicesTotal: Number(record.servicesTotal || 0),
        grandTotal: Number(record.grandTotal || 0),
        cashPaid: Number(record.cashPaid || 0),
        nonCashPaid: Number(record.nonCashPaid || 0),
        change: Number(record.change || 0),
        nonCashReference: String(record.nonCashReference || ""),
        status: String(record.status || ""),
        createdAt: String(record.createdAt || ""),
        services: toServiceLines(record.services),
        products: parseProductLines(record.products),
      };
    })
    .filter((item): item is ServiceReportOrderItem => !!item);
};

const parseAnalyticsRows = (
  analytics: unknown,
  possibleKeys: string[],
): ServiceAggregateRow[] => {
  if (!analytics || typeof analytics !== "object") {
    return [];
  }

  const record = analytics as Record<string, unknown>;
  const source = possibleKeys
    .map((key) => record[key])
    .find((value) => Array.isArray(value));

  if (!Array.isArray(source)) {
    return [];
  }

  return source
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const row = item as Record<string, unknown>;
      const revenue = Number(row.revenue || row.totalRevenue || row.amount || 0);
      const profit = Number(row.profit || row.totalProfit || 0);
      const count = Number(
        row.count || row.totalCount || row.quantity || row.serviceCount || 0,
      );
      const name = String(
        row.name ||
          row.serviceName ||
          row.categoryName ||
          row.serviceCategoryName ||
          row.label ||
          `#${index + 1}`,
      );

      return {
        id: String(row.id || row.serviceId || row.serviceCategoryId || name),
        name,
        revenue,
        profit,
        count,
        averagePrice: count > 0 ? revenue / count : 0,
      };
    })
    .filter((row): row is ServiceAggregateRow => !!row)
    .sort((a, b) => b.revenue - a.revenue);
};

const parseProductLines = (value: unknown): ServiceReportProductLine[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((raw) => {
      if (!raw || typeof raw !== "object") {
        return null;
      }

      const row = raw as Record<string, unknown>;
      return {
        id: Number(row.id || 0),
        productId: Number(row.productId || 0),
        productCode: String(row.productCode || ""),
        quantity: Number(row.quantity || 0),
        unitPrice: Number(row.unitPrice || 0),
        lineTotal: Number(row.lineTotal || 0),
      };
    })
    .filter((line): line is ServiceReportProductLine => !!line);
};

const getServiceCost = (order: ServiceReportOrderItem): number => {
  return (order.services || []).reduce(
    (sum, line) => sum + Number(line.internalCost || 0),
    0,
  );
};

const getServiceProfit = (order: ServiceReportOrderItem): number => {
  return (order.services || []).reduce(
    (sum, line) => sum + Number(line.profit || 0),
    0,
  );
};

const toReportResponse = (payload: unknown): ServiceEstimateReportResponse => {
  const record = payload && typeof payload === "object"
    ? (payload as Record<string, unknown>)
    : {};

  const normalizedOrders = normalizeOrders(record.orders ?? record);

  return {
    orders: normalizedOrders,
    totalProductsRevenue: Number(record.totalProductsRevenue || 0),
    totalServicesRevenue: Number(record.totalServicesRevenue || 0),
    totalGrandRevenue: Number(record.totalGrandRevenue || 0),
    totalServicesCost: Number(record.totalServicesCost || 0),
    totalServicesProfit: Number(record.totalServicesProfit || 0),
    totalCount: Number(record.totalCount || normalizedOrders.length || 0),
    pageNumber: Number(record.pageNumber || 1),
    pageSize: Number(record.pageSize || 50),
    totalPages: Number(record.totalPages || 1),
  };
};

export const ServiceReports = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { shops } = useAppSelector((state) => state.shops);

  const [shopId, setShopId] = useState<number>(0);
  const [serviceCategoryId, setServiceCategoryId] = useState<number>(0);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [topN, setTopN] = useState<string>("10");

  const [isLoading, setIsLoading] = useState(false);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategoryItem[]>([]);
  const [orders, setOrders] = useState<ServiceReportOrderItem[]>([]);
  const [reportSummary, setReportSummary] = useState<ServiceEstimateReportResponse | null>(null);
  const [analytics, setAnalytics] = useState<unknown>(null);

  const [isSummaryOpen, setIsSummaryOpen] = useState(true);
  const [isGroupedOpen, setIsGroupedOpen] = useState(true);
  const [isTopServicesOpen, setIsTopServicesOpen] = useState(true);
  const [isOrdersOpen, setIsOrdersOpen] = useState(true);

  const cashRegisterId = useMemo(() => getCashRegisterId(0), []);

  useEffect(() => {
    dispatch(fetchShops({ cashRegisterId }));
  }, [dispatch, cashRegisterId]);

  useEffect(() => {
    if (shops.length > 0 && shopId === 0) {
      setShopId(shops[0].id);
    }
  }, [shops, shopId]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const rows = await getServiceCategories();
        setServiceCategories(rows.filter((item) => item.isActive !== false));
      } catch {
        setServiceCategories([]);
      }
    };

    void loadCategories();
  }, []);

  const handleLoad = useCallback(async () => {
    if (!shopId) {
      toast.error(t("financeReports.validation.selectShop"));
      return;
    }

    const parsedTopN = Number(topN);
    const resolvedTopN = Number.isFinite(parsedTopN) && parsedTopN > 0 ? parsedTopN : 10;

    setIsLoading(true);
    try {
      const fromDateTime = toDateTimeRange(fromDate, false);
      const toDateTime = toDateTimeRange(toDate, true);

      const [reportResRaw, analyticsRes] = await Promise.all([
        getServiceEstimateReport({
          shopId,
          serviceCategoryId: serviceCategoryId > 0 ? serviceCategoryId : undefined,
          fromDate: fromDateTime,
          toDate: toDateTime,
          pageNumber: 1,
          pageSize: 500,
          cashRegisterId,
        }),
        getServiceEstimateAnalytics({
          shopId,
          fromDate: fromDateTime,
          toDate: toDateTime,
          topN: resolvedTopN,
          cashRegisterId,
        }),
      ]);

      const normalizedReport = toReportResponse(reportResRaw);
      setOrders(normalizedReport.orders);
      setReportSummary(normalizedReport);
      setAnalytics(analyticsRes);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, t("financeReports.error.failedToLoad")));
    } finally {
      setIsLoading(false);
    }
  }, [shopId, serviceCategoryId, fromDate, toDate, topN, cashRegisterId, t]);

  const filteredLines = useMemo(() => {
    const lines = orders.flatMap((order) => order.services || []);
    if (serviceCategoryId <= 0) {
      return lines;
    }

    return lines.filter((line) => Number(line.serviceCategoryId) === serviceCategoryId);
  }, [orders, serviceCategoryId]);

  const totalRevenue = useMemo(() => {
    const fromReport = Number(reportSummary?.totalServicesRevenue || 0);
    if (fromReport > 0) {
      return fromReport;
    }

    const fromAnalytics =
      analytics && typeof analytics === "object"
        ? Number(
            (analytics as Record<string, unknown>).totalRevenue ||
              (analytics as Record<string, unknown>).servicesRevenue ||
              (analytics as Record<string, unknown>).revenue ||
              0,
          )
        : 0;

    if (fromAnalytics > 0) {
      return fromAnalytics;
    }

    return filteredLines.reduce((sum, line) => sum + Number(line.customerPrice || 0), 0);
  }, [reportSummary, analytics, filteredLines]);

  const totalProfit = useMemo(() => {
    const fromReport = Number(reportSummary?.totalServicesProfit || 0);
    if (fromReport > 0) {
      return fromReport;
    }

    const fromAnalytics =
      analytics && typeof analytics === "object"
        ? Number(
            (analytics as Record<string, unknown>).totalProfit ||
              (analytics as Record<string, unknown>).servicesProfit ||
              (analytics as Record<string, unknown>).profit ||
              0,
          )
        : 0;

    if (fromAnalytics > 0) {
      return fromAnalytics;
    }

    return filteredLines.reduce((sum, line) => sum + Number(line.profit || 0), 0);
  }, [reportSummary, analytics, filteredLines]);

  const totalServicesPerformed = useMemo(() => {
    const fromAnalytics =
      analytics && typeof analytics === "object"
        ? Number(
            (analytics as Record<string, unknown>).servicesCount ||
              (analytics as Record<string, unknown>).totalServicesCount ||
              (analytics as Record<string, unknown>).performedServicesCount ||
              0,
          )
        : 0;

    if (fromAnalytics > 0) {
      return fromAnalytics;
    }

    const fromReport = Number(reportSummary?.totalCount || 0);
    if (fromReport > 0) {
      return fromReport;
    }

    return filteredLines.length;
  }, [reportSummary, analytics, filteredLines]);

  const averageServicePrice = useMemo(() => {
    const fromAnalytics =
      analytics && typeof analytics === "object"
        ? Number((analytics as Record<string, unknown>).averageServicePrice || 0)
        : 0;

    if (fromAnalytics > 0) {
      return fromAnalytics;
    }

    if (!totalServicesPerformed) {
      return 0;
    }

    return totalRevenue / totalServicesPerformed;
  }, [analytics, totalRevenue, totalServicesPerformed]);

  const groupedByCategory = useMemo(() => {
    const fromAnalytics = parseAnalyticsRows(analytics, [
      "revenueByServiceType",
      "profitByServiceType",
      "groupedByServiceType",
      "serviceTypeBreakdown",
    ]);

    if (fromAnalytics.length > 0) {
      return fromAnalytics;
    }

    const byCategory = new Map<string, ServiceAggregateRow>();

    filteredLines.forEach((line) => {
      const key = String(line.serviceCategoryId || line.serviceCategoryName || "unknown");
      const name = line.serviceCategoryName || `#${line.serviceCategoryId || "-"}`;
      const current = byCategory.get(key) || {
        id: key,
        name,
        revenue: 0,
        profit: 0,
        count: 0,
        averagePrice: 0,
      };

      current.revenue += Number(line.customerPrice || 0);
      current.profit += Number(line.profit || 0);
      current.count += 1;
      current.averagePrice = current.count > 0 ? current.revenue / current.count : 0;
      byCategory.set(key, current);
    });

    return Array.from(byCategory.values()).sort((a, b) => b.revenue - a.revenue);
  }, [analytics, filteredLines]);

  const servicesByFrequency = useMemo(() => {
    const fromAnalytics = parseAnalyticsRows(analytics, [
      "mostFrequentServices",
      "topServicesByFrequency",
      "topServices",
    ]);

    if (fromAnalytics.length > 0) {
      return fromAnalytics;
    }

    const byService = new Map<string, ServiceAggregateRow>();

    filteredLines.forEach((line) => {
      const key = String(line.serviceId || line.serviceName || "unknown");
      const name = line.serviceName || `#${line.serviceId || "-"}`;
      const current = byService.get(key) || {
        id: key,
        name,
        revenue: 0,
        profit: 0,
        count: 0,
        averagePrice: 0,
      };

      current.revenue += Number(line.customerPrice || 0);
      current.profit += Number(line.profit || 0);
      current.count += 1;
      current.averagePrice = current.count > 0 ? current.revenue / current.count : 0;
      byService.set(key, current);
    });

    return Array.from(byService.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, Number(topN) || 10);
  }, [analytics, filteredLines, topN]);

  const servicesByProfit = useMemo(() => {
    const fromAnalytics = parseAnalyticsRows(analytics, [
      "mostProfitableServices",
      "topServicesByProfit",
    ]);

    if (fromAnalytics.length > 0) {
      return fromAnalytics;
    }

    const byService = new Map<string, ServiceAggregateRow>();

    filteredLines.forEach((line) => {
      const key = String(line.serviceId || line.serviceName || "unknown");
      const name = line.serviceName || `#${line.serviceId || "-"}`;
      const current = byService.get(key) || {
        id: key,
        name,
        revenue: 0,
        profit: 0,
        count: 0,
        averagePrice: 0,
      };

      current.revenue += Number(line.customerPrice || 0);
      current.profit += Number(line.profit || 0);
      current.count += 1;
      current.averagePrice = current.count > 0 ? current.revenue / current.count : 0;
      byService.set(key, current);
    });

    return Array.from(byService.values())
      .sort((a, b) => b.profit - a.profit)
      .slice(0, Number(topN) || 10);
  }, [analytics, filteredLines, topN]);

  const categoryColumns = useMemo(
    () => [
      serviceColumnHelper.display({
        id: "categoryName",
        header: t("financeReports.serviceReports.columns.categoryOrService"),
        cell: ({ row }) => row.original.name,
      }),
      serviceColumnHelper.display({
        id: "revenue",
        header: t("financeReports.serviceReports.columns.revenue"),
        cell: ({ row }) => money(row.original.revenue),
      }),
      serviceColumnHelper.display({
        id: "profit",
        header: t("financeReports.serviceReports.columns.profit"),
        cell: ({ row }) => money(row.original.profit),
      }),
      serviceColumnHelper.display({
        id: "count",
        header: t("financeReports.serviceReports.columns.count"),
        cell: ({ row }) => row.original.count.toLocaleString(),
      }),
      serviceColumnHelper.display({
        id: "averagePrice",
        header: t("financeReports.serviceReports.columns.averagePrice"),
        cell: ({ row }) => money(row.original.averagePrice),
      }),
    ],
    [t],
  );

  const topServiceColumns = useMemo(
    () => [
      serviceColumnHelper.display({
        id: "topServiceName",
        header: t("financeReports.serviceReports.columns.categoryOrService"),
        cell: ({ row }) => row.original.name,
      }),
      serviceColumnHelper.display({
        id: "topServiceRevenue",
        header: t("financeReports.serviceReports.columns.revenue"),
        cell: ({ row }) => money(row.original.revenue),
      }),
      serviceColumnHelper.display({
        id: "topServiceProfit",
        header: t("financeReports.serviceReports.columns.profit"),
        cell: ({ row }) => money(row.original.profit),
      }),
    ],
    [t],
  );

  const orderColumns = useMemo(
    () => [
      orderColumnHelper.display({
        id: "estimateNumber",
        header: t("financeReports.serviceReports.orders.estimate"),
        cell: ({ row }) => row.original.estimateNumber || `#${row.original.id}`,
      }),
      orderColumnHelper.display({
        id: "vehicle",
        header: t("financeReports.serviceReports.orders.vehicle"),
        cell: ({ row }) => {
          const order = row.original;
          return `${order.vehicleBrandName || "-"} ${order.vehicleModelName || ""} ${order.vehicleYear || ""}`.trim();
        },
      }),
      orderColumnHelper.display({
        id: "servicesCount",
        header: t("financeReports.serviceReports.orders.servicesCount"),
        cell: ({ row }) => (row.original.services || []).length.toLocaleString(),
      }),
      orderColumnHelper.display({
        id: "servicesTotal",
        header: t("financeReports.serviceReports.orders.servicesRevenue"),
        cell: ({ row }) => money(Number(row.original.servicesTotal || 0)),
      }),
      orderColumnHelper.display({
        id: "servicesCost",
        header: t("financeReports.serviceReports.orders.servicesCost"),
        cell: ({ row }) => money(getServiceCost(row.original)),
      }),
      orderColumnHelper.display({
        id: "servicesProfit",
        header: t("financeReports.serviceReports.orders.servicesProfit"),
        cell: ({ row }) => money(getServiceProfit(row.original)),
      }),
      orderColumnHelper.display({
        id: "createdAt",
        header: t("financeReports.serviceReports.orders.createdAt"),
        cell: ({ row }) => {
          const raw = row.original.createdAt;
          if (!raw) return "-";
          const date = new Date(raw);
          if (Number.isNaN(date.getTime())) return raw;
          return date.toLocaleString();
        },
      }),
      orderColumnHelper.display({
        id: "status",
        header: t("financeReports.serviceReports.orders.status"),
        cell: ({ row }) => row.original.status || "-",
      }),
    ],
    [t],
  );

  const hasData =
    totalRevenue > 0 ||
    totalProfit > 0 ||
    groupedByCategory.length > 0 ||
    servicesByFrequency.length > 0 ||
    servicesByProfit.length > 0 ||
    orders.length > 0;

  const groupedMaxRevenue = useMemo(() => {
    return Math.max(1, ...groupedByCategory.map((row) => row.revenue));
  }, [groupedByCategory]);

  return (
    <div className={`${styles.panel} ${styles.shopReportsPanel}`}>
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
          label={t("financeReports.serviceReports.filters.serviceCategory")}
          value={String(serviceCategoryId || 0)}
          onChange={(e) => setServiceCategoryId(Number(e.target.value) || 0)}
        >
          <option value="0">{t("financeReports.serviceReports.filters.allCategories")}</option>
          {serviceCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
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

        <TextField
          label={t("financeReports.serviceReports.filters.topNLabel")}
          helperText={t("financeReports.serviceReports.filters.topNHelp")}
          placeholder={t("financeReports.serviceReports.filters.topNPlaceholder")}
          value={topN}
          onChange={(e) => setTopN(e.target.value)}
          inputMode="numeric"
        />
      </div>

      <div className={styles.actions}>
        <Button variant="primary" size="medium" onClick={handleLoad} disabled={isLoading}>
          {isLoading ? t("common.loading") : t("financeReports.actions.load")}
        </Button>
      </div>

      {!hasData ? (
        <div className={styles.info}>{t("financeReports.serviceReports.empty")}</div>
      ) : (
        <div className={styles.shopSections}>
          <section className={styles.reportSection}>
            <button
              type="button"
              className={styles.sectionHeader}
              onClick={() => setIsSummaryOpen((prev) => !prev)}
            >
              <span>{t("financeReports.serviceReports.sections.summary")}</span>
              <ChevronDown className={!isSummaryOpen ? styles.rotate180 : ""} size={16} />
            </button>
            {isSummaryOpen && (
              <div className={styles.sectionBody}>
                <div className={styles.kpiGrid}>
                  <article className={styles.kpiCard}>
                    <span>{t("financeReports.serviceReports.kpi.revenue")}</span>
                    <strong>{money(totalRevenue)}</strong>
                  </article>
                  <article className={styles.kpiCard}>
                    <span>{t("financeReports.serviceReports.kpi.profit")}</span>
                    <strong>{money(totalProfit)}</strong>
                  </article>
                  <article className={styles.kpiCard}>
                    <span>{t("financeReports.serviceReports.kpi.performed")}</span>
                    <strong>{totalServicesPerformed.toLocaleString()}</strong>
                  </article>
                  <article className={styles.kpiCard}>
                    <span>{t("financeReports.serviceReports.kpi.averagePrice")}</span>
                    <strong>{money(averageServicePrice)}</strong>
                  </article>
                </div>
              </div>
            )}
          </section>

          <section className={styles.reportSection}>
            <button
              type="button"
              className={styles.sectionHeader}
              onClick={() => setIsGroupedOpen((prev) => !prev)}
            >
              <span>{t("financeReports.serviceReports.sections.grouped")}</span>
              <ChevronDown className={!isGroupedOpen ? styles.rotate180 : ""} size={16} />
            </button>
            {isGroupedOpen && (
              <div className={styles.sectionBody}>
                <div className={styles.chartCard}>
                  <div className={styles.chartTitleRow}>
                    <ChartNoAxesColumnIncreasing size={16} />
                    <h4>{t("financeReports.serviceReports.charts.revenueByType")}</h4>
                  </div>
                  {groupedByCategory.length === 0 ? (
                    <p className={styles.chartEmpty}>{t("financeReports.serviceReports.noRows")}</p>
                  ) : (
                    <div className={styles.barChart}>
                      {groupedByCategory.slice(0, Number(topN) || 10).map((item) => (
                        <div key={item.id} className={styles.barRow}>
                          <span className={styles.barLabel}>{item.name}</span>
                          <div className={styles.barTrack}>
                            <div
                              className={styles.barFillPrimary}
                              style={{ width: `${(item.revenue / groupedMaxRevenue) * 100}%` }}
                            />
                          </div>
                          <span className={styles.barValue}>{money(item.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <DataTable
                  data={groupedByCategory}
                  columns={categoryColumns}
                  pageSize={Math.min(Number(topN) || 10, 25)}
                />
              </div>
            )}
          </section>

          <section className={styles.reportSection}>
            <button
              type="button"
              className={styles.sectionHeader}
              onClick={() => setIsTopServicesOpen((prev) => !prev)}
            >
              <span>{t("financeReports.serviceReports.sections.topServices")}</span>
              <ChevronDown className={!isTopServicesOpen ? styles.rotate180 : ""} size={16} />
            </button>
            {isTopServicesOpen && (
              <div className={styles.sectionBody}>
                <div>
                  <h4 className={styles.subTitle}>{t("financeReports.serviceReports.sections.mostFrequent")}</h4>
                  <DataTable
                    data={servicesByFrequency}
                    columns={topServiceColumns}
                    pageSize={Math.min(Number(topN) || 10, 25)}
                  />
                </div>

                <div>
                  <h4 className={styles.subTitle}>{t("financeReports.serviceReports.sections.mostProfitable")}</h4>
                  <DataTable
                    data={servicesByProfit}
                    columns={topServiceColumns}
                    pageSize={Math.min(Number(topN) || 10, 25)}
                  />
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {orders.length > 0 && (
        <section className={styles.reportSection}>
          <button
            type="button"
            className={styles.sectionHeader}
            onClick={() => setIsOrdersOpen((prev) => !prev)}
          >
            <span>{t("financeReports.serviceReports.sections.reportRows")}</span>
            <ChevronDown className={!isOrdersOpen ? styles.rotate180 : ""} size={16} />
          </button>

          {isOrdersOpen && (
            <div className={styles.sectionBody}>
              <div className={styles.chartCard}>
                <div className={styles.chartTitleRow}>
                  <Wrench size={16} />
                  <h4>{t("financeReports.serviceReports.sections.reportRows")}</h4>
                </div>
                <p className={styles.chartEmpty}>
                  {t("financeReports.serviceReports.reportRowsHint", {
                    count: reportSummary?.totalCount || orders.length,
                  })}
                </p>
              </div>

              <DataTable
                data={orders}
                columns={orderColumns}
                pageSize={15}
                renderSubComponent={({ row }) => {
                  const order = row.original;

                  return (
                    <div className={styles.serviceOrderDetails}>
                      <div>
                        <h5 className={styles.serviceOrderSubTitle}>
                          {t("financeReports.serviceReports.orders.servicesLines")}
                        </h5>
                        {order.services.length === 0 ? (
                          <p className={styles.chartEmpty}>{t("financeReports.serviceReports.noRows")}</p>
                        ) : (
                          <div className={styles.serviceLinesTable}>
                            <div className={styles.serviceLinesHeader}>
                              <span>{t("financeReports.serviceReports.orders.service")}</span>
                              <span>{t("financeReports.serviceReports.orders.category")}</span>
                              <span>{t("financeReports.serviceReports.orders.internalCost")}</span>
                              <span>{t("financeReports.serviceReports.orders.customerPrice")}</span>
                              <span>{t("financeReports.serviceReports.orders.profit")}</span>
                            </div>
                            {order.services.map((line) => (
                              <div
                                key={`${order.id}-${line.id}-${line.serviceId}`}
                                className={styles.serviceLinesRow}
                              >
                                <span>{line.serviceName || `#${line.serviceId}`}</span>
                                <span>{line.serviceCategoryName || `#${line.serviceCategoryId}`}</span>
                                <span>{money(Number(line.internalCost || 0))}</span>
                                <span>{money(Number(line.customerPrice || 0))}</span>
                                <span>{money(Number(line.profit || 0))}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <h5 className={styles.serviceOrderSubTitle}>
                          {t("financeReports.serviceReports.orders.productsLines")}
                        </h5>
                        {order.products.length === 0 ? (
                          <p className={styles.chartEmpty}>{t("financeReports.serviceReports.noRows")}</p>
                        ) : (
                          <div className={styles.serviceLinesTable}>
                            <div className={styles.serviceLinesHeader}>
                              <span>{t("financeReports.serviceReports.orders.productCode")}</span>
                              <span>{t("financeReports.serviceReports.orders.quantity")}</span>
                              <span>{t("financeReports.serviceReports.orders.unitPrice")}</span>
                              <span>{t("financeReports.serviceReports.orders.lineTotal")}</span>
                              <span>{t("financeReports.serviceReports.orders.share")}</span>
                            </div>
                            {order.products.map((line) => (
                              <div
                                key={`${order.id}-${line.id}-${line.productId}`}
                                className={styles.serviceLinesRow}
                              >
                                <span>{line.productCode || `#${line.productId}`}</span>
                                <span>{Number(line.quantity || 0).toLocaleString()}</span>
                                <span>{money(Number(line.unitPrice || 0))}</span>
                                <span>{money(Number(line.lineTotal || 0))}</span>
                                <span>
                                  {order.grandTotal > 0
                                    ? `${(((Number(line.lineTotal || 0) / order.grandTotal) * 100).toFixed(1))}%`
                                    : "0%"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }}
              />
            </div>
          )}
        </section>
      )}
    </div>
  );
};
