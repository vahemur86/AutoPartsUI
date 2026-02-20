import { useTranslation } from "react-i18next";
import { TextField, Button } from "@/ui-kit";
import { Send } from "lucide-react";

import styles from "./PricingBreakdown.module.css";
import sharedStyles from "../../OperatorPage.module.css";

interface PricingRowProps {
  weightLabel: string;
  priceValue: string;
  onPriceChange: (val: string) => void;
  error?: boolean;
}

const PricingRow = ({
  weightLabel,
  priceValue,
  onPriceChange,
  error,
}: PricingRowProps) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val !== "" && !/^\d*\.?\d{0,4}$/.test(val)) return;
    if (val.length > 1 && val.startsWith("0") && val[1] !== ".") {
      val = val.replace(/^0+/, "");
      if (val === "") val = "0";
    }
    if (val === ".") val = "0.";
    onPriceChange(val);
  };

  return (
    <div
      className={styles.pricingRow}
      style={{ display: "flex", alignItems: "center" }}
    >
      <div
        className={styles.pricingMetal}
        style={{ width: "120px", flexShrink: 0 }}
      >
        {weightLabel}
      </div>
      <div className={styles.pricingCalculation} style={{ flex: 1, margin: 0 }}>
        <TextField
          type="text"
          inputMode="decimal"
          value={priceValue}
          onChange={handleInputChange}
          placeholder="0.00"
          error={error}
        />
      </div>
    </div>
  );
};

interface PricingBreakdownProps {
  formData: {
    platinumPrice: string;
    palladiumPrice: string;
    rhodiumPrice: string;
  };
  onPriceChange: (field: string, value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  hasTriedSubmit: boolean;
}

export const PricingBreakdown = ({
  formData,
  onPriceChange,
  onSubmit,
  isLoading,
  hasTriedSubmit,
}: PricingBreakdownProps) => {
  const { t } = useTranslation();
  const isInvalid = (val: string) => val.trim() === "" || isNaN(Number(val));

  return (
    <div className={styles.pricingCard}>
      <h2 className={sharedStyles.cardTitle}>{t("pricingBreakdown.title")}</h2>
      <div className={sharedStyles.divider} />
      <div className={styles.pricingContent}>
        <PricingRow
          weightLabel={t("pricingBreakdown.platinumWeight")}
          priceValue={formData.platinumPrice}
          onPriceChange={(val) => onPriceChange("platinumPrice", val)}
          error={hasTriedSubmit && isInvalid(formData.platinumPrice)}
        />
        <PricingRow
          weightLabel={t("pricingBreakdown.palladiumWeight")}
          priceValue={formData.palladiumPrice}
          onPriceChange={(val) => onPriceChange("palladiumPrice", val)}
          error={hasTriedSubmit && isInvalid(formData.palladiumPrice)}
        />
        <PricingRow
          weightLabel={t("pricingBreakdown.rhodiumWeight")}
          priceValue={formData.rhodiumPrice}
          onPriceChange={(val) => onPriceChange("rhodiumPrice", val)}
          error={hasTriedSubmit && isInvalid(formData.rhodiumPrice)}
        />
        <div className={sharedStyles.divider} />
        <div style={{ marginTop: "8px" }}>
          <Button
            variant="primary"
            onClick={onSubmit}
            disabled={isLoading}
            style={{ width: "100%" }}
          >
            <Send size={18} style={{ marginRight: "8px" }} />
            {t("pricingBreakdown.createIntake")}
          </Button>
        </div>
      </div>
    </div>
  );
};
