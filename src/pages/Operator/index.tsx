import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toast } from "react-toastify";
import i18n from "i18next";

// stores
import { logout } from "@/store/slices/authSlice";
import {
  fetchActiveMetalRate,
  clearError as clearMetalError,
} from "@/store/slices/metalRatesSlice";
import {
  fetchIntake,
  clearError as clearIntakeError,
  clearIntakeState,
  addIntake,
} from "@/store/slices/operatorSlice";
import {
  fetchLanguages,
  clearError as clearLangError,
} from "@/store/slices/languagesSlice";
import {
  fetchBalance,
  openSession,
  clearError as clearCashError,
} from "@/store/slices/cash/registersSlice";
import {
  fetchRegisterSession,
  resetSessionState,
  clearError as clearSessionError,
} from "@/store/slices/cash/sessionsSlice";
import { closeSession } from "@/store/slices/cash/cashboxSessionsSlice";
import { fetchOfferOptions } from "@/store/slices/offerOptionsSlice";
import {
  fetchExchangeRates,
  clearExchangeRatesState,
} from "@/store/slices/exchangeRatesSlice";
import { clearCustomersState } from "@/store/slices/customersSlice";
import {
  fetchIronDropdown,
  addIronEntry,
  clearAdminError,
} from "@/store/slices/adminProductsSlice";

// ui-kit
import { ConfirmationModal, TextField, Select, Button } from "@/ui-kit";

// components
import {
  FinalOffer,
  PricingBreakdown,
  CustomerDetails,
  PowderExtraction,
  LiveMarketPrices,
  OperatorHeader,
  CashRegisterField,
} from "./components";

// utils
import { mapApiCodeToI18nCode } from "@/utils/languageMapping";

// styles
import styles from "./OperatorPage.module.css";

export const OperatorPage = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Redux Selectors
  const { activeMetalRate, error: metalRatesError } = useAppSelector(
    (state) => state.metalRates,
  );
  const { intake, error: intakeError } = useAppSelector(
    (state) => state.operator,
  );
  const {
    languages: allLanguages,
    error: languagesError,
    isLoading: isLangLoading,
  } = useAppSelector((state) => state.languages);
  const {
    activeBalance,
    error: cashError,
    isBalanceLoading,
  } = useAppSelector((state) => state.cashRegisters);
  const {
    hasOpenSession,
    sessionDetails,
    error: sessionError,
  } = useAppSelector((state) => state.cashSessions);
  const { options: offerOptions } = useAppSelector(
    (state) => state.offerOptions,
  );
  const { exchangeRates } = useAppSelector((state) => state.exchangeRates);
  const { items: searchedCustomers } = useAppSelector(
    (state) => state.customers,
  );

  const {
    dropdownItems: ironOptions,
    isLoading: isIronLoading,
    isSubmitting: isIronSubmitting,
    error: adminError,
  } = useAppSelector((state) => state.adminProducts);

  const languages = allLanguages.filter((lang) => lang.isEnabled);

  const [userData] = useState(() =>
    JSON.parse(localStorage.getItem("user_data") ?? "null"),
  );

  const [uiState, setUiState] = useState({
    isSubmitting: false,
    hasTriedSubmit: false,
    showCashAmount: false,
    isCloseSessionModalOpen: false,
  });

  const [recalculationsAmount, setRecalculationsAmount] = useState(0);
  const [initialOfferPrice, setInitialOfferPrice] = useState<number | null>(
    null,
  );

  const [formData, setFormData] = useState({
    powderWeight: "0",
    platinumPrice: "0",
    palladiumPrice: "0",
    rhodiumPrice: "0",
    customer: {
      phone: "",
      fullName: "",
      gender: 0,
      notes: "",
    },
  });

  const [ironFormData, setIronFormData] = useState({
    productId: "" as string | number,
    weight: "0",
  });

  useEffect(() => {
    const searchedCustomerType = searchedCustomers[0]?.customerType?.code;
    const linkedCustomerType = intake?.customer?.customerType?.code;

    const currentType = (
      linkedCustomerType || searchedCustomerType
    )?.toLowerCase();

    const crId = userData?.cashRegisterId;

    if (crId && currentType && currentType !== "standard") {
      dispatch(
        fetchExchangeRates({
          isActive: true,
          cashRegisterId: crId,
        }),
      );
    } else {
      dispatch(clearExchangeRatesState());
    }
  }, [
    dispatch,
    intake?.customer?.customerType?.code,
    searchedCustomers,
    userData?.cashRegisterId,
  ]);

  const usdAmdRate = useMemo(() => {
    return exchangeRates.find(
      (r) => r.baseCurrencyCode === "USD" && r.quoteCurrencyCode === "AMD",
    )?.rate;
  }, [exchangeRates]);

  useEffect(() => {
    if (intake?.offerPrice && initialOfferPrice === null)
      setInitialOfferPrice(intake.offerPrice);
    if (!intake) setInitialOfferPrice(null);
  }, [intake, initialOfferPrice]);

  useEffect(() => {
    const errors = [
      { msg: metalRatesError, clear: clearMetalError },
      { msg: intakeError, clear: clearIntakeError },
      { msg: languagesError, clear: clearLangError },
      { msg: cashError, clear: clearCashError },
      { msg: sessionError, clear: clearSessionError },
      { msg: adminError, clear: clearAdminError },
    ];

    errors.forEach(({ msg, clear }) => {
      if (msg) {
        toast.error(msg, { toastId: msg });
        dispatch(clear());
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    metalRatesError,
    intakeError,
    languagesError,
    cashError,
    sessionError,
    adminError,
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
    const crId = userData?.cashRegisterId;
    if (crId) {
      const currentLng = i18n.language;

      dispatch(
        fetchIronDropdown({
          cashRegisterId: crId,
          lang: currentLng,
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, userData?.cashRegisterId, i18n.language]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (uiState.showCashAmount && userData?.cashRegisterId) {
      dispatch(fetchBalance(userData.cashRegisterId));
      timer = setTimeout(
        () => setUiState((p) => ({ ...p, showCashAmount: false })),
        10000,
      );
    }
    return () => clearTimeout(timer);
  }, [uiState.showCashAmount, dispatch, userData?.cashRegisterId]);

  const handleResetForm = useCallback(() => {
    setFormData({
      powderWeight: "0",
      platinumPrice: "0",
      palladiumPrice: "0",
      rhodiumPrice: "0",
      customer: { phone: "", fullName: "", gender: 0, notes: "" },
    });
    setUiState((p) => ({ ...p, hasTriedSubmit: false, showCashAmount: false }));
    setInitialOfferPrice(null);
    setRecalculationsAmount(0);

    dispatch(clearIntakeState());
    dispatch(clearCustomersState());
    dispatch(clearExchangeRatesState());
  }, [dispatch]);

  const handleSubmit = async () => {
    setUiState((p) => ({ ...p, hasTriedSubmit: true }));

    const isValid =
      !isNaN(Number(formData.powderWeight)) &&
      formData.customer.phone.length > 3 &&
      !isNaN(Number(formData.platinumPrice)) &&
      !isNaN(Number(formData.palladiumPrice)) &&
      !isNaN(Number(formData.rhodiumPrice));

    if (!isValid) return;

    setUiState((p) => ({ ...p, isSubmitting: true }));
    try {
      const crId = userData?.cashRegisterId;

      const response = await dispatch(
        addIntake({
          intake: {
            shopId: userData?.shopId,
            customer: {
              phone: formData.customer.phone,
              fullName: formData.customer.fullName,
              gender: formData.customer.gender,
              notes: formData.customer.notes,
            },
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

  const handleBuyIron = async () => {
    const crId = userData?.cashRegisterId;
    if (!crId || !ironFormData.productId || Number(ironFormData.weight) <= 0) {
      return;
    }

    try {
      const finalForm = {
        productId: Number(ironFormData.productId),
        weight: Number(ironFormData.weight),
      };

      await dispatch(
        addIronEntry({
          payload: finalForm,
          cashRegisterId: crId,
        }),
      ).unwrap();

      toast.success(t("operatorPage.success.ironSold"));
      setIronFormData({ productId: "", weight: "0" });
    } catch (e) {
      console.error("Iron buy failed", e);
    }
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
        } else if (sessionDetails?.sessionId) {
          await dispatch(
            closeSession({
              sessionId: sessionDetails.sessionId,
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
    [dispatch, sessionDetails, userData?.cashRegisterId, t],
  );

  const displayBalance = isBalanceLoading
    ? t("cashRegisters.fetchingBalance")
    : uiState.showCashAmount
      ? activeBalance?.balance.toString()
      : "••••••••";

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    if (val !== "" && !/^\d*\.?\d{0,4}$/.test(val)) {
      return;
    }

    if (val.length > 1 && val.startsWith("0") && val[1] !== ".") {
      val = val.replace(/^0+/, "");
      if (val === "") val = "0";
    }

    if (val === ".") {
      val = "0.";
    }

    setIronFormData((p) => ({ ...p, weight: val }));
  };

  return (
    <div className={styles.operatorPage}>
      <OperatorHeader
        hasOpenSession={hasOpenSession}
        onToggleSession={handleToggleSession}
        onOpenCloseModal={() =>
          setUiState((p) => ({ ...p, isCloseSessionModalOpen: true }))
        }
        languages={languages}
        selectedApiCode={
          languages.find((l) => mapApiCodeToI18nCode(l.code) === i18n.language)
            ?.code ?? ""
        }
        onLanguageChange={(e) => {
          const code = mapApiCodeToI18nCode(e.target.value);
          i18n.changeLanguage(code);
          localStorage.setItem("i18nextLng", code);
        }}
        onLogout={() => {
          dispatch(logout());
          navigate("/login");
        }}
        isLangLoading={isLangLoading}
      />

      <div className={styles.topRow}>
        <div className={styles.leftColumn}>
          <PowderExtraction
            weight={formData.powderWeight}
            onWeightChange={(v) =>
              setFormData((p) => ({ ...p, powderWeight: v }))
            }
            error={
              uiState.hasTriedSubmit && isNaN(Number(formData.powderWeight))
            }
          />
          <LiveMarketPrices
            ptPricePerGram={activeMetalRate?.ptPricePerGram}
            pdPricePerGram={activeMetalRate?.pdPricePerGram}
            rhPricePerGram={activeMetalRate?.rhPricePerGram}
            currencyCode={activeMetalRate?.currencyCode}
            updatedAt={activeMetalRate?.effectiveFrom}
            usdAmdRate={usdAmdRate}
          />
        </div>

        <div className={styles.centerColumn}>
          <PricingBreakdown
            formData={formData}
            onPriceChange={(f, v) => setFormData((p) => ({ ...p, [f]: v }))}
            onSubmit={handleSubmit}
            isLoading={uiState.isSubmitting}
            hasTriedSubmit={uiState.hasTriedSubmit}
          />
          <FinalOffer
            offerPrice={initialOfferPrice ?? intake?.offerPrice ?? 0}
            currencyCode={intake?.currencyCode}
            userData={userData}
            isRecalculationsLimitReached={
              recalculationsAmount >= offerOptions.length
            }
            onReset={handleResetForm}
            setRecalculationsAmount={setRecalculationsAmount}
          />
        </div>

        <div className={styles.rightColumn}>
          <CustomerDetails
            customerData={formData.customer}
            onCustomerChange={(customer) =>
              setFormData((prev) => ({ ...prev, customer }))
            }
            phoneError={uiState.hasTriedSubmit && !formData.customer.phone}
            onSuccess={handleResetForm}
          />

          <div className={styles.customerCard}>
            <div className={styles.customerHeader}>
              <h3 className={styles.cardTitle}>{t("operatorPage.buyIron")}</h3>
            </div>
            <div className={styles.customerContent}>
              <Select
                searchable
                label={t("operatorPage.ironType")}
                value={ironFormData.productId}
                onChange={(e) =>
                  setIronFormData((p) => ({ ...p, productId: e.target.value }))
                }
                disabled={isIronLoading || isIronSubmitting}
              >
                <option value="" disabled>
                  {t("common.select")}
                </option>
                {ironOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.displayName}
                  </option>
                ))}
              </Select>

              <TextField
                label={t("operatorPage.weightKg")}
                type="text"
                inputMode="decimal"
                value={ironFormData.weight}
                onChange={handleWeightChange}
                disabled={isIronSubmitting}
              />

              <Button
                onClick={handleBuyIron}
                disabled={
                  !ironFormData.productId || Number(ironFormData.weight) <= 0
                }
                fullWidth
              >
                {t("common.buy")}
              </Button>
            </div>
          </div>

          <CashRegisterField
            displayBalance={displayBalance || ""}
            showCashAmount={uiState.showCashAmount}
            onToggleVisibility={() =>
              setUiState((p) => ({ ...p, showCashAmount: !p.showCashAmount }))
            }
            hasError={!!cashError}
          />
        </div>
      </div>

      {uiState.isCloseSessionModalOpen && (
        <ConfirmationModal
          open={uiState.isCloseSessionModalOpen}
          onOpenChange={(v) =>
            setUiState((p) => ({ ...p, isCloseSessionModalOpen: v }))
          }
          title={t("operatorPage.closeSession")}
          description={t("common.areYouSure")}
          onConfirm={() => handleToggleSession("close")}
          onCancel={() =>
            setUiState((p) => ({ ...p, isCloseSessionModalOpen: false }))
          }
        />
      )}
    </div>
  );
};
