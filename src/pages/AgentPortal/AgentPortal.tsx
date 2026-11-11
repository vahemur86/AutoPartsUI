import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  Languages,
  LogOut,
  ListChecks,
  MoreHorizontal,
  Minus,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  ShoppingCart,
  Store,
  UserRound,
  X,
} from "lucide-react";
import { Button, ConfirmationModal, TextField } from "@/ui-kit";
import { agentPortalService } from "@/services/agentPortal";
import { AgentNotifications } from "./AgentNotifications";
import { getProducts } from "@/services/products";
import { getShops } from "@/services/settings/shop";
import i18n from "@/i18n/config";
import { logout } from "@/store/slices/authSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { Product } from "@/types/products";
import type { AgentDto, AgentProductCreditSaleDto, AgentProductDebtDto, AgentProductDebtPaymentDto, AgentTypeHistoryDto, PagedResult } from "@/types/agents";
import type { AgentAdvanceDto, AgentContractListItemDto } from "@/types/agentContracts";
import type { PowderDeliveryDto, PowderDeliveryListItemDto } from "@/types/powderDeliveries";
import type { AgentNotification, AgentOrderRequest, AgentOrderRequestStatus, AgentPortalFinancialSummary } from "@/types/agentPortal";
import type { Shop } from "@/types/settings";
import type { ShopProductItem } from "@/types/warehouses/warehouseProduct";
import styles from "./AgentPortal.module.css";

type PortalSection = "overview" | "profile" | "contracts" | "advances" | "deliveries" | "debt" | "orders" | "myRequests";
type PageResult<T> = PagedResult<T>;

const PAGE_SIZE = 10;
const isTabletViewport = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(min-width: 768px) and (max-width: 1199px)").matches;
const PORTAL_LANGUAGES = [
  { code: "am", label: "Հայերեն" },
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
];

const formatAmd = (value: number | null | undefined) =>
  `${Number(value ?? 0).toLocaleString()} AMD`;

const formatNumber = (value: number | null | undefined) =>
  value == null
    ? "—"
    : value.toLocaleString(i18n.resolvedLanguage?.startsWith("am") ? "hy-AM" : i18n.resolvedLanguage || undefined, { maximumFractionDigits: 3 });

const ARMENIAN_MONTHS = [
  "հունվարի",
  "փետրվարի",
  "մարտի",
  "ապրիլի",
  "մայիսի",
  "հունիսի",
  "հուլիսի",
  "օգոստոսի",
  "սեպտեմբերի",
  "հոկտեմբերի",
  "նոյեմբերի",
  "դեկտեմբերի",
];

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  if ((i18n.resolvedLanguage || i18n.language).startsWith("am")) {
    return `${date.getDate()} ${ARMENIAN_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  }
  return new Intl.DateTimeFormat(i18n.resolvedLanguage || undefined, { dateStyle: "medium" }).format(date);
};

const getFullName = (profile: AgentDto | null) =>
  profile
    ? [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
      profile.customer?.fullName ||
      profile.code
    : "";

const getStatusText = (status: string | number | null | undefined, translate: (key: string) => string) => {
  const resolved = typeof status === "number"
    ? ["Active", "Inactive", "Suspended", "Blocked"][status]
    : status;
  return resolved && ["Active", "Inactive", "Suspended", "Blocked"].includes(resolved)
    ? translate(`agentPortal.agentStatuses.${resolved}`)
    : resolved || "—";
};

const getRecordStatus = (status: string | number, translate: (key: string) => string) => {
  const powderStatuses: Record<number, string> = {
    1: "Draft",
    2: "Valuated",
    3: "Confirmed",
    4: "Cancelled",
  };
  const resolved = typeof status === "number"
    ? powderStatuses[status]
    : status;
  return resolved && ["Draft", "Valuated", "Confirmed", "Cancelled", "Active", "Completed", "Defaulted"]
    .includes(resolved)
    ? translate(`agentPortal.recordStatuses.${resolved}`)
    : String(status);
};

const getRequestStatus = (status: AgentOrderRequest["status"]): AgentOrderRequestStatus | "Unknown" => {
  if (typeof status === "number") {
    return (["Pending", "Approved", "Rejected"] as const)[status] ?? "Unknown";
  }
  const normalized = String(status).toLowerCase();
  if (normalized === "pending") return "Pending";
  if (normalized === "approved") return "Approved";
  if (normalized === "rejected") return "Rejected";
  return "Unknown";
};

const pageCount = <T,>(page: PageResult<T> | null) =>
  Math.max(1, Math.ceil((page?.totalItems ?? 0) / (page?.pageSize || PAGE_SIZE)));

const Pager = ({
  page,
  onChange,
  disabled,
}: {
  page: PageResult<unknown> | null;
  onChange: (page: number) => void;
  disabled: boolean;
}) => {
  if (!page || page.totalItems <= (page.pageSize || PAGE_SIZE)) return null;
  const totalPages = pageCount(page);
  return (
    <div className={styles.pager}>
      <Button variant="secondary" size="small" disabled={disabled || page.page <= 1} onClick={() => onChange(page.page - 1)}>
        <ChevronLeft size={16} aria-hidden="true" />
      </Button>
      <span>{page.page} / {totalPages}</span>
      <Button variant="secondary" size="small" disabled={disabled || page.page >= totalPages} onClick={() => onChange(page.page + 1)}>
        <ChevronRight size={16} aria-hidden="true" />
      </Button>
    </div>
  );
};

const EmptyState = ({ text }: { text: string }) => (
  <div className={styles.emptyState}><Package size={22} aria-hidden="true" /><p>{text}</p></div>
);

export const AgentPortal = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const authUser = useAppSelector((state) => state.auth.user);
  const accessToken = useAppSelector((state) => state.auth.token);
  const allowedShopIds = useMemo(
    () => [...new Set([authUser?.shopId, ...(authUser?.shopIds ?? [])]
      .filter((id): id is number => typeof id === "number" && id > 0))],
    [authUser],
  );
  const activeLanguage = (i18n.resolvedLanguage || i18n.language).split("-")[0];
  const [section, setSection] = useState<PortalSection>("overview");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(isTabletViewport);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const moreSheetRef = useRef<HTMLElement>(null);
  const [profile, setProfile] = useState<AgentDto | null>(null);
  const [summary, setSummary] = useState<AgentPortalFinancialSummary | null>(null);
  const [profileError, setProfileError] = useState("");
  const [summaryError, setSummaryError] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [typeHistory, setTypeHistory] = useState<AgentTypeHistoryDto[]>([]);
  const [contracts, setContracts] = useState<PageResult<AgentContractListItemDto> | null>(null);
  const [productCreditContracts, setProductCreditContracts] = useState<AgentContractListItemDto[]>([]);
  const [advances, setAdvances] = useState<PageResult<AgentAdvanceDto> | null>(null);
  const [deliveries, setDeliveries] = useState<PageResult<PowderDeliveryListItemDto> | null>(null);
  const [deliveryDetails, setDeliveryDetails] = useState<Record<string, PowderDeliveryDto>>({});
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<string | null>(null);
  const [loadingDeliveryId, setLoadingDeliveryId] = useState<string | null>(null);
  const [deliveryDetailErrors, setDeliveryDetailErrors] = useState<Record<string, string>>({});
  const [creditSales, setCreditSales] = useState<PageResult<AgentProductCreditSaleDto> | null>(null);
  const [debtPayments, setDebtPayments] = useState<AgentProductDebtPaymentDto[]>([]);
  const [productDebt, setProductDebt] = useState<AgentProductDebtDto | null>(null);
  const [orders, setOrders] = useState<PageResult<AgentOrderRequest> | null>(null);
  const [orderFilter, setOrderFilter] = useState<AgentOrderRequestStatus | "">("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<Record<string, AgentOrderRequest>>({});
  const [productDirectory, setProductDirectory] = useState<Product[]>([]);
  const [productDirectoryLoaded, setProductDirectoryLoaded] = useState(false);
  const [productDirectoryError, setProductDirectoryError] = useState("");
  const [contractsPage, setContractsPage] = useState(1);
  const [advancesPage, setAdvancesPage] = useState(1);
  const [deliveriesPage, setDeliveriesPage] = useState(1);
  const [deliveryStatus, setDeliveryStatus] = useState("");
  const [deliveryDateFrom, setDeliveryDateFrom] = useState("");
  const [deliveryDateTo, setDeliveryDateTo] = useState("");
  const [salesPage, setSalesPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [debtContract, setDebtContract] = useState("");
  const [sectionLoading, setSectionLoading] = useState(false);
  const [sectionError, setSectionError] = useState("");
  const [retry, setRetry] = useState(0);
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopsLoaded, setShopsLoaded] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [shopLoading, setShopLoading] = useState(false);
  const [shopError, setShopError] = useState("");
  const [products, setProducts] = useState<ShopProductItem[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogShopId, setCatalogShopId] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<number, number>>({});
  const [orderStep, setOrderStep] = useState<"catalog" | "cart">("catalog");
  const [lastAddedProductId, setLastAddedProductId] = useState<number | null>(null);
  const [addAnimationKey, setAddAnimationKey] = useState(0);
  const [cartAnimationKey, setCartAnimationKey] = useState(0);
  const [flyingProduct, setFlyingProduct] = useState<{
    productId: number;
    fromX: number;
    fromY: number;
    deltaX: number;
    deltaY: number;
  } | null>(null);
  const cartButtonRef = useRef<HTMLButtonElement>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState("");
  const selectedShop = shops.find((shop) => shop.id === selectedShopId) ?? null;

  const loadIdentity = useCallback(async () => {
    setProfileLoading(true);
    setSummaryLoading(true);
    setProfileError("");
    setSummaryError("");
    const [profileResult, summaryResult] = await Promise.allSettled([
      agentPortalService.getProfile(),
      agentPortalService.getFinancialSummary(),
    ]);
    if (profileResult.status === "fulfilled") setProfile(profileResult.value);
    else setProfileError(profileResult.reason instanceof Error ? profileResult.reason.message : t("agentPortal.loadError"));
    if (summaryResult.status === "fulfilled") setSummary(summaryResult.value);
    else setSummaryError(summaryResult.reason instanceof Error ? summaryResult.reason.message : t("agentPortal.loadError"));
    setProfileLoading(false);
    setSummaryLoading(false);
  }, [t]);

  useEffect(() => {
    void loadIdentity();
  }, [loadIdentity, retry]);

  useEffect(() => {
    if (!isMoreOpen) return;
    const moreButton = moreButtonRef.current;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMoreOpen(false);
        return;
      }

      if (event.key !== "Tab") return;
      const focusableElements = moreSheetRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], select:not([disabled]), input:not([disabled])',
      );
      if (!focusableElements?.length) return;
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    moreSheetRef.current?.querySelector<HTMLElement>("button")?.focus();
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      moreButton?.focus();
    };
  }, [isMoreOpen]);

  useEffect(() => {
    let wasTablet = isTabletViewport();
    const handleViewportChange = () => {
      const isTablet = isTabletViewport();
      if (isTablet !== wasTablet) {
        wasTablet = isTablet;
        setIsSidebarCollapsed(isTablet);
      }
    };
    window.addEventListener("resize", handleViewportChange);
    return () => window.removeEventListener("resize", handleViewportChange);
  }, []);

  useEffect(() => {
    if (section !== "orders" || shopsLoaded) return;
    let active = true;
    const loadAgentShops = async () => {
      setShopLoading(true);
      setShopError("");
      try {
        const availableShops = await getShops();
        if (!active) return;
        const linkedShops = availableShops.filter((shop) => allowedShopIds.includes(shop.id));
        setShops(linkedShops);
        setSelectedShopId((current) =>
          current && linkedShops.some((shop) => shop.id === current)
            ? current
            : linkedShops[0]?.id ?? null,
        );
        if (!linkedShops.length) setShopError(t("agentPortal.noLinkedShops"));
      } catch (error: unknown) {
        if (active) setShopError(error instanceof Error ? error.message : t("agentPortal.shopError"));
      } finally {
        if (active) {
          setShopLoading(false);
          setShopsLoaded(true);
        }
      }
    };
    void loadAgentShops();
    return () => { active = false; };
  }, [section, shopsLoaded, allowedShopIds, retry, t]);

  useEffect(() => {
    if (
      section !== "orders" ||
      !shopsLoaded ||
      !selectedShopId ||
      !shops.some((shop) => shop.id === selectedShopId) ||
      (catalogLoaded && catalogShopId === selectedShopId)
    ) return;
    let active = true;
    const loadShopCatalog = async () => {
      setCatalogLoading(true);
      setCatalogError("");
      try {
        const shopProducts = await agentPortalService.getShopProducts(selectedShopId);
        if (!active) return;
        setProducts(shopProducts);
        setCatalogShopId(selectedShopId);
        setCatalogLoaded(true);
      } catch (error: unknown) {
        if (active) {
          setCatalogError(error instanceof Error ? error.message : t("agentPortal.catalogError"));
          setCatalogLoaded(true);
          setCatalogShopId(selectedShopId);
        }
      } finally {
        if (active) setCatalogLoading(false);
      }
    };
    void loadShopCatalog();
    return () => { active = false; };
  }, [section, shopsLoaded, selectedShopId, shops, catalogLoaded, catalogShopId, retry, t]);

  useEffect(() => {
    if (section !== "myRequests" || productDirectoryLoaded) return;
    let active = true;
    const loadProductDirectory = async () => {
      setProductDirectoryError("");
      try {
        const result: unknown = await getProducts();
        if (!active) return;
        if (!Array.isArray(result)) throw new Error(t("agentPortal.productNamesUnavailable"));
        setProductDirectory(result.filter(
          (product): product is Product =>
            Boolean(product) &&
            typeof product === "object" &&
            typeof product.id === "number" &&
            typeof product.code === "string",
        ));
        setProductDirectoryLoaded(true);
      } catch (error: unknown) {
        if (active) {
          setProductDirectoryError(error instanceof Error ? error.message : t("agentPortal.productNamesUnavailable"));
          setProductDirectoryLoaded(true);
        }
      }
    };
    void loadProductDirectory();
    return () => { active = false; };
  }, [section, productDirectoryLoaded, retry, t]);

  useEffect(() => {
    let active = true;
    const loadSection = async () => {
      setSectionError("");
      if (section === "overview") {
        setSectionLoading(false);
        return;
      }
      setSectionLoading(true);
      try {
        switch (section) {
          case "profile":
            setTypeHistory(await agentPortalService.getTypeHistory());
            break;
          case "contracts":
            setContracts(await agentPortalService.getContracts(contractsPage, PAGE_SIZE));
            break;
          case "advances":
            setAdvances(await agentPortalService.getAdvances(advancesPage, PAGE_SIZE));
            break;
          case "deliveries":
            setDeliveries(await agentPortalService.getDeliveries(deliveriesPage, PAGE_SIZE, {
              ...(deliveryStatus ? { status: deliveryStatus } : {}),
              ...(deliveryDateFrom ? { deliveryDateFrom } : {}),
              ...(deliveryDateTo ? { deliveryDateTo } : {}),
            }));
            break;
          case "debt": {
            const contractPage = await agentPortalService.getContracts(1, 500);
            if (!active) return;
            const eligibleContracts = contractPage.results.filter((contract) => contract.allowsProductAdvance === true);
            setProductCreditContracts(eligibleContracts);
            setProductDebt(null);
            setCreditSales(null);
            setDebtPayments([]);
            if (debtContract && eligibleContracts.some((contract) => contract.id === debtContract)) {
              const [debt, sales, payments] = await Promise.all([
                agentPortalService.getProductDebt(debtContract),
                agentPortalService.getCreditSales(salesPage, 50),
                agentPortalService.getDebtPayments(),
              ]);
              if (!active) return;
              setProductDebt(debt);
              setCreditSales(sales);
              setDebtPayments(payments);
            }
            break;
          }
          case "myRequests": {
            const orderPage = await agentPortalService.getOrderRequests(orderFilter || undefined, ordersPage, PAGE_SIZE);
            if (!active) return;
            setOrders(orderPage);
            break;
          }
        }
      } catch (error: unknown) {
        if (active) setSectionError(error instanceof Error ? error.message : t("agentPortal.loadError"));
      } finally {
        if (active) setSectionLoading(false);
      }
    };
    void loadSection();
    return () => { active = false; };
  }, [section, contractsPage, advancesPage, deliveriesPage, deliveryStatus, deliveryDateFrom, deliveryDateTo, salesPage, debtContract, orderFilter, ordersPage, retry, t]);

  const visibleProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    return products.filter((item) =>
      [item.product?.code, item.product?.sku, item.product?.brandName, item.product?.categoryName]
        .some((value) => value?.toLowerCase().includes(query)),
    ).slice(0, 40);
  }, [products, productSearch]);

  const selectedProductSummary = useMemo(
    () => Object.entries(selectedItems)
      .map(([id, quantity]) => ({ item: products.find((product) => product.productId === Number(id)), id, quantity }))
      .filter((entry) => entry.quantity > 0),
    [products, selectedItems],
  );
  const selectedCreditSales = creditSales?.results.filter((sale) => sale.contractId === debtContract) ?? [];
  const selectedDebtPayments = debtPayments.filter((payment) => payment.agentContractId === debtContract);

  const selectedCount = Object.keys(selectedItems).length;
  const selectedQuantity = Object.values(selectedItems).reduce((total, quantity) => total + quantity, 0);
  const cartTotal = selectedProductSummary.reduce(
    (total, { item, quantity }) => total + Number(item?.salePrice ?? 0) * quantity,
    0,
  );

  const addProductToCart = (productId: number, button: HTMLButtonElement) => {
    const from = button.getBoundingClientRect();
    const cart = cartButtonRef.current?.getBoundingClientRect();
    if (cart) {
      setFlyingProduct({
        productId,
        fromX: from.left + from.width / 2,
        fromY: from.top + from.height / 2,
        deltaX: cart.left + cart.width / 2 - (from.left + from.width / 2),
        deltaY: cart.top + cart.height / 2 - (from.top + from.height / 2),
      });
    }
    setLastAddedProductId(productId);
    setAddAnimationKey((key) => key + 1);
    setCartAnimationKey((key) => key + 1);
    setSelectedItems((items) => ({ ...items, [productId]: (items[productId] ?? 0) + 1 }));
  };
  const summaryValue = (value?: number | null, alternate?: number | null, nested?: number | null) =>
    value == null && alternate == null && nested == null ? "—" : formatAmd(value ?? alternate ?? nested);
  const activeContractsCount = summary?.activeContractsCount ??
    summary?.contracts?.filter((contract) => contract.status?.toLowerCase() === "active").length ??
    "—";

  const handleOpenNotification = useCallback((notification: AgentNotification) => {
    if (notification.relatedEntityType === "AgentOrderRequest" || notification.type.startsWith("Order")) {
      setOrdersPage(1);
      setSection("myRequests");
    } else if (notification.relatedEntityType === "AgentAdvance") {
      setAdvancesPage(1);
      setSection("advances");
    } else if (notification.relatedEntityType === "AgentContract" || notification.type.startsWith("Contract")) {
      setContractsPage(1);
      setSection("contracts");
    }
  }, []);

  const submitOrder = async () => {
    const entries = Object.entries(selectedItems).map(([id, quantity]) => ({
      productId: Number(id),
      quantity,
    }));
    if (
      !selectedShopId ||
      !entries.length ||
      entries.length > 50 ||
      entries.some(({ quantity }) => !Number.isInteger(quantity) || quantity <= 0) ||
      selectedProductSummary.some(({ item, quantity }) => !item || quantity > item.quantity)
    ) return;
    setIsSubmittingOrder(true);
    setSectionError("");
    setOrderSuccess("");
    try {
      await agentPortalService.createOrderRequest({
        items: entries,
      });
      setSelectedItems({});
      setOrderStep("catalog");
      setOrderSuccess(t("agentPortal.orderSubmitted"));
      setOrdersPage(1);
      setExpandedOrderId(null);
      setSection("myRequests");
    } catch (error: unknown) {
      setSectionError(error instanceof Error ? error.message : t("agentPortal.submitError"));
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await dispatch(logout()).unwrap();
      navigate("/login", { replace: true });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t("agentPortal.logoutError"));
      setIsLoggingOut(false);
    }
  };

  const loadDeliveryDetails = async (deliveryId: string) => {
    setLoadingDeliveryId(deliveryId);
    setDeliveryDetailErrors((errors) => ({ ...errors, [deliveryId]: "" }));
    try {
      const details = await agentPortalService.getDeliveryDetails(deliveryId);
      setDeliveryDetails((current) => ({ ...current, [deliveryId]: details }));
    } catch (error: unknown) {
      setDeliveryDetailErrors((errors) => ({
        ...errors,
        [deliveryId]: error instanceof Error ? error.message : t("agentPortal.deliveryDetailsError"),
      }));
    } finally {
      setLoadingDeliveryId((current) => current === deliveryId ? null : current);
    }
  };

  const toggleDeliveryDetails = async (deliveryId: string) => {
    if (expandedDeliveryId === deliveryId) {
      setExpandedDeliveryId(null);
      return;
    }

    setExpandedDeliveryId(deliveryId);
    if (!deliveryDetails[deliveryId]) await loadDeliveryDetails(deliveryId);
  };

  const sections: Array<{ id: PortalSection; label: string; icon: typeof UserRound }> = [
    { id: "overview", label: t("agentPortal.overview"), icon: ClipboardList },
    { id: "contracts", label: t("agentPortal.contracts"), icon: FileText },
    { id: "advances", label: t("agentPortal.advances"), icon: CreditCard },
    { id: "deliveries", label: t("agentPortal.deliveries"), icon: Package },
    { id: "debt", label: t("agentPortal.productDebt"), icon: CreditCard },
    { id: "orders", label: t("agentPortal.orders"), icon: ShoppingCart },
    { id: "myRequests", label: t("agentPortal.myRequests"), icon: ListChecks },
    { id: "profile", label: t("agentPortal.profile"), icon: UserRound },
  ];
  const primaryMobileSections = sections.filter(({ id }) =>
    ["overview", "orders", "myRequests", "contracts"].includes(id),
  );
  const moreMobileSections = sections.filter(({ id }) =>
    !primaryMobileSections.some((primary) => primary.id === id),
  );

  return (
    <main className={`${styles.page} ${styles.agentPortalPage}`}>
      <header className={styles.header}>
        <div className={styles.headerIdentity}>
          <div className={styles.headerBrand}>
          <span className={styles.portalLogoMark} role="img" aria-label="PRP Service">
            <span className={styles.portalLogoBrand}>
              <span className={styles.portalLogoPrp}>PRP</span>
              <span className={styles.portalLogoService}>Service</span>
            </span>
          </span>
            <div className={styles.headerProfile}>
              <span className={styles.eyebrow}>{t("agentPortal.portalLabel")}</span>
              <div className={styles.identityTitle}>
                <h1>{profile ? getFullName(profile) : authUser?.username || t("agentPortal.portalTitle")}</h1>
                {profile && (
                  <span className={`${styles.statusBadge} ${styles[`status${getStatusText(profile.status, (key) => key)}`] || ""}`}>
                    {getStatusText(profile.status, t)}
                  </span>
                )}
              </div>
              <div className={styles.identityMeta}>
                {profile && <p>{t("agentPortal.agentCode")}: <strong>{profile.code}</strong></p>}
                <Button variant="secondary" size="small" className={styles.refreshButton} onClick={() => setRetry((current) => current + 1)}>
                  <RefreshCw size={15} aria-hidden="true" /> {t("agentPortal.refresh")}
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.headerActions}>
          <AgentNotifications accessToken={accessToken} onOpenNotification={handleOpenNotification} />
          <div className={styles.balanceSummary}>
            <span>{t("agentPortal.accountBalance")}</span>
            <button
              type="button"
              className={styles.balanceToggle}
              onClick={() => setIsBalanceVisible((visible) => !visible)}
              aria-label={t(isBalanceVisible ? "agentPortal.hideBalance" : "agentPortal.showBalance")}
              aria-pressed={isBalanceVisible}
              disabled={summaryLoading || !summary}
            >
              <strong>{isBalanceVisible
                ? summaryValue(summary?.totalAdvancedAmount, summary?.totalAdvancedAmountAmd, summary?.agent?.totalAdvancedAmount)
                : "••••••"}</strong>
              {isBalanceVisible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
            </button>
          </div>
          <label className={styles.languageControl}>
            <Languages size={16} aria-hidden="true" />
            <select
              aria-label={t("header.language")}
              value={PORTAL_LANGUAGES.some(({ code }) => code === activeLanguage) ? activeLanguage : "en"}
              onChange={(event) => {
                const language = event.target.value;
                void i18n.changeLanguage(language);
                localStorage.setItem("i18nextLng", language);
              }}
            >
              {PORTAL_LANGUAGES.map(({ code, label }) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </label>
          <Button
            variant="secondary"
            size="small"
            className={styles.logoutButton}
            onClick={() => setIsLogoutConfirmOpen(true)}
            disabled={isLoggingOut}
            aria-busy={isLoggingOut}
          >
            <LogOut size={15} aria-hidden="true" /> {t("header.logout")}
          </Button>
        </div>
      </header>

      <div className={`${styles.portalLayout} ${isSidebarCollapsed ? styles.portalLayoutCollapsed : styles.portalLayoutExpanded}`}>
        <aside className={`${styles.sidebar} ${isSidebarCollapsed ? styles.sidebarCollapsed : styles.sidebarExpanded}`}>
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarLabel}>{t("agentPortal.navigation")}</span>
            <button
              type="button"
              className={styles.sidebarToggle}
              onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
              aria-label={t(isSidebarCollapsed ? "agentPortal.expandNavigation" : "agentPortal.collapseNavigation")}
              aria-expanded={!isSidebarCollapsed}
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
            </button>
          </div>
          <nav className={styles.navigation} aria-label={t("agentPortal.navigation")}>
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className={section === id ? styles.navActive : ""}
                onClick={() => setSection(id)}
                aria-current={section === id ? "page" : undefined}
                aria-label={label}
                title={isSidebarCollapsed ? label : undefined}
              >
                <Icon size={17} aria-hidden="true" /><span>{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <div className={styles.portalContent}>
          {sectionError && (
            <div className={styles.error} role="alert">
              <span>{sectionError}</span>
              <Button variant="secondary" size="small" onClick={() => setRetry((current) => current + 1)}>{t("agentPortal.retry")}</Button>
            </div>
          )}

      {section === "overview" && (
        <section className={styles.section}>
          <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>{t("agentPortal.overview")}</span><h2>{t("agentPortal.financialSummary")}</h2></div></div>
          {summaryError && <div className={styles.error} role="alert"><span>{summaryError}</span><Button variant="secondary" size="small" onClick={() => setRetry((current) => current + 1)}>{t("agentPortal.retry")}</Button></div>}
          {profileError && <div className={styles.error} role="alert"><span>{profileError}</span><Button variant="secondary" size="small" onClick={() => setRetry((current) => current + 1)}>{t("agentPortal.retry")}</Button></div>}
          {summaryLoading ? <div className={styles.loading} role="status">{t("agentPortal.loading")}</div> : (
            <div className={styles.metrics}>
              <article><span>{t("agentPortal.activeContracts")}</span><strong>{activeContractsCount}</strong></article>
              <article><span>{t("agentPortal.totalAdvanced")}</span><strong>{summaryValue(summary?.totalAdvancedAmount, summary?.totalAdvancedAmountAmd, summary?.agent?.totalAdvancedAmount)}</strong></article>
              <article><span>{t("agentPortal.totalRepaid")}</span><strong>{summaryValue(summary?.totalRepaidAmount, summary?.totalRepaidAmountAmd, summary?.agent?.totalRepaidAmount)}</strong></article>
              <article><span>{t("agentPortal.contractBalance")}</span><strong>{summaryValue(summary?.totalOutstandingAmount, summary?.totalOutstandingAmountAmd, summary?.agent?.outstandingAmount)}</strong></article>
            </div>
          )}
        </section>
      )}

      {section === "profile" && (
        <section className={styles.section}>
          <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>{t("agentPortal.agentDetails")}</span><h2>{t("agentPortal.profile")}</h2></div></div>
          {profileError && <div className={styles.error} role="alert"><span>{profileError}</span><Button variant="secondary" size="small" onClick={() => setRetry((current) => current + 1)}>{t("agentPortal.retry")}</Button></div>}
          {profileLoading || sectionLoading ? <div className={styles.loading} role="status">{t("agentPortal.loading")}</div> : profile ? (
            <>
              <div className={styles.profileCard}>
                <dl>
                  <div><dt>{t("agentPortal.name")}</dt><dd>{getFullName(profile) || "—"}</dd></div>
                  <div><dt>{t("agentPortal.agentCode")}</dt><dd>{profile.code}</dd></div>
                  <div><dt>{t("agentPortal.phone")}</dt><dd>{profile.phone || profile.customer?.phone || "—"}</dd></div>
                  <div><dt>{t("agentPortal.email")}</dt><dd>{profile.email || profile.customer?.email || "—"}</dd></div>
                  <div><dt>{t("agentPortal.address")}</dt><dd>{profile.address || "—"}</dd></div>
                  <div><dt>{t("agentPortal.registrationDate")}</dt><dd>{formatDate(profile.registrationDate)}</dd></div>
                  <div><dt>{t("agentPortal.status")}</dt><dd>{getStatusText(profile.status, t)}</dd></div>
                  <div><dt>{t("agentPortal.agentType")}</dt><dd>{profile.agentType?.name || "—"}</dd></div>
                </dl>
              </div>
              <h3 className={styles.subheading}>{t("agentPortal.typeHistory")}</h3>
              {typeHistory.length ? <div className={styles.cardList}>{typeHistory.map((item) => <article className={styles.dataCard} key={item.id}><strong>{item.newType?.name || "—"}</strong><span>{formatDate(item.changedAt)}</span></article>)}</div> : <EmptyState text={t("agentPortal.noHistory")} />}
            </>
          ) : null}
        </section>
      )}

      {section === "contracts" && (
        <section className={styles.section}>
          <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>{t("agentPortal.finances")}</span><h2>{t("agentPortal.contracts")}</h2></div></div>
          {sectionLoading ? <div className={styles.loading}>{t("agentPortal.loading")}</div> : contracts?.results.length ? (
            <div className={styles.cardList}>{contracts.results.map((contract) => <article className={styles.dataCard} key={contract.id}>
              <div className={styles.cardTitle}><strong>{contract.contractNumber}</strong><span className={styles.statusBadge}>{getRecordStatus(contract.status, t)}</span></div>
              <dl className={styles.contractTerms}>
                <div>
                  <dt>{t("agentPortal.contractSigningDate")}</dt>
                  <dd>{formatDate(contract.contractDate)}</dd>
                </div>
                {contract.allowsProductAdvance === true && (
                  <>
                    <div>
                      <dt>{t("agentPortal.productCreditLimit")}</dt>
                      <dd>{contract.productCreditLimitAmd != null && Number.isFinite(contract.productCreditLimitAmd) && contract.productCreditLimitAmd > 0
                        ? formatAmd(contract.productCreditLimitAmd)
                        : t("common.notSpecified")}</dd>
                    </div>
                    <div>
                      <dt>{t("agentPortal.productCreditDeadline")}</dt>
                      <dd>{contract.productCreditDeadline ? formatDate(contract.productCreditDeadline) : t("common.notSpecified")}</dd>
                    </div>
                  </>
                )}
              </dl>
              <div className={styles.cardMetrics}><span>{t("agentPortal.totalAdvanced")}: {formatAmd(contract.totalAdvancedAmount)}</span><span>{t("agentPortal.totalRepaid")}: {formatAmd(contract.totalRepaidAmount)}</span><strong>{t("agentPortal.balance")}: {formatAmd(contract.outstandingAmount)}</strong></div>
            </article>)}</div>
          ) : !sectionError && <EmptyState text={t("agentPortal.noContracts")} />}
          <Pager page={contracts} onChange={setContractsPage} disabled={sectionLoading} />
        </section>
      )}

      {section === "advances" && (
        <section className={styles.section}>
          <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>{t("agentPortal.finances")}</span><h2>{t("agentPortal.advances")}</h2></div></div>
          {sectionLoading ? <div className={styles.loading}>{t("agentPortal.loading")}</div> : advances?.results.length ? (
            <div className={styles.cardList}>{advances.results.map((advance) => <article className={styles.dataCard} key={advance.id}>
              <div className={styles.cardTitle}><strong>{advance.advanceNumber}</strong><span className={styles.statusBadge}>{getRecordStatus(advance.status, t)}</span></div>
              <p>{formatDate(advance.advanceDate)} · {advance.agent?.code || ""}</p>
              <div className={styles.cardMetrics}><strong>{formatAmd(advance.advancedAmount)}</strong>{advance.repaymentDeadline && <span>{t("agentPortal.dueDate")}: {formatDate(advance.repaymentDeadline)}</span>}</div>
            </article>)}</div>
          ) : !sectionError && <EmptyState text={t("agentPortal.noAdvances")} />}
          <Pager page={advances} onChange={setAdvancesPage} disabled={sectionLoading} />
        </section>
      )}

      {section === "deliveries" && (
        <section className={styles.section}>
          <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>{t("agentPortal.finances")}</span><h2>{t("agentPortal.deliveries")}</h2></div></div>
          <div className={styles.deliveryFilters}>
            <label>{t("agentPortal.filterStatus")}<select value={deliveryStatus} onChange={(event) => { setDeliveryStatus(event.target.value); setDeliveriesPage(1); }}>
              <option value="">{t("agentPortal.allStatuses")}</option>
              {(["Draft", "Valuated", "Confirmed", "Cancelled"] as const).map((status) => (
                <option key={status} value={status}>{t(`agentPortal.recordStatuses.${status}`)}</option>
              ))}
            </select></label>
            <label>{t("agentPortal.dateFrom")}<input type="date" value={deliveryDateFrom} onChange={(event) => { setDeliveryDateFrom(event.target.value); setDeliveriesPage(1); }} /></label>
            <label>{t("agentPortal.dateTo")}<input type="date" value={deliveryDateTo} onChange={(event) => { setDeliveryDateTo(event.target.value); setDeliveriesPage(1); }} /></label>
          </div>
          {sectionLoading ? <div className={styles.loading}>{t("agentPortal.loading")}</div> : deliveries?.results.length ? (
            <div className={styles.cardList}>{deliveries.results.map((delivery) => <article className={styles.dataCard} key={delivery.id}>
              <div className={styles.cardTitle}><strong>{delivery.deliveryNumber}</strong><span className={styles.statusBadge}>{getRecordStatus(delivery.status, t)}</span></div>
              <p>{formatDate(delivery.deliveryDate)} · {delivery.netWeightKg} kg</p>
              <div className={styles.cardMetrics}><strong>{formatAmd(delivery.totalValueAmd)}</strong><span>{delivery.contract?.contractNumber || ""}</span></div>
              <button
                type="button"
                className={styles.deliveryDetailsToggle}
                onClick={() => void toggleDeliveryDetails(delivery.id)}
                aria-expanded={expandedDeliveryId === delivery.id}
              >
                {expandedDeliveryId === delivery.id ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
                {t("agentPortal.deliveryDetails")}
              </button>
              {expandedDeliveryId === delivery.id && (
                <div className={styles.deliveryDetails}>
                  {loadingDeliveryId === delivery.id ? (
                    <div className={styles.loading} role="status">{t("agentPortal.loading")}</div>
                  ) : deliveryDetailErrors[delivery.id] ? (
                    <div className={styles.error} role="alert">
                      <span>{deliveryDetailErrors[delivery.id]}</span>
                      <Button variant="secondary" size="small" onClick={() => void loadDeliveryDetails(delivery.id)}>
                        {t("agentPortal.retry")}
                      </Button>
                    </div>
                  ) : deliveryDetails[delivery.id] ? (
                    <>
                      <strong>{t("agentPortal.metalDetails")}</strong>
                      <div className={styles.metalDetailsGrid}>
                        {([
                          { key: "pt", weight: deliveryDetails[delivery.id].ptGrams, value: deliveryDetails[delivery.id].ptValueUsd, price: deliveryDetails[delivery.id].priceSnapshot?.ptPriceUsdPerGram },
                          { key: "pd", weight: deliveryDetails[delivery.id].pdGrams, value: deliveryDetails[delivery.id].pdValueUsd, price: deliveryDetails[delivery.id].priceSnapshot?.pdPriceUsdPerGram },
                          { key: "rh", weight: deliveryDetails[delivery.id].rhGrams, value: deliveryDetails[delivery.id].rhValueUsd, price: deliveryDetails[delivery.id].priceSnapshot?.rhPriceUsdPerGram },
                        ] as const).map((metal) => (
                          <div className={styles.metalDetailsCard} key={metal.key}>
                            <strong>{t(`agentPortal.metals.${metal.key}`)}</strong>
                            <span>{t("agentPortal.metalWeight")}: {formatNumber(metal.weight)} g</span>
                            <span>{t("agentPortal.metalValue")}: {formatNumber(metal.value)} USD</span>
                            <span>{t("agentPortal.metalPrice")}: {formatNumber(metal.price)} USD/g</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
              )}
            </article>)}</div>
          ) : !sectionError && <EmptyState text={t("agentPortal.noDeliveries")} />}
          <Pager page={deliveries} onChange={setDeliveriesPage} disabled={sectionLoading} />
        </section>
      )}

      {section === "debt" && (
        <section className={styles.section}>
          <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>{t("agentPortal.productDebt")}</span><h2>{t("agentPortal.debtOverview")}</h2></div></div>
          <label className={`${styles.filter} ${styles.debtContractFilter}`}>{t("agentPortal.contract")}
            <select value={debtContract} onChange={(event) => { setDebtContract(event.target.value); setSalesPage(1); }}>
              <option value="">{t("agentPortal.selectProductContract")}</option>
              {productCreditContracts.map((contract) => <option key={contract.id} value={contract.id}>{contract.contractNumber}</option>)}
            </select>
          </label>
          {!sectionLoading && productCreditContracts.length === 0 && <EmptyState text={t("agentPortal.noContracts")} />}
          {!sectionLoading && productCreditContracts.length > 0 && !debtContract && (
            <p className={styles.notice}>{t("agentPortal.selectContractPrompt")}</p>
          )}
          {sectionLoading ? <div className={styles.loading}>{t("agentPortal.loading")}</div> : productDebt && (
            <div className={`${styles.metrics} ${styles.debtMetrics}`}>
              <article><span>{t("agentPortal.contractNumber")}</span><strong>{productCreditContracts.find((contract) => contract.id === debtContract)?.contractNumber ?? "—"}</strong></article>
              <article><span>{t("agentPortal.totalAdvanced")}</span><strong>{formatAmd(productDebt.totalAdvancedAmountAmd)}</strong></article>
              <article><span>{t("agentPortal.totalRepaid")}</span><strong>{formatAmd(productDebt.totalPaidAmountAmd)}</strong></article>
              <article><span>{t("agentPortal.productDebtBalance")}</span><strong>{formatAmd(productDebt.outstandingAmountAmd)}</strong></article>
            </div>
          )}
          {debtContract && <div className={styles.debtLists}>
            <section className={styles.debtListPanel}>
              <div className={styles.debtPanelHeading}>
                <span className={styles.debtPanelIcon}><ShoppingCart size={18} aria-hidden="true" /></span>
                <h3>{t("agentPortal.creditPurchases")}</h3>
                <span className={styles.debtPanelCount}>{selectedCreditSales.length}</span>
              </div>
              <div className={styles.debtPanelContent}>
                {selectedCreditSales.length ? (
                  <div className={styles.cardList}>{selectedCreditSales.map((sale) => <article className={styles.dataCard} key={sale.saleId}>
                    <div className={styles.cardTitle}><strong>#{sale.saleId}</strong><span className={styles.statusBadge}>{sale.status}</span></div>
                    <p>{formatDate(sale.saleDate)}</p>
                    <p>{t("agentPortal.contractNumber")}: {productCreditContracts.find((contract) => contract.id === sale.contractId)?.contractNumber ?? sale.contractId}</p>
                    <div className={styles.cardMetrics}><span>{t("agentPortal.total")}: {formatAmd(sale.totalAmount)}</span><span>{t("agentPortal.paid")}: {formatAmd(sale.paidAmount)}</span><strong>{t("agentPortal.balance")}: {formatAmd(sale.outstandingAmount)}</strong></div>
                    {sale.items.map((item, index) => <small key={`${item.productId}-${index}`}>{item.productCode || item.productSku || `#${item.productId}`} · {item.quantity}</small>)}
                  </article>)}</div>
                ) : !sectionLoading && <EmptyState text={t("agentPortal.noSales")} />}
                <Pager page={creditSales} onChange={setSalesPage} disabled={sectionLoading} />
              </div>
            </section>
            <section className={styles.debtListPanel}>
              <div className={styles.debtPanelHeading}>
                <span className={styles.debtPanelIcon}><CreditCard size={18} aria-hidden="true" /></span>
                <h3>{t("agentPortal.debtPayments")}</h3>
                <span className={styles.debtPanelCount}>{selectedDebtPayments.length}</span>
              </div>
              <div className={styles.debtPanelContent}>
                {selectedDebtPayments.length ? (
                  <div className={styles.cardList}>{selectedDebtPayments.map((payment) => <article className={styles.dataCard} key={payment.id}>
                    <div className={styles.cardTitle}><strong>{formatAmd(payment.amountAmd)}</strong><span>{formatDate(payment.paymentDate)}</span></div>
                    <p>{t("agentPortal.contractNumber")}: {productCreditContracts.find((contract) => contract.id === payment.agentContractId)?.contractNumber ?? payment.agentContractId}</p>
                  </article>)}</div>
                ) : !sectionLoading && <EmptyState text={t("agentPortal.noPayments")} />}
                <p className={styles.notice}>{t("agentPortal.noPaymentAction")}</p>
              </div>
            </section>
          </div>}
        </section>
      )}

      {section === "orders" && (
        <section className={styles.section}>
          <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>{t("agentPortal.orders")}</span><h2>{t("agentPortal.createOrder")}</h2></div></div>
          <p className={styles.notice}>{t("agentPortal.noPriceNotice")}</p>
          {orderSuccess && <div className={styles.success} role="status">{orderSuccess}</div>}
          {shopError && <div className={styles.error} role="alert">
            <span>{shopError}</span>
            <Button variant="secondary" size="small" onClick={() => { setShopsLoaded(false); setRetry((current) => current + 1); }}>{t("agentPortal.retry")}</Button>
          </div>}
          {catalogError && <div className={styles.error} role="alert">
            <span>{catalogError}</span>
            <Button variant="secondary" size="small" onClick={() => { setCatalogLoaded(false); setCatalogShopId(null); setRetry((current) => current + 1); }}>{t("agentPortal.retry")}</Button>
          </div>}
          <div className={styles.orderBuilder}>
            <div className={styles.orderToolbar}>
              <label className={styles.shopSelect}>
                <span><Store size={16} aria-hidden="true" />{t("agentPortal.selectShop")}</span>
                <select
                  value={selectedShopId ?? ""}
                  disabled={shopLoading || !shops.length}
                  onChange={(event) => {
                    const nextShopId = Number(event.target.value);
                    setSelectedShopId(nextShopId);
                    setProducts([]);
                    setSelectedItems({});
                    setOrderStep("catalog");
                    setProductSearch("");
                    setCatalogLoaded(false);
                    setCatalogShopId(null);
                    setCatalogError("");
                  }}
                >
                  {shops.map((shop) => <option key={shop.id} value={shop.id}>{shop.code}</option>)}
                </select>
              </label>
              <button
                type="button"
                ref={cartButtonRef}
                className={styles.cartButton}
                aria-current={orderStep === "cart" ? "step" : undefined}
                onClick={() => setOrderStep("cart")}
                disabled={!selectedCount}
              >
                <span key={cartAnimationKey} className={cartAnimationKey ? styles.cartIconPulse : ""}>
                  <ShoppingCart size={18} aria-hidden="true" />
                </span>
                <span>{t("agentPortal.cart")}</span>
                <strong key={`cart-count-${cartAnimationKey}`} className={cartAnimationKey ? styles.cartCountPulse : ""}>{selectedQuantity}</strong>
              </button>
            </div>

            {shopLoading ? <div className={styles.loading}>{t("agentPortal.shopLoading")}</div> : null}
            {!shopLoading && !shops.length && !shopError && <EmptyState text={t("agentPortal.noLinkedShops")} />}

            {orderStep === "catalog" && selectedShop && (
              <>
                <div className={styles.catalogHeading}>
                  <div><strong>{selectedShop.code}</strong><span>{t("agentPortal.shopCatalogHint")}</span></div>
                  <TextField label={t("agentPortal.searchProducts")} placeholder={t("agentPortal.searchProducts")} value={productSearch} onChange={(event) => setProductSearch(event.target.value)} />
                </div>
                {catalogLoading ? <div className={styles.loading}>{t("agentPortal.loading")}</div> : (
                  <div className={styles.productList}>
                    {visibleProducts.map((item) => {
                      const product = item.product;
                      const productId = item.productId ?? product?.id;
                      if (productId == null || !product) return null;
                      const quantity = selectedItems[productId] ?? 0;
                      const available = Math.max(0, item.quantity);
                      return <article
                        className={`${styles.productRow} ${lastAddedProductId === productId ? styles.productJustAdded : ""}`}
                        key={`${productId}-${lastAddedProductId === productId ? addAnimationKey : 0}`}
                      >
                        <div className={styles.productInfo}>
                          <strong>{product.code}</strong>
                          <span>{[product.brandName, product.categoryName, product.sku, product.boxSizeName].filter(Boolean).join(" · ")}</span>
                          <div className={styles.productMeta}>
                            <b>{formatAmd(item.salePrice)}{product.unitTypeName ? ` / ${product.unitTypeName}` : ""}</b>
                            <span>{available > 0 ? t("agentPortal.inStock", { count: available }) : t("agentPortal.outOfStock")}</span>
                          </div>
                        </div>
                        {quantity ? <div className={styles.quantityControl}>
                          <button type="button" aria-label={t("agentPortal.decreaseQuantity")} onClick={() => setSelectedItems((items) => quantity <= 1 ? Object.fromEntries(Object.entries(items).filter(([id]) => Number(id) !== productId)) : { ...items, [productId]: quantity - 1 })}><Minus size={14} aria-hidden="true" /></button>
                          <strong>{quantity}</strong>
                          <button type="button" aria-label={t("agentPortal.increaseQuantity")} disabled={quantity >= available} onClick={() => setSelectedItems((items) => ({ ...items, [productId]: Math.min(quantity + 1, available) }))}><Plus size={14} aria-hidden="true" /></button>
                        </div> : <button
                          type="button"
                          className={styles.addProductButton}
                          aria-label={t("agentPortal.add")}
                          title={t("agentPortal.add")}
                          disabled={selectedCount >= 50 || available < 1}
                          onClick={(event) => addProductToCart(productId, event.currentTarget)}
                        >
                          <Plus size={19} strokeWidth={2.5} aria-hidden="true" />
                        </button>}
                      </article>;
                    })}
                    {!visibleProducts.length && <EmptyState text={products.length ? t("agentPortal.noProductsFound") : t("agentPortal.noProducts")} />}
                  </div>
                )}
              </>
            )}

            {orderStep === "cart" && (
              <div className={styles.cartReview}>
                <div className={styles.cartHeading}>
                  <div><h3>{t("agentPortal.cart")}</h3><span>{selectedShop?.code} · {t("agentPortal.checkoutHint")}</span></div>
                  <button type="button" className={styles.continueShoppingButton} onClick={() => setOrderStep("catalog")}>{t("agentPortal.continueShopping")}</button>
                </div>
                {selectedProductSummary.length ? (
                  <>
                    <div className={styles.cartItems}>
                      {selectedProductSummary.map(({ id, item, quantity }) => {
                        const product = item?.product;
                        const productId = Number(id);
                        return <article className={styles.cartItem} key={id}>
                          <div className={styles.cartProduct}>
                            <strong>{product?.code || `#${id}`}</strong>
                            <span>{[product?.brandName, product?.categoryName, product?.unitTypeName].filter(Boolean).join(" · ")}</span>
                            <b>{formatAmd(item?.salePrice)} × {quantity} = {formatAmd(Number(item?.salePrice ?? 0) * quantity)}</b>
                          </div>
                          <div className={styles.quantityControl}>
                            <button type="button" aria-label={t("agentPortal.decreaseQuantity")} onClick={() => setSelectedItems((items) => quantity <= 1 ? Object.fromEntries(Object.entries(items).filter(([entryId]) => Number(entryId) !== productId)) : { ...items, [productId]: quantity - 1 })}><Minus size={14} aria-hidden="true" /></button>
                            <strong>{quantity}</strong>
                            <button type="button" aria-label={t("agentPortal.increaseQuantity")} disabled={!item || quantity >= item.quantity} onClick={() => setSelectedItems((items) => ({ ...items, [productId]: Math.min(quantity + 1, item?.quantity ?? quantity) }))}><Plus size={14} aria-hidden="true" /></button>
                          </div>
                          <button type="button" className={styles.removeCartItem} onClick={() => setSelectedItems((items) => Object.fromEntries(Object.entries(items).filter(([entryId]) => Number(entryId) !== productId)))}>{t("agentPortal.remove")}</button>
                        </article>;
                      })}
                    </div>
                    <div className={styles.cartTotal}><span>{t("agentPortal.cartTotal")} · {t("agentPortal.selectedItems", { count: selectedCount })}</span><strong>{formatAmd(cartTotal)}</strong></div>
                    <div className={styles.orderFooter}><Button variant="primary" size="medium" disabled={isSubmittingOrder || !selectedCount || !selectedShopId} onClick={() => void submitOrder()}>{isSubmittingOrder ? t("agentPortal.submitting") : t("agentPortal.submitOrder")}</Button></div>
                  </>
                ) : <EmptyState text={t("agentPortal.emptyCart")} />}
              </div>
            )}
          </div>
          {flyingProduct && createPortal(
            <span
              key={`${flyingProduct.productId}-${addAnimationKey}`}
              className={styles.flyingProduct}
              style={{
                left: flyingProduct.fromX,
                top: flyingProduct.fromY,
                "--fly-x": `${flyingProduct.deltaX}px`,
                "--fly-y": `${flyingProduct.deltaY}px`,
              } as CSSProperties & { "--fly-x": string; "--fly-y": string }}
              aria-hidden="true"
              onAnimationEnd={() => setFlyingProduct(null)}
            >
              +1
            </span>,
            document.body,
          )}
        </section>
      )}

      {section === "myRequests" && (
        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <div><span className={styles.eyebrow}>{t("agentPortal.orders")}</span><h2>{t("agentPortal.myRequests")}</h2></div>
            <div className={styles.requestHeadingActions}>
              <label className={styles.requestFilter}>
                <span>{t("agentPortal.filterStatus")}</span>
                <select aria-label={t("agentPortal.filterStatus")} value={orderFilter} onChange={(event) => { setOrderFilter(event.target.value as AgentOrderRequestStatus | ""); setOrdersPage(1); }}>
                  <option value="">{t("agentPortal.allStatuses")}</option>
                  {(["Pending", "Approved", "Rejected"] as const).map((status) => (
                    <option key={status} value={status}>{t(`agentPortal.statuses.${status}`)}</option>
                  ))}
                </select>
              </label>
              <Button variant="primary" size="small" onClick={() => setSection("orders")}>
                <ShoppingCart size={15} aria-hidden="true" /> {t("agentPortal.createOrder")}
              </Button>
            </div>
          </div>
          {orderSuccess && <div className={styles.success} role="status">{orderSuccess}</div>}
          {productDirectoryError && <div className={styles.error} role="alert">
            <span>{productDirectoryError}</span>
            <Button variant="secondary" size="small" onClick={() => { setProductDirectoryLoaded(false); setRetry((current) => current + 1); }}>{t("agentPortal.retry")}</Button>
          </div>}
          {sectionLoading ? <div className={styles.loading}>{t("agentPortal.loading")}</div> : orders?.results.length ? (
            <div className={styles.cardList}>{orders.results.map((order) => {
              const status = getRequestStatus(order.status);
              return <article className={styles.dataCard} key={order.id}>
                <div className={styles.cardTitle}>
                  <div className={styles.requestIdentity}><strong>{formatDate(order.requestedAt)}</strong><span>#{order.id.slice(0, 8)}</span></div>
                  <span className={`${styles.statusBadge} ${styles[`status${status}`] || ""}`}>{t(`agentPortal.statuses.${status}`)}</span>
                </div>
                <div className={styles.requestCardMeta}>
                  <span>{t("agentPortal.itemCount", { count: order.items.length })}</span>
                  {status === "Approved" && order.approvedShopId != null && <span>{t("agentPortal.approvedShopId", { id: order.approvedShopId })}</span>}
                  {status === "Approved" && order.posSaleId && <span>{t("agentPortal.saleReference", { id: order.posSaleId })}</span>}
                </div>
                {status === "Rejected" && order.decisionNote && <p className={styles.decisionNote}>{order.decisionNote}</p>}
                <Button
                  variant="secondary"
                  size="small"
                  className={styles.orderDetailsToggle}
                  aria-expanded={expandedOrderId === order.id}
                  aria-controls={`order-details-${order.id}`}
                  onClick={async () => {
                    if (expandedOrderId === order.id) {
                      setExpandedOrderId(null);
                      return;
                    }
                    setExpandedOrderId(order.id);
                    if (orderDetails[order.id]) return;
                    try {
                      const details = await agentPortalService.getOrderRequest(order.id);
                      setOrderDetails((current) => ({ ...current, [order.id]: details }));
                    } catch (error: unknown) {
                      setExpandedOrderId((current) => current === order.id ? null : current);
                      setSectionError(error instanceof Error ? error.message : t("agentPortal.loadError"));
                    }
                  }}
                >
                  {expandedOrderId === order.id
                    ? <ChevronUp size={16} aria-hidden="true" />
                    : <ChevronDown size={16} aria-hidden="true" />}
                  {expandedOrderId === order.id ? t("agentPortal.hideDetails") : t("agentPortal.viewDetails")}
                </Button>
                {expandedOrderId === order.id && <div className={styles.orderDetail} id={`order-details-${order.id}`}>
                  {orderDetails[order.id] ? orderDetails[order.id].items.map((item, index) => {
                    const product = productDirectory.find((entry) => entry.id === item.productId);
                    const name = item.productName?.trim() || product?.code || item.productCode || t("agentPortal.productNameUnavailable");
                    const description = [
                      product?.brandName,
                      product?.categoryName,
                      product?.sku ? `${t("agentPortal.sku")}: ${product.sku}` : null,
                    ].filter(Boolean).join(" · ");
                    return <div className={styles.orderDetailItem} key={`${item.productId}-${index}`}>
                      <span>
                        <strong>{name}</strong>
                        {description && <small>{description}</small>}
                      </span>
                      <b>× {item.quantity}</b>
                    </div>;
                  }) : <span className={styles.orderDetailLoading}>{t("agentPortal.loading")}</span>}
                  {orderDetails[order.id]?.notes && <p>{orderDetails[order.id].notes}</p>}
                </div>}
              </article>;
            })}</div>
          ) : !sectionError && <EmptyState text={t("agentPortal.noRequests")} />}
          <Pager page={orders} onChange={setOrdersPage} disabled={sectionLoading} />
        </section>
      )}

        </div>
        <nav className={styles.mobileNavigation} aria-label={t("agentPortal.navigation")}>
          {primaryMobileSections.map(({ id, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={section === id ? styles.mobileNavActive : ""}
              onClick={() => setSection(id)}
              aria-current={section === id ? "page" : undefined}
              aria-label={t(`agentPortal.mobile.${id}`)}
            >
              <Icon size={19} aria-hidden="true" />
              <span>{t(`agentPortal.mobile.${id}`)}</span>
            </button>
          ))}
          <button
            type="button"
            ref={moreButtonRef}
            aria-controls="agent-portal-more-menu"
            className={isMoreOpen || moreMobileSections.some(({ id }) => id === section) ? styles.mobileNavActive : ""}
            onClick={() => setIsMoreOpen(true)}
            aria-expanded={isMoreOpen}
            aria-label={t("agentPortal.mobile.more")}
          >
            <MoreHorizontal size={20} aria-hidden="true" />
            <span>{t("agentPortal.mobile.more")}</span>
          </button>
        </nav>
        {isMoreOpen && (
          <div className={styles.moreOverlay}>
            <button
              type="button"
              className={styles.moreBackdrop}
              aria-label={t("common.close")}
              onClick={() => setIsMoreOpen(false)}
            />
            <section
              id="agent-portal-more-menu"
              ref={moreSheetRef}
              className={styles.moreSheet}
              role="dialog"
              aria-modal="true"
              aria-label={t("agentPortal.mobile.more")}
            >
              <div className={styles.moreSheetHeading}>
                <h2>{t("agentPortal.mobile.more")}</h2>
                <button type="button" onClick={() => setIsMoreOpen(false)} aria-label={t("common.close")}>
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
              <nav className={styles.moreLinks} aria-label={t("agentPortal.navigation")}>
                {moreMobileSections.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    className={section === id ? styles.moreLinkActive : ""}
                    onClick={() => {
                      setSection(id);
                      setIsMoreOpen(false);
                    }}
                    aria-current={section === id ? "page" : undefined}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                ))}
              </nav>
            </section>
          </div>
        )}
        <ConfirmationModal
          open={isLogoutConfirmOpen}
          onOpenChange={setIsLogoutConfirmOpen}
          title={t("header.logout")}
          description={t("agentPortal.confirmLogout")}
          confirmText={t("common.confirm")}
          cancelText={t("common.cancel")}
          onConfirm={() => void handleLogout()}
          onCancel={() => setIsLogoutConfirmOpen(false)}
        />
      </div>
    </main>
  );
};
