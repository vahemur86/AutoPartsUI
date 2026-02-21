import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import i18n from "i18next";
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
} from "@/store/slices/ironCarShopSlice";

export type TabType = "catalyst" | "iron";

export const useOperator = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState<TabType>("catalyst");
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [userData] = useState(() =>
    JSON.parse(localStorage.getItem("user_data") ?? "null"),
  );

  const metalRates = useAppSelector((state) => state.metalRates);
  const operator = useAppSelector((state) => state.operator);
  const languagesState = useAppSelector((state) => state.languages);
  const cashRegisters = useAppSelector((state) => state.cashRegisters);
  const cashSessions = useAppSelector((state) => state.cashSessions);
  const offerOptions = useAppSelector((state) => state.offerOptions);
  const { exchangeRates } = useAppSelector((state) => state.exchangeRates);
  const customers = useAppSelector((state) => state.customers);
  const ironCarShop = useAppSelector((state) => state.ironCarShop);

  const [uiState, setUiState] = useState({
    isSubmitting: false,
    hasTriedSubmit: false,
    showCashAmount: false,
    isCloseSessionModalOpen: false,
    isLogoutModalOpen: false,
    isTabConfirmModalOpen: false,
    isRejectConfirmationOpen: false,
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

  const languages = useMemo(
    () => languagesState.languages.filter((lang) => lang.isEnabled),
    [languagesState.languages],
  );
  const usdAmdRate = useMemo(
    () =>
      exchangeRates.find(
        (r) => r.baseCurrencyCode === "USD" && r.quoteCurrencyCode === "AMD",
      )?.rate,
    [exchangeRates],
  );

  useEffect(() => {
    const crId = userData?.cashRegisterId;
    const token = userData?.token;
    if (!crId || !token || !cashSessions.hasOpenSession) {
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
      dispatch(fetchBalance(crId));
      dispatch(fetchPendingTransaction(crId));
    });

    const startHub = async () => {
      try {
        await newConnection.start();
        await newConnection.invoke("JoinCashBox", crId);
        dispatch(fetchBalance(crId));
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
    cashSessions.hasOpenSession,
    dispatch,
  ]);

  useEffect(() => {
    const crId = userData?.cashRegisterId;
    if (crId) {
      dispatch(
        fetchActiveMetalRate({ cashRegisterId: crId, currencyCode: "USD" }),
      );
      dispatch(fetchLanguages(crId));
      dispatch(fetchRegisterSession(crId));
      dispatch(fetchBalance(crId));
    }
  }, [dispatch, userData?.cashRegisterId]);

  useEffect(() => {
    const searchedCustomerType = customers.items[0]?.customerType?.code;
    const linkedCustomerType = operator.intake?.customer?.customerType?.code;
    const currentType = (
      linkedCustomerType || searchedCustomerType
    )?.toLowerCase();
    const crId = userData?.cashRegisterId;

    if (crId && currentType && currentType !== "standard") {
      dispatch(fetchExchangeRates({ isActive: true, cashRegisterId: crId }));
    } else {
      dispatch(clearExchangeRatesState());
    }
  }, [
    dispatch,
    operator.intake?.customer?.customerType?.code,
    customers.items,
    userData?.cashRegisterId,
  ]);

  useEffect(() => {
    const crId = userData?.cashRegisterId;
    if (activeTab === "iron" && crId && ironCarShop.carModels.length === 0) {
      dispatch(fetchCarModels({ cashRegisterId: crId, lang: i18n.language }));
    }
  }, [
    activeTab,
    ironCarShop.carModels.length,
    userData?.cashRegisterId,
    dispatch,
  ]);

  // Logic: Iron Dropdown
  useEffect(() => {
    const crId = userData?.cashRegisterId;
    if (crId) {
      dispatch(
        fetchIronDropdown({ cashRegisterId: crId, lang: i18n.language }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, userData?.cashRegisterId, i18n.language]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const crId = userData?.cashRegisterId;
    if (uiState.showCashAmount && crId) {
      dispatch(fetchBalance(crId));
      timer = setTimeout(
        () => setUiState((p) => ({ ...p, showCashAmount: false })),
        10000,
      );
    }
    return () => clearTimeout(timer);
  }, [uiState.showCashAmount, userData?.cashRegisterId, dispatch]);

  useEffect(() => {
    if (operator.intake?.offerPrice && initialOfferPrice === null)
      setInitialOfferPrice(operator.intake.offerPrice);
    if (!operator.intake) setInitialOfferPrice(null);
  }, [operator.intake, initialOfferPrice]);

  useEffect(() => {
    const errors = [
      {
        msg: metalRates.error,
        clear: () => dispatch({ type: "metalRates/clearError" }),
      },
      { msg: operator.error, clear: () => dispatch(clearIntakeState()) },
      { msg: languagesState.error, clear: () => {} },
      { msg: cashRegisters.error, clear: () => {} },
      { msg: cashSessions.error, clear: () => {} },
      { msg: ironCarShop.error, clear: () => {} },
    ];
    errors.forEach(({ msg }) => {
      if (msg) {
        toast.error(msg, { toastId: msg });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    metalRates.error,
    operator.error,
    languagesState.error,
    cashRegisters.error,
    cashSessions.error,
    ironCarShop.error,
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
            shopId: userData?.shopId,
            customer: formData.customer,
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
    } finally {
      setUiState((p) => ({ ...p, isSubmitting: false }));
    }
  };

  const handleBulkPurchase = async () => {
    const customer = operator.intake?.customer || customers.items[0];
    if (!customer || ironCarShop.ironPrices.length === 0) return;
    try {
      const crId = userData?.cashRegisterId;
      await dispatch(
        submitBulkPurchase({
          payload: {
            customerId: customer.id,
            customerTypeId: customer.customerTypeId,
            items: ironCarShop.ironPrices.map((item) => ({
              ironTypeId: item.ironTypeId,
              weightKg: item.weightKg,
            })),
          },
          cashRegisterId: crId,
          lang: i18n.language,
        }),
      ).unwrap();
      toast.success(t("operatorPage.success.purchaseCompleted"));
      dispatch(fetchBalance(crId));
      handleResetForm();
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmReject = async () => {
    if (activeTab === "catalyst" && operator.intake?.id) {
      try {
        await dispatch(
          rejectIntake({
            intakeId: operator.intake.id,
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
          dispatch(fetchBalance(crId));
        } else if (cashSessions.sessionDetails?.sessionId) {
          await dispatch(
            closeSession({
              sessionId: cashSessions.sessionDetails.sessionId,
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
    [dispatch, cashSessions.sessionDetails, userData?.cashRegisterId, t],
  );

  const handleConfirmTopUp = async () => {
    if (!userData?.cashRegisterId) return;
    try {
      await dispatch(confirmTransaction(userData.cashRegisterId)).unwrap();
      toast.success(t("operatorPage.success.transactionConfirmed"));
      dispatch(clearPendingData());
      dispatch(fetchBalance(userData.cashRegisterId));
      dispatch(fetchPendingTransaction(userData.cashRegisterId));
    } catch (e) {
      console.error(e);
    }
  };

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
    usdAmdRate,
    selectors: {
      metalRates,
      operator,
      languagesState,
      cashRegisters,
      cashSessions,
      offerOptions,
      exchangeRates,
      customers,
      ironCarShop,
    },
    actions: {
      handleResetForm,
      handleSubmit,
      handleBulkPurchase,
      handleConfirmReject,
      handleToggleSession,
      handleConfirmTopUp,
    },
  };
};
