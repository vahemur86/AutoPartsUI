import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import i18n from "i18next";

import { logout } from "@/store/slices/authSlice";

// Components
import { FinalOffer } from "./components/FinalOffer";
import { PricingBreakdown } from "./components/PricingBreakdown";
import { CustomerDetails } from "./components/CustomerDetails";
import { PowderExtraction } from "./components/PowderExtraction";
import { LiveMarketPrices } from "./components/LiveMarketPrices";

// styles
import styles from "./OperatorPage.module.css";

// stores
import { fetchMetalRates } from "@/store/slices/metalRatesSlice";
import { fetchIntake } from "@/store/slices/operatorSlice";

// services & types
import { getLanguages } from "@/services/settings/languages";
import type { Language } from "@/types/settings";
import { mapApiCodeToI18nCode } from "@/utils/languageMapping";
import { createIntake } from "@/services/operator";

export const OperatorPage = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { metalRates } = useAppSelector((state) => state.metalRates);
  const { intake } = useAppSelector((state) => state.operator);

  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLangLoading, setIsLangLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userData, setUserData] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  // Shared Form State
  const [formData, setFormData] = useState({
    powderWeight: "",
    platinumPrice: "",
    palladiumPrice: "",
    rhodiumPrice: "",
    customerPhone: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Validation Logic
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
    dispatch(fetchMetalRates());
  }, [dispatch]);

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        setIsLangLoading(true);
        const data = await getLanguages();
        const enabled = (data as Language[]).filter((lang) => lang.isEnabled);
        setLanguages(enabled);
      } catch (error) {
        console.error("Failed to load languages:", error);
      } finally {
        setIsLangLoading(false);
      }
    };
    loadLanguages();
  }, []);

  const handleSubmit = async () => {
    setHasTriedSubmit(true);
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      await createIntake({
        currencyCode: "AMD",
        ptWeight: Number(formData.platinumPrice),
        pdWeight: Number(formData.palladiumPrice),
        rhWeight: Number(formData.rhodiumPrice),
        powderWeightTotal: Number(formData.powderWeight),
        customerPhone: formData.customerPhone,
        shopId: userData.shopId,
      });
      dispatch(fetchIntake(userData.shopId));
      setHasTriedSubmit(false);
    } catch (error) {
      console.error("Failed to submit intake:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const handleLanguageChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const apiCode = event.target.value;
    const i18nCode = mapApiCodeToI18nCode(apiCode);
    i18n.changeLanguage(i18nCode);
    localStorage.setItem("i18nextLng", i18nCode);
  };

  return (
    <div className={styles.operatorPage}>
      <div className={styles.headerSection}>
        <h1 className={styles.pageTitle}>{t("operatorPage.title")}</h1>
        <div style={{ display: "flex", gap: "12px" }}>
          <select
            className={styles.languageSelect}
            onChange={handleLanguageChange}
            value={
              languages.find(
                (lang) => mapApiCodeToI18nCode(lang.code) === i18n.language,
              )?.code ?? ""
            }
            disabled={isLangLoading || languages.length === 0}
          >
            {languages.map((lang) => (
              <option key={lang.id} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
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

          <FinalOffer offerPrice={intake ? intake.offerPrice : 0} />
        </div>

        <div className={styles.rightColumn}>
          <CustomerDetails
            customerPhone={formData.customerPhone}
            onPhoneChange={(val) => handleInputChange("customerPhone", val)}
            onCloseSession={handleLogout}
            phoneError={hasTriedSubmit && !isPhoneValid}
          />
        </div>
      </div>
    </div>
  );
};
