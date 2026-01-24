import { useTranslation } from "react-i18next";

// ui-kit
import { TextField } from "@/ui-kit";

// styles
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

  const rawData = localStorage.getItem("user_data");
  const userData = rawData ? JSON.parse(rawData) : {};

  const shopId = userData.shopId || "—";
  const username = userData.username || "—";
  const cashRegisterName = userData.cashRegisterName || "—";

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
              {t("powderExtraction.shopId")}
            </span>
            <span className={styles.detailValue}>{shopId}</span>
          </div>

          <div className={styles.powderDetailRow}>
            <span className={styles.detailLabel}>
              {t("powderExtraction.username")}
            </span>
            <span className={styles.detailValue}>{username}</span>
          </div>

          <div className={styles.powderDetailRow}>
            <span className={styles.detailLabel}>
              {t("powderExtraction.cashRegisterName")}
            </span>
            <span className={styles.detailValue}>{cashRegisterName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
