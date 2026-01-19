import styles from "../OperatorPage.module.css";

interface PricingRowProps {
  metal: string;
  amount: string;
  price: string;
  coefficient?: string;
  total: string;
}

const PricingRow = ({
  metal,
  amount,
  price,
  coefficient,
  total,
}: PricingRowProps) => (
  <div className={styles.pricingRow}>
    <div className={styles.pricingMetal}>{metal}:</div>
    <div className={styles.pricingCalculation}>
      {amount} × {price}
      {coefficient && ` × ${coefficient}`} = {total}
    </div>
  </div>
);

export const PricingBreakdown = () => {
  return (
    <div className={styles.pricingCard}>
      <h2 className={styles.cardTitle}>Pricing Breakdown</h2>

      <div className={styles.divider} />

      <div className={styles.pricingContent}>
        <PricingRow
          metal="Platinum"
          amount="1 kg"
          price="$30,000"
          total="$28,500"
        />
        <PricingRow
          metal="Palladium"
          amount="0.5 kg"
          price="$25,000"
          coefficient="96%"
          total="$12,000"
        />
        <PricingRow
          metal="Rhodium"
          amount="0 kg"
          price="$150,000"
          coefficient="90%"
          total="$0"
        />

        <div className={styles.divider} />

        <div className={styles.pricingSummary}>
          <div className={styles.summaryRow}>
            <span>Total Metal Value:</span>
            <span className={styles.summaryValue}>$40,500</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Client Coefficient:</span>
            <span className={styles.summaryValue}>0.88</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.finalOfferLabelSummary}>Final Offer:</span>
            <span className={styles.finalOfferValue}>$35,640</span>
          </div>
        </div>
      </div>
    </div>
  );
};
