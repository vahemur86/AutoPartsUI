import { useTranslation } from "react-i18next";
import { TextField } from "@/ui-kit";
import styles from "../OperatorPage.module.css";

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

  return (
    <div className={styles.powderCard}>
      <div className={styles.powderHeader}>
        <h2 className={styles.cardTitle}>{t("powderExtraction.title")}</h2>
      </div>
      <div className={styles.divider} />
      <div className={styles.powderContent}>
        <TextField
          label={t("powderExtraction.extractionWeight")}
          placeholder="0.00"
          type="number"
          value={weight}
          onChange={(e) => onWeightChange(e.target.value)}
          error={error}
        />
        <div className={styles.powderDetails}>
          <div className={styles.powderDetailRow}>
            <span className={styles.detailLabel}>
              {t("powderExtraction.scaleId")}
            </span>
            <span className={styles.detailValue}>SC-102</span>
          </div>
          <div className={styles.powderDetailRow}>
            <span className={styles.detailLabel}>
              {t("powderExtraction.measuredAt")}
            </span>
            <span className={styles.detailValue}>10:42 AM</span>
          </div>
        </div>
      </div>
    </div>
  );
};
