import { TextField, Button } from "@/ui-kit";
import { Send } from "lucide-react";
import styles from "../OperatorPage.module.css";

interface PricingRowProps {
  metal: string;
  priceValue: string;
  onPriceChange: (val: string) => void;
  error?: boolean;
}

const PricingRow = ({
  metal,
  priceValue,
  onPriceChange,
  error,
}: PricingRowProps) => (
  <div
    className={styles.pricingRow}
    style={{ display: "flex", alignItems: "center" }}
  >
    <div
      className={styles.pricingMetal}
      style={{ width: "120px", flexShrink: 0 }}
    >
      {metal} Weight:
    </div>
    <div className={styles.pricingCalculation} style={{ flex: 1, margin: 0 }}>
      <TextField
        type="number"
        value={priceValue}
        onChange={(e) => onPriceChange(e.target.value)}
        placeholder="0.00"
        error={error}
      />
    </div>
  </div>
);

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
  const isInvalid = (val: string) => val.trim() === "" || isNaN(Number(val));

  return (
    <div className={styles.pricingCard}>
      <h2 className={styles.cardTitle}>Pricing Breakdown</h2>
      <div className={styles.divider} />
      <div className={styles.pricingContent}>
        <PricingRow
          metal="Platinum"
          priceValue={formData.platinumPrice}
          onPriceChange={(val) => onPriceChange("platinumPrice", val)}
          error={hasTriedSubmit && isInvalid(formData.platinumPrice)}
        />
        <PricingRow
          metal="Palladium"
          priceValue={formData.palladiumPrice}
          onPriceChange={(val) => onPriceChange("palladiumPrice", val)}
          error={hasTriedSubmit && isInvalid(formData.palladiumPrice)}
        />
        <PricingRow
          metal="Rhodium"
          priceValue={formData.rhodiumPrice}
          onPriceChange={(val) => onPriceChange("rhodiumPrice", val)}
          error={hasTriedSubmit && isInvalid(formData.rhodiumPrice)}
        />
        <div className={styles.divider} />
        <div style={{ marginTop: "8px" }}>
          <Button
            variant="primary"
            onClick={onSubmit}
            disabled={isLoading}
            style={{ width: "100%" }}
          >
            <Send size={18} style={{ marginRight: "8px" }} />
            Create Intake
          </Button>
        </div>
      </div>
    </div>
  );
};
