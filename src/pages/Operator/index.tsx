import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toast } from "react-toastify";
import i18n from "i18next";

// icons
import { LogOut, Banknote, Eye, EyeOff } from "lucide-react";

// store
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

// stores
import {
  fetchBalance,
  openSession,
  resetRegistersState,
  clearError as clearCashError,
} from "@/store/slices/cash/registersSlice";
import {
  fetchRegisterSession,
  resetSessionState,
  clearError as clearSessionError,
} from "@/store/slices/cash/sessionsSlice";
import { closeSession } from "@/store/slices/cash/cashboxSessionsSlice";

// ui-kit
import { Button, Select, TextField, ConfirmationModal } from "@/ui-kit";

// components
import { FinalOffer } from "./components/FinalOffer";
import { PricingBreakdown } from "./components/PricingBreakdown";
import { CustomerDetails } from "./components/CustomerDetails";
import { PowderExtraction } from "./components/PowderExtraction";
import { LiveMarketPrices } from "./components/LiveMarketPrices";

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

  // New Store Selectors
  const {
    activeBalance,
    error: cashError,
    isLoading: isBalanceLoading,
  } = useAppSelector((state) => state.cashRegisters);

  const {
    hasOpenSession,
    sessionDetails,
    error: sessionError,
  } = useAppSelector((state) => state.cashSessions);

  const languages = allLanguages.filter((lang) => lang.isEnabled);

  // Local State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userData, setUserData] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [showCashAmount, setShowCashAmount] = useState(false);
  const [isCloseSessionModalOpen, setIsCloseSessionModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    powderWeight: "0",
    platinumPrice: "0",
    palladiumPrice: "0",
    rhodiumPrice: "0",
    customerPhone: "",
  });

  const handleResetForm = useCallback(() => {
    setFormData({
      powderWeight: "0",
      platinumPrice: "0",
      palladiumPrice: "0",
      rhodiumPrice: "0",
      customerPhone: "",
    });
    setHasTriedSubmit(false);
    setShowCashAmount(false);
    dispatch(clearIntakeState());
  }, [dispatch]);

  // Global Error Watcher
  useEffect(() => {
    const errorConfigs = [
      { msg: metalRatesError, clear: clearMetalError },
      { msg: intakeError, clear: clearIntakeError },
      { msg: languagesError, clear: clearLangError },
      { msg: cashError, clear: clearCashError },
      { msg: sessionError, clear: clearSessionError },
    ];

    let toastFired = false;

    errorConfigs.forEach(({ msg, clear }) => {
      if (msg) {
        if (!toastFired) {
          toast.error(msg);
          toastFired = true;
        }
        dispatch(clear());
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metalRatesError, intakeError, languagesError, cashError, sessionError]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isNumberValid = (val: string) =>
    val.trim() !== "" && !isNaN(Number(val));
  const isPhoneValid = formData.customerPhone.trim().length > 0;

  const isFormValid =
    isNumberValid(formData.powderWeight) &&
    isNumberValid(formData.platinumPrice) &&
    isNumberValid(formData.palladiumPrice) &&
    isNumberValid(formData.rhodiumPrice) &&
    isPhoneValid;

  useEffect(() => {
    const localeStorageData = JSON.parse(
      localStorage.getItem("user_data") ?? "{}",
    );
    setUserData(localeStorageData);

    const crId = localeStorageData?.cashRegisterId;
    if (crId) {
      dispatch(
        fetchActiveMetalRate({ cashRegisterId: crId, currencyCode: "USD" }),
      );
      dispatch(fetchLanguages(crId));
      dispatch(fetchRegisterSession(crId));
    }
  }, [dispatch]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showCashAmount && userData?.cashRegisterId) {
      dispatch(fetchBalance(userData.cashRegisterId));
      timer = setTimeout(() => setShowCashAmount(false), 10000);
    }
    return () => clearTimeout(timer);
  }, [showCashAmount, dispatch, userData?.cashRegisterId]);

  const handleSubmit = async () => {
    setHasTriedSubmit(true);
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      const { cashRegisterId } = userData ?? {};

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
          cashRegisterId,
        }),
      ).unwrap();

      toast.success(t("operatorPage.success.intakeCreated"));
      dispatch(fetchIntake({ intakeId: response.id, cashRegisterId }));
      setHasTriedSubmit(false);
    } catch (error) {
      console.error("Submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearIntakeState());
    dispatch(resetRegistersState());
    dispatch(resetSessionState());
    navigate("/login", { replace: true });
  };

  const handleToggleSession = useCallback(
    async (actionType: "open" | "close") => {
      const cashRegisterId = userData?.cashRegisterId;
      if (!cashRegisterId) return;

      if (actionType === "open") {
        try {
          await dispatch(openSession(cashRegisterId)).unwrap();
          await dispatch(fetchRegisterSession(cashRegisterId));
          toast.success(t("operatorPage.success.sessionOpened"));
        } catch {
          // Error handled by global watcher
        }
      } else if (sessionDetails?.sessionId) {
        try {
          await dispatch(
            closeSession({
              sessionId: sessionDetails.sessionId,
              cashRegisterId,
            }),
          ).unwrap();

          dispatch(resetSessionState());
          toast.success(t("operatorPage.success.sessionClosed"));
          setIsCloseSessionModalOpen(false);
        } catch {
          // Error handled by global watcher
        }
      }
    },
    [dispatch, sessionDetails, userData?.cashRegisterId, t],
  );

  const handleLanguageChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const apiCode = event.target.value;
    const i18nCode = mapApiCodeToI18nCode(apiCode);
    i18n.changeLanguage(i18nCode);
    localStorage.setItem("i18nextLng", i18nCode);
  };

  const selectedApiCode =
    languages.find((lang) => mapApiCodeToI18nCode(lang.code) === i18n.language)
      ?.code ?? "";

  const displayBalance = isBalanceLoading
    ? t("cashRegisters.fetchingBalance", "Fetching...")
    : (activeBalance?.balance ?? 0).toString();

  return (
    <div className={styles.operatorPage}>
      <div className={styles.headerSection}>
        <h1 className={styles.pageTitle}>{t("operatorPage.title")}</h1>

        <div className={styles.headerActions}>
          <div className={styles.sessionGroup}>
            <Button
              onClick={() => handleToggleSession("open")}
              className={
                hasOpenSession
                  ? styles.sessionBtnActive
                  : styles.sessionBtnInactive
              }
              disabled={hasOpenSession}
            >
              {t("operatorPage.openSession")}
            </Button>

            <Button
              onClick={() => setIsCloseSessionModalOpen(true)}
              className={
                !hasOpenSession
                  ? styles.sessionBtnActiveClose
                  : styles.sessionBtnInactiveClose
              }
              disabled={!hasOpenSession}
            >
              {t("operatorPage.closeSession")}
            </Button>
          </div>

          <div className={styles.languageSelectWrapper}>
            <Select
              placeholder={t("common.select")}
              onChange={handleLanguageChange}
              value={selectedApiCode}
              disabled={isLangLoading || languages.length === 0}
              containerClassName={styles.languageSelectContainer}
            >
              {languages.map((lang) => (
                <option key={lang.id} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </Select>
          </div>

          <Button
            variant="secondary"
            size="medium"
            onClick={handleLogout}
            className={styles.logoutBtn}
          >
            <LogOut size={16} />
            {t("header.logout")}
          </Button>
        </div>
      </div>

      <div className={styles.topRow}>
        <div className={styles.leftColumn}>
          <PowderExtraction
            weight={formData.powderWeight}
            onWeightChange={(val) => handleInputChange("powderWeight", val)}
            error={hasTriedSubmit && !isNumberValid(formData.powderWeight)}
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
            onPriceChange={handleInputChange}
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
            hasTriedSubmit={hasTriedSubmit}
          />

          <FinalOffer
            offerPrice={intake ? intake.offerPrice : 0}
            currencyCode={intake?.currencyCode}
            userData={userData}
            onReset={handleResetForm}
          />
        </div>

        <div className={styles.rightColumn}>
          <CustomerDetails
            customerPhone={formData.customerPhone}
            onPhoneChange={(val) => handleInputChange("customerPhone", val)}
            phoneError={hasTriedSubmit && !isPhoneValid}
            onSuccess={handleResetForm}
          />

          <div className={styles.cashRegisterContainer}>
            <div className={styles.fieldWithLeftIcon}>
              <div className={styles.leftIcon}>
                <Banknote size={20} />
              </div>
              <TextField
                label={t("operatorPage.cashAmount")}
                type={showCashAmount ? "text" : "password"}
                name="cash-amount-display"
                autoComplete="new-password"
                placeholder={t("operatorPage.cashAmountPlaceholder")}
                value={cashError ? t("common.error") : displayBalance}
                className={styles.textField}
                error={!!cashError}
                style={{ paddingLeft: "44px" }}
                readOnly
                icon={
                  <button
                    type="button"
                    onClick={() => setShowCashAmount(!showCashAmount)}
                    className={styles.passwordToggle}
                  >
                    {showCashAmount ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                }
              />
            </div>
          </div>
        </div>
      </div>

      {isCloseSessionModalOpen && (
        <ConfirmationModal
          open={isCloseSessionModalOpen}
          onOpenChange={setIsCloseSessionModalOpen}
          title={t("operatorPage.closeSession")}
          description={t("common.areYouSure")}
          confirmText={t("common.yes")}
          cancelText={t("common.cancel")}
          onConfirm={() => handleToggleSession("close")}
          onCancel={() => setIsCloseSessionModalOpen(false)}
        />
      )}
    </div>
  );
};
