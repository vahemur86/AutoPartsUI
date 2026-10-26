import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";
import { Button, ConfirmationModal, Select, TextField } from "@/ui-kit";
import { ArrowLeftRight, BadgeCheck, BadgeDollarSign, Banknote, Check, CheckCircle2, CircleAlert, CircleDollarSign, CreditCard, FileText, ScanLine, Search, ShoppingBag, Trash2, Wallet } from "lucide-react";
import { CountryPhoneInput } from "@/components/common";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchShops } from "@/store/slices/shopsSlice";
import { fetchShopProducts } from "@/store/slices/shops/productsSlice";

// services
import { searchShopProductsBySku } from "@/services/warehouses/warehouseProduct";
import {
  convertServiceEstimateToOrder,
  getServiceEstimateByNumber,
} from "@/services/operator";
import { agentsService } from "@/services/agents";
import { agentContractsService } from "@/services/agentContracts";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";

// utils
import { getCashRegisterId } from "@/utils";

// services
import { createPOSSale } from "@/services/shops/posSale";

// types
import type { ServiceEstimateLookupResponse } from "@/types/operator";
import type { AgentContractListItemDto } from "@/types/agentContracts";
import type { AgentDto } from "@/types/agents";
import type {
  AgentProductDebtDto,
  AgentProductDebtPaymentDto,
} from "@/types/agents";
import type { ShopProductItem } from "@/types/warehouses/warehouseProduct";

// styles
import styles from "./CashierMode.module.css";

interface CashierModeProps {
  cashRegisterId?: number;
}

type CashierProductRow = ShopProductItem & {
  productCode: string;
  sku: string;
};

type PaymentMode = "cash" | "non-cash" | "mixed";
type SaleType = "normal" | "agent-credit" | "product-debt";

type CartItem = {
  productId: number;
  shopStockId: number;
  productCode: string;
  unitPrice: number;
  quantity: number;
  availableQuantity: number;
};

export const CashierMode = ({ cashRegisterId }: CashierModeProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { shops } = useAppSelector((state) => state.shops);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [saleType, setSaleType] = useState<SaleType>("normal");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerPhoneCountry, setCustomerPhoneCountry] = useState<CountryCode>("AM");
  const [customerLookupLoading, setCustomerLookupLoading] = useState(false);
  const [identifiedAgent, setIdentifiedAgent] = useState<AgentDto | null>(null);
  const [identifiedContract, setIdentifiedContract] = useState<AgentContractListItemDto | null>(null);
  const [identifiedProductDebt, setIdentifiedProductDebt] = useState<AgentProductDebtDto | null>(null);
  const [creditConfirmationOpen, setCreditConfirmationOpen] = useState(false);
  const [debtAgents, setDebtAgents] = useState<AgentDto[]>([]);
  const [debtAgentId, setDebtAgentId] = useState("");
  const [debtContracts, setDebtContracts] = useState<AgentContractListItemDto[]>([]);
  const [debtContractId, setDebtContractId] = useState("");
  const [debtSummary, setDebtSummary] = useState<AgentProductDebtDto | null>(null);
  const [debtPaymentHistory, setDebtPaymentHistory] = useState<AgentProductDebtPaymentDto[]>([]);
  const [debtPaymentAmount, setDebtPaymentAmount] = useState("");
  const [debtLoading, setDebtLoading] = useState(false);
  const [debtPaymentSaving, setDebtPaymentSaving] = useState(false);
  const [agentLookupError, setAgentLookupError] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");
  const [cashPaid, setCashPaid] = useState("0");
  const [nonCashPaid, setNonCashPaid] = useState("0");
  const [isSaleLoading, setIsSaleLoading] = useState(false);
  const [saleError, setSaleError] = useState("");
  const [saleSuccess, setSaleSuccess] = useState<{
    amount: number;
    saleNumber: string | number;
  } | null>(null);
  const [searchSku, setSearchSku] = useState("");
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [searchMessageType, setSearchMessageType] = useState<"success" | "error" | null>(null);
  const [estimateNumberInput, setEstimateNumberInput] = useState("");
  const [isEstimateLoading, setIsEstimateLoading] = useState(false);
  const [isEstimateConverting, setIsEstimateConverting] = useState(false);
  const [selectedEstimate, setSelectedEstimate] =
    useState<ServiceEstimateLookupResponse | null>(null);
  const skuInputRef = useRef<HTMLInputElement | null>(null);

  const cashRegister = useMemo(() => getCashRegisterId(0), []);
  const resolvedCashRegisterId = useMemo(() => {
    const fromProp = Number(cashRegisterId || 0);
    if (Number.isFinite(fromProp) && fromProp > 0) {
      return fromProp;
    }

    const fromLocal = Number(cashRegister || 0);
    if (Number.isFinite(fromLocal) && fromLocal > 0) {
      return fromLocal;
    }

    return 0;
  }, [cashRegisterId, cashRegister]);
  const currentShopId = shops[0]?.id ?? null;
  const currentShopCode = shops[0]?.code ?? "";

  useEffect(() => {
    if (!resolvedCashRegisterId) return;
    dispatch(fetchShops({ cashRegisterId: resolvedCashRegisterId }));
  }, [dispatch, resolvedCashRegisterId]);

  useEffect(() => {
    skuInputRef.current?.focus();
  }, [currentShopId]);

  useEffect(() => {
    if (!currentShopId || !resolvedCashRegisterId) return;
    dispatch(
      fetchShopProducts({
        shopId: currentShopId,
        cashRegisterId: resolvedCashRegisterId,
      }),
    );
    setCartItems([]);
  }, [dispatch, currentShopId, resolvedCashRegisterId]);

  const totalAmount = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + Number(item.unitPrice) * item.quantity,
        0,
      ),
    [cartItems],
  );

  const isEstimateMode = !!selectedEstimate;

  const estimateServiceLines = useMemo(
    () => (selectedEstimate?.lines ?? selectedEstimate?.services ?? []),
    [selectedEstimate],
  );

  const estimateProductLines = useMemo(
    () => selectedEstimate?.productLines ?? selectedEstimate?.products ?? [],
    [selectedEstimate],
  );

  const estimateServicesTotal = useMemo(() => {
    const fromField = Number(selectedEstimate?.servicesTotal || 0);
    if (fromField > 0) return fromField;

    return estimateServiceLines.reduce(
      (sum, line) => sum + Number(line.customerPrice || 0),
      0,
    );
  }, [selectedEstimate, estimateServiceLines]);

  const estimateProductsTotal = useMemo(() => {
    const fromField = Number(selectedEstimate?.productsTotal || 0);
    if (fromField > 0) return fromField;

    return estimateProductLines.reduce((sum, line) => {
      const lineTotal = Number((line as { totalPrice?: number; lineTotal?: number }).lineTotal ?? (line as { totalPrice?: number; lineTotal?: number }).totalPrice ?? 0);
      if (lineTotal > 0) return sum + lineTotal;
      return sum + Number(line.quantity || 0) * Number(line.unitPrice || 0);
    }, 0);
  }, [selectedEstimate, estimateProductLines]);

  const estimateTotalAmount = useMemo(() => {
    const fromField = Number(selectedEstimate?.grandTotal || selectedEstimate?.totalAmount || 0);
    if (fromField > 0) return fromField;
    return estimateServicesTotal + estimateProductsTotal;
  }, [selectedEstimate, estimateServicesTotal, estimateProductsTotal]);

  const activeTotalAmount = isEstimateMode ? estimateTotalAmount : totalAmount;

  const resolveActiveContract = useCallback(
    (contracts?: Array<Partial<AgentContractListItemDto>> | null) => {
      if (!Array.isArray(contracts) || contracts.length === 0) return null;

      const activeContract = contracts.find((contract) => {
        const statusText = String(contract.status ?? "").toLowerCase();
        const numericStatus = Number(contract.status ?? -1);
        return statusText === "active" || numericStatus === 0;
      });

      return activeContract ?? null;
    },
    [],
  );

  const isAgentCreditSale = saleType === "agent-credit";
  const isProductDebtSale = saleType === "product-debt";
  const isAgentCreditReady =
    isAgentCreditSale &&
    !!identifiedAgent &&
    !!identifiedContract &&
    (String(identifiedContract.status).toLowerCase() === "active" || Number(identifiedContract.status) === 0);

  const cashPaidNum = useMemo(() => parseFloat(cashPaid) || 0, [cashPaid]);
  const nonCashPaidNum = useMemo(() => parseFloat(nonCashPaid) || 0, [nonCashPaid]);

  const resolvedCashPaid = useMemo(() => {
    if (paymentMode === "cash") return activeTotalAmount;
    if (paymentMode === "non-cash") return 0;
    return cashPaidNum;
  }, [paymentMode, activeTotalAmount, cashPaidNum]);

  const resolvedNonCashPaid = useMemo(() => {
    if (paymentMode === "non-cash") return activeTotalAmount;
    if (paymentMode === "cash") return 0;
    return nonCashPaidNum;
  }, [paymentMode, activeTotalAmount, nonCashPaidNum]);

  const change = useMemo(() => {
    if (paymentMode === "cash") return Math.max(0, cashPaidNum - activeTotalAmount);
    if (paymentMode === "mixed") return Math.max(0, cashPaidNum + nonCashPaidNum - activeTotalAmount);
    return 0;
  }, [paymentMode, cashPaidNum, nonCashPaidNum, activeTotalAmount]);

  const handleAddToCart = useCallback(
    (product: CashierProductRow) => {
      const resolvedProductId = product.productId ?? product.product?.id;
      const shopStockId = product.id;
      if (!resolvedProductId || !shopStockId) return;

      setCartItems((prevItems) => {
        const existing = prevItems.find(
          (item) => item.productId === resolvedProductId,
        );
        if (existing) {
          return prevItems.map((item) =>
            item.productId === resolvedProductId
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          );
        }

        return [
          ...prevItems,
          {
            productId: resolvedProductId,
            shopStockId,
            productCode: product.productCode,
            unitPrice: product.salePrice,
            quantity: 1,
            availableQuantity: product.quantity,
          },
        ];
      });
    },
    [],
  );

  const handleSkuSearch = useCallback(async () => {
    const sku = searchSku.trim();
    if (!sku) {
      setSearchMessageType("error");
      setSearchMessage(t("operatorPage.cashier.enterSku"));
      return;
    }
    if (!currentShopId) {
      setSearchMessageType("error");
      setSearchMessage(t("operatorPage.cashier.loadingShop"));
      return;
    }

    try {
      const crId = resolvedCashRegisterId;
      if (!crId) {
        setSearchMessageType("error");
        setSearchMessage(t("operatorPage.cashier.missingCashRegisterHeader"));
        return;
      }
      const results = await searchShopProductsBySku({
        shopId: currentShopId,
        cashRegisterId: crId,
        sku,
      });

      const shopProduct = results[0];
      if (!shopProduct) {
        setSearchMessageType("error");
        setSearchMessage(t("operatorPage.cashier.productNotFound"));
        return;
      }

      const productCode = shopProduct.product?.code || String(shopProduct.productId || "-");
      const productSku = shopProduct.product?.sku || sku;

      handleAddToCart({
        ...shopProduct,
        productCode,
        sku: productSku,
      });

      setSearchSku("");
      setSearchMessageType("success");
      setSearchMessage(
        t("operatorPage.cashier.addedToCart", {
          sku: productSku,
        }),
      );
      skuInputRef.current?.focus();
    } catch {
      setSearchMessageType("error");
      setSearchMessage(t("operatorPage.cashier.productNotFound"));
    }
  }, [
    searchSku,
    currentShopId,
    resolvedCashRegisterId,
    handleAddToCart,
    t,
  ]);

  const handleQuantityChange = useCallback(
    (productId: number, value: string) => {
      const quantity = Number(value);
      if (Number.isNaN(quantity) || quantity < 0) return;
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(0, quantity) }
            : item,
        ),
      );
    },
    [],
  );

  const handleRemoveFromCart = useCallback((productId: number) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.productId !== productId),
    );
  }, []);

  const resetCheckoutState = useCallback(() => {
    setCartItems([]);
    setCashPaid("0");
    setNonCashPaid("0");
    setPaymentMode("cash");
    setSaleType("normal");
    setCustomerPhone("");
    setCustomerPhoneCountry("AM");
    setIdentifiedAgent(null);
    setIdentifiedContract(null);
    setIdentifiedProductDebt(null);
    setCreditConfirmationOpen(false);
    setAgentLookupError(null);
    setSearchSku("");
    setSearchMessage(null);
    setSearchMessageType(null);
    setEstimateNumberInput("");
    setSelectedEstimate(null);
  }, []);

  useEffect(() => {
    if (saleType !== "product-debt") return;
    void agentsService
      .getAgents({ page: 1, pageSize: 200, status: 0 })
      .then((result) => setDebtAgents(result.results ?? []))
      .catch((error) => toast.error(getApiErrorMessage(error, t("operatorPage.cashier.productDebt.loadFailed"))));
  }, [saleType, t]);

  useEffect(() => {
    if (!debtAgentId) {
      setDebtContracts([]);
      setDebtContractId("");
      setDebtSummary(null);
      setDebtPaymentHistory([]);
      return;
    }

    let isCancelled = false;
    setDebtLoading(true);
    void Promise.all([
      agentContractsService.listProductCreditContracts({ agentId: debtAgentId, page: 1, pageSize: 50 }),
      agentsService.getAgentProductDebt(debtAgentId, undefined, resolvedCashRegisterId),
    ])
      .then(([contractsResponse, summary]) => {
        if (isCancelled) return;
        const activeContracts = (contractsResponse.results ?? []).filter(
          (contract) =>
            (String(contract.status).toLowerCase() === "active" || Number(contract.status) === 0),
        );
        setDebtContracts(activeContracts);
        setDebtContractId((current) =>
          activeContracts.some((contract) => contract.id === current)
            ? current
            : activeContracts.length === 1
              ? activeContracts[0].id
              : "",
        );
        setDebtSummary(summary);
      })
      .catch((error) => {
        if (!isCancelled) {
          setDebtContracts([]);
          setDebtSummary(null);
          toast.error(getApiErrorMessage(error, t("operatorPage.cashier.productDebt.loadFailed")));
        }
      })
      .finally(() => {
        if (!isCancelled) setDebtLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [debtAgentId, resolvedCashRegisterId, t]);

  useEffect(() => {
    if (!debtAgentId || !debtContractId) return;
    let isCancelled = false;
    void agentsService
      .getAgentProductDebt(debtAgentId, debtContractId, resolvedCashRegisterId)
      .then((summary) => {
        if (!isCancelled) setDebtSummary(summary);
      })
      .catch((error) => {
        if (!isCancelled) toast.error(getApiErrorMessage(error, t("operatorPage.cashier.productDebt.loadFailed")));
      });
    return () => {
      isCancelled = true;
    };
  }, [debtAgentId, debtContractId, resolvedCashRegisterId, t]);

  const handleSubmitProductDebtPayment = useCallback(async () => {
    const amountAmd = Number(debtPaymentAmount);
    if (!debtAgentId || !Number.isFinite(amountAmd) || amountAmd <= 0) {
      toast.error(t("operatorPage.cashier.productDebt.invalidAmount"));
      return;
    }
    if (debtSummary && amountAmd > debtSummary.outstandingAmountAmd) {
      toast.error(t("operatorPage.cashier.productDebt.amountExceedsDebt"));
      return;
    }
    if (!resolvedCashRegisterId) {
      toast.error(t("operatorPage.cashier.missingCashRegisterHeader"));
      return;
    }

    setDebtPaymentSaving(true);
    try {
      await agentsService.payAgentProductDebt(
        debtAgentId,
        { amountAmd, ...(debtContractId ? { contractId: debtContractId } : {}) },
        resolvedCashRegisterId,
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("operatorPage.cashier.productDebt.paymentFailed")));
      setDebtPaymentSaving(false);
      return;
    }

    toast.success(t("operatorPage.cashier.productDebt.paymentRecorded"));
    setSaleType("normal");
    window.dispatchEvent(new CustomEvent("agent-product-credit-activity-changed", {
      detail: { agentId: debtAgentId },
    }));
    setDebtPaymentAmount("");
    try {
      const [summaryResult, paymentResult] = await Promise.allSettled([
        agentsService.getAgentProductDebt(
          debtAgentId,
          debtContractId || undefined,
          resolvedCashRegisterId,
        ),
        agentsService.getAgentProductDebtPayments(
          debtAgentId,
          debtContractId || undefined,
          resolvedCashRegisterId,
        ),
      ]);
      if (summaryResult.status === "fulfilled") setDebtSummary(summaryResult.value);
      if (paymentResult.status === "fulfilled") setDebtPaymentHistory(paymentResult.value);
      if ([summaryResult, paymentResult].some((result) => result.status === "rejected")) {
        toast.error(t("operatorPage.cashier.productDebt.loadFailed"));
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("operatorPage.cashier.productDebt.loadFailed")));
    } finally {
      setDebtPaymentSaving(false);
    }
  }, [debtAgentId, debtContractId, debtPaymentAmount, debtSummary, resolvedCashRegisterId, t]);

  const handleLookupCustomerAndAgent = useCallback(async () => {
    const cleanedPhone = customerPhone.trim();
    if (!cleanedPhone) {
      toast.error(t("operatorPage.cashier.customerLookup.phoneRequired"));
      return;
    }

    const parsed = parsePhoneNumberFromString(cleanedPhone);
    if (!parsed || !parsed.isValid()) {
      toast.error(t("operatorPage.cashier.customerLookup.invalidPhone"));
      return;
    }

    setCustomerLookupLoading(true);
    setAgentLookupError(null);
    setIdentifiedAgent(null);
    setIdentifiedContract(null);
    setIdentifiedProductDebt(null);

    try {
      const agentsResponse = await agentsService.getAgents({
        phone: cleanedPhone,
        page: 1,
        pageSize: 1,
        status: 0,
      });
      const matchedAgent = agentsResponse.results[0];

      if (!matchedAgent) {
        setAgentLookupError(t("operatorPage.cashier.customerLookup.notAnAgent"));
        toast.error(t("operatorPage.cashier.customerLookup.notAnAgent"));
        return;
      }

      setIdentifiedAgent(matchedAgent);

      const contractsResponse = await agentContractsService.listProductCreditContracts({
        agentId: matchedAgent.id,
        page: 1,
        pageSize: 50,
      });
      const activeContract = resolveActiveContract(contractsResponse.results);

      if (!activeContract) {
        setIdentifiedContract(null);
        setAgentLookupError(t("operatorPage.cashier.customerLookup.noActiveContract"));
        toast.error(t("operatorPage.cashier.customerLookup.noActiveContract"));
        return;
      }

      setIdentifiedContract(activeContract as AgentContractListItemDto);

      const productDebt = await agentsService
        .getAgentProductDebt(matchedAgent.id, activeContract.id, resolvedCashRegisterId)
        .catch(() => null);
      setIdentifiedProductDebt(productDebt);

      toast.success(t("operatorPage.cashier.customerLookup.agentIdentified"));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("operatorPage.cashier.customerLookup.failedToLoad");
      setAgentLookupError(message);
      toast.error(message);
    } finally {
      setCustomerLookupLoading(false);
    }
  }, [customerPhone, resolvedCashRegisterId, resolveActiveContract, t]);

  const handleSubmitSale = useCallback(async () => {
    if (cartItems.length === 0 || !currentShopId) return;
    setSaleError("");

    const crId = resolvedCashRegisterId;
    if (!crId) {
      setSaleError(t("operatorPage.cashier.missingCashRegisterHeader"));
      return;
    }

    if (isAgentCreditSale) {
      if (!identifiedAgent || !identifiedContract || !isAgentCreditReady) {
        setSaleError(t("operatorPage.cashier.customerLookup.noActiveContract"));
        return;
      }
    }

    if (cartItems.some((item) => item.quantity > item.availableQuantity)) {
      setSaleError(t("operatorPage.cashier.insufficientStock"));
      return;
    }

    setIsSaleLoading(true);
    try {
      const saleResponse = await createPOSSale(
        {
          shopId: currentShopId,
          ...(isAgentCreditSale
            ? {
                customerId: identifiedAgent?.customerId ?? null,
                isAgentCredit: true,
                agentId: identifiedAgent?.id ?? null,
                agentContractId: identifiedContract?.id ?? null,
              }
            : {}),
          cashPaid: isAgentCreditSale ? 0 : resolvedCashPaid,
          nonCashPaid: isAgentCreditSale ? 0 : resolvedNonCashPaid,
          items: cartItems.map((item) => ({
            productId: item.productId,
            shopStockId: item.shopStockId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
        crId,
      );
      setSaleSuccess({
        amount: Number(saleResponse.totalAmount),
        saleNumber: saleResponse.saleNumber || saleResponse.id,
      });
      if (isAgentCreditSale && identifiedAgent?.id) {
        window.dispatchEvent(new CustomEvent("agent-product-credit-activity-changed", {
          detail: { agentId: identifiedAgent.id },
        }));
      }
      dispatch(
        fetchShopProducts({
          shopId: currentShopId,
          cashRegisterId: crId,
        }),
      );
      resetCheckoutState();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error ?? "");
      const isInsufficientStock =
        /(?:insufficient|not enough|exceed|greater than|остат|колич|ապրանք|քանակ|մնացորդ).*(?:stock|quantity|available|inventory|остат|колич|ապրանք|քանակ|մնացորդ)|(?:stock|quantity|available|inventory|остат|колич|ապրանք|քանակ|մնացորդ).*(?:insufficient|not enough|exceed|greater than|остат|колич|ապրանք|քանակ|մնացորդ)/i.test(errorMessage);
      const msg = isInsufficientStock
        ? t("operatorPage.cashier.insufficientStock")
        : errorMessage || t("operatorPage.cashier.saleError");
      setSaleError(msg);
    } finally {
      setIsSaleLoading(false);
    }
  }, [
    cartItems,
    currentShopId,
    resolvedCashRegisterId,
    resolvedCashPaid,
    resolvedNonCashPaid,
    isAgentCreditSale,
    isAgentCreditReady,
    identifiedAgent,
    identifiedContract,
    resetCheckoutState,
    t,
    dispatch,
  ]);

  const handleCompleteSale = useCallback(() => {
    if (isAgentCreditSale) {
      setCreditConfirmationOpen(true);
      return;
    }
    void handleSubmitSale();
  }, [handleSubmitSale, isAgentCreditSale]);

  const handleDismissSaleSuccess = useCallback(() => {
    setSaleSuccess(null);
  }, []);

  const handleFindEstimate = useCallback(async () => {
    const estimateNumber = estimateNumberInput.trim();
    if (!estimateNumber) {
      toast.error(t("operatorPage.cashier.estimate.enterNumber"));
      return;
    }

    setIsEstimateLoading(true);
    try {
      const result = await getServiceEstimateByNumber({
        estimateNumber,
        cashRegisterId: resolvedCashRegisterId,
      });
      setSelectedEstimate(result);
      setPaymentMode("cash");
      setCashPaid("0");
      setNonCashPaid("0");
      toast.success(t("operatorPage.cashier.estimate.found"));
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : t("operatorPage.cashier.estimate.notFound");
      setSelectedEstimate(null);
      toast.error(msg);
    } finally {
      setIsEstimateLoading(false);
    }
  }, [estimateNumberInput, resolvedCashRegisterId, t]);

  const handleConvertEstimate = useCallback(async () => {
    if (!selectedEstimate?.id) return;

    if (estimateTotalAmount <= 0) {
      toast.error(t("operatorPage.cashier.estimate.invalidAmount"));
      return;
    }

    const paidTotal = resolvedCashPaid + resolvedNonCashPaid;
    if (paidTotal < estimateTotalAmount) {
      toast.error(t("operatorPage.cashier.estimate.insufficientPayment"));
      return;
    }

    setIsEstimateConverting(true);
    try {
      await convertServiceEstimateToOrder({
        payload: {
          serviceEstimateId: Number(selectedEstimate.id),
          cashPaid: Number(resolvedCashPaid || 0),
          nonCashPaid: Number(resolvedNonCashPaid || 0),
          products: [],
        },
        cashRegisterId: resolvedCashRegisterId,
      });

      toast.success(t("operatorPage.cashier.estimate.confirmed"));
      resetCheckoutState();
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : t("operatorPage.cashier.estimate.confirmFailed");
      toast.error(msg);
    } finally {
      setIsEstimateConverting(false);
    }
  }, [
    selectedEstimate,
    resolvedCashPaid,
    resolvedNonCashPaid,
    resolvedCashRegisterId,
    estimateTotalAmount,
    resetCheckoutState,
    t,
  ]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{t("operatorPage.cashier.title")}</h2>
          <p className={styles.description}>
            {t("operatorPage.cashier.description")}
          </p>
        </div>

        <div className={styles.shopBadgeContainer}>
          <div className={styles.shopBadge}>
            <span>{t("operatorPage.cashier.shopLabel")}</span>
            <strong>{currentShopCode || t("operatorPage.cashier.loadingShop")}</strong>
          </div>
        </div>
      </div>

      <div className={styles.estimateSearchRow}>
        <div
          className={styles.saleTypeRow}
          role="radiogroup"
          aria-label={t("operatorPage.cashier.saleTypes.label")}
        >
          {(["normal", "agent-credit", "product-debt"] as SaleType[]).map((type) => (
            <label
              key={type}
              className={`${styles.saleTypeOption} ${saleType === type ? styles.saleTypeOptionActive : ""}`}
            >
              <input
                type="radio"
                name="saleType"
                value={type}
                checked={saleType === type}
                onChange={() => {
                  setSaleType(type);
                  if (type === "normal") {
                    setCustomerPhone("");
                    setCustomerPhoneCountry("AM");
                    setIdentifiedAgent(null);
                    setIdentifiedContract(null);
                    setAgentLookupError(null);
                  }
                }}
              />
              <span className={styles.saleTypeIcon} aria-hidden="true">
                {type === "normal" ? <ShoppingBag size={17} /> : type === "agent-credit" ? <BadgeDollarSign size={18} /> : <Wallet size={17} />}
              </span>
              <span className={styles.saleTypeCopy}>
                <strong>{t(type === "normal" ? "operatorPage.cashier.saleTypes.normal" : type === "agent-credit" ? "operatorPage.cashier.saleTypes.agentCredit" : "operatorPage.cashier.saleTypes.productDebt")}</strong>
                <small>{t(type === "normal" ? "operatorPage.cashier.saleTypes.normalDescription" : type === "agent-credit" ? "operatorPage.cashier.saleTypes.agentCreditDescription" : "operatorPage.cashier.saleTypes.productDebtDescription")}</small>
              </span>
              {saleType === type && <Check className={styles.saleTypeCheck} size={16} aria-hidden="true" />}
            </label>
          ))}
        </div>
      </div>

      {isProductDebtSale && (
        <section className={styles.agentCreditPanel}>
          <h3>{t("operatorPage.cashier.productDebt.title")}</h3>
          <Select
            label={t("operatorPage.cashier.productDebt.selectAgent")}
            searchable
            searchPlaceholder={t("operatorPage.cashier.productDebt.searchAgent")}
            dropdownMaxHeight={420}
            value={debtAgentId}
            onChange={(event) => {
              setDebtAgentId(event.target.value);
              setDebtPaymentHistory([]);
            }}
          >
            <option value="">{t("operatorPage.cashier.productDebt.selectAgent")}</option>
            {debtAgents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.code} - {agent.customer?.fullName || agent.phone || agent.code}
              </option>
            ))}
          </Select>
          {debtContracts.length > 1 && (
            <Select
              value={debtContractId}
              onChange={(event) => {
                setDebtContractId(event.target.value);
                setDebtPaymentHistory([]);
              }}
            >
              <option value="">{t("operatorPage.cashier.productDebt.selectContract")}</option>
              {debtContracts.map((contract) => (
                <option key={contract.id} value={contract.id}>
                  {contract.contractNumber}
                </option>
              ))}
            </Select>
          )}
          {debtLoading ? (
            <div>{t("operatorPage.cashier.processing")}</div>
          ) : debtAgentId ? (
            <div className={styles.agentInfoCard}>
              {debtContracts.length === 0 ? (
                <div>{t("operatorPage.cashier.productDebt.noActiveContract")}</div>
              ) : (
                <div>
                  <strong>{t("operatorPage.cashier.productDebt.activeContract")}:</strong>{" "}
                  {debtContracts.find((contract) => contract.id === debtContractId)?.contractNumber ||
                    debtContracts[0]?.contractNumber}
                </div>
              )}
              <div>
                <strong>{t("operatorPage.cashier.productDebt.outstanding")}:</strong>{" "}
                {Number(debtSummary?.outstandingAmountAmd ?? 0).toLocaleString()} AMD
              </div>
            </div>
          ) : null}
          <div className={styles.estimateSearchRow}>
            <TextField
              label={t("operatorPage.cashier.productDebt.amount")}
              type="number"
              min="0.01"
              max={debtSummary?.outstandingAmountAmd}
              value={debtPaymentAmount}
              onChange={(event) => setDebtPaymentAmount(event.target.value)}
              inputMode="decimal"
            />
            <Button
              type="button"
              className={`${styles.cashierActionButton} ${styles.cashierActionRecord}`}
              onClick={() => void handleSubmitProductDebtPayment()}
              disabled={
                debtPaymentSaving ||
                debtLoading ||
                !debtAgentId ||
                debtContracts.length === 0 ||
                (debtContracts.length > 1 && !debtContractId) ||
                !debtSummary ||
                Number(debtPaymentAmount) <= 0 ||
                Number(debtPaymentAmount) > Number(debtSummary?.outstandingAmountAmd ?? 0)
              }
            >
              <Wallet size={16} aria-hidden="true" />
              {debtPaymentSaving
                ? t("operatorPage.cashier.processing")
                : t("operatorPage.cashier.productDebt.submitPayment")}
            </Button>
          </div>
            {debtPaymentHistory.length > 0 && (
              <div className={styles.debtHistorySection} aria-live="polite">
                <h4>{t("operatorPage.cashier.productDebt.recentPayments")}</h4>
                {debtPaymentHistory.slice(0, 3).map((payment) => (
                  <div className={styles.debtHistoryRow} key={payment.id}>
                    <span>{new Date(payment.paymentDate).toLocaleDateString()}</span>
                    <strong>{Number(payment.amountAmd).toLocaleString()} AMD</strong>
                  </div>
                ))}
              </div>
            )}
        </section>
      )}

      {!isProductDebtSale && isAgentCreditSale && (
        <div className={styles.agentCreditPanel}>
          <form
            className={styles.estimateSearchRow}
            onSubmit={(event) => {
              event.preventDefault();
              void handleLookupCustomerAndAgent();
            }}
          >
            <div className={styles.customerPhoneField}>
              <label>{t("operatorPage.cashier.customerLookup.phoneLabel")}</label>
              <CountryPhoneInput
                phone={customerPhone}
                selectedCountry={customerPhoneCountry}
                onCountryChange={(country) => {
                  setCustomerPhoneCountry(country);
                  setCustomerPhone("");
                }}
                onPhoneChange={setCustomerPhone}
                disabled={customerLookupLoading}
              />
            </div>
            <Button
              type="submit"
              className={`${styles.cashierActionButton} ${styles.cashierActionLookup}`}
              disabled={customerLookupLoading}
            >
              <Search size={16} aria-hidden="true" />
              {customerLookupLoading ? t("operatorPage.cashier.processing") : t("operatorPage.cashier.customerLookup.lookupButton")}
            </Button>
          </form>

          {agentLookupError && <div className={styles.errorMessage}>{agentLookupError}</div>}

          {identifiedAgent && identifiedContract && (
            <div className={styles.agentInfoCard}>
              <div><strong>{t("operatorPage.cashier.customerLookup.customer")}:</strong> {identifiedAgent.customer?.fullName || identifiedAgent.customer?.phone || identifiedAgent.phone || "-"}</div>
              <div><strong>{t("operatorPage.cashier.customerLookup.agent")}:</strong> {identifiedAgent.code} — {identifiedAgent.customer?.fullName || identifiedAgent.phone || "Agent"}</div>
              <div><strong>{t("operatorPage.cashier.customerLookup.contract")}:</strong> {identifiedContract.contractNumber}</div>
              <div><strong>{t("operatorPage.cashier.customerLookup.status")}:</strong> {identifiedContract.status}</div>
            </div>
          )}
        </div>
      )}

      {!isProductDebtSale && (
        <div className={styles.estimateSearchRow}>
          <TextField
            className={styles.searchTextField}
            label={t("operatorPage.cashier.estimate.label")}
            value={estimateNumberInput}
            onChange={(event) => setEstimateNumberInput(event.target.value)}
            placeholder={t("operatorPage.cashier.estimate.placeholder")}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleFindEstimate();
              }
            }}
            inputMode="text"
          />
          <Button
            type="button"
            className={`${styles.cashierActionButton} ${styles.cashierActionEstimate}`}
            onClick={handleFindEstimate}
            disabled={isEstimateLoading}
          >
            <FileText size={16} aria-hidden="true" />
            {isEstimateLoading
              ? t("operatorPage.cashier.processing")
              : t("operatorPage.cashier.estimate.findButton")}
          </Button>
        </div>
      )}

      {!isProductDebtSale && selectedEstimate && (
        <div className={styles.estimateCard}>
          <div className={styles.estimateHeader}>
            <strong>
              {t("operatorPage.cashier.estimate.number")}: {selectedEstimate.estimateNumber}
            </strong>
            <span>
              {t("operatorPage.cashier.estimate.status")}: {selectedEstimate.status || t("operatorPage.cashier.estimate.pending")}
            </span>
          </div>

          <div className={styles.estimateGrid}>
            <div>
              {t("operatorPage.cashier.estimate.vehicle")}: {selectedEstimate.vehicleBrandName || "-"} {selectedEstimate.vehicleModelName || ""} {selectedEstimate.vehicleYear || ""}
            </div>
            <div>
              {t("operatorPage.cashier.estimate.vin")}: {selectedEstimate.vinCode || "-"}
            </div>
            <div>
              {t("operatorPage.cashier.estimate.amount")}: {Number(selectedEstimate.grandTotal || estimateTotalAmount || 0).toLocaleString()} AMD
            </div>
          </div>

          <div className={styles.estimateGrid}>
            <div>
              <strong>{t("operatorPage.cashier.estimate.servicesSection")}</strong>
            </div>
            {estimateServiceLines.length === 0 ? (
              <div>{t("operatorPage.cashier.estimate.noServices")}</div>
            ) : (
              estimateServiceLines.map((line, index) => (
                <div key={`${line.id || line.serviceId || index}`}>
                  {(line.serviceName || `#${line.serviceId || "-"}`)} - {Number(line.customerPrice || 0).toLocaleString()} AMD
                </div>
              ))
            )}
            <div>
              {t("operatorPage.cashier.estimate.servicesTotal")}: {estimateServicesTotal.toLocaleString()} AMD
            </div>
          </div>

          <div className={styles.estimateGrid}>
            <div>
              <strong>{t("operatorPage.cashier.estimate.productsSection")}</strong>
            </div>
            {estimateProductLines.length === 0 ? (
              <div>{t("operatorPage.cashier.estimate.noProducts")}</div>
            ) : (
              estimateProductLines.map((line, index) => {
                const productLine = line as {
                  totalPrice?: number;
                  lineTotal?: number;
                  productName?: string;
                  sku?: string;
                };
                const lineTotal =
                  Number(productLine.lineTotal || productLine.totalPrice || 0) ||
                  Number(line.quantity || 0) * Number(line.unitPrice || 0);
                const lineLabel =
                  productLine.productName ||
                  line.productCode ||
                  productLine.sku ||
                  `#${line.productId || "-"}`;

                return (
                  <div key={`${line.id || line.productId || index}`}>
                    {lineLabel} x {Number(line.quantity || 0)} - {lineTotal.toLocaleString()} AMD
                  </div>
                );
              })
            )}
            <div>
              {t("operatorPage.cashier.estimate.productsTotal")}: {estimateProductsTotal.toLocaleString()} AMD
            </div>
            <div>
              <strong>
                {t("operatorPage.cashier.estimate.orderTotal")}: {estimateTotalAmount.toLocaleString()} AMD
              </strong>
            </div>
          </div>

          <div className={styles.estimateActions}>
            <Button
              type="button"
              onClick={() => {
                setSelectedEstimate(null);
                setEstimateNumberInput("");
              }}
              variant="secondary"
            >
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      )}

      {!isEstimateMode && !isProductDebtSale && (
        <div className={styles.searchRow}>
        <TextField
          ref={skuInputRef}
          className={styles.searchTextField}
          containerClassName={styles.skuInputContainer}
          label={t("operatorPage.cashier.scanOrEnterSku")}
          value={searchSku}
          onChange={(event) => {
            setSearchSku(event.target.value);
            setSearchMessage(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSkuSearch();
            }
          }}
          placeholder={t("operatorPage.cashier.scanPlaceholder")}
          inputMode="text"
        />
        <Button
          type="button"
          className={`${styles.cashierActionButton} ${styles.cashierActionScan}`}
          onClick={handleSkuSearch}
          disabled={!searchSku.trim()}
        >
          <ScanLine size={16} aria-hidden="true" />
          {t("operatorPage.cashier.searchButton")}
        </Button>
        </div>
      )}
      {!isEstimateMode && !isProductDebtSale && searchMessage ? (
        <div
          className={`${styles.searchMessage} ${
            searchMessageType === "success"
              ? styles.successMessage
              : styles.errorMessage
          }`}
          role="status"
          aria-live="polite"
        >
          <span className={styles.searchMessageIcon} aria-hidden="true">
            {searchMessageType === "success" ? (
              <CheckCircle2 size={17} />
            ) : (
              <CircleAlert size={17} />
            )}
          </span>
          <span>{searchMessage}</span>
        </div>
      ) : null}

      {!isProductDebtSale && (
        <div className={styles.grid}>
          <aside className={styles.cartSection}>
            <div className={styles.sectionHeader}>
              <h3>
                {isEstimateMode
                  ? t("operatorPage.cashier.estimate.summaryTitle")
                  : t("operatorPage.cashier.cartTitle")}
              </h3>
            </div>

            <div className={styles.cartContent}>
            {!isEstimateMode && cartItems.length === 0 ? (
              <div className={styles.emptyState}>
                {t("operatorPage.cashier.emptyCart")}
              </div>
            ) : !isEstimateMode ? (
              <div className={styles.cartItems}>
                {cartItems.map((item) => (
                  <div key={item.productId} className={styles.cartItem}>
                    <div>
                      <strong>{item.productCode}</strong>
                      <div className={styles.cartItemMeta}>
                        {t("operatorPage.cashier.unitPrice")}:
                        <span>{item.unitPrice.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className={styles.cartItemControls}>
                      <TextField
                        aria-label={t("operatorPage.cashier.quantity")}
                        className={styles.quantityField}
                        value={item.quantity.toString()}
                        onChange={(event) =>
                          handleQuantityChange(item.productId, event.target.value)
                        }
                        inputMode="numeric"
                      />
                      <Button
                        variant="secondary"
                        size="small"
                        className={styles.cartRemoveButton}
                        onClick={() => handleRemoveFromCart(item.productId)}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                        {t("operatorPage.cashier.remove")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.cartItems}>
                <div className={styles.cartItem}>
                  <div>
                    <strong>{t("operatorPage.cashier.estimate.servicesTotal")}</strong>
                  </div>
                  <div className={styles.cartItemMeta}>{estimateServicesTotal.toLocaleString()} AMD</div>
                </div>
                <div className={styles.cartItem}>
                  <div>
                    <strong>{t("operatorPage.cashier.estimate.productsTotal")}</strong>
                  </div>
                  <div className={styles.cartItemMeta}>{estimateProductsTotal.toLocaleString()} AMD</div>
                </div>
                <div className={styles.cartItem}>
                  <div>
                    <strong>{t("operatorPage.cashier.estimate.orderTotal")}</strong>
                  </div>
                  <div className={styles.cartItemMeta}>{estimateTotalAmount.toLocaleString()} AMD</div>
                </div>
              </div>
            )}

            {!isProductDebtSale && (
            <div className={styles.paymentPanel}>
              <div className={styles.totalRow}>
                <div className={styles.totalLabel}>
                  <span className={styles.totalIcon} aria-hidden="true"><CircleDollarSign size={18} /></span>
                  <span>{t("operatorPage.cashier.total")}</span>
                </div>
                <div className={styles.totalValue}>
                  <span>֏</span>
                  <strong>{activeTotalAmount.toFixed(2)}</strong>
                </div>
              </div>

              {!isAgentCreditSale && (
                <div
                  className={styles.paymentMethods}
                  role="radiogroup"
                  aria-label={t("operatorPage.cashier.paymentModeLabel")}
                >
                  {(["cash", "non-cash", "mixed"] as PaymentMode[]).map((mode) => (
                    <label
                      key={mode}
                      data-payment-mode={mode}
                      className={`${styles.paymentOption} ${
                        paymentMode === mode ? styles.activePaymentOption : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMode"
                        value={mode}
                        checked={paymentMode === mode}
                        onChange={() => setPaymentMode(mode)}
                      />
                      <span className={styles.paymentOptionIcon} aria-hidden="true">
                        {mode === "cash" ? <Banknote size={17} /> : mode === "non-cash" ? <CreditCard size={17} /> : <ArrowLeftRight size={17} />}
                      </span>
                      <span className={styles.paymentOptionLabel}>
                        {t(`operatorPage.cashier.paymentMethods.${mode === "non-cash" ? "nonCash" : mode}`)}
                      </span>
                      {paymentMode === mode && <Check className={styles.paymentOptionCheck} size={15} aria-hidden="true" />}
                    </label>
                  ))}
                </div>
              )}

              {isAgentCreditSale && (
                <div className={styles.agentCreditSummary}>
                  <div className={styles.paymentInfoRow}>
                    <span className={styles.creditSummaryLabel}><BadgeCheck size={16} aria-hidden="true" />{t("operatorPage.cashier.customerLookup.creditType")}:</span>
                    <strong>{t("operatorPage.cashier.customerLookup.creditSale")}</strong>
                  </div>
                  <div className={styles.paymentInfoRow}>
                    <span className={styles.creditSummaryLabel}><Banknote size={16} aria-hidden="true" />{t("operatorPage.cashier.customerLookup.cashReceived")}:</span>
                    <strong>0.00</strong>
                  </div>
                  <div className={styles.paymentInfoRow}>
                    <span className={styles.creditSummaryLabel}><CreditCard size={16} aria-hidden="true" />{t("operatorPage.cashier.customerLookup.nonCashReceived")}:</span>
                    <strong>0.00</strong>
                  </div>
                </div>
              )}

              {!isAgentCreditSale && (paymentMode === "cash" || paymentMode === "mixed") && (
                <TextField
                  label={t("operatorPage.cashier.cashPaid")}
                  value={cashPaid}
                  onChange={(e) => setCashPaid(e.target.value)}
                  inputMode="numeric"
                />
              )}

              {!isAgentCreditSale && !isEstimateMode && (paymentMode === "non-cash" || paymentMode === "mixed") && (
                <TextField
                  label={t("operatorPage.cashier.nonCashPaid")}
                  value={paymentMode === "non-cash" ? activeTotalAmount.toFixed(2) : nonCashPaid}
                  onChange={(e) => setNonCashPaid(e.target.value)}
                  inputMode="numeric"
                  disabled={paymentMode === "non-cash"}
                />
              )}

              <div className={styles.actions}>
                <Button
                  variant="secondary"
                  fullWidth
                  className={
                    isEstimateMode
                      ? styles.estimateSubmit
                      : isAgentCreditSale
                        ? styles.agentCreditSubmit
                        : styles.completeSaleButton
                  }
                  disabled={
                    activeTotalAmount === 0 ||
                    isSaleLoading ||
                    isEstimateConverting ||
                    (!isEstimateMode && cartItems.length === 0) ||
                    (isEstimateMode && !selectedEstimate?.id) ||
                    (isAgentCreditSale && !isAgentCreditReady)
                  }
                  onClick={isEstimateMode ? handleConvertEstimate : handleCompleteSale}
                >
                  {!isSaleLoading && !isEstimateConverting && (
                    isEstimateMode ? (
                      <FileText size={18} aria-hidden="true" />
                    ) : isAgentCreditSale ? (
                      <BadgeCheck size={18} aria-hidden="true" />
                    ) : (
                      <CheckCircle2 size={18} aria-hidden="true" />
                    )
                  )}
                  {isSaleLoading || isEstimateConverting
                    ? t("operatorPage.cashier.processing")
                    : isEstimateMode
                      ? t("operatorPage.cashier.estimate.confirmButton")
                      : isAgentCreditSale
                        ? t("operatorPage.cashier.customerLookup.submitCreditSale")
                        : t("operatorPage.cashier.completeSale")}
                </Button>
              </div>
              <div className={styles.paymentInfo}>
                {(!isAgentCreditSale && (paymentMode === "cash" || paymentMode === "mixed")) && (
                  <div className={styles.paymentInfoRow}>
                    <span>{t("operatorPage.cashier.cashPaid")}:</span>
                    <strong>{resolvedCashPaid.toFixed(2)}</strong>
                  </div>
                )}
                {(!isAgentCreditSale && (paymentMode === "non-cash" || paymentMode === "mixed")) && (
                  <div className={styles.paymentInfoRow}>
                    <span>{t("operatorPage.cashier.nonCashPaid")}:</span>
                    <strong>{resolvedNonCashPaid.toFixed(2)}</strong>
                  </div>
                )}
                {change > 0 && !isAgentCreditSale && (
                  <div className={`${styles.paymentInfoRow} ${styles.changeRow}`}>
                    <span>{t("operatorPage.cashier.change")}:</span>
                    <strong>{change.toFixed(2)}</strong>
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        </aside>
      </div>
      )}

      <ConfirmationModal
        open={creditConfirmationOpen}
        onOpenChange={setCreditConfirmationOpen}
        title={t("operatorPage.cashier.customerLookup.confirmTitle")}
        description={t("operatorPage.cashier.customerLookup.confirmDescription")}
        confirmText={t("operatorPage.cashier.customerLookup.submitCreditSale")}
        confirmLoading={isSaleLoading}
        confirmDisabled={!isAgentCreditReady}
        onConfirm={() => {
          setCreditConfirmationOpen(false);
          void handleSubmitSale();
        }}
      >
        <div className={styles.creditConfirmation}>
          <div><strong>{t("operatorPage.cashier.customerLookup.agent")}:</strong> {identifiedAgent?.customer?.fullName || identifiedAgent?.phone || identifiedAgent?.code || "-"}</div>
          <div><strong>{t("operatorPage.cashier.customerLookup.contract")}:</strong> {identifiedContract?.contractNumber || "-"}</div>
          <div><strong>{t("operatorPage.cashier.customerLookup.productCount")}:</strong> {cartItems.reduce((count, item) => count + item.quantity, 0)}</div>
          <div><strong>{t("operatorPage.cashier.customerLookup.creditAmount")}:</strong> {activeTotalAmount.toLocaleString()} AMD</div>
          <div><strong>{t("operatorPage.cashier.customerLookup.cashReceived")}:</strong> 0 AMD</div>
          {identifiedProductDebt && (
            <div><strong>{t("operatorPage.cashier.productDebt.outstanding")}:</strong> {Number(identifiedProductDebt.outstandingAmountAmd).toLocaleString()} AMD</div>
          )}
          <ul>
            {cartItems.map((item) => (
              <li key={item.productId}>
                {item.productCode} x {item.quantity} - {(item.unitPrice * item.quantity).toLocaleString()} AMD
              </li>
            ))}
          </ul>
        </div>
      </ConfirmationModal>

      <ConfirmationModal
        open={!!saleError}
        onOpenChange={(open) => {
          if (!open) setSaleError("");
        }}
        title={t("operatorPage.cashier.saleErrorTitle")}
        description={saleError}
        confirmText={t("common.close")}
        cancelText={t("operatorPage.cashier.returnToSale")}
        confirmVariant="secondary"
        confirmClassName={styles.saleErrorButton}
        cancelClassName={styles.saleErrorReturnButton}
        onConfirm={() => setSaleError("")}
        onCancel={() => setSaleError("")}
        className={styles.saleErrorModal}
      >
        <div className={styles.saleErrorContent} aria-hidden="true">
          <CircleAlert size={34} strokeWidth={1.8} />
        </div>
      </ConfirmationModal>

      <ConfirmationModal
        open={saleSuccess !== null}
        onOpenChange={(open) => {
          if (!open) handleDismissSaleSuccess();
        }}
        title={t("operatorPage.cashier.saleSuccessTitle")}
        description={t("operatorPage.cashier.saleSuccessDescription")}
        confirmText={t("operatorPage.cashier.newSale")}
        cancelText={t("common.close")}
        confirmVariant="primary"
        confirmClassName={styles.saleSuccessButton}
        cancelClassName={styles.saleSuccessCloseButton}
        confirmIcon={<ShoppingBag size={17} aria-hidden="true" />}
        onConfirm={handleDismissSaleSuccess}
        onCancel={handleDismissSaleSuccess}
        className={styles.saleSuccessModal}
      >
        {saleSuccess && (
          <div className={styles.saleSuccessContent}>
            <div className={styles.saleSuccessIcon} aria-hidden="true">
              <CheckCircle2 size={40} strokeWidth={1.8} />
            </div>
            <strong className={styles.saleSuccessMessage}>
              {t("operatorPage.cashier.saleAccepted")}
            </strong>
            <div className={styles.saleSuccessDetails}>
              <span>{t("operatorPage.cashier.saleNumber")}</span>
              <strong>{saleSuccess.saleNumber}</strong>
            </div>
            <div className={`${styles.saleSuccessDetails} ${styles.saleSuccessAmount}`}>
              <span>{t("operatorPage.cashier.amountPaid")}</span>
              <strong>{saleSuccess.amount.toLocaleString()} AMD</strong>
            </div>
          </div>
        )}
      </ConfirmationModal>
    </div>
  );
};
