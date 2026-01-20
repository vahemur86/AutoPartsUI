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

// services & types
import { getLanguages } from "@/services/settings/languages";
import type { Language } from "@/types/settings";
import { mapApiCodeToI18nCode } from "@/utils/languageMapping";
import { fetchIntake } from "@/store/slices/operatorSlice";
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
  const [data, setData] = useState<any | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const metalRate = useMemo(
    () => metalRates.find((rate) => rate.isActive),
    [metalRates],
  );

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

  useEffect(() => {
    const localeStorageData = JSON.parse(
      localStorage.getItem("user_data") ?? "{}",
    );
    setData(localeStorageData);
    dispatch(fetchMetalRates());
    dispatch(fetchIntake(localeStorageData.shopId));
  }, [dispatch]);

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        setIsLangLoading(true);
        const data = await getLanguages();
        const enabled = (data as Language[]).filter((lang) => lang.isEnabled);
        setLanguages(enabled);
      } catch (error) {
        // Silent fail for operator UI; settings page handles language management errors
        console.error("Failed to load languages for operator:", error);
      } finally {
        setIsLangLoading(false);
      }
    };

    loadLanguages();
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      dispatch(
        await createIntake({
          currencyCode: "AMD",
          ptWeight: Number(formData.platinumPrice),
          pdWeight: Number(formData.palladiumPrice),
          rhWeight: Number(formData.rhodiumPrice),
          powderWeightTotal: Number(formData.powderWeight),
          customerPhone: formData.customerPhone,
          shopId: data.shopId,
        }),
      ).unwrap();
    } catch (error) {
      console.error("Failed to submit:", error);
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

    if (!i18n.hasResourceBundle(i18nCode, "translation")) {
      return;
    }

    i18n.changeLanguage(i18nCode);
    localStorage.setItem("i18nextLng", i18nCode);
  };

  return (
    <div className={styles.operatorPage}>
      <div className={styles.headerSection}>
        <h1 className={styles.pageTitle}>{t("operatorPage.title")}</h1>

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
          {languages.length === 0 && (
            <option value="">{t("operatorPage.languageLoading")}</option>
          )}
          {languages.map((lang) => (
            <option key={lang.id} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.topRow}>
        <div className={styles.leftColumn}>
          <PowderExtraction
            weight={formData.powderWeight}
            onWeightChange={(val) => handleInputChange("powderWeight", val)}
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
          />
          <FinalOffer offerPrice={intake?.offerPrice ?? 0} />
        </div>

        <div className={styles.rightColumn}>
          <CustomerDetails
            customerPhone={formData.customerPhone}
            onPhoneChange={(val) => handleInputChange("customerPhone", val)}
            onCloseSession={handleLogout}
          />
        </div>
      </div>
    </div>
  );
};
