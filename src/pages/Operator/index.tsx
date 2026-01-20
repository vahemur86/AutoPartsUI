import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

import { logout } from "@/store/slices/authSlice";

// Components
import { FinalOffer } from "./components/FinalOffer";
import { PricingBreakdown } from "./components/PricingBreakdown";
import { CustomerDetails } from "./components/CustomerDetails";
import { PowderExtraction } from "./components/PowderExtraction";
import { LiveMarketPrices } from "./components/LiveMarketPrices";

// UI Kit & Icons
import { Button } from "@/ui-kit";
import { LogOut } from "lucide-react";

// styles
import styles from "./OperatorPage.module.css";

// stores
import { fetchMetalRates } from "@/store/slices/metalRatesSlice";

export const OperatorPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { metalRates } = useAppSelector((state) => state.metalRates);

  const metalRate = useMemo(
    () => metalRates.find((rate) => rate.isActive),
    [metalRates],
  );

  useEffect(() => {
    dispatch(fetchMetalRates());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <div className={styles.operatorPage}>
      <div className={styles.headerSection}>
        <h1 className={styles.pageTitle}>Operator Terminal</h1>
        <Button
          variant="secondary300"
          onClick={handleLogout}
          className={styles.logoutBtn}
        >
          <LogOut size={18} />
          Close Session
        </Button>
      </div>

      <div className={styles.topRow}>
        <div className={styles.leftColumn}>
          <PowderExtraction />
          <LiveMarketPrices
            ptPricePerGram={metalRate?.ptPricePerGram}
            pdPricePerGram={metalRate?.pdPricePerGram}
            rhPricePerGram={metalRate?.rhPricePerGram}
            currencyCode={metalRate?.currencyCode}
            updatedAt={metalRate?.effectiveFrom}
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
