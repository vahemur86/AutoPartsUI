import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { createColumnHelper } from "@tanstack/react-table";
import { ChevronDown, TrendingUp, Package, AlertTriangle, Ban } from "lucide-react";

// ui-kit
import { Button, DataTable, DatePicker, Select, TextField } from "@/ui-kit";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchShops } from "@/store/slices/shopsSlice";

// services
import {
  getShopBestSellingProducts,
  getShopHighestProfitProducts,
  getShopInventoryAllProductsReport,
  getShopInventoryReport,
  getShopReportSummary,
} from "@/services/financeReports";

// utils
import { getApiErrorMessage, getCashRegisterId } from "@/utils";

// types
import type {
  ShopReportInventoryAllProductsResponse,
  ShopReportInventoryProduct,
  ShopReportInventoryResponse,
  ShopReportProductMetric,
  ShopReportSummaryResponse,
} from "@/types/financeReports";

// local
import styles from "./FinanceReports.module.css";

const columnHelper = createColumnHelper<ShopReportProductMetric>();
const inventoryColumnHelper = createColumnHelper<ShopReportInventoryProduct>();

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

export const ShopReports = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { shops } = useAppSelector((state) => state.shops);

  const [shopId, setShopId] = useState<number>(0);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [take, setTake] = useState<string>("10");
  const [lowStockThreshold, setLowStockThreshold] = useState<string>("5");

  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<ShopReportSummaryResponse | null>(null);
  const [bestSelling, setBestSelling] = useState<ShopReportProductMetric[]>([]);
  const [highestProfit, setHighestProfit] = useState<ShopReportProductMetric[]>([]);
  const [inventory, setInventory] = useState<ShopReportInventoryResponse | null>(null);
  const [inventoryAllProducts, setInventoryAllProducts] =
    useState<ShopReportInventoryAllProductsResponse | null>(null);

  const [isSummaryOpen, setIsSummaryOpen] = useState(true);
  const [isBestSellingOpen, setIsBestSellingOpen] = useState(true);
  const [isHighestProfitOpen, setIsHighestProfitOpen] = useState(true);
  const [isInventoryOpen, setIsInventoryOpen] = useState(true);

  const cashRegisterId = useMemo(() => getCashRegisterId(0), []);

  useEffect(() => {
    dispatch(fetchShops({ cashRegisterId }));
  }, [dispatch, cashRegisterId]);

  useEffect(() => {
    if (shops.length > 0 && shopId === 0) {
      setShopId(shops[0].id);
    }
  }, [shops, shopId]);

  const hasData = !!summary || !!inventory || !!inventoryAllProducts;

  const handleLoad = useCallback(async () => {
    if (!shopId) {
      toast.error(t("financeReports.validation.selectShop"));
      return;
    }

    const parsedTake = Number(take);
    const resolvedTake = Number.isFinite(parsedTake) && parsedTake > 0 ? parsedTake : 10;

    const parsedThreshold = Number(lowStockThreshold);
    const resolvedThreshold =
      Number.isFinite(parsedThreshold) && parsedThreshold > 0 ? parsedThreshold : 5;

    setIsLoading(true);
    try {
      const fromDateTime = toDateTimeRange(fromDate, false);
      const toDateTime = toDateTimeRange(toDate, true);

      const [summaryRes, bestRes, highestRes, inventoryRes, inventoryAllRes] = await Promise.all([
        getShopReportSummary(shopId, {
          fromDate: fromDateTime,
          toDate: toDateTime,
          cashRegisterId,
        }),
        getShopBestSellingProducts(shopId, {
          fromDate: fromDateTime,
          toDate: toDateTime,
          take: resolvedTake,
          cashRegisterId,
        }),
        getShopHighestProfitProducts(shopId, {
          fromDate: fromDateTime,
          toDate: toDateTime,
          take: resolvedTake,
          cashRegisterId,
        }),
        getShopInventoryReport(shopId, {
          lowStockThreshold: resolvedThreshold,
          cashRegisterId,
        }),
        getShopInventoryAllProductsReport(shopId, { cashRegisterId }),
      ]);

      setSummary(summaryRes);
      setBestSelling(bestRes);
      setHighestProfit(highestRes);
      setInventory(inventoryRes);
      setInventoryAllProducts(inventoryAllRes);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, t("financeReports.error.failedToLoad")));
    } finally {
      setIsLoading(false);
    }
  }, [shopId, fromDate, toDate, take, lowStockThreshold, cashRegisterId, t]);

  const productColumns = useMemo(
    () => [
      columnHelper.display({
        id: "productCode",
        header: t("financeReports.shopReports.columns.productCode"),
        cell: ({ row }) => row.original.productCode || "-",
      }),
      columnHelper.display({
        id: "productSku",
        header: t("financeReports.shopReports.columns.productSku"),
        cell: ({ row }) => row.original.productSku || "-",
      }),
      columnHelper.display({
        id: "quantitySold",
        header: t("financeReports.shopReports.columns.quantitySold"),
        cell: ({ row }) => Number(row.original.quantitySold || 0).toLocaleString(),
      }),
      columnHelper.display({
        id: "revenue",
        header: t("financeReports.shopReports.columns.revenue"),
        cell: ({ row }) => money(Number(row.original.revenue || 0)),
      }),
      columnHelper.display({
        id: "cost",
        header: t("financeReports.shopReports.columns.cost"),
        cell: ({ row }) => money(Number(row.original.cost || 0)),
      }),
      columnHelper.display({
        id: "profit",
        header: t("financeReports.shopReports.columns.profit"),
        cell: ({ row }) => money(Number(row.original.profit || 0)),
      }),
    ],
    [t],
  );

  const inventoryColumns = useMemo(
    () => [
      inventoryColumnHelper.display({
        id: "productCode",
        header: t("financeReports.shopReports.columns.productCode"),
        cell: ({ row }) => row.original.productCode || "-",
      }),
      inventoryColumnHelper.display({
        id: "productSku",
        header: t("financeReports.shopReports.columns.productSku"),
        cell: ({ row }) => row.original.productSku || "-",
      }),
      inventoryColumnHelper.display({
        id: "quantity",
        header: t("financeReports.shopReports.columns.quantity"),
        cell: ({ row }) => Number(row.original.quantity || 0).toLocaleString(),
      }),
      inventoryColumnHelper.display({
        id: "salePrice",
        header: t("financeReports.shopReports.columns.salePrice"),
        cell: ({ row }) => money(Number(row.original.salePrice || 0)),
      }),
      inventoryColumnHelper.display({
        id: "inventoryValue",
        header: t("financeReports.shopReports.columns.inventoryValue"),
        cell: ({ row }) => {
          const value =
            Number(row.original.inventoryValue || 0) ||
            Number(row.original.inventoryValueAtSalePrice || 0);
          return money(value);
        },
      }),
    ],
    [t],
  );

  const inventoryAllColumns = useMemo(
    () => [
      inventoryColumnHelper.display({
        id: "productCodeAll",
        header: t("financeReports.shopReports.columns.productCode"),
        cell: ({ row }) => row.original.productCode || "-",
      }),
      inventoryColumnHelper.display({
        id: "productSkuAll",
        header: t("financeReports.shopReports.columns.productSku"),
        cell: ({ row }) => row.original.productSku || "-",
      }),
      inventoryColumnHelper.display({
        id: "quantityAll",
        header: t("financeReports.shopReports.columns.quantity"),
        cell: ({ row }) => Number(row.original.quantity || 0).toLocaleString(),
      }),
      inventoryColumnHelper.display({
        id: "salePriceAll",
        header: t("financeReports.shopReports.columns.salePrice"),
        cell: ({ row }) => money(Number(row.original.salePrice || 0)),
      }),
      inventoryColumnHelper.display({
        id: "avgCostPriceAll",
        header: t("financeReports.shopReports.columns.avgCostPrice"),
        cell: ({ row }) => money(Number(row.original.avgCostPrice || 0)),
      }),
      inventoryColumnHelper.display({
        id: "inventoryValueAtSalePriceAll",
        header: t("financeReports.shopReports.columns.inventoryValueAtSalePrice"),
        cell: ({ row }) => money(Number(row.original.inventoryValueAtSalePrice || 0)),
      }),
      inventoryColumnHelper.display({
        id: "inventoryValueAtCostAll",
        header: t("financeReports.shopReports.columns.inventoryValueAtCost"),
        cell: ({ row }) => money(Number(row.original.inventoryValueAtCost || 0)),
      }),
    ],
    [t],
  );

  const allInventoryProducts = useMemo(() => {
    return [...(inventoryAllProducts?.products || [])].sort((a, b) => {
      return Number(b.inventoryValueAtSalePrice || 0) - Number(a.inventoryValueAtSalePrice || 0);
    });
  }, [inventoryAllProducts]);

  const bestSellingChartData = useMemo(() => {
    return bestSelling.slice(0, 5).map((item) => ({
      label: item.productCode || item.productSku || `#${item.productId}`,
      value: Number(item.quantitySold || 0),
    }));
  }, [bestSelling]);

  const highestProfitChartData = useMemo(() => {
    return highestProfit.slice(0, 5).map((item) => ({
      label: item.productCode || item.productSku || `#${item.productId}`,
      value: Number(item.profit || 0),
    }));
  }, [highestProfit]);

  const bestSellingMax = useMemo(() => {
    return Math.max(1, ...bestSellingChartData.map((item) => item.value));
  }, [bestSellingChartData]);

  const highestProfitMax = useMemo(() => {
    return Math.max(1, ...highestProfitChartData.map((item) => item.value));
  }, [highestProfitChartData]);

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
          label={t("financeReports.shopReports.filters.takeLabel")}
          helperText={t("financeReports.shopReports.filters.takeHelp")}
          placeholder={t("financeReports.shopReports.filters.takePlaceholder")}
          value={take}
          onChange={(e) => setTake(e.target.value)}
          inputMode="numeric"
        />

        <TextField
          label={t("financeReports.shopReports.filters.lowStockThresholdLabel")}
          helperText={t("financeReports.shopReports.filters.lowStockThresholdHelp")}
          placeholder={t("financeReports.shopReports.filters.lowStockThresholdPlaceholder")}
          value={lowStockThreshold}
          onChange={(e) => setLowStockThreshold(e.target.value)}
          inputMode="numeric"
        />
      </div>

      <div className={styles.actions}>
        <Button variant="primary" size="medium" onClick={handleLoad} disabled={isLoading}>
          {isLoading ? t("common.loading") : t("financeReports.actions.load")}
        </Button>
      </div>

      {!hasData ? (
        <div className={styles.info}>{t("financeReports.shopReports.empty")}</div>
      ) : (
        <div className={styles.shopSections}>
          <section className={styles.reportSection}>
            <button
              type="button"
              className={styles.sectionHeader}
              onClick={() => setIsSummaryOpen((prev) => !prev)}
            >
              <span>{t("financeReports.shopReports.sections.summary")}</span>
              <ChevronDown className={!isSummaryOpen ? styles.rotate180 : ""} size={16} />
            </button>
            {isSummaryOpen && summary && (
              <div className={styles.sectionBody}>
                <div className={styles.kpiGrid}>
                  <article className={styles.kpiCard}>
                    <span>{t("financeReports.shopReports.kpi.revenue")}</span>
                    <strong>{money(Number(summary.revenueFromProductSales || 0))}</strong>
                  </article>
                  <article className={styles.kpiCard}>
                    <span>{t("financeReports.shopReports.kpi.profit")}</span>
                    <strong>{money(Number(summary.profitFromProductSales || 0))}</strong>
                  </article>
                  <article className={styles.kpiCard}>
                    <span>{t("financeReports.shopReports.kpi.productsSold")}</span>
                    <strong>{Number(summary.totalQuantitySold || 0).toLocaleString()}</strong>
                  </article>
                  <article className={styles.kpiCard}>
                    <span>{t("financeReports.shopReports.kpi.salesCount")}</span>
                    <strong>{Number(summary.salesCount || 0).toLocaleString()}</strong>
                  </article>
                </div>
              </div>
            )}
          </section>

          <section className={styles.reportSection}>
            <button
              type="button"
              className={styles.sectionHeader}
              onClick={() => setIsBestSellingOpen((prev) => !prev)}
            >
              <span>{t("financeReports.shopReports.sections.bestSelling")}</span>
              <ChevronDown className={!isBestSellingOpen ? styles.rotate180 : ""} size={16} />
            </button>
            {isBestSellingOpen && (
              <div className={styles.sectionBody}>
                <div className={styles.chartCard}>
                  <div className={styles.chartTitleRow}>
                    <TrendingUp size={16} />
                    <h4>{t("financeReports.shopReports.charts.byQuantity")}</h4>
                  </div>
                  {bestSellingChartData.length === 0 ? (
                    <p className={styles.chartEmpty}>{t("financeReports.shopReports.noRows")}</p>
                  ) : (
                    <div className={styles.barChart}>
                      {bestSellingChartData.map((item) => (
                        <div key={item.label} className={styles.barRow}>
                          <span className={styles.barLabel}>{item.label}</span>
                          <div className={styles.barTrack}>
                            <div
                              className={styles.barFillPrimary}
                              style={{ width: `${(item.value / bestSellingMax) * 100}%` }}
                            />
                          </div>
                          <span className={styles.barValue}>{item.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <DataTable
                  data={bestSelling}
                  columns={productColumns}
                  pageSize={Math.min(Number(take) || 10, 25)}
                />
              </div>
            )}
          </section>

          <section className={styles.reportSection}>
            <button
              type="button"
              className={styles.sectionHeader}
              onClick={() => setIsHighestProfitOpen((prev) => !prev)}
            >
              <span>{t("financeReports.shopReports.sections.highestProfit")}</span>
              <ChevronDown className={!isHighestProfitOpen ? styles.rotate180 : ""} size={16} />
            </button>
            {isHighestProfitOpen && (
              <div className={styles.sectionBody}>
                <div className={styles.chartCard}>
                  <div className={styles.chartTitleRow}>
                    <TrendingUp size={16} />
                    <h4>{t("financeReports.shopReports.charts.byProfit")}</h4>
                  </div>
                  {highestProfitChartData.length === 0 ? (
                    <p className={styles.chartEmpty}>{t("financeReports.shopReports.noRows")}</p>
                  ) : (
                    <div className={styles.barChart}>
                      {highestProfitChartData.map((item) => (
                        <div key={item.label} className={styles.barRow}>
                          <span className={styles.barLabel}>{item.label}</span>
                          <div className={styles.barTrack}>
                            <div
                              className={styles.barFillAccent}
                              style={{ width: `${(item.value / highestProfitMax) * 100}%` }}
                            />
                          </div>
                          <span className={styles.barValue}>{money(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <DataTable
                  data={highestProfit}
                  columns={productColumns}
                  pageSize={Math.min(Number(take) || 10, 25)}
                />
              </div>
            )}
          </section>

          <section className={styles.reportSection}>
            <button
              type="button"
              className={styles.sectionHeader}
              onClick={() => setIsInventoryOpen((prev) => !prev)}
            >
              <span>{t("financeReports.shopReports.sections.inventory")}</span>
              <ChevronDown className={!isInventoryOpen ? styles.rotate180 : ""} size={16} />
            </button>
            {isInventoryOpen && inventory && (
              <div className={styles.sectionBody}>
                <div className={styles.inventorySummaryGrid}>
                  <article className={styles.inventoryCard}>
                    <Package size={16} />
                    <div>
                      <span>{t("financeReports.shopReports.kpi.currentInventoryValue")}</span>
                      <strong>
                        {money(
                          Number(
                            inventoryAllProducts?.totalInventoryValueAtSalePrice ||
                              inventory.currentInventoryValue ||
                              0,
                          ),
                        )}
                      </strong>
                    </div>
                  </article>
                  <article className={styles.inventoryCard}>
                    <Package size={16} />
                    <div>
                      <span>{t("financeReports.shopReports.kpi.currentInventoryCostValue")}</span>
                      <strong>
                        {money(
                          Number(
                            inventoryAllProducts?.totalInventoryValueAtCost ||
                              inventory.currentInventoryCostValue ||
                              0,
                          ),
                        )}
                      </strong>
                    </div>
                  </article>
                  <article className={styles.inventoryCard}>
                    <AlertTriangle size={16} />
                    <div>
                      <span>{t("financeReports.shopReports.kpi.lowStockCount")}</span>
                      <strong>{inventory.lowStockProducts?.length || 0}</strong>
                    </div>
                  </article>
                  <article className={styles.inventoryCard}>
                    <Ban size={16} />
                    <div>
                      <span>{t("financeReports.shopReports.kpi.outOfStockCount")}</span>
                      <strong>{inventory.outOfStockProducts?.length || 0}</strong>
                    </div>
                  </article>
                </div>

                <div className={styles.inventoryTablesGrid}>
                  <div>
                    <h4 className={styles.subTitle}>{t("financeReports.shopReports.sections.lowStock")}</h4>
                    <DataTable
                      data={inventory.lowStockProducts || []}
                      columns={inventoryColumns}
                      pageSize={10}
                    />
                  </div>
                  <div>
                    <h4 className={styles.subTitle}>{t("financeReports.shopReports.sections.outOfStock")}</h4>
                    <DataTable
                      data={inventory.outOfStockProducts || []}
                      columns={inventoryColumns}
                      pageSize={10}
                    />
                  </div>
                </div>

                <div>
                  <h4 className={styles.subTitle}>{t("financeReports.shopReports.sections.allInventory")}</h4>
                  <DataTable
                    data={allInventoryProducts}
                    columns={inventoryAllColumns}
                    pageSize={15}
                  />
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
