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
  return (
    <div className={styles.powderCard}>
      <div className={styles.powderHeader}>
        <h2 className={styles.cardTitle}>Powder Extraction</h2>
      </div>
      <div className={styles.divider} />
      <div className={styles.powderContent}>
        <TextField
          label="Extraction Weight (kg)"
          placeholder="0.00"
          type="number"
          value={weight}
          onChange={(e) => onWeightChange(e.target.value)}
          error={error}
        />
        <div className={styles.powderDetails}>
          <div className={styles.powderDetailRow}>
            <span className={styles.detailLabel}>Scale ID:</span>
            <span className={styles.detailValue}>SC-102</span>
          </div>
          <div className={styles.powderDetailRow}>
            <span className={styles.detailLabel}>Measured At:</span>
            <span className={styles.detailValue}>10:42 AM</span>
          </div>
        </div>
      </div>
    </div>
  );
};
