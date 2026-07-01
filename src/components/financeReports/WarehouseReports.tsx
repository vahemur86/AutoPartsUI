import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { createColumnHelper } from "@tanstack/react-table";
import { ChevronDown, Gauge } from "lucide-react";

// ui-kit
import { Button, DataTable, DatePicker, Select, TextField } from "@/ui-kit";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchWarehouses } from "@/store/slices/warehousesSlice";

// services
import { getWarehouseReportFull } from "@/services/financeReports";

// utils
import { getApiErrorMessage, getCashRegisterId } from "@/utils";

// types
import type { Warehouse } from "@/types/settings";
import type {
  WarehouseFullReportResponse,
  WarehouseMovementItem,
  WarehousePurchaseItem,
  WarehouseStockItem,
  WarehouseTurnoverItem,
  WarehouseVelocityItem,
} from "@/types/financeReports";

// local
import styles from "./FinanceReports.module.css";

const stockColumnHelper = createColumnHelper<WarehouseStockItem>();
const movementColumnHelper = createColumnHelper<WarehouseMovementItem>();
const purchaseColumnHelper = createColumnHelper<WarehousePurchaseItem>();
const velocityColumnHelper = createColumnHelper<WarehouseVelocityItem>();
const turnoverColumnHelper = createColumnHelper<WarehouseTurnoverItem>();

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

const formatDateTime = (value?: string): string => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

const movementTypeLabel = (value: number, t: (key: string) => string): string => {
  if (value === 1) return t("financeReports.warehouseReports.movementTypes.in");
  if (value === 2) return t("financeReports.warehouseReports.movementTypes.out");
  return `${t("financeReports.warehouseReports.movementTypes.unknown")} (${value})`;
};

export const WarehouseReports = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { warehouses } = useAppSelector((state) => state.warehouses);

  const [warehouseId, setWarehouseId] = useState<number>(0);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [topN, setTopN] = useState<string>("20");
  const [slowMovingDays, setSlowMovingDays] = useState<string>("30");

  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<WarehouseFullReportResponse | null>(null);

  const [isStockOpen, setIsStockOpen] = useState(true);
  const [isMovementsOpen, setIsMovementsOpen] = useState(true);
  const [isPurchasesOpen, setIsPurchasesOpen] = useState(true);
  const [isVelocityOpen, setIsVelocityOpen] = useState(true);
  const [isTurnoverOpen, setIsTurnoverOpen] = useState(true);

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

    const parsedTopN = Number(topN);
    const resolvedTopN = Number.isFinite(parsedTopN) && parsedTopN > 0 ? parsedTopN : 20;

    const parsedSlowMovingDays = Number(slowMovingDays);
    const resolvedSlowMovingDays =
      Number.isFinite(parsedSlowMovingDays) && parsedSlowMovingDays > 0
        ? parsedSlowMovingDays
        : 30;

    setIsLoading(true);
    try {
      const fromDateTime = toDateTimeRange(fromDate, false);
      const toDateTime = toDateTimeRange(toDate, true);

      const response = await getWarehouseReportFull(warehouseId, {
        fromDate: fromDateTime,
        toDate: toDateTime,
        topN: resolvedTopN,
        slowMovingDays: resolvedSlowMovingDays,
        cashRegisterId,
      });

      setReport(response);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, t("financeReports.error.failedToLoad")));
    } finally {
      setIsLoading(false);
    }
  }, [warehouseId, fromDate, toDate, topN, slowMovingDays, cashRegisterId, t]);

  const stockColumns = useMemo(
    () => [
      stockColumnHelper.display({
        id: "productCode",
        header: t("financeReports.warehouseReports.columns.productCode"),
        cell: ({ row }) => row.original.productCode || "-",
      }),
      stockColumnHelper.display({
        id: "productSku",
        header: t("financeReports.warehouseReports.columns.productSku"),
        cell: ({ row }) => row.original.productSku || "-",
      }),
      stockColumnHelper.display({
        id: "quantity",
        header: t("financeReports.warehouseReports.columns.quantity"),
        cell: ({ row }) => Number(row.original.quantity || 0).toLocaleString(),
      }),
      stockColumnHelper.display({
        id: "purchaseCost",
        header: t("financeReports.warehouseReports.columns.purchaseCost"),
        cell: ({ row }) => money(Number(row.original.purchaseCost || 0)),
      }),
      stockColumnHelper.display({
        id: "salePrice",
        header: t("financeReports.warehouseReports.columns.salePrice"),
        cell: ({ row }) => money(Number(row.original.salePrice || 0)),
      }),
      stockColumnHelper.display({
        id: "stockValueAtCost",
        header: t("financeReports.warehouseReports.columns.stockValueAtCost"),
        cell: ({ row }) => money(Number(row.original.stockValueAtCost || 0)),
      }),
      stockColumnHelper.display({
        id: "stockValueAtSalePrice",
        header: t("financeReports.warehouseReports.columns.stockValueAtSalePrice"),
        cell: ({ row }) => money(Number(row.original.stockValueAtSalePrice || 0)),
      }),
    ],
    [t],
  );

  const movementColumns = useMemo(
    () => [
      movementColumnHelper.display({
        id: "movementProductCode",
        header: t("financeReports.warehouseReports.columns.productCode"),
        cell: ({ row }) => row.original.productCode || "-",
      }),
      movementColumnHelper.display({
        id: "movementProductSku",
        header: t("financeReports.warehouseReports.columns.productSku"),
        cell: ({ row }) => row.original.productSku || "-",
      }),
      movementColumnHelper.display({
        id: "movementType",
        header: t("financeReports.warehouseReports.columns.movementType"),
        cell: ({ row }) => movementTypeLabel(Number(row.original.movementType || 0), t),
      }),
      movementColumnHelper.display({
        id: "movementQuantity",
        header: t("financeReports.warehouseReports.columns.quantity"),
        cell: ({ row }) => Number(row.original.quantity || 0).toLocaleString(),
      }),
      movementColumnHelper.display({
        id: "movementUnitCost",
        header: t("financeReports.warehouseReports.columns.unitCost"),
        cell: ({ row }) => money(Number(row.original.unitCost || 0)),
      }),
      movementColumnHelper.display({
        id: "movementTargetShop",
        header: t("financeReports.warehouseReports.columns.targetShopId"),
        cell: ({ row }) => (row.original.targetShopId ? String(row.original.targetShopId) : "-"),
      }),
      movementColumnHelper.display({
        id: "movementCreatedBy",
        header: t("financeReports.warehouseReports.columns.createdBy"),
        cell: ({ row }) => row.original.createdBy || "-",
      }),
      movementColumnHelper.display({
        id: "movementOccurredAt",
        header: t("financeReports.warehouseReports.columns.occurredAt"),
        cell: ({ row }) => formatDateTime(row.original.occurredAt),
      }),
    ],
    [t],
  );

  const purchaseColumns = useMemo(
    () => [
      purchaseColumnHelper.display({
        id: "purchaseProductCode",
        header: t("financeReports.warehouseReports.columns.productCode"),
        cell: ({ row }) => row.original.productCode || "-",
      }),
      purchaseColumnHelper.display({
        id: "purchaseProductSku",
        header: t("financeReports.warehouseReports.columns.productSku"),
        cell: ({ row }) => row.original.productSku || "-",
      }),
      purchaseColumnHelper.display({
        id: "purchaseQuantityAdded",
        header: t("financeReports.warehouseReports.columns.quantityAdded"),
        cell: ({ row }) => Number(row.original.quantityAdded || 0).toLocaleString(),
      }),
      purchaseColumnHelper.display({
        id: "purchaseUnitCost",
        header: t("financeReports.warehouseReports.columns.unitCost"),
        cell: ({ row }) => money(Number(row.original.unitCost || 0)),
      }),
      purchaseColumnHelper.display({
        id: "purchaseTotalCost",
        header: t("financeReports.warehouseReports.columns.totalCost"),
        cell: ({ row }) => money(Number(row.original.totalCost || 0)),
      }),
      purchaseColumnHelper.display({
        id: "purchasePurchasedAt",
        header: t("financeReports.warehouseReports.columns.purchasedAt"),
        cell: ({ row }) => formatDateTime(row.original.purchasedAt),
      }),
    ],
    [t],
  );

  const velocityColumns = useMemo(
    () => [
      velocityColumnHelper.display({
        id: "velocityProductCode",
        header: t("financeReports.warehouseReports.columns.productCode"),
        cell: ({ row }) => row.original.productCode || "-",
      }),
      velocityColumnHelper.display({
        id: "velocityProductSku",
        header: t("financeReports.warehouseReports.columns.productSku"),
        cell: ({ row }) => row.original.productSku || "-",
      }),
      velocityColumnHelper.display({
        id: "velocityCurrentStock",
        header: t("financeReports.warehouseReports.columns.currentWarehouseStock"),
        cell: ({ row }) => Number(row.original.currentWarehouseStock || 0).toLocaleString(),
      }),
      velocityColumnHelper.display({
        id: "velocityTotalSold",
        header: t("financeReports.warehouseReports.columns.totalUnitsSold"),
        cell: ({ row }) => Number(row.original.totalUnitsSold || 0).toLocaleString(),
      }),
      velocityColumnHelper.display({
        id: "velocityLastSoldAt",
        header: t("financeReports.warehouseReports.columns.lastSoldAt"),
        cell: ({ row }) => formatDateTime(row.original.lastSoldAt),
      }),
      velocityColumnHelper.display({
        id: "velocityDaysSince",
        header: t("financeReports.warehouseReports.columns.daysSinceLastSale"),
        cell: ({ row }) => Number(row.original.daysSinceLastSale || 0).toLocaleString(),
      }),
    ],
    [t],
  );

  const turnoverColumns = useMemo(
    () => [
      turnoverColumnHelper.display({
        id: "turnoverProductCode",
        header: t("financeReports.warehouseReports.columns.productCode"),
        cell: ({ row }) => row.original.productCode || "-",
      }),
      turnoverColumnHelper.display({
        id: "turnoverProductSku",
        header: t("financeReports.warehouseReports.columns.productSku"),
        cell: ({ row }) => row.original.productSku || "-",
      }),
      turnoverColumnHelper.display({
        id: "turnoverUnitsSold",
        header: t("financeReports.warehouseReports.columns.unitsSold"),
        cell: ({ row }) => Number(row.original.unitsSold || 0).toLocaleString(),
      }),
      turnoverColumnHelper.display({
        id: "turnoverAvgStock",
        header: t("financeReports.warehouseReports.columns.avgStockOnHand"),
        cell: ({ row }) => Number(row.original.avgStockOnHand || 0).toLocaleString(),
      }),
      turnoverColumnHelper.display({
        id: "turnoverRate",
        header: t("financeReports.warehouseReports.columns.turnoverRate"),
        cell: ({ row }) => Number(row.original.turnoverRate || 0).toLocaleString(undefined, {
          maximumFractionDigits: 4,
        }),
      }),
    ],
    [t],
  );

  const turnoverChartData = useMemo(() => {
    const rows = report?.inventoryTurnover || [];
    return rows
      .slice()
      .sort((a, b) => Number(b.turnoverRate || 0) - Number(a.turnoverRate || 0))
      .slice(0, 10)
      .map((item) => ({
        label: item.productCode || item.productSku || `#${item.productId}`,
        value: Number(item.turnoverRate || 0),
      }));
  }, [report]);

  const maxTurnoverValue = useMemo(() => {
    return Math.max(1, ...turnoverChartData.map((item) => item.value));
  }, [turnoverChartData]);

  const hasData = !!report;

  return (
    <div className={`${styles.panel} ${styles.shopReportsPanel}`}>
      <div className={styles.filters}>
        <Select
          label={t("financeReports.filters.warehouse")}
          value={warehouseId > 0 ? String(warehouseId) : ""}
          onChange={(e) => setWarehouseId(Number(e.target.value) || 0)}
        >
          <option value="">{t("financeReports.filters.selectWarehouse")}</option>
          {warehouses.map((warehouse: Warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.code}
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
          label={t("financeReports.warehouseReports.filters.topNLabel")}
          helperText={t("financeReports.warehouseReports.filters.topNHelp")}
          placeholder={t("financeReports.warehouseReports.filters.topNPlaceholder")}
          value={topN}
          onChange={(e) => setTopN(e.target.value)}
          inputMode="numeric"
        />

        <TextField
          label={t("financeReports.warehouseReports.filters.slowMovingDaysLabel")}
          helperText={t("financeReports.warehouseReports.filters.slowMovingDaysHelp")}
          placeholder={t("financeReports.warehouseReports.filters.slowMovingDaysPlaceholder")}
          value={slowMovingDays}
          onChange={(e) => setSlowMovingDays(e.target.value)}
          inputMode="numeric"
        />
      </div>

      <div className={styles.actions}>
        <Button variant="primary" size="medium" onClick={handleLoad} disabled={isLoading}>
          {isLoading ? t("common.loading") : t("financeReports.actions.load")}
        </Button>
      </div>

      {!hasData ? (
        <div className={styles.info}>{t("financeReports.warehouseReports.empty")}</div>
      ) : (
        <div className={styles.shopSections}>
          <section className={styles.reportSection}>
            <button
              type="button"
              className={styles.sectionHeader}
              onClick={() => setIsStockOpen((prev) => !prev)}
            >
              <span>{t("financeReports.warehouseReports.sections.stock")}</span>
              <ChevronDown className={!isStockOpen ? styles.rotate180 : ""} size={16} />
            </button>
            {isStockOpen && report?.stockValuation && (
              <div className={styles.sectionBody}>
                <div className={styles.kpiGrid}>
                  <article className={styles.kpiCard}>
                    <span>{t("financeReports.warehouseReports.kpi.totalValueAtCost")}</span>
                    <strong>{money(Number(report.stockValuation.totalValueAtCost || 0))}</strong>
                  </article>
                  <article className={styles.kpiCard}>
                    <span>{t("financeReports.warehouseReports.kpi.totalValueAtSalePrice")}</span>
                    <strong>{money(Number(report.stockValuation.totalValueAtSalePrice || 0))}</strong>
                  </article>
                  <article className={styles.kpiCard}>
                    <span>{t("financeReports.warehouseReports.kpi.totalProducts")}</span>
                    <strong>{Number(report.stockValuation.totalProducts || 0).toLocaleString()}</strong>
                  </article>
                  <article className={styles.kpiCard}>
                    <span>{t("financeReports.warehouseReports.kpi.totalUnits")}</span>
                    <strong>{Number(report.stockValuation.totalUnits || 0).toLocaleString()}</strong>
                  </article>
                </div>

                <DataTable
                  data={report.stockValuation.items || []}
                  columns={stockColumns}
                  pageSize={15}
                />
              </div>
            )}
          </section>

          <section className={styles.reportSection}>
            <button
              type="button"
              className={styles.sectionHeader}
              onClick={() => setIsMovementsOpen((prev) => !prev)}
            >
              <span>{t("financeReports.warehouseReports.sections.movements")}</span>
              <ChevronDown className={!isMovementsOpen ? styles.rotate180 : ""} size={16} />
            </button>
            {isMovementsOpen && (
              <div className={styles.sectionBody}>
                <DataTable
                  data={report?.inventoryMovements || []}
                  columns={movementColumns}
                  pageSize={15}
                />
              </div>
            )}
          </section>

          <section className={styles.reportSection}>
            <button
              type="button"
              className={styles.sectionHeader}
              onClick={() => setIsPurchasesOpen((prev) => !prev)}
            >
              <span>{t("financeReports.warehouseReports.sections.purchases")}</span>
              <ChevronDown className={!isPurchasesOpen ? styles.rotate180 : ""} size={16} />
            </button>
            {isPurchasesOpen && (
              <div className={styles.sectionBody}>
                <DataTable
                  data={report?.purchaseHistory || []}
                  columns={purchaseColumns}
                  pageSize={15}
                />
              </div>
            )}
          </section>

          <section className={styles.reportSection}>
            <button
              type="button"
              className={styles.sectionHeader}
              onClick={() => setIsVelocityOpen((prev) => !prev)}
            >
              <span>{t("financeReports.warehouseReports.sections.velocity")}</span>
              <ChevronDown className={!isVelocityOpen ? styles.rotate180 : ""} size={16} />
            </button>
            {isVelocityOpen && (
              <div className={styles.sectionBody}>
                <div className={styles.inventoryTablesGrid}>
                  <div>
                    <h4 className={styles.subTitle}>{t("financeReports.warehouseReports.sections.fastMoving")}</h4>
                    <DataTable
                      data={report?.fastMovingProducts || []}
                      columns={velocityColumns}
                      pageSize={10}
                    />
                  </div>
                  <div>
                    <h4 className={styles.subTitle}>{t("financeReports.warehouseReports.sections.slowMoving")}</h4>
                    <DataTable
                      data={report?.slowMovingProducts || []}
                      columns={velocityColumns}
                      pageSize={10}
                    />
                  </div>
                </div>

                <div>
                  <h4 className={styles.subTitle}>{t("financeReports.warehouseReports.sections.notSold")}</h4>
                  <DataTable
                    data={report?.notSoldProducts || []}
                    columns={velocityColumns}
                    pageSize={10}
                  />
                </div>
              </div>
            )}
          </section>

          <section className={styles.reportSection}>
            <button
              type="button"
              className={styles.sectionHeader}
              onClick={() => setIsTurnoverOpen((prev) => !prev)}
            >
              <span>{t("financeReports.warehouseReports.sections.turnover")}</span>
              <ChevronDown className={!isTurnoverOpen ? styles.rotate180 : ""} size={16} />
            </button>
            {isTurnoverOpen && (
              <div className={styles.sectionBody}>
                <div className={styles.chartCard}>
                  <div className={styles.chartTitleRow}>
                    <Gauge size={16} />
                    <h4>{t("financeReports.warehouseReports.charts.turnover")}</h4>
                  </div>

                  {turnoverChartData.length === 0 ? (
                    <p className={styles.chartEmpty}>{t("financeReports.warehouseReports.noRows")}</p>
                  ) : (
                    <div className={styles.barChart}>
                      {turnoverChartData.map((item) => (
                        <div key={item.label} className={styles.barRow}>
                          <span className={styles.barLabel}>{item.label}</span>
                          <div className={styles.barTrack}>
                            <div
                              className={styles.barFillAccent}
                              style={{ width: `${(item.value / maxTurnoverValue) * 100}%` }}
                            />
                          </div>
                          <span className={styles.barValue}>{item.value.toLocaleString(undefined, {
                            maximumFractionDigits: 4,
                          })}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <DataTable
                  data={report?.inventoryTurnover || []}
                  columns={turnoverColumns}
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
