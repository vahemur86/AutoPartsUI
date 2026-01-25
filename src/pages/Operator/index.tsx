import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import i18n from "i18next";

// icons
import { LogOut } from "lucide-react";

// store
import { logout } from "@/store/slices/authSlice";
import { fetchMetalRates } from "@/store/slices/metalRatesSlice";
import { fetchIntake } from "@/store/slices/operatorSlice";
import { fetchLanguages } from "@/store/slices/languagesSlice";

// ui-kit
import { Button, Select } from "@/ui-kit";

// Components
import { FinalOffer } from "./components/FinalOffer";
import { PricingBreakdown } from "./components/PricingBreakdown";
import { CustomerDetails } from "./components/CustomerDetails";
import { PowderExtraction } from "./components/PowderExtraction";
import { LiveMarketPrices } from "./components/LiveMarketPrices";

// styles
import styles from "./OperatorPage.module.css";

// services & types
import { mapApiCodeToI18nCode } from "@/utils/languageMapping";
import { createIntake } from "@/services/operator";

export const OperatorPage = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { metalRates } = useAppSelector((state) => state.metalRates);
  const { intake } = useAppSelector((state) => state.operator);
  const { languages: allLanguages, isLoading: isLangLoading } = useAppSelector(
    (state) => state.languages,
  );

  const languages = allLanguages.filter((lang) => lang.isEnabled);

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
    dispatch(fetchLanguages());
  }, [dispatch]);

  const handleSubmit = async () => {
    setHasTriedSubmit(true);
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      const response = await createIntake({
        currencyCode: "USD",
        ptWeight: Number(formData.platinumPrice),
        pdWeight: Number(formData.palladiumPrice),
        rhWeight: Number(formData.rhodiumPrice),
        powderWeightTotal: Number(formData.powderWeight),
        customerPhone: formData.customerPhone,
        shopId: userData.shopId,
      });
      dispatch(fetchIntake(response.id));
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

  const selectedApiCode =
    languages.find((lang) => mapApiCodeToI18nCode(lang.code) === i18n.language)
      ?.code ?? "";

  return (
    <div className={styles.operatorPage}>
      <div className={styles.headerSection}>
        <h1 className={styles.pageTitle}>{t("operatorPage.title")}</h1>

        <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
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

          <FinalOffer offerPrice={intake ? intake.offerPrice : 0} />
        </div>

        <div className={styles.rightColumn}>
          <CustomerDetails
            customerPhone={formData.customerPhone}
            onPhoneChange={(val) => handleInputChange("customerPhone", val)}
            phoneError={hasTriedSubmit && !isPhoneValid}
          />
        </div>
      </div>
    </div>
  );
};
