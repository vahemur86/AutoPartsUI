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

export const OperatorPage = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { metalRates } = useAppSelector((state) => state.metalRates);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLangLoading, setIsLangLoading] = useState(false);

  const metalRate = useMemo(
    () => metalRates.find((rate) => rate.isActive),
    [metalRates]
  );

  useEffect(() => {
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
        // Silent fail for operator UI; settings page handles language management errors
        console.error("Failed to load languages for operator:", error);
      } finally {
        setIsLangLoading(false);
      }
    };

    loadLanguages();
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
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
        <h1 className={styles.pageTitle}>
          {t("operatorPage.title")}
        </h1>

         <select
          className={styles.languageSelect}
          onChange={handleLanguageChange}
          value={
            languages.find(
              (lang) => mapApiCodeToI18nCode(lang.code) === i18n.language
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
          <PowderExtraction />
          <LiveMarketPrices
            ptPricePerGram={metalRate?.ptPricePerGram}
            pdPricePerGram={metalRate?.pdPricePerGram}
            rhPricePerGram={metalRate?.rhPricePerGram}
            currencyCode={metalRate?.currencyCode}
            updatedAt={metalRate?.effectiveFrom}
          />
        </div>

        <div className={styles.centerColumn}>
          <PricingBreakdown />
          <FinalOffer />
        </div>

        <div className={styles.rightColumn}>
          <CustomerDetails onCloseSession={handleLogout} />
        </div>
      </div>
    </div>
  );
};
