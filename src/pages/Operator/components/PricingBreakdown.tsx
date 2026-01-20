// ui-kit
import { TextField, Button } from "@/ui-kit";

// icons
import { Send } from "lucide-react";

// styles
import styles from "../OperatorPage.module.css";

interface PricingRowProps {
  metal: string;
  priceValue: string;
  onPriceChange: (val: string) => void;
}

const PricingRow = ({ metal, priceValue, onPriceChange }: PricingRowProps) => (
  <div
    className={styles.pricingRow}
    style={{ display: "flex", alignItems: "center" }}
  >
    <div
      className={styles.pricingMetal}
      style={{ width: "120px", flexShrink: 0 }}
    >
      {metal} Price:
    </div>
    <div className={styles.pricingCalculation} style={{ flex: 1, margin: 0 }}>
      <TextField
        type="number"
        value={priceValue}
        onChange={(e) => onPriceChange(e.target.value)}
        placeholder="0.00"
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
}

export const PricingBreakdown = ({
  formData,
  onPriceChange,
  onSubmit,
  isLoading,
}: PricingBreakdownProps) => {
  return (
    <div className={styles.pricingCard}>
      <h2 className={styles.cardTitle}>Pricing Breakdown</h2>

      <div className={styles.divider} />

      <div className={styles.pricingContent}>
        <PricingRow
          metal="Platinum"
          priceValue={formData.platinumPrice}
          onPriceChange={(val) => onPriceChange("platinumPrice", val)}
        />
        <PricingRow
          metal="Palladium"
          priceValue={formData.palladiumPrice}
          onPriceChange={(val) => onPriceChange("palladiumPrice", val)}
        />
        <PricingRow
          metal="Rhodium"
          priceValue={formData.rhodiumPrice}
          onPriceChange={(val) => onPriceChange("rhodiumPrice", val)}
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
