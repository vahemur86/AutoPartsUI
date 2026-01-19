import { FinalOffer } from "./components/FinalOffer";
import { PricingBreakdown } from "./components/PricingBreakdown";
import { CustomerDetails } from "./components/CustomerDetails";
import { PowderExtraction } from "./components/PowderExtraction";
import { LiveMarketPrices } from "./components/LiveMarketPrices";
import styles from "./OperatorPage.module.css";

export const OperatorPage = () => {
  return (
    <div className={styles.operatorPage}>
      <div className={styles.topRow}>
        <div className={styles.leftColumn}>
          <PowderExtraction />
          <LiveMarketPrices />
        </div>

        <div className={styles.centerColumn}>
          <PricingBreakdown />
          <FinalOffer />
        </div>

        <div className={styles.rightColumn}>
          <CustomerDetails />
        </div>
      </div>
    </div>
  );
};
