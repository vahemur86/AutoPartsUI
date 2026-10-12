import styles from "./PrpServiceLoader.module.css";

export const PrpServiceLoader = ({
  ariaLabel = "Loading service data",
}: {
  ariaLabel?: string;
}) => (
  <div className={styles.loader} role="status" aria-busy="true" aria-label={ariaLabel}>
    <div className={styles.core} aria-hidden="true">
      <span className={styles.letters}>PRP</span>
      <span className={styles.service}>Service</span>
    </div>
  </div>
);