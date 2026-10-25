import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  Archive,
  Atom,
  ArrowLeftRight,
  Boxes,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Coins,
  Factory,
  LoaderCircle,
  Scale,
  ShoppingCart,
  Workflow,
} from "lucide-react";
import {
  Button,
  ConfirmationModal,
  Select,
  TextField,
} from "@/ui-kit";
import { getCashRegisterId, getApiErrorMessage } from "@/utils";
import { getWarehouses } from "@/services/settings/warehouses";
import { getIronCategories, getIronTypeCatalog } from "@/services/ironCarShop";
import {
  getAvailableIronPurchases,
  getAvailableIronPurchasesSummary,
  getIronProcessingBatches,
  getIronPowderProfitReport,
  getIronWarehouseTransfers,
  getIronWarehouseStock,
  createBulkPhysicalIronSale,
  getPhysicalIronSalesReport,
  processBulkIronToPowder,
  transferIronPurchaseToWarehouse,
} from "@/services/ironCatalystFlow";
import type { Warehouse } from "@/types/settings";
import type { IronCategory, IronType } from "@/types/ironCarShop";
import type {
  AvailableIronPurchase,
  AvailableIronPurchasesSummary,
  IronWarehouseStock,
  IronProcessingBatch,
  IronPowderProfitReport,
  IronWarehouseTransfer,
  BulkPhysicalIronSaleAllocation,
  PhysicalIronSaleReportItem,
  BulkIronProcessingAllocation,
} from "@/types/ironCatalystFlow";
import styles from "./IronCatalystPowderFlow.module.css";

type FlowTab =
  | "purchases"
  | "transfers"
  | "processing"
  | "profit";

interface PhysicalIronSaleSource {
  ironPurchaseId: number;
  ironTypeName?: string;
  warehouseId: number;
  transferIds: number[];
  weightKg: number;
  availableWeightKg: number;
  totalCost: number;
  unitCost: number;
  transferredAt: string;
}

interface GroupedIronWarehouseStock {
  ironTypeName: string;
  purchasedWeightKg: number;
  transferredWeightKg: number;
  physicalSoldWeightKg: number;
  processingWeightKg: number;
  remainingWeightKg: number;
}

const PAGE_SIZE = 10;
const tabs: Array<{ id: FlowTab; label: string; icon: typeof Archive }> = [
  { id: "purchases", label: "ironCatalystFlow.tabs.purchases", icon: ShoppingCart },
  { id: "transfers", label: "ironCatalystFlow.tabs.transfers", icon: ArrowLeftRight },
  { id: "processing", label: "ironCatalystFlow.tabs.processing", icon: Factory },
  { id: "profit", label: "ironCatalystFlow.tabs.profit", icon: ChartNoAxesCombined },
];

const formatNumber = (value?: number | null, decimals = 3) =>
  Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });

const formatAmd = (value?: number | null) => `${formatNumber(value, 0)} AMD`;
const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString() : "—";
const formatDay = (value: string, locale?: string) => {
  const date = new Date(`${value}T00:00:00`);
  if (locale?.startsWith("am") || locale?.startsWith("hy")) {
    const weekdays = ["կիրակի", "երկուշաբթի", "երեքշաբթի", "չորեքշաբթի", "հինգշաբթի", "ուրբաթ", "շաբաթ"];
    const months = ["հունվարի", "փետրվարի", "մարտի", "ապրիլի", "մայիսի", "հունիսի", "հուլիսի", "օգոստոսի", "սեպտեմբերի", "հոկտեմբերի", "նոյեմբերի", "դեկտեմբերի"];
    return `${weekdays[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} թ.`;
  }
  return date.toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
const parseDecimalInput = (value: string) => Number(value.replace(",", "."));
const physicalIronSourceKey = (source: Pick<PhysicalIronSaleSource, "warehouseId" | "ironPurchaseId">) =>
  `${source.warehouseId}:${source.ironPurchaseId}`;
const formatPurchaseAllocations = (
  allocations: Array<{ ironPurchaseId: number; sourceWeightKg: number }> | undefined,
) => allocations?.length
  ? allocations.map((allocation) =>
    `#${allocation.ironPurchaseId} (${formatNumber(allocation.sourceWeightKg)} kg)`,
  ).join(", ")
  : "—";

export const IronCatalystPowderFlow = () => {
  const { t, i18n } = useTranslation();
  const column = (key: string) => t(`ironCatalystFlow.columns.${key}`);
  const cashRegisterId = useMemo(() => getCashRegisterId(), []);
  const [activeTab, setActiveTab] = useState<FlowTab>("purchases");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [ironTypes, setIronTypes] = useState<IronType[]>([]);
  const [ironCategories, setIronCategories] = useState<IronCategory[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [purchases, setPurchases] = useState<AvailableIronPurchase[]>([]);
  const [purchaseSummary, setPurchaseSummary] = useState<AvailableIronPurchasesSummary | null>(null);
  const [purchaseFilters, setPurchaseFilters] = useState({ ironTypeId: "", categoryId: "" });
  const [purchaseDateFilters, setPurchaseDateFilters] = useState({ fromDate: "", toDate: "" });
  const [purchasePage, setPurchasePage] = useState(1);
  const [transfers, setTransfers] = useState<IronWarehouseTransfer[]>([]);
  const [ironWarehouseStock, setIronWarehouseStock] = useState<IronWarehouseStock[]>([]);
  const [processingBatches, setProcessingBatches] = useState<IronProcessingBatch[]>([]);
  const [profitReport, setProfitReport] = useState<IronPowderProfitReport | null>(null);
  const [physicalIronSalesReport, setPhysicalIronSalesReport] = useState<PhysicalIronSaleReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);
  const [transferTarget, setTransferTarget] = useState<AvailableIronPurchase | null>(null);
  const [transferForm, setTransferForm] = useState({ warehouseId: "", weightKg: "" });
  const [transferAttempted, setTransferAttempted] = useState(false);
  const [selectedBulkIronPurchases, setSelectedBulkIronPurchases] = useState<Record<string, boolean>>({});
  const [bulkPhysicalSaleOpen, setBulkPhysicalSaleOpen] = useState(false);
  const [bulkPhysicalSaleWeights, setBulkPhysicalSaleWeights] = useState<Record<string, string>>({});
  const [bulkPhysicalSaleForm, setBulkPhysicalSaleForm] = useState({ unitSalePrice: "", extraExpenses: "0" });
  const [bulkProcessingOpen, setBulkProcessingOpen] = useState(false);
  const [bulkProcessingWeights, setBulkProcessingWeights] = useState<Record<string, string>>({});
  const [bulkProcessingForm, setBulkProcessingForm] = useState({
    powderWeightKg: "",
    ptPerKg: "",
    pdPerKg: "",
    rhPerKg: "",
    processingExpenses: "0",
  });
  const [transferFilters, setTransferFilters] = useState({ purchaseId: "", fromDate: "", toDate: "" });
  const [reportFilters, setReportFilters] = useState({ dateFrom: "", dateTo: "" });

  const chosenWarehouseId = Number(warehouseId) || undefined;
  const apiLanguage = (i18n.resolvedLanguage || i18n.language).toLowerCase().split("-")[0] === "am"
    ? "hy"
    : (i18n.resolvedLanguage || i18n.language).toLowerCase().split("-")[0];
  const purchaseFilterParams = useMemo(() => ({
    ironTypeId: Number(purchaseFilters.ironTypeId) || undefined,
    categoryId: Number(purchaseFilters.categoryId) || undefined,
    lang: apiLanguage,
  }), [apiLanguage, purchaseFilters]);

  const loadPurchaseData = useCallback(async () => {
    const [purchaseRows, summary] = await Promise.all([
      getAvailableIronPurchases(cashRegisterId, purchaseFilterParams),
      getAvailableIronPurchasesSummary(cashRegisterId, purchaseFilterParams),
    ]);
    setPurchases(purchaseRows);
    setPurchaseSummary(summary);
  }, [cashRegisterId, purchaseFilterParams]);

  const loadSection = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      switch (activeTab) {
        case "purchases":
          await loadPurchaseData();
          break;
        case "transfers": {
          const [transferRows, stockRows] = await Promise.all([
            getIronWarehouseTransfers({ warehouseId: chosenWarehouseId, lang: apiLanguage }, cashRegisterId),
            chosenWarehouseId
              ? getIronWarehouseStock(chosenWarehouseId, apiLanguage, cashRegisterId)
              : Promise.resolve([]),
          ]);
          setTransfers(transferRows);
          setIronWarehouseStock(stockRows);
          break;
        }
        case "processing": {
          const batchRows = await getIronProcessingBatches(chosenWarehouseId, cashRegisterId);
          setProcessingBatches(batchRows);
          break;
        }
        case "profit": {
          const reportParams = {
            warehouseId: chosenWarehouseId,
            fromUtc: reportFilters.dateFrom
              ? new Date(`${reportFilters.dateFrom}T00:00:00`).toISOString()
              : undefined,
            toUtc: reportFilters.dateTo
              ? new Date(`${reportFilters.dateTo}T23:59:59`).toISOString()
              : undefined,
          };
          const [profit, physicalSales] = await Promise.all([
            getIronPowderProfitReport(reportParams, cashRegisterId),
            getPhysicalIronSalesReport(reportParams, cashRegisterId),
          ]);
          setProfitReport(profit);
          setPhysicalIronSalesReport(physicalSales);
          break;
        }
      }
    } catch (error) {
      const message = getApiErrorMessage(error, t("ironCatalystFlow.errors.loadFailed"));
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, [
    activeTab,
    cashRegisterId,
    chosenWarehouseId,
    apiLanguage,
    loadPurchaseData,
    reportFilters,
    t,
  ]);

  useEffect(() => {
    let current = true;
    Promise.all([
      getWarehouses(cashRegisterId),
      getIronTypeCatalog(cashRegisterId),
      getIronCategories(cashRegisterId),
    ])
      .then(([warehouseRows, ironTypeRows, categoryRows]) => {
        if (!current) return;
        setWarehouses(warehouseRows as Warehouse[]);
        setIronTypes(ironTypeRows);
        setIronCategories(categoryRows);
        setWarehouseId((currentWarehouse) => currentWarehouse || String(warehouseRows[0]?.id ?? ""));
      })
      .catch((error: unknown) => {
        if (current) setLoadError(getApiErrorMessage(error, t("ironCatalystFlow.errors.loadWarehouses")));
      });
    return () => { current = false; };
  }, [cashRegisterId, t]);

  useEffect(() => {
    void loadSection();
  }, [loadSection]);

  const filteredPurchases = useMemo(() => purchases.filter((purchase) => {
    const purchasedDate = purchase.purchasedAt.slice(0, 10);
    if (purchaseDateFilters.fromDate && purchasedDate < purchaseDateFilters.fromDate) return false;
    if (purchaseDateFilters.toDate && purchasedDate > purchaseDateFilters.toDate) return false;
    return true;
  }), [purchases, purchaseDateFilters]);
  const purchasesByDay = useMemo(() => {
    const days = new Map<string, AvailableIronPurchase[]>();
    for (const purchase of filteredPurchases) {
      const day = purchase.purchasedAt.slice(0, 10);
      days.set(day, [...(days.get(day) ?? []), purchase]);
    }
    return [...days.entries()]
      .sort(([firstDay], [secondDay]) => secondDay.localeCompare(firstDay))
      .map(([day, dayPurchases]) => ({
        day,
        purchases: dayPurchases.sort((first, second) =>
          second.purchasedAt.localeCompare(first.purchasedAt) || second.purchaseId - first.purchaseId,
        ),
        purchasedWeightKg: dayPurchases.reduce((total, purchase) => total + purchase.purchasedWeightKg, 0),
        transferredWeightKg: dayPurchases.reduce((total, purchase) => total + purchase.transferredWeightKg, 0),
        remainingWeightKg: dayPurchases.reduce((total, purchase) => total + purchase.remainingWeightKg, 0),
      }));
  }, [filteredPurchases]);
  const purchasePageCount = Math.max(1, Math.ceil(filteredPurchases.length / PAGE_SIZE));
  const visiblePurchaseIds = useMemo(
    () => new Set(filteredPurchases
      .slice((purchasePage - 1) * PAGE_SIZE, purchasePage * PAGE_SIZE)
      .map((purchase) => purchase.purchaseId)),
    [filteredPurchases, purchasePage],
  );
  useEffect(() => {
    setPurchasePage(1);
  }, [purchaseFilters, purchaseDateFilters]);

  useEffect(() => {
    setPurchasePage((page) => Math.min(page, purchasePageCount));
  }, [purchasePageCount]);
  const physicalIronSaleSources = useMemo(() => {
    const sources = new Map<string, PhysicalIronSaleSource>();
    for (const transfer of transfers) {
      const key = `${transfer.warehouseId}:${transfer.ironPurchaseId}`;
      const source = sources.get(key);
      if (source) {
        source.ironTypeName = source.ironTypeName || transfer.ironTypeName || undefined;
        source.transferIds.push(transfer.id);
        source.weightKg += transfer.weightKg;
        source.totalCost += transfer.totalCost;
        source.unitCost = source.totalCost / source.weightKg;
        if (transfer.transferredAt > source.transferredAt) source.transferredAt = transfer.transferredAt;
      } else {
        sources.set(key, {
          ironPurchaseId: transfer.ironPurchaseId,
          ironTypeName: transfer.ironTypeName || undefined,
          warehouseId: transfer.warehouseId,
          transferIds: [transfer.id],
          weightKg: transfer.weightKg,
          availableWeightKg: transfer.weightKg,
          totalCost: transfer.totalCost,
          unitCost: transfer.unitCost,
          transferredAt: transfer.transferredAt,
        });
      }
    }
    const remainingByPurchase = new Map<number, number>();
    for (const stock of ironWarehouseStock) {
      const purchaseId = stock.purchaseId ?? stock.ironPurchaseId;
      if (purchaseId != null) remainingByPurchase.set(purchaseId, stock.remainingWeightKg);
    }
    for (const source of sources.values()) {
      source.availableWeightKg = remainingByPurchase.get(source.ironPurchaseId) ?? 0;
    }
    return [...sources.values()];
  }, [transfers, ironWarehouseStock]);
  const ironWarehouseStockByType = useMemo(() => {
    const grouped = new Map<string, GroupedIronWarehouseStock>();
    for (const stock of ironWarehouseStock) {
      const ironTypeName = stock.ironTypeName?.trim() || "—";
      const key = ironTypeName.toLocaleLowerCase();
      const current = grouped.get(key) ?? {
        ironTypeName,
        purchasedWeightKg: 0,
        transferredWeightKg: 0,
        physicalSoldWeightKg: 0,
        processingWeightKg: 0,
        remainingWeightKg: 0,
      };
      current.purchasedWeightKg += stock.purchasedWeightKg;
      current.transferredWeightKg += stock.transferredWeightKg;
      current.physicalSoldWeightKg += stock.physicalSoldWeightKg;
      current.processingWeightKg += stock.processingWeightKg;
      current.remainingWeightKg += stock.remainingWeightKg;
      grouped.set(key, current);
    }
    return [...grouped.values()].sort((first, second) =>
      first.ironTypeName.localeCompare(second.ironTypeName),
    );
  }, [ironWarehouseStock]);
  const selectedBulkPhysicalSources = physicalIronSaleSources.filter(
    (source) => selectedBulkIronPurchases[physicalIronSourceKey(source)],
  );
  const bulkPhysicalSaleTotalWeight = selectedBulkPhysicalSources.reduce(
    (total, source) => total + (parseDecimalInput(bulkPhysicalSaleWeights[physicalIronSourceKey(source)] ?? "") || 0),
    0,
  );
  const bulkProcessingTotalWeight = selectedBulkPhysicalSources.reduce(
    (total, source) => total + (parseDecimalInput(bulkProcessingWeights[physicalIronSourceKey(source)] ?? "") || 0),
    0,
  );
  const handleTransfer = async () => {
    if (!transferTarget) return;
    setTransferAttempted(true);
    const selectedWarehouse = Number(transferForm.warehouseId);
    const weightKg = Number(transferForm.weightKg);
    if (!selectedWarehouse || !Number.isFinite(weightKg) || weightKg <= 0 || weightKg > transferTarget.remainingWeightKg) {
      toast.error(t("ironCatalystFlow.errors.invalidTransfer"));
      return;
    }
    setMutating(true);
    try {
      await transferIronPurchaseToWarehouse(transferTarget.purchaseId, selectedWarehouse, weightKg, cashRegisterId);
      toast.success(t("ironCatalystFlow.success.transferred"));
      setTransferTarget(null);
      setTransferForm({ warehouseId: "", weightKg: "" });
      setActiveTab("purchases");
      const [transferRows] = await Promise.all([
        getIronWarehouseTransfers({ warehouseId: selectedWarehouse, lang: apiLanguage }, cashRegisterId),
        loadPurchaseData(),
      ]);
      setTransfers(transferRows);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("ironCatalystFlow.errors.transferFailed")));
    } finally {
      setMutating(false);
    }
  };

  const toggleBulkPhysicalSource = (source: PhysicalIronSaleSource, checked: boolean) => {
    const sourceKey = physicalIronSourceKey(source);
    setSelectedBulkIronPurchases((selected) => ({
      ...selected,
      [sourceKey]: checked,
    }));
    setBulkPhysicalSaleWeights((weights) => {
      const next = { ...weights };
      if (checked) next[sourceKey] = String(source.availableWeightKg);
      else delete next[sourceKey];
      return next;
    });
    setBulkProcessingWeights((weights) => {
      const next = { ...weights };
      if (checked) next[sourceKey] = String(source.availableWeightKg);
      else delete next[sourceKey];
      return next;
    });
  };

  const submitBulkPhysicalIronSale = async () => {
    const allocations: BulkPhysicalIronSaleAllocation[] = selectedBulkPhysicalSources.map((source) => ({
      ironPurchaseId: source.ironPurchaseId,
      weightKg: parseDecimalInput(bulkPhysicalSaleWeights[physicalIronSourceKey(source)] ?? ""),
    }));
    const unitSalePrice = Number(bulkPhysicalSaleForm.unitSalePrice);
    const extraExpenses = Number(bulkPhysicalSaleForm.extraExpenses);
    const allocationIsInvalid = allocations.some((allocation) => {
      const source = selectedBulkPhysicalSources.find(
        (item) => item.ironPurchaseId === allocation.ironPurchaseId,
      );
      return !source || !Number.isFinite(allocation.weightKg) ||
        allocation.weightKg <= 0 || allocation.weightKg > source.availableWeightKg;
    });
    if (
      allocations.length < 1 ||
      allocationIsInvalid ||
      !bulkPhysicalSaleForm.unitSalePrice.trim() ||
      !Number.isFinite(unitSalePrice) ||
      unitSalePrice < 0 ||
      !Number.isFinite(extraExpenses) ||
      extraExpenses < 0 ||
      new Set(allocations.map((allocation) => allocation.ironPurchaseId)).size !== allocations.length
    ) {
      toast.error(t("ironCatalystFlow.errors.invalidPhysicalSale"));
      return;
    }
    const sourceWarehouseIds = new Set(selectedBulkPhysicalSources.map((source) => source.warehouseId));
    if (sourceWarehouseIds.size !== 1) {
      toast.error(t("ironCatalystFlow.errors.invalidPhysicalSale"));
      return;
    }
    const saleWarehouseId = selectedBulkPhysicalSources[0].warehouseId;
    setMutating(true);
    try {
      const response = await createBulkPhysicalIronSale({
        warehouseId: saleWarehouseId,
        allocations,
        unitSalePrice,
        extraExpenses,
      }, cashRegisterId);
      toast.success(`${t("ironCatalystFlow.success.physicalIronSold")} ${formatAmd(response.profit)}`);
      setBulkPhysicalSaleOpen(false);
      setSelectedBulkIronPurchases({});
      setBulkPhysicalSaleWeights({});
      setBulkProcessingWeights({});
      setBulkPhysicalSaleForm({ unitSalePrice: "", extraExpenses: "0" });
      try {
        const [transferRows, stockRows] = await Promise.all([
          getIronWarehouseTransfers({ warehouseId: saleWarehouseId, lang: apiLanguage }, cashRegisterId),
          getIronWarehouseStock(saleWarehouseId, apiLanguage, cashRegisterId),
        ]);
        setTransfers(transferRows);
        setIronWarehouseStock(stockRows);
      } catch (refreshError) {
        toast.error(getApiErrorMessage(refreshError, t("ironCatalystFlow.errors.loadFailed")));
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("ironCatalystFlow.errors.saleFailed")));
    } finally {
      setMutating(false);
    }
  };

  const submitBulkIronProcessing = async () => {
    const allocations: BulkIronProcessingAllocation[] = selectedBulkPhysicalSources.map((source) => ({
      ironPurchaseId: source.ironPurchaseId,
      sourceWeightKg: parseDecimalInput(bulkProcessingWeights[physicalIronSourceKey(source)] ?? ""),
    }));
    const powderWeightKg = parseDecimalInput(bulkProcessingForm.powderWeightKg);
    const ptPerKg = parseDecimalInput(bulkProcessingForm.ptPerKg);
    const pdPerKg = parseDecimalInput(bulkProcessingForm.pdPerKg);
    const rhPerKg = parseDecimalInput(bulkProcessingForm.rhPerKg);
    const processingExpenses = parseDecimalInput(bulkProcessingForm.processingExpenses);
    const allocationIsInvalid = allocations.some((allocation) => {
      const source = selectedBulkPhysicalSources.find(
        (item) => item.ironPurchaseId === allocation.ironPurchaseId,
      );
      return !source || !Number.isFinite(allocation.sourceWeightKg) ||
        allocation.sourceWeightKg <= 0 || allocation.sourceWeightKg > source.availableWeightKg;
    });
    const processingValues = [powderWeightKg, ptPerKg, pdPerKg, rhPerKg, processingExpenses];
    const sourceWarehouseIds = new Set(selectedBulkPhysicalSources.map((source) => source.warehouseId));
    if (
      allocations.length < 1 ||
      allocationIsInvalid ||
      processingValues.some((value) => !Number.isFinite(value)) ||
      powderWeightKg <= 0 ||
      ptPerKg < 0 ||
      pdPerKg < 0 ||
      rhPerKg < 0 ||
      processingExpenses < 0 ||
      sourceWarehouseIds.size !== 1 ||
      new Set(allocations.map((allocation) => allocation.ironPurchaseId)).size !== allocations.length
    ) {
      toast.error(t("ironCatalystFlow.errors.invalidProcessing"));
      return;
    }

    setMutating(true);
    try {
      const response = await processBulkIronToPowder({
        warehouseId: selectedBulkPhysicalSources[0].warehouseId,
        allocations,
        powderWeightKg,
        ptPerKg,
        pdPerKg,
        rhPerKg,
        processingExpenses,
      }, cashRegisterId);
      const batch = { ...response.batch, allocations: response.allocations };
      setProcessingBatches((batches) => [batch, ...batches.filter((item) => item.id !== batch.id)]);
      setBulkProcessingOpen(false);
      setSelectedBulkIronPurchases({});
      setBulkPhysicalSaleWeights({});
      setBulkProcessingWeights({});
      setBulkProcessingForm({
        powderWeightKg: "",
        ptPerKg: "",
        pdPerKg: "",
        rhPerKg: "",
        processingExpenses: "0",
      });
      toast.success(t("ironCatalystFlow.success.processed"));
      setActiveTab("processing");
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("ironCatalystFlow.errors.processingFailed")));
    } finally {
      setMutating(false);
    }
  };

  const renderTable = (headers: string[], rows: React.ReactNode[][]) => (
    <PaginatedTable headers={headers} rows={rows} />
  );

  const renderPurchaseBreakdown = (
    title: string,
    items: Array<{
      id: number;
      name: string;
      purchasedWeightKg: number;
      transferredWeightKg: number;
      remainingWeightKg: number;
    }>,
  ) => (
    <section className={styles.purchaseBreakdown}>
      <h3>{title}</h3>
      {items.length > 0 ? (
        <div className={styles.purchaseBreakdownList}>
          {items.map((item) => (
            <div className={styles.purchaseBreakdownRow} key={item.id}>
              <strong>{item.name || `#${item.id}`}</strong>
              <div className={styles.purchaseBreakdownValues}>
                <span>{t("ironCatalystFlow.purchaseSummary.purchased")}: <b>{formatNumber(item.purchasedWeightKg)} kg</b></span>
                <span>{t("ironCatalystFlow.purchaseSummary.transferred")}: <b>{formatNumber(item.transferredWeightKg)} kg</b></span>
                <span>{t("ironCatalystFlow.purchaseSummary.remaining")}: <b>{formatNumber(item.remainingWeightKg)} kg</b></span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.purchaseBreakdownEmpty}>{t("ironCatalystFlow.purchaseSummary.noGroups")}</div>
      )}
    </section>
  );

  const renderPurchases = () => (
    <div className={styles.purchaseSection}>
      <div className={styles.filterRow}>
        <Select
          label={t("ironCatalystFlow.filters.ironType")}
          value={purchaseFilters.ironTypeId}
          onChange={(event) => setPurchaseFilters((filters) => ({ ...filters, ironTypeId: event.target.value }))}
        >
          <option value="">{t("common.all")}</option>
          {ironTypes.map((ironType) => (
            <option key={ironType.id} value={ironType.id}>{ironType.name || ironType.code}</option>
          ))}
        </Select>
        <Select
          label={t("ironCatalystFlow.filters.category")}
          value={purchaseFilters.categoryId}
          onChange={(event) => setPurchaseFilters((filters) => ({ ...filters, categoryId: event.target.value }))}
        >
          <option value="">{t("common.all")}</option>
          {ironCategories.filter((category) => category.isActive).map((category) => (
            <option key={category.id} value={category.id}>{category.name || category.code}</option>
          ))}
        </Select>
        <TextField
          type="date"
          label={t("ironCatalystFlow.filters.fromDate")}
          value={purchaseDateFilters.fromDate}
          max={purchaseDateFilters.toDate || undefined}
          onChange={(event) => setPurchaseDateFilters((filters) => ({ ...filters, fromDate: event.target.value }))}
        />
        <TextField
          type="date"
          label={t("ironCatalystFlow.filters.toDate")}
          value={purchaseDateFilters.toDate}
          min={purchaseDateFilters.fromDate || undefined}
          onChange={(event) => setPurchaseDateFilters((filters) => ({ ...filters, toDate: event.target.value }))}
        />
      </div>

      {purchaseSummary && (
        <section className={styles.purchaseSummary}>
          <div className={styles.metricGrid}>
            <Metric label={t("ironCatalystFlow.purchaseSummary.totalPurchasedWeight")} value={`${formatNumber(purchaseSummary.totalPurchasedWeightKg)} kg`} />
            <Metric label={t("ironCatalystFlow.purchaseSummary.totalTransferredWeight")} value={`${formatNumber(purchaseSummary.totalTransferredWeightKg)} kg`} />
            <Metric label={t("ironCatalystFlow.purchaseSummary.totalRemainingWeight")} value={`${formatNumber(purchaseSummary.totalRemainingWeightKg)} kg`} accent />
          </div>
          <div className={styles.purchaseBreakdowns}>
            {renderPurchaseBreakdown(t("ironCatalystFlow.purchaseSummary.byIronType"), purchaseSummary.byIronType)}
            {renderPurchaseBreakdown(t("ironCatalystFlow.purchaseSummary.byCategory"), purchaseSummary.byCategory)}
          </div>
        </section>
      )}

      {purchasesByDay.length > 0 ? (
        <>
          <div className={styles.purchaseDays}>
            {purchasesByDay
              .filter((day) => day.purchases.some((purchase) => visiblePurchaseIds.has(purchase.purchaseId)))
              .map((day) => (
                <section className={styles.purchaseDay} key={day.day}>
                  <header className={styles.purchaseDayHeader}>
                    <div>
                      <h3>{formatDay(
                        day.day,
                        localStorage.getItem("i18nextLng") || i18n.resolvedLanguage || i18n.language,
                      )}</h3>
                      <span>{t("ironCatalystFlow.purchaseSummary.dayPurchaseCount", { count: day.purchases.length })}</span>
                    </div>
                    <div className={styles.purchaseDayMetrics}>
                      <span>{t("ironCatalystFlow.purchaseSummary.purchased")}: <strong>{formatNumber(day.purchasedWeightKg)} kg</strong></span>
                      <span>{t("ironCatalystFlow.purchaseSummary.transferred")}: <strong>{formatNumber(day.transferredWeightKg)} kg</strong></span>
                      <span>{t("ironCatalystFlow.purchaseSummary.remaining")}: <strong>{formatNumber(day.remainingWeightKg)} kg</strong></span>
                    </div>
                  </header>
                  <div className={styles.purchaseCards}>
                    {day.purchases.filter((purchase) => visiblePurchaseIds.has(purchase.purchaseId)).map((purchase) => (
                      <article className={styles.purchaseCard} key={purchase.purchaseId}>
                        <div className={styles.purchaseCardHeader}>
                          <span className={styles.purchaseCardId}>#{purchase.purchaseId}</span>
                          {purchase.recalculationStep == null
                            ? <span className={styles.purchaseCardBadge}>{t("ironCatalystFlow.purchaseSummary.regularPrice")}</span>
                            : <span className={styles.purchaseCardBadge}>{t("ironCatalystFlow.purchaseSummary.recalculationStep", { step: purchase.recalculationStep })}</span>}
                        </div>
                        <div className={styles.purchaseCardIdentity}>
                          <strong>{purchase.brandName || (purchase.dictBrandId ? `#${purchase.dictBrandId}` : "—")}</strong>
                          <span>
                            {t("ironCatalystFlow.columns.customerName")}: {purchase.customerName || `#${purchase.customerId}`}
                            {purchase.customerName && ` (#${purchase.customerId})`}
                          </span>
                          {purchase.customerPhone && (
                            <span>{t("ironCatalystFlow.columns.customerPhone")}: {purchase.customerPhone}</span>
                          )}
                        </div>
                        <div className={styles.purchaseCardDetails}>
                          <span>{t("ironCatalystFlow.columns.ironType")}<strong>{purchase.ironTypeName || `#${purchase.ironTypeId}`}</strong></span>
                          <span>{t("ironCatalystFlow.columns.category")}<strong>{purchase.categoryName || "—"}</strong></span>
                          <span>{t("ironCatalystFlow.columns.customerType")}<strong>{purchase.customerTypeName || `#${purchase.customerTypeId}`}</strong></span>
                          <span>{t("ironCatalystFlow.columns.purchaseCost")}<strong>{formatAmd(purchase.totalPurchaseCost)}</strong></span>
                        </div>
                        <div className={styles.purchaseCardWeights}>
                          <span>{t("ironCatalystFlow.purchaseSummary.purchased")}<strong>{formatNumber(purchase.purchasedWeightKg)} kg</strong></span>
                          <span>{t("ironCatalystFlow.purchaseSummary.transferred")}<strong>{formatNumber(purchase.transferredWeightKg)} kg</strong></span>
                          <span>{t("ironCatalystFlow.purchaseSummary.remaining")}<strong>{formatNumber(purchase.remainingWeightKg)} kg</strong></span>
                        </div>
                        <Button size="small" onClick={() => {
                          setTransferTarget(purchase);
                          setTransferAttempted(false);
                          setTransferForm({ warehouseId: warehouseId || "", weightKg: String(purchase.remainingWeightKg) });
                        }}>
                          <ArrowLeftRight size={14} />{t("ironCatalystFlow.actions.transfer")}
                        </Button>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
          </div>
          {purchasePageCount > 1 && (
            <div className={styles.pagination}>
              <Button
                variant="secondary"
                size="small"
                disabled={purchasePage <= 1}
                onClick={() => setPurchasePage((page) => page - 1)}
              >
                <ChevronLeft size={15} />{t("common.previous")}
              </Button>
              <span>{purchasePage} / {purchasePageCount}</span>
              <Button
                variant="secondary"
                size="small"
                disabled={purchasePage >= purchasePageCount}
                onClick={() => setPurchasePage((page) => page + 1)}
              >
                {t("common.next")}<ChevronRight size={15} />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className={styles.emptyState}>{t("ironCatalystFlow.empty")}</div>
      )}
    </div>
  );

  const renderTransfers = () => (
    <>
      <section className={styles.ironStockPanel}>
        <h3>{t("ironCatalystFlow.warehouseStock.title")}</h3>
        {ironWarehouseStockByType.length > 0 ? (
          renderTable(
            ["ironType", "purchasedWeight", "transferredWeight", "physicalSoldWeight", "processingWeight", "remainingWeight"].map(column),
            ironWarehouseStockByType.map((stock) => [
              stock.ironTypeName,
              `${formatNumber(stock.purchasedWeightKg)} kg`,
              `${formatNumber(stock.transferredWeightKg)} kg`,
              `${formatNumber(stock.physicalSoldWeightKg)} kg`,
              `${formatNumber(stock.processingWeightKg)} kg`,
              `${formatNumber(stock.remainingWeightKg)} kg`,
            ]),
          )
        ) : (
          <div className={styles.purchaseBreakdownEmpty}>{t("ironCatalystFlow.empty")}</div>
        )}
      </section>
      <div className={styles.filterRow}>
        <TextField type="number" label={t("ironCatalystFlow.filters.purchaseId")} value={transferFilters.purchaseId} onChange={(event) => setTransferFilters((filters) => ({ ...filters, purchaseId: event.target.value }))} />
        <TextField type="date" label={t("ironCatalystFlow.filters.fromDate")} value={transferFilters.fromDate} onChange={(event) => setTransferFilters((filters) => ({ ...filters, fromDate: event.target.value }))} />
        <TextField type="date" label={t("ironCatalystFlow.filters.toDate")} value={transferFilters.toDate} onChange={(event) => setTransferFilters((filters) => ({ ...filters, toDate: event.target.value }))} />
      </div>
      <div className={styles.bulkSaleActions}>
        <span>{t("ironCatalystFlow.physicalIronSale.selectedSources", { count: selectedBulkPhysicalSources.length })}</span>
        <Button
          variant="primary"
          disabled={selectedBulkPhysicalSources.length < 1 || mutating}
          onClick={() => {
            setBulkPhysicalSaleWeights(Object.fromEntries(
              selectedBulkPhysicalSources.map((source) => [
                physicalIronSourceKey(source),
                String(source.availableWeightKg),
              ]),
            ));
            setBulkPhysicalSaleOpen(true);
          }}
        >
          <Coins size={17} aria-hidden="true" />
          {t("ironCatalystFlow.actions.sellSelectedIron")}
        </Button>
        <Button
          variant="primary"
          disabled={selectedBulkPhysicalSources.length < 1 || mutating}
          onClick={() => {
            setBulkProcessingWeights(Object.fromEntries(
              selectedBulkPhysicalSources.map((source) => [
                physicalIronSourceKey(source),
                String(source.availableWeightKg),
              ]),
            ));
            setBulkProcessingOpen(true);
          }}
        >
          <Factory size={17} aria-hidden="true" />
          {t("ironCatalystFlow.actions.processSelectedIron")}
        </Button>
      </div>
      {renderTable(
        ["select", "transferId", "purchaseId", "ironType", "warehouse", "weight", "unitCost", "totalCost", "transferredAt"].map(column),
        physicalIronSaleSources.filter((item) => {
          if (transferFilters.purchaseId && item.ironPurchaseId !== Number(transferFilters.purchaseId)) return false;
          const date = item.transferredAt.slice(0, 10);
          if (transferFilters.fromDate && date < transferFilters.fromDate) return false;
          if (transferFilters.toDate && date > transferFilters.toDate) return false;
          return true;
        }).map((item) => [
          <input
            key="select"
            type="checkbox"
            checked={Boolean(selectedBulkIronPurchases[physicalIronSourceKey(item)])}
            disabled={
              item.availableWeightKg <= 0 ||
              (selectedBulkPhysicalSources.length > 0 &&
                selectedBulkPhysicalSources[0].warehouseId !== item.warehouseId)
            }
            aria-label={t("ironCatalystFlow.physicalIronSale.selectSource", { id: item.ironPurchaseId })}
            onChange={(event) => toggleBulkPhysicalSource(item, event.target.checked)}
          />,
          item.transferIds.map((id) => `#${id}`).join(", "),
          `#${item.ironPurchaseId}`,
          item.ironTypeName || "—",
          warehouses.find((warehouse) => warehouse.id === item.warehouseId)?.code || `#${item.warehouseId}`,
          `${formatNumber(item.availableWeightKg)} kg`,
          formatAmd(item.unitCost),
          formatAmd(item.totalCost),
          formatDate(item.transferredAt),
        ]),
      )}
    </>
  );

  const renderProcessingBatches = () => renderTable(
    ["batchId", "purchaseId", "sourceWeight", "powderWeight", "remainingPowder", "ptPerKg", "pdPerKg", "rhPerKg", "allocatedPurchaseCost", "processingExpenses", "totalCost", "createdAt"].map(column),
          processingBatches.map((batch) => [
      `#${batch.id}`,
      batch.allocations?.length
        ? formatPurchaseAllocations(batch.allocations)
        : batch.ironPurchaseId > 0 ? `#${batch.ironPurchaseId}` : "—",
      `${formatNumber(batch.sourceWeightKg)} kg`,
      `${formatNumber(batch.powderWeightKg)} kg`,
      `${formatNumber(batch.remainingPowderKg)} kg`,
      formatNumber(batch.ptPerKg),
      formatNumber(batch.pdPerKg),
      formatNumber(batch.rhPerKg),
        formatAmd(batch.allocatedPurchaseCost),
      formatAmd(batch.processingExpenses),
      formatAmd(batch.totalCost),
      formatDate(batch.createdAt),
    ]),
  );

  const renderProfit = () => (
    <>
      <div className={styles.filterRow}>
        <TextField type="date" label={t("common.fromDate")} value={reportFilters.dateFrom} onChange={(event) => setReportFilters((value) => ({ ...value, dateFrom: event.target.value }))} />
        <TextField type="date" label={t("common.toDate")} value={reportFilters.dateTo} onChange={(event) => setReportFilters((value) => ({ ...value, dateTo: event.target.value }))} />
      </div>
      {profitReport ? (
        <>
          <div className={styles.metricGrid}>
            <Metric label={t("ironCatalystFlow.metrics.physicalIronRevenue")} value={formatAmd(profitReport.physicalIronRevenue)} />
            <Metric label={t("ironCatalystFlow.metrics.physicalIronCost")} value={formatAmd(profitReport.physicalIronCost)} />
            <Metric label={t("ironCatalystFlow.metrics.physicalIronProfit")} value={formatAmd(profitReport.physicalIronProfit)} />
            <Metric label={t("ironCatalystFlow.metrics.powderRevenue")} value={formatAmd(profitReport.powderRevenue)} />
            <Metric label={t("ironCatalystFlow.metrics.powderCost")} value={formatAmd(profitReport.powderCost)} />
            <Metric label={t("ironCatalystFlow.metrics.powderProfit")} value={formatAmd(profitReport.powderProfit)} />
            <Metric label={t("ironCatalystFlow.metrics.revenue")} value={formatAmd(profitReport.totalRevenue)} />
            <Metric label={t("ironCatalystFlow.metrics.totalCost")} value={formatAmd(profitReport.totalCost)} />
            <Metric label={t("ironCatalystFlow.metrics.totalProfit")} value={formatAmd(profitReport.totalProfit)} accent />
            <Metric label={t("ironCatalystFlow.metrics.physicalIronSoldWeight")} value={`${formatNumber(profitReport.physicalIronSoldWeightKg)} kg`} />
            <Metric label={t("ironCatalystFlow.metrics.powderSoldWeight")} value={`${formatNumber(profitReport.powderSoldWeightKg)} kg`} />
          </div>
          {renderTable([t("ironCatalystFlow.metrics.physicalIronProfit"), t("ironCatalystFlow.metrics.powderProfit"), t("ironCatalystFlow.metrics.totalProfit")], [[
            formatAmd(profitReport.physicalIronProfit),
            formatAmd(profitReport.powderProfit),
            <strong key="combined">{formatAmd(profitReport.totalProfit)}</strong>,
          ]])}
          <h3 className={styles.reportSubheading}>{t("ironCatalystFlow.physicalIronSale.reportTitle")}</h3>
          {renderTable(
            ["saleId", "purchaseId", "weight", "unitSalePrice", "extraExpenses", "totalCost", "profit", "soldAt"].map((key) =>
              key === "saleId" ? t("ironCatalystFlow.physicalIronSale.saleId")
                : key === "unitSalePrice" ? t("ironCatalystFlow.physicalIronSale.unitSalePrice")
                  : key === "extraExpenses" ? t("ironCatalystFlow.physicalIronSale.extraExpenses")
                    : column(key),
            ),
            physicalIronSalesReport.map((sale) => [
              `#${sale.id}`,
              sale.allocations.map((allocation) => `#${allocation.ironPurchaseId}: ${formatNumber(allocation.weightKg)} kg`).join(" · "),
              `${formatNumber(sale.weightKg)} kg`,
              formatAmd(sale.unitSalePrice),
              formatAmd(sale.extraExpenses),
              formatAmd(sale.totalCost),
              formatAmd(sale.profit),
              formatDate(sale.soldAt),
            ]),
          )}
          {physicalIronSalesReport.map((sale) => (
            <div className={styles.physicalSaleAllocations} key={sale.id}>
              <strong>{t("ironCatalystFlow.physicalIronSale.allocationCosts", { id: sale.id })}</strong>
              {sale.allocations.map((allocation) => (
                <span key={allocation.ironPurchaseId}>
                  #{allocation.ironPurchaseId}: {formatNumber(allocation.weightKg)} kg · {formatAmd(allocation.allocatedCost)}
                  {allocation.allocatedExpenses != null && ` · ${formatAmd(allocation.allocatedExpenses)}`}
                </span>
              ))}
            </div>
          ))}
        </>
      ) : <div className={styles.emptyState}>{t("ironCatalystFlow.empty")}</div>}
    </>
  );

  const selectedTab = tabs.find((tab) => tab.id === activeTab)!;
  const SelectedTabIcon = selectedTab.icon;
  const selectedTabKey = selectedTab.id;

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.headerTitle}>
          <span className={styles.headerIcon}><Workflow size={20} /></span>
          <div><span className={styles.eyebrow}>{t("ironCatalystFlow.eyebrow")}</span><h1>{t("ironCatalystFlow.title")}</h1><p>{t("ironCatalystFlow.description")}</p></div>
        </div>
        <div className={styles.warehouseControl}>
          <Select label={t("ironCatalystFlow.warehouse")} value={warehouseId} onChange={(event) => {
            setWarehouseId(event.target.value);
            setSelectedBulkIronPurchases({});
            setBulkPhysicalSaleWeights({});
            setBulkProcessingWeights({});
          }}>
            <option value="">{t("ironCatalystFlow.selectWarehouse")}</option>
            {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.code}</option>)}
          </Select>
        </div>
      </header>

      <nav className={styles.tabRail} aria-label={t("ironCatalystFlow.title")}>
        {tabs.map(({ id, label, icon: Icon }, index) => (
          <button type="button" key={id} className={`${styles.tab} ${activeTab === id ? styles.tabActive : ""}`} onClick={() => { setActiveTab(id); setLoadError(null); }} aria-current={activeTab === id ? "page" : undefined}>
            <Icon size={17} aria-hidden="true" /><span>{t(label)}</span><small>{String(index + 1).padStart(2, "0")}</small>
          </button>
        ))}
      </nav>

      <section className={styles.contentPanel}>
        <header className={styles.sectionHeader}>
          <div><span className={styles.sectionIcon}><SelectedTabIcon size={17} /></span><div><h2>{t(selectedTab.label)}</h2><p>{t(`ironCatalystFlow.sectionDescriptions.${selectedTabKey}`)}</p></div></div>
        </header>

        {isLoading && <div className={styles.loading} role="status"><LoaderCircle size={18} />{t("common.loading")}</div>}
        {loadError && !isLoading && <div className={styles.errorState} role="alert"><CircleAlert size={16} />{loadError}<Button size="small" variant="secondary" onClick={() => void loadSection()}>{t("ironCatalystFlow.actions.retry")}</Button></div>}
        {!isLoading && !loadError && (
          <>
            {activeTab === "purchases" && renderPurchases()}
            {activeTab === "transfers" && renderTransfers()}
            {activeTab === "processing" && (
              <section className={styles.historyPanel}><h3>{t("ironCatalystFlow.processing.history")}</h3>{renderProcessingBatches()}</section>
            )}
            {activeTab === "profit" && renderProfit()}
          </>
        )}
      </section>

      {bulkPhysicalSaleOpen && (
        <ConfirmationModal
          open
          preventClose
          onOpenChange={(open) => !open && setBulkPhysicalSaleOpen(false)}
          title={t("ironCatalystFlow.physicalIronSale.bulkTitle")}
          description={t("ironCatalystFlow.physicalIronSale.bulkAvailable", {
            count: selectedBulkPhysicalSources.length,
          })}
          confirmText={t("ironCatalystFlow.actions.sellSelectedIron")}
          confirmVariant="primary"
          confirmIcon={<Coins size={16} aria-hidden="true" />}
          confirmLoading={mutating}
          onConfirm={() => void submitBulkPhysicalIronSale()}
          confirmDisabled={selectedBulkPhysicalSources.length < 1}
        >
          <div className={styles.bulkPhysicalSaleForm}>
            <div className={styles.bulkAllocationList}>
              {selectedBulkPhysicalSources.map((source) => (
                <div className={styles.bulkAllocation} key={physicalIronSourceKey(source)}>
                  <span>
                    {t("ironCatalystFlow.physicalIronSale.purchaseWeight", {
                      id: source.ironPurchaseId,
                      weight: formatNumber(source.availableWeightKg),
                    })}
                  </span>
                  <TextField
                    type="text"
                    inputMode="decimal"
                    label={t("ironCatalystFlow.physicalIronSale.weight")}
                    value={bulkPhysicalSaleWeights[physicalIronSourceKey(source)] ?? ""}
                    onChange={(event) => setBulkPhysicalSaleWeights((weights) => ({
                      ...weights,
                      [physicalIronSourceKey(source)]: event.target.value,
                    }))}
                  />
                </div>
              ))}
            </div>
            <strong className={styles.bulkSaleTotal}>
              {t("ironCatalystFlow.physicalIronSale.totalWeight", {
                weight: formatNumber(bulkPhysicalSaleTotalWeight),
              })}
            </strong>
            <TextField
              type="number"
              min="0"
              label={t("ironCatalystFlow.physicalIronSale.unitSalePrice")}
              value={bulkPhysicalSaleForm.unitSalePrice}
              onChange={(event) => setBulkPhysicalSaleForm((form) => ({
                ...form,
                unitSalePrice: event.target.value,
              }))}
            />
            <TextField
              type="number"
              min="0"
              label={t("ironCatalystFlow.physicalIronSale.extraExpenses")}
              value={bulkPhysicalSaleForm.extraExpenses}
              onChange={(event) => setBulkPhysicalSaleForm((form) => ({
                ...form,
                extraExpenses: event.target.value,
              }))}
            />
          </div>
        </ConfirmationModal>
      )}

      {bulkProcessingOpen && (
        <ConfirmationModal
          open
          preventClose
          onOpenChange={(open) => !open && setBulkProcessingOpen(false)}
          title={t("ironCatalystFlow.processing.bulkTitle")}
          description={t("ironCatalystFlow.processing.bulkAvailable", {
            count: selectedBulkPhysicalSources.length,
          })}
          confirmText={t("ironCatalystFlow.actions.processSelectedIron")}
          confirmVariant="primary"
          confirmIcon={<Factory size={16} aria-hidden="true" />}
          confirmLoading={mutating}
          onConfirm={() => void submitBulkIronProcessing()}
          confirmDisabled={selectedBulkPhysicalSources.length < 1}
        >
          <div className={`${styles.bulkPhysicalSaleForm} ${styles.bulkProcessingForm}`}>
            <div className={styles.bulkAllocationList}>
              {selectedBulkPhysicalSources.map((source) => (
                <div className={styles.bulkAllocation} key={physicalIronSourceKey(source)}>
                  <div className={styles.bulkAllocationInfo}>
                    <div className={styles.bulkAllocationHeading}>
                      <span className={styles.bulkAllocationIcon}><Factory size={17} /></span>
                      <strong>{source.ironTypeName || t("ironCatalystFlow.columns.ironType")}</strong>
                      <span className={styles.bulkAllocationId}>#{source.ironPurchaseId}</span>
                    </div>
                    <span className={styles.bulkAllocationAvailable}>
                      <Boxes size={14} />
                    {t("ironCatalystFlow.physicalIronSale.purchaseWeight", {
                      id: source.ironPurchaseId,
                      weight: formatNumber(source.availableWeightKg),
                    })}
                    </span>
                  </div>
                  <TextField
                    type="text"
                    inputMode="decimal"
                    label={t("ironCatalystFlow.processing.sourceWeight")}
                    suffix="kg"
                    value={bulkProcessingWeights[physicalIronSourceKey(source)] ?? ""}
                    icon={<Scale size={15} />}
                    onChange={(event) => setBulkProcessingWeights((weights) => ({
                      ...weights,
                      [physicalIronSourceKey(source)]: event.target.value,
                    }))}
                  />
                </div>
              ))}
            </div>
            <div className={styles.bulkSaleTotal}>
              <Scale size={17} />
              <strong>{t("ironCatalystFlow.processing.totalSourceWeight", {
                weight: formatNumber(bulkProcessingTotalWeight),
              })}</strong>
            </div>
            <div className={styles.bulkProcessingFields}>
              <TextField
                type="text"
                inputMode="decimal"
                label={t("ironCatalystFlow.processing.powderWeight")}
                suffix="kg"
                value={bulkProcessingForm.powderWeightKg}
                icon={<Boxes size={15} />}
                onChange={(event) => setBulkProcessingForm((form) => ({
                  ...form,
                  powderWeightKg: event.target.value,
                }))}
              />
              <TextField
                type="text"
                inputMode="decimal"
                label={t("ironCatalystFlow.processing.ptPerKg")}
                suffix="g/kg"
                value={bulkProcessingForm.ptPerKg}
                icon={<Atom size={15} />}
                onChange={(event) => setBulkProcessingForm((form) => ({
                  ...form,
                  ptPerKg: event.target.value,
                }))}
              />
              <TextField
                type="text"
                inputMode="decimal"
                label={t("ironCatalystFlow.processing.pdPerKg")}
                suffix="g/kg"
                value={bulkProcessingForm.pdPerKg}
                icon={<Atom size={15} />}
                onChange={(event) => setBulkProcessingForm((form) => ({
                  ...form,
                  pdPerKg: event.target.value,
                }))}
              />
              <TextField
                type="text"
                inputMode="decimal"
                label={t("ironCatalystFlow.processing.rhPerKg")}
                suffix="g/kg"
                value={bulkProcessingForm.rhPerKg}
                icon={<Atom size={15} />}
                onChange={(event) => setBulkProcessingForm((form) => ({
                  ...form,
                  rhPerKg: event.target.value,
                }))}
              />
              <TextField
                type="text"
                inputMode="decimal"
                label={t("ironCatalystFlow.processing.expenses")}
                suffix="AMD"
                value={bulkProcessingForm.processingExpenses}
                icon={<Coins size={15} />}
                onChange={(event) => setBulkProcessingForm((form) => ({
                  ...form,
                  processingExpenses: event.target.value,
                }))}
              />
            </div>
          </div>
        </ConfirmationModal>
      )}

      {transferTarget && (
        <ConfirmationModal
          open
          preventClose
          onOpenChange={(open) => !open && setTransferTarget(null)}
          title={t("ironCatalystFlow.transfer.title", { id: transferTarget.purchaseId })}
          description={t("ironCatalystFlow.transfer.remaining", { weight: formatNumber(transferTarget.remainingWeightKg) })}
          confirmText={t("ironCatalystFlow.actions.transfer")}
          confirmLoading={mutating}
          onConfirm={() => void handleTransfer()}
        >
          <div className={styles.modalFields}>
            <Select label={t("ironCatalystFlow.warehouse")} value={transferForm.warehouseId} error={transferAttempted && !transferForm.warehouseId} helperText={transferAttempted && !transferForm.warehouseId ? t("ironCatalystFlow.errors.invalidTransfer") : undefined} onChange={(event) => setTransferForm((form) => ({ ...form, warehouseId: event.target.value }))}>
              <option value="">{t("ironCatalystFlow.selectWarehouse")}</option>{warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.code}</option>)}
            </Select>
            <TextField type="number" min="0" max={transferTarget.remainingWeightKg} step="0.001" label={t("ironCatalystFlow.transfer.weight")} value={transferForm.weightKg} error={transferAttempted && (!Number(transferForm.weightKg) || Number(transferForm.weightKg) <= 0 || Number(transferForm.weightKg) > transferTarget.remainingWeightKg)} helperText={transferAttempted && (!Number(transferForm.weightKg) || Number(transferForm.weightKg) <= 0 || Number(transferForm.weightKg) > transferTarget.remainingWeightKg) ? t("ironCatalystFlow.errors.invalidTransfer") : undefined} onChange={(event) => setTransferForm((form) => ({ ...form, weightKg: event.target.value }))} />
          </div>
        </ConfirmationModal>
      )}

    </main>
  );
};

const Metric = ({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) => (
  <div className={`${styles.metric} ${accent ? styles.metricAccent : ""}`}><span>{label}</span><strong>{value}</strong></div>
);

const PaginatedTable = ({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  const visibleRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr>{headers.map((header, index) => <th key={`${header}-${index}`}>{header}</th>)}</tr></thead>
          <tbody>
            {visibleRows.length ? visibleRows.map((row, index) => (
              <tr key={(page - 1) * PAGE_SIZE + index}>
                {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
              </tr>
            )) : <tr><td colSpan={headers.length} className={styles.emptyCell}>{t("ironCatalystFlow.empty")}</td></tr>}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <div className={styles.pagination}>
          <Button variant="secondary" size="small" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
            <ChevronLeft size={15} />{t("common.previous")}
          </Button>
          <span>{page} / {pageCount}</span>
          <Button variant="secondary" size="small" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)}>
            {t("common.next")}<ChevronRight size={15} />
          </Button>
        </div>
      )}
    </>
  );
};