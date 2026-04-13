import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import {
  HttpTransportType,
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from "@microsoft/signalr";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchActiveMetalRate } from "@/store/slices/metalRatesSlice";
import {
  fetchMetalPrices,
  clearPricesError,
} from "@/store/slices/metalPricesSlice";
import {
  fetchIntake,
  clearIntakeState,
  addIntake,
  rejectIntake,
} from "@/store/slices/operatorSlice";
import { fetchLanguages } from "@/store/slices/languagesSlice";
import {
  fetchBalance,
  openSession,
  fetchPendingTransaction,
  confirmTransaction,
  clearPendingData,
} from "@/store/slices/cash/registersSlice";
import {
  fetchRegisterSession,
  resetSessionState,
} from "@/store/slices/cash/sessionsSlice";
import { closeSession } from "@/store/slices/cash/cashboxSessionsSlice";
import { fetchOfferOptions } from "@/store/slices/offerOptionsSlice";
import {
  fetchExchangeRates,
  clearExchangeRatesState,
} from "@/store/slices/exchangeRatesSlice";
import { clearCustomersState } from "@/store/slices/customersSlice";
import { fetchIronDropdown } from "@/store/slices/adminProductsSlice";
import {
  submitBulkPurchase,
  clearPrices,
  fetchCarModels,
  recalculatePrices,
} from "@/store/slices/ironCarShopSlice";

// utils
import { mapApiCodeToI18nCode } from "@/utils/languageMapping";

export type TabType = "catalyst" | "iron";

export const useOperator = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState<TabType>("catalyst");
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [userData] = useState(() =>
    JSON.parse(localStorage.getItem("user_data") ?? "null"),
  );

  const selectors = {
    metalRates: useAppSelector((state) => state.metalRates),
    metalPrices: useAppSelector((state) => state.metalPrices),
    operator: useAppSelector((state) => state.operator),
    languagesState: useAppSelector((state) => state.languages),
    cashRegisters: useAppSelector((state) => state.cashRegisters),
    cashSessions: useAppSelector((state) => state.cashSessions),
    offerOptions: useAppSelector((state) => state.offerOptions),
    exchangeRates: useAppSelector((state) => state.exchangeRates),
    customers: useAppSelector((state) => state.customers),
    ironCarShop: useAppSelector((state) => state.ironCarShop),
  };

  const [uiState, setUiState] = useState({
    isSubmitting: false,
    hasTriedSubmit: false,
    showCashAmount: false,
    isCloseSessionModalOpen: false,
    isLogoutModalOpen: false,
    isTabConfirmModalOpen: false,
    isRejectConfirmationOpen: false,
    isCashboxBlockedModalOpen: false,
  });

  const [hasTriedCalculateIron, setHasTriedCalculateIron] = useState(false);
  const [pendingTab, setPendingTab] = useState<TabType | null>(null);
  const [recalculationsAmount, setRecalculationsAmount] = useState(0);
  const [initialOfferPrice, setInitialOfferPrice] = useState<number | null>(
    null,
  );
  const [formData, setFormData] = useState({
    powderWeight: "0",
    platinumPrice: "0",
    palladiumPrice: "0",
    rhodiumPrice: "0",
    customer: { phone: "", fullName: "", gender: 0, notes: "" },
  });

  // --- Helpers ---
  const refreshBalance = useCallback(() => {
    if (userData?.cashRegisterId) {
      dispatch(fetchBalance(userData.cashRegisterId));
    }
  }, [dispatch, userData?.cashRegisterId]);

  const languages = useMemo(
    () => selectors.languagesState.languages.filter((lang) => lang.isEnabled),
    [selectors.languagesState.languages],
  );

  const usdAmdRate = useMemo(
    () =>
      selectors.exchangeRates.exchangeRates.find(
        (r) => r.baseCurrencyCode === "USD" && r.quoteCurrencyCode === "AMD",
      )?.rate,
    [selectors.exchangeRates.exchangeRates],
  );

  const isNonStandardCustomer = useMemo(() => {
    const searchedCustomerType =
      selectors.customers.items[0]?.customerType?.code;
    const linkedCustomerType =
      selectors.operator.intake?.customer?.customerType?.code;
    const currentType = (
      linkedCustomerType || searchedCustomerType
    )?.toLowerCase();
    return !!(currentType && currentType !== "standard");
  }, [
    selectors.operator.intake?.customer?.customerType?.code,
    selectors.customers.items,
  ]);

  const isFormDirty = useMemo(() => {
    return (
      formData.powderWeight !== "0" ||
      formData.customer.phone !== "" ||
      selectors.operator.intake !== null ||
      selectors.ironCarShop.ironPrices.length > 0
    );
  }, [formData, selectors.operator.intake, selectors.ironCarShop.ironPrices]);

  const currentLanguageCode = useMemo(() => {
    return (
      languages.find((l) => mapApiCodeToI18nCode(l.code) === i18n.language)
        ?.code ?? ""
    );
  }, [languages, i18n.language]);

  // --- SignalR Logic ---
  useEffect(() => {
    const crId = userData?.cashRegisterId;
    const token = userData?.token;
    if (!crId || !token || !selectors.cashSessions.hasOpenSession) {
      if (connection) {
        connection.stop();
        setConnection(null);
      }
      return;
    }

    const url = `https://autoparts-ambpc7hjbqhxeebx.canadacentral-01.azurewebsites.net/hubs/cash?cashRegisterId=${crId}`;
    const newConnection = new HubConnectionBuilder()
      .withUrl(url, {
        accessTokenFactory: () => token,
        headers: { "X-CashRegister-Id": crId.toString() },
        transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    newConnection.on("PendingCashInCreated", () =>
      dispatch(fetchPendingTransaction(crId)),
    );
    newConnection.on("ReceivePendingCashIn", () =>
      dispatch(fetchPendingTransaction(crId)),
    );
    newConnection.onreconnected(() => {
      refreshBalance();
      dispatch(fetchPendingTransaction(crId));
    });

    const startHub = async () => {
      try {
        await newConnection.start();
        await newConnection.invoke("JoinCashBox", crId);
        dispatch(fetchPendingTransaction(crId));
        setConnection(newConnection);
      } catch (err) {
        console.error("SignalR Connection Error: ", err);
      }
    };

    startHub();
    return () => {
      if (newConnection) newConnection.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userData?.cashRegisterId,
    userData?.token,
    selectors.cashSessions.hasOpenSession,
    dispatch,
    refreshBalance,
  ]);

  // --- Initial Data Load ---
  useEffect(() => {
    const crId = userData?.cashRegisterId;
    if (crId) {
      dispatch(
        fetchActiveMetalRate({ cashRegisterId: crId, currencyCode: "USD" }),
      );
      dispatch(fetchLanguages(crId));
      dispatch(fetchRegisterSession(crId));
      refreshBalance();
    }
  }, [dispatch, userData?.cashRegisterId, refreshBalance]);

  useEffect(() => {
    const crId = userData?.cashRegisterId;
    if (crId && isNonStandardCustomer) {
      dispatch(fetchExchangeRates({ isActive: true, cashRegisterId: crId }));
      dispatch(fetchMetalPrices(crId));
    } else {
      dispatch(clearExchangeRatesState());
    }
  }, [dispatch, isNonStandardCustomer, userData?.cashRegisterId]);

  // --- Iron Shop Data ---
  useEffect(() => {
    const crId = userData?.cashRegisterId;
    if (
      activeTab === "iron" &&
      crId &&
      selectors.ironCarShop.carModels.length === 0
    ) {
      dispatch(fetchCarModels({ cashRegisterId: crId, lang: i18n.language }));
    }
  }, [
    activeTab,
    selectors.ironCarShop.carModels.length,
    userData?.cashRegisterId,
    dispatch,
    i18n.language,
  ]);

  // Iron Dropdown Logic
  useEffect(() => {
    const crId = userData?.cashRegisterId;
    if (crId) {
      dispatch(
        fetchIronDropdown({ cashRegisterId: crId, lang: i18n.language }),
      );
    }
  }, [dispatch, userData?.cashRegisterId, i18n.language]);

  // --- Visibility Logic ---
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const crId = userData?.cashRegisterId;
    if (uiState.showCashAmount && crId) {
      refreshBalance();
      timer = setTimeout(
        () => setUiState((p) => ({ ...p, showCashAmount: false })),
        10000,
      );
    }
    return () => clearTimeout(timer);
  }, [uiState.showCashAmount, refreshBalance, userData?.cashRegisterId]);

  // --- Offer Price Sync ---
  useEffect(() => {
    if (selectors.operator.intake?.offerPrice && initialOfferPrice === null)
      setInitialOfferPrice(selectors.operator.intake.offerPrice);
    if (!selectors.operator.intake) setInitialOfferPrice(null);
  }, [selectors.operator.intake, initialOfferPrice]);

  // --- Error Handling ---
  useEffect(() => {
    const errors = [
      {
        msg: selectors.metalRates.error,
        clear: () => dispatch({ type: "metalRates/clearError" }),
      },
      {
        msg: selectors.metalPrices.error,
        clear: () => dispatch(clearPricesError()),
      },
      {
        msg: selectors.operator.error,
        clear: () => dispatch(clearIntakeState()),
      },
      { msg: selectors.languagesState.error },
      { msg: selectors.cashRegisters.error },
      { msg: selectors.cashSessions.error },
      { msg: selectors.ironCarShop.error },
    ];
    errors.forEach(({ msg }) => {
      if (msg) toast.error(msg, { toastId: msg });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectors.metalRates.error,
    selectors.metalPrices.error,
    selectors.operator.error,
    selectors.languagesState.error,
    selectors.cashRegisters.error,
    selectors.cashSessions.error,
    selectors.ironCarShop.error,
  ]);

  const handleResetForm = useCallback(() => {
    setFormData({
      powderWeight: "0",
      platinumPrice: "0",
      palladiumPrice: "0",
      rhodiumPrice: "0",
      customer: { phone: "", fullName: "", gender: 0, notes: "" },
    });
    setUiState((p) => ({
      ...p,
      hasTriedSubmit: false,
      showCashAmount: false,
      isRejectConfirmationOpen: false,
    }));
    setHasTriedCalculateIron(false);
    setInitialOfferPrice(null);
    setRecalculationsAmount(0);
    dispatch(clearIntakeState());
    dispatch(clearCustomersState());
    dispatch(clearExchangeRatesState());
    dispatch(clearPrices());
  }, [dispatch]);

  const isCashboxClosedError = (error: unknown) => {
    const msg = typeof error === "string" ? error : (error as any)?.message;

    return msg === "No open cashbox session for operator.";
  };

  const handleSubmit = async () => {
    setUiState((p) => ({ ...p, hasTriedSubmit: true }));
    if (
      isNaN(Number(formData.powderWeight)) ||
      formData.customer.phone.length <= 3
    )
      return;

    setUiState((p) => ({ ...p, isSubmitting: true }));
    try {
      const crId = userData?.cashRegisterId;
      const response = await dispatch(
        addIntake({
          intake: {
            ...formData,
            shopId: userData?.shopId,
            powderWeightTotal: Number(formData.powderWeight),
            ptWeight: Number(formData.platinumPrice),
            pdWeight: Number(formData.palladiumPrice),
            rhWeight: Number(formData.rhodiumPrice),
            currencyCode: "USD",
          },
          cashRegisterId: crId,
        }),
      ).unwrap();

      toast.success(t("operatorPage.success.intakeCreated"));
      dispatch(fetchIntake({ intakeId: response.id, cashRegisterId: crId }));
      dispatch(
        fetchOfferOptions({ shopId: userData?.shopId, cashRegisterId: crId }),
      );
      setUiState((p) => ({ ...p, hasTriedSubmit: false }));
    } catch (e) {
      console.error(e);

      if (isCashboxClosedError(e)) {
        setUiState((p) => ({
          ...p,
          isCashboxBlockedModalOpen: true,
        }));
      } else {
        dispatch(clearIntakeState());
      }
    } finally {
      setUiState((p) => ({ ...p, isSubmitting: false }));
    }
  };

  const handleIronRecalculate = useCallback(async () => {
    const customer =
      selectors.operator.intake?.customer || selectors.customers.items[0];
    if (!customer || !selectors.ironCarShop.ironPrices.length) return;

    try {
      const itemsMap: Record<string, number> = {};
      selectors.ironCarShop.ironPrices.forEach((item) => {
        itemsMap[String(item.ironTypeId)] = item.weightKg;
      });

      const stepToFetch =
        selectors.ironCarShop.recalculationResult?.nextStep ?? 1;

      await dispatch(
        recalculatePrices({
          payload: {
            customerId: customer.id,
            customerTypeId: customer.customerTypeId,
            currentStep: stepToFetch,
            items: itemsMap,
          },
          cashRegisterId: userData?.cashRegisterId,
        }),
      ).unwrap();
      toast.success(t("finalOffer.success.recalculated"));
    } catch (e) {
      console.error("Iron Recalculate Error:", e);
    }
  }, [
    dispatch,
    selectors.operator.intake,
    selectors.customers.items,
    selectors.ironCarShop,
    userData,
    t,
  ]);

  const handleBulkPurchase = async () => {
    const customer =
      selectors.operator.intake?.customer || selectors.customers.items[0];
    if (!customer || selectors.ironCarShop.ironPrices.length === 0) return;
    try {
      await dispatch(
        submitBulkPurchase({
          payload: {
            customerId: customer.id,
            customerTypeId: customer.customerTypeId,
            items: selectors.ironCarShop.ironPrices.map((item) => ({
              ironTypeId: item.ironTypeId,
              weightKg: item.weightKg,
            })),
          },
          cashRegisterId: userData?.cashRegisterId,
          lang: i18n.language,
        }),
      ).unwrap();
      toast.success(t("operatorPage.success.purchaseCompleted"));
      refreshBalance();
      handleResetForm();
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmReject = async () => {
    if (activeTab === "catalyst" && selectors.operator.intake?.id) {
      try {
        await dispatch(
          rejectIntake({
            intakeId: selectors.operator.intake.id,
            cashRegisterId: userData?.cashRegisterId,
          }),
        ).unwrap();
        toast.success(t("finalOffer.success.rejected"));
        handleResetForm();
      } catch (error) {
        console.error("Reject failed:", error);
      }
    } else {
      handleResetForm();
    }
    setUiState((p) => ({ ...p, isRejectConfirmationOpen: false }));
  };

  const handleToggleSession = useCallback(
    async (action: "open" | "close") => {
      const crId = userData?.cashRegisterId;
      if (!crId) return;
      try {
        if (action === "open") {
          await dispatch(openSession(crId)).unwrap();
          dispatch(fetchRegisterSession(crId));
          toast.success(t("operatorPage.success.sessionOpened"));
          refreshBalance();
        } else if (selectors.cashSessions.sessionDetails?.sessionId) {
          await dispatch(
            closeSession({
              sessionId: selectors.cashSessions.sessionDetails.sessionId,
              cashRegisterId: crId,
            }),
          ).unwrap();
          dispatch(resetSessionState());
          setUiState((p) => ({ ...p, isCloseSessionModalOpen: false }));
          toast.success(t("operatorPage.success.sessionClosed"));
        }
      } catch (error) {
        console.error("Session action failed", error);
      }
    },
    [
      dispatch,
      selectors.cashSessions.sessionDetails,
      userData?.cashRegisterId,
      t,
      refreshBalance,
    ],
  );

  const handleConfirmTopUp = async () => {
    if (!userData?.cashRegisterId) return;
    try {
      await dispatch(confirmTransaction(userData.cashRegisterId)).unwrap();
      toast.success(t("operatorPage.success.transactionConfirmed"));
      dispatch(clearPendingData());
      refreshBalance();
      dispatch(fetchPendingTransaction(userData.cashRegisterId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLanguageChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const code = mapApiCodeToI18nCode(e.target.value);
      i18n.changeLanguage(code); // Using instance from useTranslation
      localStorage.setItem("i18nextLng", code);
    },
    [i18n], // Depend on i18n instance
  );

  return {
    activeTab,
    setActiveTab,
    uiState,
    setUiState,
    userData,
    formData,
    setFormData,
    initialOfferPrice,
    recalculationsAmount,
    setRecalculationsAmount,
    hasTriedCalculateIron,
    setHasTriedCalculateIron,
    pendingTab,
    setPendingTab,
    languages,
    currentLanguageCode,
    usdAmdRate,
    isNonStandardCustomer,
    isFormDirty,
    selectors,
    actions: {
      handleResetForm,
      handleSubmit,
      handleBulkPurchase,
      handleConfirmReject,
      handleToggleSession,
      handleConfirmTopUp,
      handleIronRecalculate,
      handleLanguageChange,
      refreshBalance,
    },
  };
};
