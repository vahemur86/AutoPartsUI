import { Check, X } from "lucide-react";
import { Button } from "@/ui-kit";
import styles from "../OperatorPage.module.css";

export const FinalOffer = () => {
  return (
    <div className={styles.finalOfferCard}>
      <div className={styles.finalOfferContent}>
        <div className={styles.finalOfferLabel}>Final Offer</div>
        <div className={styles.finalOfferAmount}>$35,640 USD</div>

        <div className={styles.divider} />

        <div className={styles.finalOfferActions}>
          <Button variant="primary" size="small" fullWidth>
            <Check size={20} />
            Offer Calculate
          </Button>
          <Button variant="secondary" size="small" fullWidth>
            <X size={20} />
            Reject Offer
          </Button>
        </div>

        <div className={styles.offerValid}>
          Offer Valid: <span className={styles.countdown}>04:57</span>
        </div>
      </div>
    </div>
  );
};
