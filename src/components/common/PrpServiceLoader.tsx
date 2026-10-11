import styles from "./PrpServiceLoader.module.css";

export const PrpServiceLoader = () => (
  <div className={styles.loader} role="status" aria-busy="true" aria-label="Loading service data">
    <div className={styles.core} aria-hidden="true">
      <span className={styles.letters}>PRP</span>
      <span className={styles.service}>Service</span>
    </div>
  </div>
);