import { useCallback, useEffect, useState } from "react";
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

// ui-kit
import { ConfirmationModal } from "@/ui-kit";

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
    customerPhone: "",
  });

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
    ];
    errors.forEach(({ msg, clear }) => {
      if (msg) {
        toast.error(msg);
        dispatch(clear());
      }
    });
  }, [
    metalRatesError,
    intakeError,
    languagesError,
    cashError,
    sessionError,
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
      customerPhone: "",
    });
    setUiState((p) => ({ ...p, hasTriedSubmit: false, showCashAmount: false }));
    setInitialOfferPrice(null);
    setRecalculationsAmount(0);
    dispatch(clearIntakeState());
  }, [dispatch]);

  const handleSubmit = async () => {
    setUiState((p) => ({ ...p, hasTriedSubmit: true }));
    const isValid =
      !isNaN(Number(formData.powderWeight)) && formData.customerPhone.trim();
    if (!isValid) return;

    setUiState((p) => ({ ...p, isSubmitting: true }));
    try {
      const crId = userData?.cashRegisterId;
      const response = await dispatch(
        addIntake({
          intake: {
            currencyCode: "USD",
            ptWeight: Number(formData.platinumPrice),
            pdWeight: Number(formData.palladiumPrice),
            rhWeight: Number(formData.rhodiumPrice),
            powderWeightTotal: Number(formData.powderWeight),
            customerPhone: formData.customerPhone,
            shopId: userData?.shopId,
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

  const handleToggleSession = useCallback(
    async (action: "open" | "close") => {
      const crId = userData?.cashRegisterId;
      if (!crId) return;

      if (action === "open") {
        await dispatch(openSession(crId)).unwrap();
        dispatch(fetchRegisterSession(crId));
      } else if (sessionDetails?.sessionId) {
        await dispatch(
          closeSession({
            sessionId: sessionDetails.sessionId,
            cashRegisterId: crId,
          }),
        ).unwrap();
        dispatch(resetSessionState());
        setUiState((p) => ({ ...p, isCloseSessionModalOpen: false }));
      }
    },
    [dispatch, sessionDetails, userData?.cashRegisterId],
  );

  const displayBalance = isBalanceLoading
    ? t("cashRegisters.fetchingBalance")
    : uiState.showCashAmount
      ? activeBalance?.balance.toString()
      : "••••••••";

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
            customerPhone={formData.customerPhone}
            onPhoneChange={(v) =>
              setFormData((p) => ({ ...p, customerPhone: v }))
            }
            phoneError={uiState.hasTriedSubmit && !formData.customerPhone}
            onSuccess={handleResetForm}
          />
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
