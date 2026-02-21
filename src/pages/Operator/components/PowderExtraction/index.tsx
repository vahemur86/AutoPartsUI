import { useTranslation } from "react-i18next";

// ui-kit
import { TextField } from "@/ui-kit";

// styles
import styles from "./PowderExtraction.module.css";
import sharedStyles from "../../OperatorPage.module.css";

interface PowderExtractionProps {
  weight: string;
  onWeightChange: (val: string) => void;
  error?: boolean;
}

export const PowderExtraction = ({
  weight,
  onWeightChange,
  error,
}: PowderExtractionProps) => {
  const { t } = useTranslation();

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (val !== "" && !/^\d*\.?\d{0,4}$/.test(val)) return;
    if (val.length > 1 && val.startsWith("0") && val[1] !== ".") {
      val = val.replace(/^0+/, "");
      if (val === "") val = "0";
    }
    if (val === ".") val = "0.";
    onWeightChange(val);
  };

  return (
    <div className={styles.powderCard}>
      <div className={styles.powderHeader}>
        <h2 className={sharedStyles.cardTitle}>
          {t("powderExtraction.title")}
        </h2>
      </div>
      <div className={sharedStyles.divider} />
      <div className={styles.powderContent}>
        <TextField
          label={t("powderExtraction.extractionWeight")}
          placeholder="0.00"
          type="text"
          inputMode="decimal"
          value={weight}
          onChange={handleWeightChange}
          error={error}
        />
      </div>
    </div>
  );
};
