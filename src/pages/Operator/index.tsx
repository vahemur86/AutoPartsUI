import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { FinalOffer } from "./components/FinalOffer";
import { PricingBreakdown } from "./components/PricingBreakdown";
import { CustomerDetails } from "./components/CustomerDetails";
import { PowderExtraction } from "./components/PowderExtraction";
import { LiveMarketPrices } from "./components/LiveMarketPrices";
import { getMetalRates } from "@/services/operator";
import { getErrorMessage } from "@/utils";
import styles from "./OperatorPage.module.css";
import type { MetalRate } from "@/types/operator";

export const OperatorPage = () => {
  const [metalRates, setMetalRates] = useState<MetalRate | null>(null);
  //   const [isLoadingRates, setIsLoadingRates] = useState(true);

  const fetchMetalRates = useCallback(async () => {
    try {
      //   setIsLoadingRates(true);
      const rates = await getMetalRates();
      console.log(rates, "RATES");
      const activeRate = rates.find((rate) => rate.isActive) || rates[0];

      if (activeRate) {
        setMetalRates(activeRate);
      }
    } catch (error: unknown) {
      console.error("Error fetching metal rates:", error);
      toast.error(getErrorMessage(error, "Failed to load metal rates"));
    } finally {
      //   setIsLoadingRates(false);
    }
  }, []);

  useEffect(() => {
    fetchMetalRates();
  }, [fetchMetalRates]);

  return (
    <div className={styles.operatorPage}>
      <div className={styles.topRow}>
        <div className={styles.leftColumn}>
          <PowderExtraction />
          <LiveMarketPrices
            ptPricePerGram={metalRates?.ptPricePerGram}
            pdPricePerGram={metalRates?.pdPricePerGram}
            rhPricePerGram={metalRates?.rhPricePerGram}
            currencyCode={metalRates?.currencyCode}
            updatedAt={metalRates?.effectiveFrom}
          />
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
