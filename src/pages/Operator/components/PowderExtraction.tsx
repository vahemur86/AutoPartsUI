import styles from "../OperatorPage.module.css";

export const PowderExtraction = () => {
  return (
    <div className={styles.powderCard}>
      <div className={styles.powderHeader}>
        <h2 className={styles.cardTitle}>Powder Extraction</h2>
      </div>

      <div className={styles.divider} />

      <div className={styles.powderContent}>
        <div className={styles.powderAmount}>7.00 kg</div>

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
