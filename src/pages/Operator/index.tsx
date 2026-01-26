import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toast } from "react-toastify";
import i18n from "i18next";

// icons
import { LogOut, Banknote, Eye, EyeOff } from "lucide-react";

// services
import { createIntake } from "@/services/operator";

// store
import { logout } from "@/store/slices/authSlice";
import {
  fetchMetalRates,
  clearError as clearMetalError,
} from "@/store/slices/metalRatesSlice";
import {
  fetchIntake,
  clearError as clearIntakeError,
  clearIntakeState,
} from "@/store/slices/operatorSlice";
import {
  fetchLanguages,
  clearError as clearLangError,
} from "@/store/slices/languagesSlice";
import {
  fetchCashRegisterBalance,
  clearError as clearCashError,
  openSession,
  closeSession,
} from "@/store/slices/cashRegistersSlice";

// ui-kit
import { Button, Select, TextField } from "@/ui-kit";

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
  const { metalRates, error: metalRatesError } = useAppSelector(
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
    cashRegisterBalance,
    sessionId,
    error: cashRegistersError,
    isLoading: isBalanceLoading,
  } = useAppSelector((state) => state.cashRegisters);

  const languages = allLanguages.filter((lang) => lang.isEnabled);

  // Local State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userData, setUserData] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [showCashAmount, setShowCashAmount] = useState(false);

  const isSessionOpen = !!sessionId;

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
    const errors = [
      { msg: metalRatesError, clear: clearMetalError },
      { msg: intakeError, clear: clearIntakeError },
      { msg: languagesError, clear: clearLangError },
      { msg: cashRegistersError, clear: clearCashError },
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
    cashRegistersError,
    dispatch,
  ]);

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

  const metalRate = useMemo(
    () => metalRates.find((rate) => rate.isActive),
    [metalRates],
  );

  useEffect(() => {
    const localeStorageData = JSON.parse(
      localStorage.getItem("user_data") ?? "{}",
    );
    setUserData(localeStorageData);

    if (localeStorageData?.cashRegisterId) {
      dispatch(fetchMetalRates(localeStorageData.cashRegisterId));
      dispatch(fetchLanguages(localeStorageData.cashRegisterId));
    }
  }, [dispatch]);

  // AUTO-HIDE CASH AMOUNT AFTER 10 SECONDS
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (showCashAmount) {
      // Fetch balance when shown
      if (userData?.cashRegisterId) {
        dispatch(fetchCashRegisterBalance(userData.cashRegisterId));
      }

      // Set the 10-second auto-hide timer
      timer = setTimeout(() => {
        setShowCashAmount(false);
      }, 10000);
    }

    // Cleanup timer if the user manually closes it or unmounts
    return () => clearTimeout(timer);
  }, [showCashAmount, dispatch, userData?.cashRegisterId]);

  const handleSubmit = async () => {
    setHasTriedSubmit(true);
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      const { shopId, cashRegisterId } = userData ?? {};
      const response = await createIntake({
        intake: {
          currencyCode: "USD",
          ptWeight: Number(formData.platinumPrice),
          pdWeight: Number(formData.palladiumPrice),
          rhWeight: Number(formData.rhodiumPrice),
          powderWeightTotal: Number(formData.powderWeight),
          customerPhone: formData.customerPhone,
          shopId,
        },
        cashRegisterId,
      });

      dispatch(
        fetchIntake({
          intakeId: response.id,
          cashRegisterId,
        }),
      );
      setHasTriedSubmit(false);
    } catch (error) {
      console.error("Failed to submit intake:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearIntakeState());
    navigate("/login", { replace: true });
  };

  const handleToggleSession = useCallback(
    (actionType: "open" | "close") => {
      const cashRegisterId = userData?.cashRegisterId;
      if (!cashRegisterId) return;

      if (actionType === "open") {
        dispatch(openSession(cashRegisterId));
      } else if (sessionId) {
        dispatch(closeSession({ sessionId, cashRegisterId }));
      }
    },
    [dispatch, sessionId, userData?.cashRegisterId],
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
    : (cashRegisterBalance?.balance ?? 0).toString();

  return (
    <div className={styles.operatorPage}>
      <div className={styles.headerSection}>
        <h1 className={styles.pageTitle}>{t("operatorPage.title")}</h1>

        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <Button
              onClick={() => handleToggleSession("open")}
              style={{
                backgroundColor: isSessionOpen ? "#22c55e" : "transparent",
                color: isSessionOpen ? "white" : "#22c55e",
                border: "1px solid #22c55e",
              }}
              disabled={isSessionOpen}
            >
              {t("operatorPage.openSession", "Open Session")}
            </Button>

            <Button
              onClick={() => handleToggleSession("close")}
              style={{
                backgroundColor: !isSessionOpen ? "#ef4444" : "transparent",
                color: !isSessionOpen ? "white" : "#ef4444",
                border: "1px solid #ef4444",
              }}
              disabled={!isSessionOpen}
            >
              {t("operatorPage.closeSession", "Close Session")}
            </Button>
          </div>

          <div style={{ width: "160px" }}>
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

          <Button variant="danger" size="medium" onClick={handleLogout}>
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
            ptPricePerGram={metalRate?.ptPricePerGram}
            pdPricePerGram={metalRate?.pdPricePerGram}
            rhPricePerGram={metalRate?.rhPricePerGram}
            currencyCode={metalRate?.currencyCode}
            updatedAt={metalRate?.effectiveFrom}
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
                label={t("operatorPage.cashAmount", "Cash in Cash Register")}
                type={showCashAmount ? "text" : "password"}
                placeholder={t(
                  "operatorPage.cashAmountPlaceholder",
                  "Enter current cash amount",
                )}
                value={displayBalance}
                className={styles.textField}
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
    </div>
  );
};
