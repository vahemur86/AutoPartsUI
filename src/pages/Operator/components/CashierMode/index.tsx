import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { Button, ConfirmationModal, Select, TextField } from "@/ui-kit";
import { Trash2 } from "lucide-react";

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
import { getCustomers } from "@/services/customers";
import { agentsService } from "@/services/agents";
import { agentContractsService } from "@/services/agentContracts";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";

// utils
import { getCashRegisterId } from "@/utils";

// services
import { createPOSSale } from "@/services/shops/posSale";

// types
import type { Customer, ServiceEstimateLookupResponse } from "@/types/operator";
import type { AgentContractListItemDto } from "@/types/agentContracts";
import type { AgentDto } from "@/types/agents";
import type { AgentProductDebtDto } from "@/types/agents";
import type { ShopProductItem } from "@/types/warehouses/warehouseProduct";

type AgentContractCashierItem = AgentContractListItemDto & {
  allowsProductAdvance?: boolean | null;
};

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
type SaleType = "normal" | "agent-credit";

type CartItem = {
  productId: number;
  shopStockId: number;
  productCode: string;
  unitPrice: number;
  quantity: number;
};

export const CashierMode = ({ cashRegisterId }: CashierModeProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { shops } = useAppSelector((state) => state.shops);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [saleType, setSaleType] = useState<SaleType>("normal");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerLookupLoading, setCustomerLookupLoading] = useState(false);
  const [identifiedCustomer, setIdentifiedCustomer] = useState<Customer | null>(null);
  const [identifiedAgent, setIdentifiedAgent] = useState<AgentDto | null>(null);
  const [identifiedContract, setIdentifiedContract] = useState<AgentContractCashierItem | null>(null);
  const [identifiedProductDebt, setIdentifiedProductDebt] = useState<AgentProductDebtDto | null>(null);
  const [creditConfirmationOpen, setCreditConfirmationOpen] = useState(false);
  const [productDebtPaymentOpen, setProductDebtPaymentOpen] = useState(false);
  const [debtAgents, setDebtAgents] = useState<AgentDto[]>([]);
  const [debtAgentId, setDebtAgentId] = useState("");
  const [debtContracts, setDebtContracts] = useState<AgentContractListItemDto[]>([]);
  const [debtContractId, setDebtContractId] = useState("");
  const [debtSummary, setDebtSummary] = useState<AgentProductDebtDto | null>(null);
  const [debtPaymentAmount, setDebtPaymentAmount] = useState("");
  const [debtLoading, setDebtLoading] = useState(false);
  const [debtPaymentSaving, setDebtPaymentSaving] = useState(false);
  const [agentLookupError, setAgentLookupError] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");
  const [cashPaid, setCashPaid] = useState("0");
  const [nonCashPaid, setNonCashPaid] = useState("0");
  const [nonCashReference, setNonCashReference] = useState("");
  const [isSaleLoading, setIsSaleLoading] = useState(false);
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

  const resolveProductAdvanceAllowed = useCallback(
    (contract?: Partial<AgentContractCashierItem> | null) => {
      return contract?.allowsProductAdvance === true;
    },
    [],
  );

  const resolveActiveContract = useCallback(
    (contracts?: Array<Partial<AgentContractCashierItem>> | null) => {
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
  const isAgentCreditReady =
    isAgentCreditSale &&
    !!identifiedCustomer &&
    !!identifiedAgent &&
    !!identifiedContract &&
    resolveProductAdvanceAllowed(identifiedContract) !== false;

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
    setNonCashReference("");
    setPaymentMode("cash");
    setSaleType("normal");
    setCustomerPhone("");
    setIdentifiedCustomer(null);
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
    if (!productDebtPaymentOpen) return;
    void agentsService
      .getAgents({ page: 1, pageSize: 200, status: 0 })
      .then((result) => setDebtAgents(result.results ?? []))
      .catch((error) => toast.error(getApiErrorMessage(error, t("operatorPage.cashier.productDebt.loadFailed"))));
  }, [productDebtPaymentOpen, t]);

  useEffect(() => {
    if (!debtAgentId) {
      setDebtContracts([]);
      setDebtContractId("");
      setDebtSummary(null);
      return;
    }

    let isCancelled = false;
    setDebtLoading(true);
    void Promise.all([
      agentContractsService.listContracts({ agentId: debtAgentId, page: 1, pageSize: 50 }),
      agentsService.getProductDebt(debtAgentId, undefined, resolvedCashRegisterId),
    ])
      .then(([contractsResponse, summary]) => {
        if (isCancelled) return;
        const activeContracts = (contractsResponse.results ?? []).filter(
          (contract) => String(contract.status).toLowerCase() === "active" || Number(contract.status) === 0,
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
      .getProductDebt(debtAgentId, debtContractId, resolvedCashRegisterId)
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
    if (debtSummary && amountAmd > debtSummary.outstandingAmount) {
      toast.error(t("operatorPage.cashier.productDebt.amountExceedsDebt"));
      return;
    }
    if (!resolvedCashRegisterId) {
      toast.error(t("operatorPage.cashier.missingCashRegisterHeader"));
      return;
    }

    setDebtPaymentSaving(true);
    try {
      await agentsService.createProductDebtPayment(
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
    setDebtPaymentAmount("");
    try {
      const summary = await agentsService.getProductDebt(
        debtAgentId,
        debtContractId || undefined,
        resolvedCashRegisterId,
      );
      setDebtSummary(summary);
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

    const parsed = parsePhoneNumberFromString(cleanedPhone, "AM");
    if (!parsed || !parsed.isValid()) {
      toast.error(t("operatorPage.cashier.customerLookup.invalidPhone"));
      return;
    }

    setCustomerLookupLoading(true);
    setAgentLookupError(null);

    try {
      const customersResponse = await getCustomers({
        phone: cleanedPhone,
        cashRegisterId: resolvedCashRegisterId,
      });
      const foundCustomer = customersResponse.results[0];

      if (!foundCustomer) {
        setIdentifiedCustomer(null);
        setIdentifiedAgent(null);
        setIdentifiedContract(null);
        setIdentifiedProductDebt(null);
        setAgentLookupError(t("operatorPage.cashier.customerLookup.customerNotFound"));
        toast.error(t("operatorPage.cashier.customerLookup.customerNotFound"));
        return;
      }

      setIdentifiedCustomer(foundCustomer);

      const agentsResponse = await agentsService.getAgents({ page: 1, pageSize: 200, status: 0 });
      const matchedAgent = agentsResponse.results.find(
        (agent) =>
          String(agent.customerId) === String(foundCustomer.id) ||
          String(agent.customer?.id) === String(foundCustomer.id),
      );

      if (!matchedAgent) {
        setIdentifiedAgent(null);
        setIdentifiedContract(null);
        setIdentifiedProductDebt(null);
        setAgentLookupError(t("operatorPage.cashier.customerLookup.notAnAgent"));
        toast.error(t("operatorPage.cashier.customerLookup.notAnAgent"));
        return;
      }

      setIdentifiedAgent(matchedAgent);

      const contractsResponse = await agentContractsService.listContracts({
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

      const allowsProductAdvance = resolveProductAdvanceAllowed(activeContract);
      const normalizedContract: AgentContractCashierItem = {
        id: String(activeContract.id ?? ""),
        contractNumber: activeContract.contractNumber ?? "",
        agent: activeContract.agent ?? {
          id: "",
          code: "",
          fullName: "",
        },
        contractDate: activeContract.contractDate ?? new Date().toISOString(),
        status: (String(activeContract.status ?? "Active") as AgentContractListItemDto["status"]),
        totalAdvancedAmount: Number(activeContract.totalAdvancedAmount ?? 0),
        totalRepaidAmount: Number(activeContract.totalRepaidAmount ?? 0),
        outstandingAmount: Number(activeContract.outstandingAmount ?? 0),
        createdAt: activeContract.createdAt ?? new Date().toISOString(),
        allowsProductAdvance,
      };

      setIdentifiedContract(normalizedContract);

      if (!allowsProductAdvance) {
        setIdentifiedProductDebt(null);
        setAgentLookupError(t("operatorPage.cashier.customerLookup.productAdvanceNotAllowed"));
        toast.error(t("operatorPage.cashier.customerLookup.productAdvanceNotAllowed"));
        return;
      }

      const productDebt = await agentsService
        .getProductDebt(matchedAgent.id, normalizedContract.id, resolvedCashRegisterId)
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
  }, [customerPhone, resolvedCashRegisterId, resolveActiveContract, resolveProductAdvanceAllowed, t]);

  const handleSubmitSale = useCallback(async () => {
    if (cartItems.length === 0 || !currentShopId) return;

    const crId = resolvedCashRegisterId;
    if (!crId) {
      toast.error(t("operatorPage.cashier.missingCashRegisterHeader"));
      return;
    }

    if (isAgentCreditSale) {
      if (!identifiedCustomer || !identifiedAgent || !identifiedContract) {
        toast.error(t("operatorPage.cashier.customerLookup.noActiveContract"));
        return;
      }
    } else if (paymentMode === "mixed" && !nonCashReference.trim()) {
      toast.error(t("operatorPage.cashier.nonCashReferenceRequired"));
      return;
    } else if (paymentMode === "non-cash" && !nonCashReference.trim()) {
      toast.error(t("operatorPage.cashier.nonCashReferenceRequired"));
      return;
    }

    setIsSaleLoading(true);
    try {
      const saleResponse = await createPOSSale(
        {
          shopId: currentShopId,
          ...(isAgentCreditSale
            ? {
                customerId: identifiedCustomer?.id ?? null,
                isAgentCredit: true,
                agentId: identifiedAgent?.id ?? null,
                agentContractId: identifiedContract?.id ?? null,
              }
            : {}),
          cashPaid: isAgentCreditSale ? 0 : resolvedCashPaid,
          nonCashPaid: isAgentCreditSale ? 0 : resolvedNonCashPaid,
          ...(!isAgentCreditSale && nonCashReference.trim()
            ? { nonCashPaymentReference: nonCashReference.trim() }
            : {}),
          items: cartItems.map((item) => ({
            productId: item.productId,
            shopStockId: item.shopStockId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
        crId,
      );
      toast.success(
        isAgentCreditSale
          ? t("operatorPage.cashier.customerLookup.creditSaleSuccess", {
              saleNumber: saleResponse.saleNumber || saleResponse.id,
              agentName: identifiedAgent?.customer?.fullName || identifiedAgent?.phone || identifiedAgent?.code,
              amount: Number(saleResponse.totalAmount).toLocaleString(),
            })
          : t("operatorPage.cashier.saleCompleted"),
      );
      dispatch(
        fetchShopProducts({
          shopId: currentShopId,
          cashRegisterId: crId,
        }),
      );
      resetCheckoutState();
    } catch (error) {
      const msg = error instanceof Error ? error.message : t("operatorPage.cashier.saleError");
      toast.error(msg);
    } finally {
      setIsSaleLoading(false);
    }
  }, [
    cartItems,
    currentShopId,
    resolvedCashRegisterId,
    paymentMode,
    nonCashReference,
    resolvedCashPaid,
    resolvedNonCashPaid,
    isAgentCreditSale,
    identifiedCustomer,
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
      setNonCashReference("");
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
        <div className={styles.saleTypeRow}>
          {(["normal", "agent-credit"] as SaleType[]).map((type) => (
            <label key={type} className={`${styles.paymentOption} ${saleType === type ? styles.activePaymentOption : ""}`}>
              <input
                type="radio"
                name="saleType"
                value={type}
                checked={saleType === type}
                onChange={() => {
                  setSaleType(type);
                  if (type === "normal") {
                    setCustomerPhone("");
                    setIdentifiedCustomer(null);
                    setIdentifiedAgent(null);
                    setIdentifiedContract(null);
                    setAgentLookupError(null);
                  }
                }}
              />
              {t(type === "normal" ? "operatorPage.cashier.saleTypes.normal" : "operatorPage.cashier.saleTypes.agentCredit")}
            </label>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setProductDebtPaymentOpen((open) => !open)}
        >
          {t("operatorPage.cashier.productDebt.action")}
        </Button>
      </div>

      {productDebtPaymentOpen && (
        <section className={styles.agentCreditPanel}>
          <h3>{t("operatorPage.cashier.productDebt.title")}</h3>
          <Select
            value={debtAgentId}
            onChange={(event) => setDebtAgentId(event.target.value)}
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
              onChange={(event) => setDebtContractId(event.target.value)}
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
                {Number(debtSummary?.outstandingAmount ?? 0).toLocaleString()} AMD
              </div>
            </div>
          ) : null}
          <div className={styles.estimateSearchRow}>
            <TextField
              label={t("operatorPage.cashier.productDebt.amount")}
              type="number"
              min="0.01"
              max={debtSummary?.outstandingAmount}
              value={debtPaymentAmount}
              onChange={(event) => setDebtPaymentAmount(event.target.value)}
              inputMode="decimal"
            />
            <Button
              type="button"
              onClick={() => void handleSubmitProductDebtPayment()}
              disabled={
                debtPaymentSaving ||
                debtLoading ||
                !debtAgentId ||
                debtContracts.length === 0 ||
                (debtContracts.length > 1 && !debtContractId) ||
                !debtSummary ||
                Number(debtPaymentAmount) <= 0 ||
                Number(debtPaymentAmount) > Number(debtSummary?.outstandingAmount ?? 0)
              }
            >
              {debtPaymentSaving
                ? t("operatorPage.cashier.processing")
                : t("operatorPage.cashier.productDebt.submitPayment")}
            </Button>
          </div>
        </section>
      )}

      {isAgentCreditSale && (
        <div className={styles.agentCreditPanel}>
          <div className={styles.estimateSearchRow}>
            <TextField
              className={styles.searchTextField}
              label={t("operatorPage.cashier.customerLookup.phoneLabel")}
              value={customerPhone}
              onChange={(event) => setCustomerPhone(event.target.value)}
              placeholder={t("operatorPage.cashier.customerLookup.phonePlaceholder")}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleLookupCustomerAndAgent();
                }
              }}
              inputMode="tel"
            />
            <Button type="button" onClick={handleLookupCustomerAndAgent} disabled={customerLookupLoading}>
              {customerLookupLoading ? t("operatorPage.cashier.processing") : t("operatorPage.cashier.customerLookup.lookupButton")}
            </Button>
          </div>

          {agentLookupError && <div className={styles.errorMessage}>{agentLookupError}</div>}

          {identifiedCustomer && identifiedAgent && identifiedContract && (
            <div className={styles.agentInfoCard}>
              <div><strong>{t("operatorPage.cashier.customerLookup.customer")}:</strong> {identifiedCustomer.fullName || identifiedCustomer.phone}</div>
              <div><strong>{t("operatorPage.cashier.customerLookup.agent")}:</strong> {identifiedAgent.code} — {identifiedAgent.customer?.fullName || identifiedAgent.phone || "Agent"}</div>
              <div><strong>{t("operatorPage.cashier.customerLookup.contract")}:</strong> {identifiedContract.contractNumber}</div>
              <div><strong>{t("operatorPage.cashier.customerLookup.status")}:</strong> {identifiedContract.status}</div>
            </div>
          )}
        </div>
      )}

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
        <Button type="button" onClick={handleFindEstimate} disabled={isEstimateLoading}>
          {isEstimateLoading
            ? t("operatorPage.cashier.processing")
            : t("operatorPage.cashier.estimate.findButton")}
        </Button>
      </div>

      {selectedEstimate && (
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

      {!isEstimateMode && (
        <div className={styles.searchRow}>
        <TextField
          ref={skuInputRef}
          className={styles.searchTextField}
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
          onClick={handleSkuSearch}
          disabled={!searchSku.trim()}
        >
          {t("operatorPage.cashier.searchButton")}
        </Button>
        </div>
      )}
      {!isEstimateMode && searchMessage ? (
        <div
          className={`${styles.searchMessage} ${
            searchMessageType === "success"
              ? styles.successMessage
              : styles.errorMessage
          }`}
        >
          {searchMessage}
        </div>
      ) : null}

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
                        variant="danger"
                        size="small"
                        onClick={() => handleRemoveFromCart(item.productId)}
                      >
                        <Trash2 size={14} />
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

            <div className={styles.paymentPanel}>
              <div className={styles.totalRow}>
                <span>{t("operatorPage.cashier.total")}</span>
                <strong>{activeTotalAmount.toFixed(2)}</strong>
              </div>

              {!isAgentCreditSale && (
                <div className={styles.paymentMethods}>
                  {(["cash", "non-cash", "mixed"] as PaymentMode[]).map((mode) => (
                    <label
                      key={mode}
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
                      {t(`operatorPage.cashier.paymentMethods.${mode === "non-cash" ? "nonCash" : mode}`)}
                    </label>
                  ))}
                </div>
              )}

              {isAgentCreditSale && (
                <div className={styles.agentCreditSummary}>
                  <div className={styles.paymentInfoRow}>
                    <span>{t("operatorPage.cashier.customerLookup.creditType")}:</span>
                    <strong>{t("operatorPage.cashier.customerLookup.creditSale")}</strong>
                  </div>
                  <div className={styles.paymentInfoRow}>
                    <span>{t("operatorPage.cashier.customerLookup.cashReceived")}:</span>
                    <strong>0.00</strong>
                  </div>
                  <div className={styles.paymentInfoRow}>
                    <span>{t("operatorPage.cashier.customerLookup.nonCashReceived")}:</span>
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

              {!isAgentCreditSale && !isEstimateMode && (paymentMode === "non-cash" || paymentMode === "mixed") && (
                <TextField
                  label={t("operatorPage.cashier.nonCashReference")}
                  placeholder={t("operatorPage.cashier.nonCashReferencePlaceholder")}
                  value={nonCashReference}
                  onChange={(e) => setNonCashReference(e.target.value)}
                />
              )}

              <div className={styles.actions}>
                <Button
                  fullWidth
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
          </div>
        </aside>
      </div>
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
            <div><strong>{t("operatorPage.cashier.productDebt.outstanding")}:</strong> {Number(identifiedProductDebt.outstandingAmount).toLocaleString()} AMD</div>
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
    </div>
  );
};
