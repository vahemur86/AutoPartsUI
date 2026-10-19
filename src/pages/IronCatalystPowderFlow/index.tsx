import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  Archive,
  ArrowLeftRight,
  BadgeCheck,
  Boxes,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Factory,
  FlaskConical,
  LoaderCircle,
  Plus,
  Scale,
  ShoppingCart,
  Sparkles,
  Tags,
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
  createSalesLot,
  getSalesLot,
  getSalesLots,
  getSalesLotsSellForm,
  previewSalesLot,
  sellRecalculation,
  sellSalesLot,
} from "@/services/warehouses/salesLots";
import {
  getAvailableIronPurchases,
  getIronProcessingBatches,
  getIronPowderStock,
  getIronPowderProfitReport,
  getIronWarehouseTransfers,
  getAvailableIronPurchasesSummary,
  createIronPowderSale,
  createPhysicalIronSale,
  processIronToPowder,
  transferIronPurchaseToWarehouse,
} from "@/services/ironCatalystFlow";
import type { Warehouse } from "@/types/settings";
import type { IronCategory, IronType } from "@/types/ironCarShop";
import type {
  BaseLot,
  GetLotDetailsResponse,
  SalesLotPreviewResponse,
  SellSalesLotResponse,
} from "@/types/warehouses/salesLots";
import type {
  AvailableIronPurchase,
  IronProcessingBatch,
  IronPowderProfitReport,
  IronPowderStockLot,
  IronWarehouseTransfer,
  AvailableIronPurchasesSummary,
  ProcessIronToPowderRequest,
} from "@/types/ironCatalystFlow";
import styles from "./IronCatalystPowderFlow.module.css";

type FlowTab =
  | "purchases"
  | "transfers"
  | "processing"
  | "inventory"
  | "sales-lots"
  | "profit";

interface PowderSource {
  inventoryLotId: number;
  sourceType: "catalyst" | "iron";
  processingBatchId?: number;
  sourceIronPurchaseId?: number;
  warehouseId: number;
  availableKg: number;
  remainingCostAmd: number;
  unitCostAmd: number;
  ptPerKg: number;
  pdPerKg: number;
  rhPerKg: number;
  status: number | string;
  createdAt: string;
}

const PAGE_SIZE = 10;
const tabs: Array<{ id: FlowTab; label: string; icon: typeof Archive }> = [
  { id: "purchases", label: "ironCatalystFlow.tabs.purchases", icon: ShoppingCart },
  { id: "transfers", label: "ironCatalystFlow.tabs.transfers", icon: ArrowLeftRight },
  { id: "processing", label: "ironCatalystFlow.tabs.processing", icon: Factory },
  { id: "inventory", label: "ironCatalystFlow.tabs.inventory", icon: Boxes },
  { id: "sales-lots", label: "ironCatalystFlow.tabs.salesLots", icon: Tags },
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
const isAvailableSource = (status: number | string) =>
  status === 1 || String(status).toLowerCase() === "available";

export const IronCatalystPowderFlow = () => {
  const { t } = useTranslation();
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
  const [transfers, setTransfers] = useState<IronWarehouseTransfer[]>([]);
  const [processingBatches, setProcessingBatches] = useState<IronProcessingBatch[]>([]);
  const [catalystInventory, setCatalystInventory] = useState<IronPowderStockLot[]>([]);
  const [salesLots, setSalesLots] = useState<BaseLot[]>([]);
  const [salesLotTotal, setSalesLotTotal] = useState(0);
  const [salesPage, setSalesPage] = useState(1);
  const [selectedLot, setSelectedLot] = useState<GetLotDetailsResponse | null>(null);
  const [lotPreview, setLotPreview] = useState<GetLotDetailsResponse | null>(null);
  const [profitReport, setProfitReport] = useState<IronPowderProfitReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);
  const [transferTarget, setTransferTarget] = useState<AvailableIronPurchase | null>(null);
  const [transferForm, setTransferForm] = useState({ warehouseId: "", weightKg: "" });
  const [transferAttempted, setTransferAttempted] = useState(false);
  const [processForm, setProcessForm] = useState<ProcessIronToPowderRequest>({
    warehouseId: 0,
    ironPurchaseId: 0,
    sourceWeightKg: 0,
    powderWeightKg: 0,
    ptPerKg: 0,
    pdPerKg: 0,
    rhPerKg: 0,
    processingExpenses: 0,
  });
  const [pendingProcessing, setPendingProcessing] = useState(false);
  const [processingAttempted, setProcessingAttempted] = useState(false);
  const [processingResult, setProcessingResult] = useState<IronProcessingBatch | null>(null);
  const [selectedSourceQuantities, setSelectedSourceQuantities] = useState<Record<number, string>>({});
  const [preview, setPreview] = useState<SalesLotPreviewResponse | null>(null);
  const [createConfirmationOpen, setCreateConfirmationOpen] = useState(false);
  const [saleTarget, setSaleTarget] = useState<BaseLot | null>(null);
  const [saleForm, setSaleForm] = useState({
    currencyCode: "USD",
    oldRevenue: 0,
    ptPrice: 0,
    pdPrice: 0,
    rhPrice: 0,
    powderKg: 0,
    pt_g: 0,
    pd_g: 0,
    rh_g: 0,
  });
  const [salePreviewRevenue, setSalePreviewRevenue] = useState<number | null>(null);
  const [saleExchangeRate, setSaleExchangeRate] = useState(0);
  const [saleAttempted, setSaleAttempted] = useState(false);
  const [saleResult, setSaleResult] = useState<SellSalesLotResponse | null>(null);
  const [physicalIronTarget, setPhysicalIronTarget] = useState<IronWarehouseTransfer | null>(null);
  const [physicalIronForm, setPhysicalIronForm] = useState({
    ironTypeId: "",
    categoryId: "",
    weightKg: "",
    unitSalePrice: "",
    extraExpenses: "0",
  });
  const [powderSaleTarget, setPowderSaleTarget] = useState<PowderSource | null>(null);
  const [powderSaleForm, setPowderSaleForm] = useState({ powderWeightKg: "", unitSalePrice: "", extraExpenses: "0" });
  const [saleStatusFilter, setSaleStatusFilter] = useState("");
  const [containsIronFilter, setContainsIronFilter] = useState("");
  const [salesDateFilters, setSalesDateFilters] = useState({ fromDate: "", toDate: "" });
  const [transferFilters, setTransferFilters] = useState({ purchaseId: "", fromDate: "", toDate: "" });
  const [inventoryFilters, setInventoryFilters] = useState({ source: "", status: "", availableOnly: "", fromDate: "", toDate: "" });
  const [reportFilters, setReportFilters] = useState({ dateFrom: "", dateTo: "" });

  const chosenWarehouseId = Number(warehouseId) || undefined;
  const purchaseFilterParams = useMemo(() => ({
    ironTypeId: Number(purchaseFilters.ironTypeId) || undefined,
    categoryId: Number(purchaseFilters.categoryId) || undefined,
  }), [purchaseFilters]);

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
        case "transfers":
          setTransfers(await getIronWarehouseTransfers(
            { warehouseId: chosenWarehouseId },
            cashRegisterId,
          ));
          break;
        case "processing": {
          const [batchRows, transferRows] = await Promise.all([
            getIronProcessingBatches(chosenWarehouseId, cashRegisterId),
            getIronWarehouseTransfers({ warehouseId: chosenWarehouseId }, cashRegisterId),
          ]);
          setProcessingBatches(batchRows);
          setTransfers(transferRows);
          break;
        }
        case "inventory": {
          if (!chosenWarehouseId) {
            setCatalystInventory([]);
            setProcessingBatches([]);
            break;
          }
          const [inventoryRows, batchRows] = await Promise.all([
            getIronPowderStock(chosenWarehouseId, cashRegisterId),
            getIronProcessingBatches(chosenWarehouseId, cashRegisterId),
          ]);
          setCatalystInventory(inventoryRows);
          setProcessingBatches(batchRows);
          break;
        }
        case "sales-lots": {
          const result = await getSalesLots({
            warehouseId: chosenWarehouseId,
            status: saleStatusFilter ? Number(saleStatusFilter) : undefined,
            fromDate: salesDateFilters.fromDate || undefined,
            toDate: salesDateFilters.toDate || undefined,
            containsIronPowder: containsIronFilter
              ? containsIronFilter === "true"
              : undefined,
            page: salesPage,
            pageSize: PAGE_SIZE,
            cashRegisterId,
          });
          setSalesLots(result.results);
          setSalesLotTotal(result.totalItems);
          break;
        }
        case "profit":
          setProfitReport(await getIronPowderProfitReport({
            warehouseId: chosenWarehouseId,
            fromUtc: reportFilters.dateFrom
              ? new Date(`${reportFilters.dateFrom}T00:00:00`).toISOString()
              : undefined,
            toUtc: reportFilters.dateTo
              ? new Date(`${reportFilters.dateTo}T23:59:59`).toISOString()
              : undefined,
          }, cashRegisterId));
          break;
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
    loadPurchaseData,
    purchaseFilters,
    saleStatusFilter,
    salesDateFilters,
    containsIronFilter,
    salesPage,
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

  useEffect(() => {
    if (activeTab === "processing" && chosenWarehouseId) {
      setProcessForm((current) => ({ ...current, warehouseId: chosenWarehouseId }));
    }
  }, [activeTab, chosenWarehouseId]);

  useEffect(() => {
    setSalePreviewRevenue(null);
  }, [saleForm]);

  const powderSources = useMemo<PowderSource[]>(() => catalystInventory.map((lot) => {
    const isIron = lot.sourceType === "IronDerived" || lot.containsIronPowder;
    const weight = lot.remainingPowderKg;
    const processingBatch = lot.processingBatchId == null
      ? undefined
      : processingBatches.find((batch) => batch.id === lot.processingBatchId);
    return {
      inventoryLotId: lot.id,
      sourceType: isIron ? "iron" : "catalyst",
      processingBatchId: lot.processingBatchId ?? undefined,
      sourceIronPurchaseId: processingBatch?.ironPurchaseId,
      warehouseId: chosenWarehouseId ?? 0,
      availableKg: weight,
      remainingCostAmd: lot.remainingCostAmd,
      unitCostAmd: lot.remainingCostAmd / Math.max(weight, 0.000001),
      ptPerKg: lot.remainingPt_g / Math.max(weight, 0.000001),
      pdPerKg: lot.remainingPd_g / Math.max(weight, 0.000001),
      rhPerKg: lot.remainingRh_g / Math.max(weight, 0.000001),
      status: lot.status,
      createdAt: lot.createdAt,
    };
  }), [catalystInventory, chosenWarehouseId, processingBatches]);

  const selectablePowderSources = useMemo(
    () => powderSources.filter((source) => isAvailableSource(source.status) && source.availableKg > 0),
    [powderSources],
  );
  const filteredPowderSources = useMemo(() => powderSources.filter((source) => {
    if (inventoryFilters.source && source.sourceType !== inventoryFilters.source) return false;
    if (inventoryFilters.status === "available" && !isAvailableSource(source.status)) return false;
    if (inventoryFilters.status === "unavailable" && isAvailableSource(source.status)) return false;
    if (inventoryFilters.availableOnly === "true" && source.availableKg <= 0) return false;
    if (inventoryFilters.availableOnly === "false" && source.availableKg > 0) return false;
    const createdAt = source.createdAt.slice(0, 10);
    if (inventoryFilters.fromDate && createdAt < inventoryFilters.fromDate) return false;
    if (inventoryFilters.toDate && createdAt > inventoryFilters.toDate) return false;
    return true;
  }), [powderSources, inventoryFilters]);

  const selectedSources = useMemo(
    () => Object.entries(selectedSourceQuantities)
      .map(([id, value]) => ({ inventoryLotId: Number(id), powderKg: Number(value) })),
    [selectedSourceQuantities],
  );
  const selectedSourcesAreValid = selectedSources.length > 0 && selectedSources.every((item) => {
    const source = selectablePowderSources.find((candidate) => candidate.inventoryLotId === item.inventoryLotId);
    return Boolean(
      source &&
      Number.isFinite(item.powderKg) &&
      item.powderKg > 0 &&
      item.powderKg <= source.availableKg &&
      source.warehouseId === chosenWarehouseId,
    );
  });

  const remainingProcessableWeight = useMemo(() => {
    if (!chosenWarehouseId || !processForm.ironPurchaseId) return 0;
    const transferred = transfers
      .filter((item) => item.warehouseId === chosenWarehouseId && item.ironPurchaseId === processForm.ironPurchaseId)
      .reduce((total, item) => total + item.weightKg, 0);
    const processed = processingBatches
      .filter((item) => item.warehouseId === chosenWarehouseId && item.ironPurchaseId === processForm.ironPurchaseId)
      .reduce((total, item) => total + item.sourceWeightKg, 0);
    return Math.max(0, transferred - processed);
  }, [chosenWarehouseId, processForm.ironPurchaseId, transfers, processingBatches]);

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
        getIronWarehouseTransfers({ warehouseId: selectedWarehouse }, cashRegisterId),
        loadPurchaseData(),
      ]);
      setTransfers(transferRows);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("ironCatalystFlow.errors.transferFailed")));
    } finally {
      setMutating(false);
    }
  };

  const submitPhysicalIronSale = async () => {
    if (!physicalIronTarget) return;
    const ironTypeId = Number(physicalIronForm.ironTypeId);
    const categoryId = Number(physicalIronForm.categoryId);
    const weightKg = Number(physicalIronForm.weightKg);
    const unitSalePrice = Number(physicalIronForm.unitSalePrice);
    const extraExpenses = Number(physicalIronForm.extraExpenses);
    const saleNumbers = [weightKg, unitSalePrice, extraExpenses];
    if (!ironTypeId || !categoryId || saleNumbers.some((value) => !Number.isFinite(value)) || weightKg <= 0 || weightKg > physicalIronTarget.weightKg || unitSalePrice < 0 || extraExpenses < 0) {
      toast.error(t("ironCatalystFlow.errors.invalidPhysicalSale"));
      return;
    }
    setMutating(true);
    try {
      const response = await createPhysicalIronSale({
        warehouseId: physicalIronTarget.warehouseId,
        ironPurchaseId: physicalIronTarget.ironPurchaseId,
        ironTypeId,
        categoryId,
        weightKg,
        unitSalePrice,
        extraExpenses,
      }, cashRegisterId);
      toast.success(`${t("ironCatalystFlow.success.physicalIronSold")} ${formatAmd(response.profit)}`);
      setPhysicalIronTarget(null);
      setTransfers(await getIronWarehouseTransfers({ warehouseId: chosenWarehouseId }, cashRegisterId));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("ironCatalystFlow.errors.saleFailed")));
    } finally {
      setMutating(false);
    }
  };

  const submitPowderSale = async () => {
    if (!powderSaleTarget?.processingBatchId) return;
    const powderWeightKg = Number(powderSaleForm.powderWeightKg);
    const unitSalePrice = Number(powderSaleForm.unitSalePrice);
    const extraExpenses = Number(powderSaleForm.extraExpenses);
    const saleNumbers = [powderWeightKg, unitSalePrice, extraExpenses];
    if (saleNumbers.some((value) => !Number.isFinite(value)) || powderWeightKg <= 0 || powderWeightKg > powderSaleTarget.availableKg || unitSalePrice < 0 || extraExpenses < 0) {
      toast.error(t("ironCatalystFlow.errors.invalidPowderSale"));
      return;
    }
    setMutating(true);
    try {
      const response = await createIronPowderSale({
        ironProcessingBatchId: powderSaleTarget.processingBatchId,
        warehouseId: powderSaleTarget.warehouseId,
        powderWeightKg,
        unitSalePrice,
        extraExpenses,
      }, cashRegisterId);
      toast.success(`${t("ironCatalystFlow.success.powderSold")} ${formatAmd(response.profit)}`);
      setPowderSaleTarget(null);
      if (chosenWarehouseId) {
        setCatalystInventory(await getIronPowderStock(chosenWarehouseId, cashRegisterId));
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("ironCatalystFlow.errors.saleFailed")));
    } finally {
      setMutating(false);
    }
  };

  const submitProcessing = async () => {
    setProcessingAttempted(true);
    const processingNumbers = [
      processForm.sourceWeightKg,
      processForm.powderWeightKg,
      processForm.ptPerKg,
      processForm.pdPerKg,
      processForm.rhPerKg,
      processForm.processingExpenses,
    ];
    if (!processForm.warehouseId || !processForm.ironPurchaseId || processForm.sourceWeightKg <= 0 ||
      processForm.powderWeightKg <= 0 || processForm.sourceWeightKg > remainingProcessableWeight ||
      processingNumbers.some((value) => !Number.isFinite(value)) ||
      processForm.ptPerKg < 0 || processForm.pdPerKg < 0 || processForm.rhPerKg < 0 ||
      processForm.processingExpenses < 0) {
      toast.error(t("ironCatalystFlow.errors.invalidProcessing"));
      return;
    }
    setMutating(true);
    try {
      const result = await processIronToPowder(processForm, cashRegisterId);
      setProcessingResult(result);
      setPendingProcessing(false);
      toast.success(t("ironCatalystFlow.success.processed"));
      setActiveTab("inventory");
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("ironCatalystFlow.errors.processingFailed")));
    } finally {
      setMutating(false);
    }
  };

  const isProcessingFormValid = Boolean(
    processForm.warehouseId &&
    processForm.ironPurchaseId &&
    processForm.sourceWeightKg > 0 &&
    Number.isFinite(processForm.sourceWeightKg) &&
    processForm.sourceWeightKg <= remainingProcessableWeight &&
    processForm.powderWeightKg > 0 &&
    Number.isFinite(processForm.powderWeightKg) &&
    processForm.ptPerKg >= 0 &&
    Number.isFinite(processForm.ptPerKg) &&
    processForm.pdPerKg >= 0 &&
    Number.isFinite(processForm.pdPerKg) &&
    processForm.rhPerKg >= 0 &&
    Number.isFinite(processForm.rhPerKg) &&
    processForm.processingExpenses >= 0 &&
    Number.isFinite(processForm.processingExpenses),
  );

  const handlePreviewSalesLot = async () => {
    if (!chosenWarehouseId || !selectedSourcesAreValid) {
      toast.error(selectedSources.length === 0
        ? t("ironCatalystFlow.errors.selectSource")
        : t("ironCatalystFlow.errors.invalidSourceQuantity"));
      return;
    }
    setIsLoading(true);
    try {
      setPreview(await previewSalesLot({ warehouseId: chosenWarehouseId, items: selectedSources, cashRegisterId }));
      setCreateConfirmationOpen(true);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("ironCatalystFlow.errors.previewFailed")));
    } finally {
      setIsLoading(false);
    }
  };

  const createLot = async () => {
    if (!chosenWarehouseId || !selectedSourcesAreValid) {
      toast.error(t("ironCatalystFlow.errors.invalidSourceQuantity"));
      return;
    }
    setMutating(true);
    try {
      const id = await createSalesLot({ warehouseId: chosenWarehouseId, items: selectedSources, cashRegisterId });
      toast.success(t("ironCatalystFlow.success.salesLotCreated"));
      setCreateConfirmationOpen(false);
      setSelectedSourceQuantities({});
      setActiveTab("sales-lots");
      const result = await getSalesLot(id, cashRegisterId);
      setSelectedLot(result);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("ironCatalystFlow.errors.createLotFailed")));
    } finally {
      setMutating(false);
    }
  };

  const openSale = async (lot: BaseLot) => {
    setMutating(true);
    try {
      const [details, sellForm] = await Promise.all([
        getSalesLot(lot.id, cashRegisterId),
        getSalesLotsSellForm(lot.id, cashRegisterId),
      ]);
      setSelectedLot(details);
      setSaleTarget(lot);
      setSaleForm({
        currencyCode: "USD",
        oldRevenue: sellForm.revenueAmd,
        ptPrice: sellForm.ptPrice,
        pdPrice: sellForm.pdPrice,
        rhPrice: sellForm.rhPrice,
        powderKg: sellForm.powderKg,
        pt_g: sellForm.pt_g,
        pd_g: sellForm.pd_g,
        rh_g: sellForm.rh_g,
      });
      setSaleExchangeRate(sellForm.usdRate);
      setSalePreviewRevenue(null);
      setSaleAttempted(false);
      setSaleResult(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("ironCatalystFlow.errors.loadSaleFormFailed")));
    } finally {
      setMutating(false);
    }
  };

  const previewSale = async () => {
    if (!saleTarget) return;
    setSaleAttempted(true);
    const saleNumbers = [
      saleForm.oldRevenue,
      saleForm.ptPrice,
      saleForm.pdPrice,
      saleForm.rhPrice,
      saleForm.powderKg,
      saleForm.pt_g,
      saleForm.pd_g,
      saleForm.rh_g,
    ];
    if (
      saleNumbers.some((value) => !Number.isFinite(value) || value < 0) ||
      saleForm.powderKg <= 0 ||
      saleForm.powderKg > saleTarget.totalPowderKg
    ) {
      toast.error(t("ironCatalystFlow.errors.invalidProcessing"));
      return;
    }
    setMutating(true);
    try {
      const amount = await sellRecalculation({ id: saleTarget.id, cashRegisterId, body: saleForm });
      setSalePreviewRevenue(Number(amount));
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("ironCatalystFlow.errors.salePreviewFailed")));
    } finally {
      setMutating(false);
    }
  };

  const completeSale = async () => {
    if (!saleTarget || salePreviewRevenue == null) return;
    setMutating(true);
    try {
      const result = await sellSalesLot({ id: saleTarget.id, cashRegisterId, body: saleForm });
      setSaleResult(result);
      setSaleTarget(null);
      setSelectedLot(null);
      toast.success(t("ironCatalystFlow.success.saleCompleted"));
      setActiveTab("sales-lots");
      setSalesPage(1);
      const refreshedLots = await getSalesLots({
        warehouseId: chosenWarehouseId,
        status: saleStatusFilter ? Number(saleStatusFilter) : undefined,
        fromDate: salesDateFilters.fromDate || undefined,
        toDate: salesDateFilters.toDate || undefined,
        containsIronPowder: containsIronFilter ? containsIronFilter === "true" : undefined,
        page: 1,
        pageSize: PAGE_SIZE,
        cashRegisterId,
      });
      setSalesLots(refreshedLots.results);
      setSalesLotTotal(refreshedLots.totalItems);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("ironCatalystFlow.errors.saleFailed")));
    } finally {
      setMutating(false);
    }
  };

  const renderTable = (headers: string[], rows: React.ReactNode[][]) => (
    <PaginatedTable headers={headers} rows={rows} />
  );

  const renderPurchaseBreakdown = (
    title: string,
    items: AvailableIronPurchasesSummary["byIronType"],
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
          {ironCategories.map((category) => (
            <option key={category.id} value={category.id}>{category.name || category.code}</option>
          ))}
        </Select>
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

      {renderTable(
        ["purchaseId", "customerId", "brand", "category", "ironType", "customerType", "purchasedWeight", "purchaseCost", "transferredWeight", "remainingWeight", "recalculationStep", "purchaseDate", ""].map(column),
        purchases.filter((purchase) => purchase.remainingWeightKg > 0).map((purchase) => [
          `#${purchase.purchaseId}`,
          `#${purchase.customerId}`,
          purchase.brandName || `#${purchase.dictBrandId}`,
          purchase.categoryName || "—",
          purchase.ironTypeName || `#${purchase.ironTypeId}`,
          purchase.customerTypeName || `#${purchase.customerTypeId}`,
          `${formatNumber(purchase.purchasedWeightKg)} kg`,
          formatAmd(purchase.totalPurchaseCost),
          `${formatNumber(purchase.transferredWeightKg)} kg`,
          <strong key="remaining" className={styles.remaining}>{formatNumber(purchase.remainingWeightKg)} kg</strong>,
          purchase.recalculationStep == null
            ? t("ironCatalystFlow.purchaseSummary.regularPrice")
            : t("ironCatalystFlow.purchaseSummary.recalculationStep", { step: purchase.recalculationStep }),
          formatDate(purchase.purchasedAt),
          <Button key="transfer" size="small" onClick={() => {
            setTransferTarget(purchase);
            setTransferAttempted(false);
            setTransferForm({ warehouseId: warehouseId || "", weightKg: String(purchase.remainingWeightKg) });
          }}><ArrowLeftRight size={14} />{t("ironCatalystFlow.actions.transfer")}</Button>,
        ]),
      )}
    </div>
  );

  const renderTransfers = () => (
    <>
      <div className={styles.filterRow}>
        <TextField type="number" label={t("ironCatalystFlow.filters.purchaseId")} value={transferFilters.purchaseId} onChange={(event) => setTransferFilters((filters) => ({ ...filters, purchaseId: event.target.value }))} />
        <TextField type="date" label={t("ironCatalystFlow.filters.fromDate")} value={transferFilters.fromDate} onChange={(event) => setTransferFilters((filters) => ({ ...filters, fromDate: event.target.value }))} />
        <TextField type="date" label={t("ironCatalystFlow.filters.toDate")} value={transferFilters.toDate} onChange={(event) => setTransferFilters((filters) => ({ ...filters, toDate: event.target.value }))} />
      </div>
      {renderTable(
        ["transferId", "purchaseId", "warehouse", "weight", "unitCost", "totalCost", "transferredAt", "transferredBy", ""].map(column),
        transfers.filter((item) => {
          if (transferFilters.purchaseId && item.ironPurchaseId !== Number(transferFilters.purchaseId)) return false;
          const date = item.transferredAt.slice(0, 10);
          if (transferFilters.fromDate && date < transferFilters.fromDate) return false;
          if (transferFilters.toDate && date > transferFilters.toDate) return false;
          return true;
        }).map((item) => [
          `#${item.id}`,
            `#${item.ironPurchaseId}`,
          warehouses.find((warehouse) => warehouse.id === item.warehouseId)?.code || `#${item.warehouseId}`,
          `${formatNumber(item.weightKg)} kg`,
          formatAmd(item.unitCost),
          formatAmd(item.totalCost),
          formatDate(item.transferredAt),
          "—",
          <Button key="physical-sale" size="small" variant="secondary" onClick={() => {
            const purchase = purchases.find((row) => row.purchaseId === item.ironPurchaseId);
            setPhysicalIronTarget(item);
            setPhysicalIronForm({
              ironTypeId: purchase ? String(purchase.ironTypeId) : "",
              categoryId: "",
              weightKg: String(item.weightKg),
              unitSalePrice: "",
              extraExpenses: "0",
            });
          }}>{t("ironCatalystFlow.actions.sellIron")}</Button>,
        ]),
      )}
    </>
  );

  const renderProcessingBatches = () => renderTable(
    ["batchId", "purchaseId", "sourceWeight", "powderWeight", "remainingPowder", "ptPerKg", "pdPerKg", "rhPerKg", "allocatedPurchaseCost", "processingExpenses", "totalCost", "createdAt"].map(column),
          processingBatches.map((batch) => [
      `#${batch.id}`,
        `#${batch.ironPurchaseId}`,
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

  const renderInventory = () => (
    <>
      <div className={styles.inventorySummary}>
        <div><span>{t("ironCatalystFlow.source.catalyst")}</span><strong>{powderSources.filter((lot) => lot.sourceType === "catalyst" && isAvailableSource(lot.status) && lot.availableKg > 0).length}</strong></div>
        <div><span>{t("ironCatalystFlow.source.iron")}</span><strong>{powderSources.filter((lot) => lot.sourceType === "iron" && isAvailableSource(lot.status) && lot.availableKg > 0).length}</strong></div>
        <div><span>{t("ironCatalystFlow.metrics.availableWeight")}</span><strong>{formatNumber(selectablePowderSources.reduce((total, source) => total + source.availableKg, 0))} kg</strong></div>
      </div>
      <div className={styles.sourcePicker}>
        <div><h3><Boxes size={16} />{t("ironCatalystFlow.inventory.selectSources")}</h3><p>{t("ironCatalystFlow.inventory.selectHint")}</p></div>
        <Button onClick={() => void handlePreviewSalesLot()} disabled={isLoading || selectedSources.length === 0}><CalculatorIcon />{t("ironCatalystFlow.actions.previewCreate")}</Button>
      </div>
      <div className={styles.filterRow}>
        <Select label={t("ironCatalystFlow.filters.powderSource")} value={inventoryFilters.source} onChange={(event) => setInventoryFilters((filters) => ({ ...filters, source: event.target.value }))}>
          <option value="">{t("common.all")}</option><option value="catalyst">{t("ironCatalystFlow.source.catalyst")}</option><option value="iron">{t("ironCatalystFlow.source.iron")}</option>
        </Select>
        <Select label={t("ironCatalystFlow.filters.status")} value={inventoryFilters.status} onChange={(event) => setInventoryFilters((filters) => ({ ...filters, status: event.target.value }))}>
          <option value="">{t("common.all")}</option><option value="available">{t("ironCatalystFlow.inventory.available")}</option><option value="unavailable">{t("ironCatalystFlow.inventory.unavailable")}</option>
        </Select>
        <Select label={t("ironCatalystFlow.filters.availableQuantity")} value={inventoryFilters.availableOnly} onChange={(event) => setInventoryFilters((filters) => ({ ...filters, availableOnly: event.target.value }))}>
          <option value="">{t("common.all")}</option><option value="true">{t("ironCatalystFlow.inventory.availableOnly")}</option><option value="false">{t("ironCatalystFlow.inventory.depletedOnly")}</option>
        </Select>
        <TextField type="date" label={t("ironCatalystFlow.filters.fromDate")} value={inventoryFilters.fromDate} onChange={(event) => setInventoryFilters((filters) => ({ ...filters, fromDate: event.target.value }))} />
        <TextField type="date" label={t("ironCatalystFlow.filters.toDate")} value={inventoryFilters.toDate} onChange={(event) => setInventoryFilters((filters) => ({ ...filters, toDate: event.target.value }))} />
      </div>
      {renderTable(
    ["select", "source", "inventoryLotId", "processingBatchId", "ironPurchaseId", "warehouse", "available", "remainingCost", "unitCost", "ptPerKg", "pdPerKg", "rhPerKg", "status", "createdAt", ""].map(column),
    filteredPowderSources.map((item) => [
      <input key="select" type="checkbox" checked={item.inventoryLotId in selectedSourceQuantities} disabled={!isAvailableSource(item.status) || item.availableKg <= 0} onChange={(event) => setSelectedSourceQuantities((current) => {
        const next = { ...current };
        if (event.target.checked) next[item.inventoryLotId] = "";
        else delete next[item.inventoryLotId];
        return next;
      })} aria-label={`${t("ironCatalystFlow.inventory.selectLot")} ${item.inventoryLotId}`} />,
      item.sourceType === "iron" ? <span key="iron" className={styles.ironBadge}><Sparkles size={12} />{t("ironCatalystFlow.badges.ironDerived")}</span> : t("ironCatalystFlow.source.catalyst"),
      `#${item.inventoryLotId}`,
      item.processingBatchId ? `#${item.processingBatchId}` : "—",
      item.sourceIronPurchaseId ? `#${item.sourceIronPurchaseId}` : "—",
      warehouses.find((warehouse) => warehouse.id === item.warehouseId)?.code || `#${item.warehouseId}`,
      <div key="quantity" className={styles.quantityField}><span>{formatNumber(item.availableKg)} kg</span>{item.inventoryLotId in selectedSourceQuantities && <input type="number" min="0" max={item.availableKg} step="0.001" value={selectedSourceQuantities[item.inventoryLotId]} onChange={(event) => setSelectedSourceQuantities((current) => ({ ...current, [item.inventoryLotId]: event.target.value }))} aria-label={t("ironCatalystFlow.inventory.selectedWeight")} />}</div>,
      formatAmd(item.remainingCostAmd),
      formatAmd(item.unitCostAmd),
      formatNumber(item.ptPerKg),
      formatNumber(item.pdPerKg),
      formatNumber(item.rhPerKg),
      item.status === 1 ? t("ironCatalystFlow.statuses.available") : t("ironCatalystFlow.statuses.unavailable"),
      formatDate(item.createdAt),
      item.sourceType === "iron" && item.processingBatchId ? (
        <Button key="powder-sale" size="small" variant="secondary" disabled={!isAvailableSource(item.status) || item.availableKg <= 0} onClick={() => {
          setPowderSaleTarget(item);
          setPowderSaleForm({ powderWeightKg: String(item.availableKg), unitSalePrice: "", extraExpenses: "0" });
        }}>{t("ironCatalystFlow.actions.sellPowder")}</Button>
      ) : "—",
    ]),
      )}
    </>
  );

  const renderSalesLots = () => (
    <>
      {selectedLot ? (
        <section className={styles.detailPanel}>
          <div className={styles.sectionHeading}>
            <div><h2>{t("ironCatalystFlow.salesLotDetails", { id: selectedLot.lot.id })}</h2><p>{t("ironCatalystFlow.detailHint")}</p></div>
            <Button variant="secondary" onClick={() => setSelectedLot(null)}>{t("common.back")}</Button>
          </div>
          {(selectedLot.lot.containsIronPowder || selectedLot.items.some((item) => item.sourceType === "Iron-derived Powder")) && <span className={styles.ironBadge}><Sparkles size={13} />{t("ironCatalystFlow.badges.ironIncluded")}</span>}
          <div className={styles.metricGrid}>
            <Metric label={t("ironCatalystFlow.warehouse")} value={warehouses.find((warehouse) => warehouse.id === selectedLot.lot.warehouseId)?.code ?? `#${selectedLot.lot.warehouseId}`} />
            <Metric label={t("ironCatalystFlow.metrics.totalPowder")} value={`${formatNumber(selectedLot.lot.totalPowderKg)} kg`} />
            <Metric label={t("ironCatalystFlow.metrics.totalCost")} value={formatAmd(selectedLot.lot.costTotalAmd)} />
            <Metric label={t("ironCatalystFlow.metrics.averagePt")} value={`${formatNumber(selectedLot.lot.ptTotal_g / Math.max(selectedLot.lot.totalPowderKg, 0.000001))} g/kg`} />
            <Metric label={t("ironCatalystFlow.metrics.averagePd")} value={`${formatNumber(selectedLot.lot.pdTotal_g / Math.max(selectedLot.lot.totalPowderKg, 0.000001))} g/kg`} />
            <Metric label={t("ironCatalystFlow.metrics.averageRh")} value={`${formatNumber(selectedLot.lot.rhTotal_g / Math.max(selectedLot.lot.totalPowderKg, 0.000001))} g/kg`} />
            <Metric label={t("ironCatalystFlow.metrics.status")} value={t(selectedLot.lot.status === 1 ? "ironCatalystFlow.statuses.open" : selectedLot.lot.status === 2 ? "ironCatalystFlow.statuses.sold" : "ironCatalystFlow.statuses.cancelled")} />
            <Metric label={t("ironCatalystFlow.metrics.created")} value={formatDate(selectedLot.lot.createdAt)} />
            <Metric label={t("ironCatalystFlow.metrics.profit")} value={selectedLot.lot.status === 2 ? formatAmd(selectedLot.lot.profitAmd) : "—"} />
          </div>
          {renderTable(["inventoryLotId", "source", "powderKg", "costPart", "ptGrams", "pdGrams", "rhGrams"].map(column), selectedLot.items.map((item) => [
            `#${item.inventoryLotId}`,
            item.sourceType === "Iron-derived Powder" ? <span key="source" className={styles.ironBadge}>{t("ironCatalystFlow.badges.ironDerived")}</span> : t("ironCatalystFlow.source.catalyst"),
            `${formatNumber(item.powderKg)} kg`,
            formatAmd(item.costPartAmd),
            formatNumber(item.pt_g),
            formatNumber(item.pd_g),
            formatNumber(item.rh_g),
          ]))}
          {selectedLot.lot.status === 1 && (
            <Button onClick={() => void openSale(selectedLot.lot)} disabled={mutating}><ShoppingCart size={15} />{t("ironCatalystFlow.actions.sell")}</Button>
          )}
        </section>
      ) : (
        <>
          <div className={styles.filterRow}>
            <Select label={t("ironCatalystFlow.filters.status")} value={saleStatusFilter} onChange={(event) => { setSaleStatusFilter(event.target.value); setSalesPage(1); }}>
              <option value="">{t("common.all")}</option><option value="1">{t("ironCatalystFlow.statuses.open")}</option><option value="2">{t("ironCatalystFlow.statuses.sold")}</option><option value="3">{t("ironCatalystFlow.statuses.cancelled")}</option>
            </Select>
            <Select label={t("ironCatalystFlow.filters.containsIron")} value={containsIronFilter} onChange={(event) => setContainsIronFilter(event.target.value)}>
              <option value="">{t("common.all")}</option><option value="true">{t("common.yes")}</option><option value="false">{t("common.no")}</option>
            </Select>
            <TextField type="date" label={t("ironCatalystFlow.filters.fromDate")} value={salesDateFilters.fromDate} onChange={(event) => setSalesDateFilters((filters) => ({ ...filters, fromDate: event.target.value }))} />
            <TextField type="date" label={t("ironCatalystFlow.filters.toDate")} value={salesDateFilters.toDate} onChange={(event) => setSalesDateFilters((filters) => ({ ...filters, toDate: event.target.value }))} />
          </div>
          {renderTable(["salesLotId", "warehouse", "totalPowder", "totalCost", "averagePt", "averagePd", "averageRh", "containsIron", "status", "createdAt", "soldAt", "profit", ""].map(column), salesLots
            .map((lot) => [
              `#${lot.id}`,
              warehouses.find((item) => item.id === lot.warehouseId)?.code || `#${lot.warehouseId}`,
              `${formatNumber(lot.totalPowderKg)} kg`,
              formatAmd(lot.costTotalAmd),
              formatNumber(lot.ptTotal_g / Math.max(lot.totalPowderKg, 0.000001)),
              formatNumber(lot.pdTotal_g / Math.max(lot.totalPowderKg, 0.000001)),
              formatNumber(lot.rhTotal_g / Math.max(lot.totalPowderKg, 0.000001)),
              lot.containsIronPowder ? <span className={styles.ironBadge}>{t("ironCatalystFlow.badges.ironIncluded")}</span> : "—",
              t(lot.status === 1 ? "ironCatalystFlow.statuses.open" : lot.status === 2 ? "ironCatalystFlow.statuses.sold" : "ironCatalystFlow.statuses.cancelled"),
              formatDate(lot.createdAt),
              formatDate(lot.soldAt),
              lot.status === 2 ? formatAmd(lot.profitAmd) : "—",
              <div className={styles.rowActions} key="actions">
                <Button size="small" variant="secondary" onClick={() => void getSalesLot(lot.id, cashRegisterId).then(setSelectedLot).catch((error: unknown) => toast.error(getApiErrorMessage(error, t("ironCatalystFlow.errors.loadDetailFailed"))))}>{t("ironCatalystFlow.actions.details")}</Button>
                <Button size="small" variant="secondary" onClick={() => void getSalesLot(lot.id, cashRegisterId).then(setLotPreview).catch((error: unknown) => toast.error(getApiErrorMessage(error, t("ironCatalystFlow.errors.loadDetailFailed"))))}>{t("ironCatalystFlow.actions.previewSale")}</Button>
                {lot.status === 1 && <Button size="small" onClick={() => void openSale(lot)}>{t("ironCatalystFlow.actions.sell")}</Button>}
              </div>,
            ]))}
          <div className={styles.pagination}>
            <Button variant="secondary" size="small" disabled={salesPage <= 1 || isLoading} onClick={() => setSalesPage((page) => page - 1)}><ChevronLeft size={15} />{t("common.previous")}</Button>
            <span>{salesPage} / {Math.max(1, Math.ceil(salesLotTotal / PAGE_SIZE))}</span>
            <Button variant="secondary" size="small" disabled={salesPage >= Math.ceil(salesLotTotal / PAGE_SIZE) || isLoading} onClick={() => setSalesPage((page) => page + 1)}>{t("common.next")}<ChevronRight size={15} /></Button>
          </div>
        </>
      )}
    </>
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
          <Select label={t("ironCatalystFlow.warehouse")} value={warehouseId} onChange={(event) => { setWarehouseId(event.target.value); setSelectedLot(null); }}>
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
          {activeTab === "sales-lots" && !selectedLot && <Button onClick={() => setActiveTab("inventory")}><Plus size={15} />{t("ironCatalystFlow.actions.createSalesLot")}</Button>}
        </header>

        {isLoading && <div className={styles.loading} role="status"><LoaderCircle size={18} />{t("common.loading")}</div>}
        {loadError && !isLoading && <div className={styles.errorState} role="alert"><CircleAlert size={16} />{loadError}<Button size="small" variant="secondary" onClick={() => void loadSection()}>{t("ironCatalystFlow.actions.retry")}</Button></div>}
        {!isLoading && !loadError && (
          <>
            {activeTab === "purchases" && renderPurchases()}
            {activeTab === "transfers" && renderTransfers()}
            {activeTab === "processing" && (
              <div className={styles.processingLayout}>
                <div className={styles.formPanel}>
                  <h3><Factory size={16} />{t("ironCatalystFlow.processing.formTitle")}</h3>
                  <div className={styles.formGrid}>
                    <Select label={t("ironCatalystFlow.warehouse")} value={String(processForm.warehouseId || "")} error={processingAttempted && !processForm.warehouseId} helperText={processingAttempted && !processForm.warehouseId ? t("ironCatalystFlow.errors.invalidProcessing") : undefined} onChange={(event) => setProcessForm((form) => ({ ...form, warehouseId: Number(event.target.value), ironPurchaseId: 0 }))}>
                      <option value="">{t("ironCatalystFlow.selectWarehouse")}</option>{warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.code}</option>)}
                    </Select>
                    <Select label={t("ironCatalystFlow.processing.purchase")} value={String(processForm.ironPurchaseId || "")} error={processingAttempted && !processForm.ironPurchaseId} helperText={processingAttempted && !processForm.ironPurchaseId ? t("ironCatalystFlow.errors.invalidProcessing") : undefined} onChange={(event) => setProcessForm((form) => ({ ...form, ironPurchaseId: Number(event.target.value) }))}>
                      <option value="">{t("ironCatalystFlow.processing.selectPurchase")}</option>
                      {Array.from(new Set(transfers.filter((item) => item.warehouseId === processForm.warehouseId).map((item) => item.ironPurchaseId))).map((id) => <option key={id} value={id}>#{id}</option>)}
                    </Select>
                    <TextField type="number" min="0" label={t("ironCatalystFlow.processing.sourceWeight")} value={processForm.sourceWeightKg || ""} error={processingAttempted && (processForm.sourceWeightKg <= 0 || processForm.sourceWeightKg > remainingProcessableWeight)} helperText={processingAttempted && (processForm.sourceWeightKg <= 0 || processForm.sourceWeightKg > remainingProcessableWeight) ? t("ironCatalystFlow.errors.invalidProcessing") : t("ironCatalystFlow.processing.availableWeight", { weight: formatNumber(remainingProcessableWeight) })} onChange={(event) => setProcessForm((form) => ({ ...form, sourceWeightKg: Number(event.target.value) }))} />
                    <TextField type="number" min="0" label={t("ironCatalystFlow.processing.powderWeight")} value={processForm.powderWeightKg || ""} error={processingAttempted && processForm.powderWeightKg <= 0} helperText={processingAttempted && processForm.powderWeightKg <= 0 ? t("ironCatalystFlow.errors.invalidProcessing") : undefined} onChange={(event) => setProcessForm((form) => ({ ...form, powderWeightKg: Number(event.target.value) }))} />
                    <TextField type="number" min="0" label={t("ironCatalystFlow.processing.ptPerKg")} value={processForm.ptPerKg || ""} error={processingAttempted && processForm.ptPerKg < 0} helperText={processingAttempted && processForm.ptPerKg < 0 ? t("ironCatalystFlow.errors.invalidProcessing") : undefined} onChange={(event) => setProcessForm((form) => ({ ...form, ptPerKg: Number(event.target.value) }))} />
                    <TextField type="number" min="0" label={t("ironCatalystFlow.processing.pdPerKg")} value={processForm.pdPerKg || ""} error={processingAttempted && processForm.pdPerKg < 0} helperText={processingAttempted && processForm.pdPerKg < 0 ? t("ironCatalystFlow.errors.invalidProcessing") : undefined} onChange={(event) => setProcessForm((form) => ({ ...form, pdPerKg: Number(event.target.value) }))} />
                    <TextField type="number" min="0" label={t("ironCatalystFlow.processing.rhPerKg")} value={processForm.rhPerKg || ""} error={processingAttempted && processForm.rhPerKg < 0} helperText={processingAttempted && processForm.rhPerKg < 0 ? t("ironCatalystFlow.errors.invalidProcessing") : undefined} onChange={(event) => setProcessForm((form) => ({ ...form, rhPerKg: Number(event.target.value) }))} />
                    <TextField type="number" min="0" label={t("ironCatalystFlow.processing.expenses")} value={processForm.processingExpenses || ""} error={processingAttempted && processForm.processingExpenses < 0} helperText={processingAttempted && processForm.processingExpenses < 0 ? t("ironCatalystFlow.errors.invalidProcessing") : undefined} onChange={(event) => setProcessForm((form) => ({ ...form, processingExpenses: Number(event.target.value) }))} />
                  </div>
                  <Button onClick={() => { setProcessingAttempted(true); if (isProcessingFormValid) setPendingProcessing(true); }} disabled={mutating}>
                    <FlaskConical size={16} />{t("ironCatalystFlow.actions.process")}
                  </Button>
                </div>
                <section className={styles.historyPanel}><h3>{t("ironCatalystFlow.processing.history")}</h3>{renderProcessingBatches()}</section>
                {processingResult && <div className={styles.successResult}><BadgeCheck size={18} /><div><strong>{t("ironCatalystFlow.processing.completed", { id: processingResult.id })}</strong><span>{formatNumber(processingResult.powderWeightKg)} kg · {formatAmd(processingResult.totalCost)}</span></div></div>}
              </div>
            )}
            {activeTab === "inventory" && renderInventory()}
            {activeTab === "sales-lots" && renderSalesLots()}
            {activeTab === "profit" && renderProfit()}
          </>
        )}
      </section>

      {physicalIronTarget && (
        <ConfirmationModal
          open
          preventClose
          onOpenChange={(open) => !open && setPhysicalIronTarget(null)}
          title={t("ironCatalystFlow.physicalIronSale.title", { id: physicalIronTarget.ironPurchaseId })}
          description={t("ironCatalystFlow.physicalIronSale.available", { weight: formatNumber(physicalIronTarget.weightKg) })}
          confirmText={t("ironCatalystFlow.actions.confirmSale")}
          confirmLoading={mutating}
          onConfirm={() => void submitPhysicalIronSale()}
        >
          <div className={styles.saleForm}>
            <Select label={t("ironCatalystFlow.columns.ironType")} value={physicalIronForm.ironTypeId} onChange={(event) => setPhysicalIronForm((form) => ({ ...form, ironTypeId: event.target.value }))}>
              <option value="">{t("ironCatalystFlow.processing.selectPurchase")}</option>
              {ironTypes.map((item) => <option key={item.id} value={item.id}>{item.name || item.code || `#${item.id}`}</option>)}
            </Select>
            <Select label={t("ironCatalystFlow.physicalIronSale.category")} value={physicalIronForm.categoryId} onChange={(event) => setPhysicalIronForm((form) => ({ ...form, categoryId: event.target.value }))}>
              <option value="">{t("ironCatalystFlow.physicalIronSale.selectCategory")}</option>
              {ironCategories.filter((item) => item.isActive).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
            <TextField type="number" min="0" max={physicalIronTarget.weightKg} step="0.001" label={t("ironCatalystFlow.physicalIronSale.weight")} value={physicalIronForm.weightKg} onChange={(event) => setPhysicalIronForm((form) => ({ ...form, weightKg: event.target.value }))} />
            <TextField type="number" min="0" label={t("ironCatalystFlow.physicalIronSale.unitSalePrice")} value={physicalIronForm.unitSalePrice} onChange={(event) => setPhysicalIronForm((form) => ({ ...form, unitSalePrice: event.target.value }))} />
            <TextField type="number" min="0" label={t("ironCatalystFlow.physicalIronSale.extraExpenses")} value={physicalIronForm.extraExpenses} onChange={(event) => setPhysicalIronForm((form) => ({ ...form, extraExpenses: event.target.value }))} />
          </div>
        </ConfirmationModal>
      )}

      {powderSaleTarget && (
        <ConfirmationModal
          open
          preventClose
          onOpenChange={(open) => !open && setPowderSaleTarget(null)}
          title={t("ironCatalystFlow.powderSale.title", { id: powderSaleTarget.processingBatchId })}
          description={t("ironCatalystFlow.powderSale.available", { weight: formatNumber(powderSaleTarget.availableKg) })}
          confirmText={t("ironCatalystFlow.actions.confirmSale")}
          confirmLoading={mutating}
          onConfirm={() => void submitPowderSale()}
        >
          <div className={styles.modalFields}>
            <TextField type="number" min="0" max={powderSaleTarget.availableKg} step="0.001" label={t("ironCatalystFlow.powderSale.weight")} value={powderSaleForm.powderWeightKg} onChange={(event) => setPowderSaleForm((form) => ({ ...form, powderWeightKg: event.target.value }))} />
            <TextField type="number" min="0" label={t("ironCatalystFlow.powderSale.unitSalePrice")} value={powderSaleForm.unitSalePrice} onChange={(event) => setPowderSaleForm((form) => ({ ...form, unitSalePrice: event.target.value }))} />
            <TextField type="number" min="0" label={t("ironCatalystFlow.powderSale.extraExpenses")} value={powderSaleForm.extraExpenses} onChange={(event) => setPowderSaleForm((form) => ({ ...form, extraExpenses: event.target.value }))} />
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

      {pendingProcessing && (
        <ConfirmationModal
          open
          preventClose
          onOpenChange={(open) => !open && setPendingProcessing(false)}
          title={t("ironCatalystFlow.processing.confirmTitle")}
          description={t("ironCatalystFlow.processing.confirmDescription", { source: formatNumber(processForm.sourceWeightKg), powder: formatNumber(processForm.powderWeightKg) })}
          confirmText={t("ironCatalystFlow.actions.process")}
          confirmLoading={mutating}
          onConfirm={() => void submitProcessing()}
        />
      )}

      {createConfirmationOpen && preview && (
        <ConfirmationModal
          open
          preventClose
          onOpenChange={(open) => !open && setCreateConfirmationOpen(false)}
          title={t("ironCatalystFlow.salesLotPreview.title")}
          description={t("ironCatalystFlow.salesLotPreview.description")}
          confirmText={t("ironCatalystFlow.actions.createSalesLot")}
          confirmLoading={mutating}
          onConfirm={() => void createLot()}
        >
          <div className={styles.previewGrid}>
            <Metric label={t("ironCatalystFlow.metrics.totalPowder")} value={`${formatNumber(preview.totalPowderKg)} kg`} />
            <Metric label={t("ironCatalystFlow.metrics.totalCost")} value={formatAmd(preview.totalCostAmd)} />
            <Metric label={t("ironCatalystFlow.metrics.averagePt")} value={`${formatNumber(preview.ptTotal_g / Math.max(preview.totalPowderKg, 0.000001))} g/kg`} />
            <Metric label={t("ironCatalystFlow.metrics.averagePd")} value={`${formatNumber(preview.pdTotal_g / Math.max(preview.totalPowderKg, 0.000001))} g/kg`} />
            <Metric label={t("ironCatalystFlow.metrics.averageRh")} value={`${formatNumber(preview.rhTotal_g / Math.max(preview.totalPowderKg, 0.000001))} g/kg`} />
            <Metric label={t("ironCatalystFlow.metrics.estimatedRevenue")} value={formatAmd(preview.totalRevenueAmd)} />
            <Metric label={t("ironCatalystFlow.metrics.estimatedProfit")} value={formatAmd(preview.totalRevenueAmd - preview.totalCostAmd)} accent />
          </div>
          <div className={styles.previewSourceSummary}>
            <span>{t("ironCatalystFlow.metrics.ironPowderQuantity")}: {formatNumber(selectedSources.filter((item) => powderSources.find((source) => source.inventoryLotId === item.inventoryLotId)?.sourceType === "iron").reduce((total, item) => total + item.powderKg, 0))} kg</span>
            <span>{t("ironCatalystFlow.metrics.otherPowderQuantity")}: {formatNumber(selectedSources.filter((item) => powderSources.find((source) => source.inventoryLotId === item.inventoryLotId)?.sourceType === "catalyst").reduce((total, item) => total + item.powderKg, 0))} kg</span>
          </div>
          {renderTable(
            ["sourceType", "inventoryLotId", "processingBatchId", "available", "powderKg", "unitCost", "totalCost", "ptPerKg", "pdPerKg", "rhPerKg"].map(column),
            preview.items.map((item) => {
              const source = powderSources.find((candidate) => candidate.inventoryLotId === item.inventoryLotId);
              const quantity = selectedSources.find((selected) => selected.inventoryLotId === item.inventoryLotId)?.powderKg ?? item.powderKg;
              return [
                source?.sourceType === "iron" ? t("ironCatalystFlow.source.iron") : t("ironCatalystFlow.source.catalyst"),
                `#${item.inventoryLotId}`,
                source?.processingBatchId ? `#${source.processingBatchId}` : "—",
                `${formatNumber(source?.availableKg)} kg`,
                `${formatNumber(quantity)} kg`,
                formatAmd(source?.unitCostAmd),
                formatAmd(item.costPartAmd),
                formatNumber(item.ptPerKg_g),
                formatNumber(item.pdPerKg_g),
                formatNumber(item.rhPerKg_g),
              ];
            }),
          )}
        </ConfirmationModal>
      )}

      {lotPreview && (
        <ConfirmationModal
          open
          preventClose
          onOpenChange={(open) => !open && setLotPreview(null)}
          title={t("ironCatalystFlow.salesLotDetails", { id: lotPreview.lot.id })}
          description={t("ironCatalystFlow.detailHint")}
          confirmText={t("common.close")}
          confirmVariant="primary"
          onConfirm={() => setLotPreview(null)}
        >
          <div className={styles.metricGrid}>
            <Metric label={t("ironCatalystFlow.metrics.totalPowder")} value={`${formatNumber(lotPreview.lot.totalPowderKg)} kg`} />
            <Metric label={t("ironCatalystFlow.metrics.totalCost")} value={formatAmd(lotPreview.lot.costTotalAmd)} />
            <Metric label={t("ironCatalystFlow.metrics.status")} value={t(lotPreview.lot.status === 1 ? "ironCatalystFlow.statuses.open" : lotPreview.lot.status === 2 ? "ironCatalystFlow.statuses.sold" : "ironCatalystFlow.statuses.cancelled")} />
          </div>
          {renderTable(["inventoryLotId", "source", "processingBatchId", "powderKg", "costPart"].map(column), lotPreview.items.map((item) => [
            `#${item.inventoryLotId}`,
            item.sourceType === "Iron-derived Powder" ? t("ironCatalystFlow.source.iron") : t("ironCatalystFlow.source.catalyst"),
            item.processingBatchId ? `#${item.processingBatchId}` : "—",
            `${formatNumber(item.powderKg)} kg`,
            formatAmd(item.costPartAmd),
          ]))}
        </ConfirmationModal>
      )}

      {saleTarget && (
        <ConfirmationModal
          open
          preventClose
          onOpenChange={(open) => !open && setSaleTarget(null)}
          title={t("ironCatalystFlow.sell.title", { id: saleTarget.id })}
          description={t("ironCatalystFlow.sell.description")}
          confirmText={t("ironCatalystFlow.actions.confirmSale")}
          confirmDisabled={salePreviewRevenue == null}
          confirmLoading={mutating}
          onConfirm={() => void completeSale()}
        >
          <div className={styles.saleForm}>
            <Select label={t("ironCatalystFlow.sell.currency")} value={saleForm.currencyCode} onChange={(event) => setSaleForm((form) => ({ ...form, currencyCode: event.target.value }))}>
              <option value="USD">USD</option><option value="AMD">AMD</option>
            </Select>
            <TextField type="number" min="0" label={t("ironCatalystFlow.sell.revenue")} value={saleForm.oldRevenue} error={saleAttempted && saleForm.oldRevenue < 0} helperText={saleAttempted && saleForm.oldRevenue < 0 ? t("ironCatalystFlow.errors.invalidProcessing") : undefined} onChange={(event) => setSaleForm((form) => ({ ...form, oldRevenue: Number(event.target.value) }))} />
            <TextField type="number" min="0" label={t("ironCatalystFlow.sell.ptPrice")} value={saleForm.ptPrice} error={saleAttempted && saleForm.ptPrice < 0} helperText={saleAttempted && saleForm.ptPrice < 0 ? t("ironCatalystFlow.errors.invalidProcessing") : undefined} onChange={(event) => setSaleForm((form) => ({ ...form, ptPrice: Number(event.target.value) }))} />
            <TextField type="number" min="0" label={t("ironCatalystFlow.sell.pdPrice")} value={saleForm.pdPrice} error={saleAttempted && saleForm.pdPrice < 0} helperText={saleAttempted && saleForm.pdPrice < 0 ? t("ironCatalystFlow.errors.invalidProcessing") : undefined} onChange={(event) => setSaleForm((form) => ({ ...form, pdPrice: Number(event.target.value) }))} />
            <TextField type="number" min="0" label={t("ironCatalystFlow.sell.rhPrice")} value={saleForm.rhPrice} error={saleAttempted && saleForm.rhPrice < 0} helperText={saleAttempted && saleForm.rhPrice < 0 ? t("ironCatalystFlow.errors.invalidProcessing") : undefined} onChange={(event) => setSaleForm((form) => ({ ...form, rhPrice: Number(event.target.value) }))} />
            <TextField type="number" min="0" max={saleTarget.totalPowderKg} label={t("ironCatalystFlow.sell.powderWeight")} value={saleForm.powderKg} error={saleAttempted && (saleForm.powderKg <= 0 || saleForm.powderKg > saleTarget.totalPowderKg)} helperText={saleAttempted && (saleForm.powderKg <= 0 || saleForm.powderKg > saleTarget.totalPowderKg) ? t("ironCatalystFlow.errors.invalidProcessing") : undefined} onChange={(event) => setSaleForm((form) => ({ ...form, powderKg: Number(event.target.value) }))} />
            <TextField type="number" min="0" label={t("ironCatalystFlow.sell.ptComposition")} value={saleForm.pt_g} error={saleAttempted && saleForm.pt_g < 0} helperText={saleAttempted && saleForm.pt_g < 0 ? t("ironCatalystFlow.errors.invalidProcessing") : undefined} onChange={(event) => setSaleForm((form) => ({ ...form, pt_g: Number(event.target.value) }))} />
            <TextField type="number" min="0" label={t("ironCatalystFlow.sell.pdComposition")} value={saleForm.pd_g} error={saleAttempted && saleForm.pd_g < 0} helperText={saleAttempted && saleForm.pd_g < 0 ? t("ironCatalystFlow.errors.invalidProcessing") : undefined} onChange={(event) => setSaleForm((form) => ({ ...form, pd_g: Number(event.target.value) }))} />
            <TextField type="number" min="0" label={t("ironCatalystFlow.sell.rhComposition")} value={saleForm.rh_g} error={saleAttempted && saleForm.rh_g < 0} helperText={saleAttempted && saleForm.rh_g < 0 ? t("ironCatalystFlow.errors.invalidProcessing") : undefined} onChange={(event) => setSaleForm((form) => ({ ...form, rh_g: Number(event.target.value) }))} />
            <Button variant="secondary" onClick={() => void previewSale()} disabled={mutating}><CalculatorIcon />{t("ironCatalystFlow.actions.previewSale")}</Button>
            {salePreviewRevenue != null && <div className={styles.salePreview}><strong>{t("ironCatalystFlow.metrics.estimatedRevenue")}: {formatAmd(salePreviewRevenue)}</strong><span>{t("ironCatalystFlow.metrics.totalCost")}: {formatAmd(saleTarget.costTotalAmd)}</span><b>{t("ironCatalystFlow.metrics.estimatedProfit")}: {formatAmd(salePreviewRevenue - saleTarget.costTotalAmd)}</b></div>}
            {salePreviewRevenue != null && <div className={styles.salePreview}><span>{t("ironCatalystFlow.sell.currency")}: {saleForm.currencyCode}</span><span>{t("ironCatalystFlow.sell.exchangeRate")}: {formatNumber(saleExchangeRate)}</span>{saleTarget.containsIronPowder && <span className={styles.ironBadge}>{t("ironCatalystFlow.badges.ironIncluded")}</span>}</div>}
          </div>
        </ConfirmationModal>
      )}

      {saleResult && (
        <ConfirmationModal
          open
          onOpenChange={() => setSaleResult(null)}
          title={t("ironCatalystFlow.saleResult.title")}
          description={t("ironCatalystFlow.saleResult.description", { id: saleResult.salesLotId })}
          confirmText={t("common.close")}
          confirmVariant="primary"
          onConfirm={() => setSaleResult(null)}
        >
          <div className={styles.metricGrid}>
            <Metric label={t("ironCatalystFlow.metrics.revenue")} value={formatAmd(saleResult.revenueTotalAmd)} />
            <Metric label={t("ironCatalystFlow.metrics.totalCost")} value={formatAmd(saleResult.costAmd)} />
            <Metric label={t("ironCatalystFlow.metrics.totalProfit")} value={formatAmd(saleResult.profitAmd)} accent />
          </div>
        </ConfirmationModal>
      )}
    </main>
  );
};

const Metric = ({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) => (
  <div className={`${styles.metric} ${accent ? styles.metricAccent : ""}`}><span>{label}</span><strong>{value}</strong></div>
);

const CalculatorIcon = () => <Scale size={15} aria-hidden="true" />;

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