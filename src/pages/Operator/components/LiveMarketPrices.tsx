import styles from "../OperatorPage.module.css";

interface MetalPriceProps {
  name: string;
  price: string;
  source: string;
  iconColor: "silver" | "gold";
}

const MetalPrice = ({ name, price, source, iconColor }: MetalPriceProps) => (
  <div className={styles.metalRow}>
    <div className={`${styles.metalIcon} ${styles[iconColor]}`} />
    <div className={styles.metalInfo}>
      <span className={styles.metalName}>{name}</span>
      <span className={styles.metalPrice}>{price} / kg</span>
      <span className={styles.metalSource}>{source}</span>
    </div>
  </div>
);

export const LiveMarketPrices = () => {
  return (
    <div className={styles.marketPricesCard}>
      <div className={styles.marketPricesHeader}>
        <h2 className={styles.cardTitle}>Live Market Prices</h2>

        <div className={styles.liveIndicator}>
          <span className={styles.liveDot} />
          <span className={styles.liveText}>LIVE</span>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.metalsList}>
        <MetalPrice
          name="Platinum"
          price="$30,000"
          source="Kitco"
          iconColor="silver"
        />
        <MetalPrice
          name="Palladium"
          price="$25,000"
          source="Kitco"
          iconColor="gold"
        />
        <MetalPrice
          name="Rhodium"
          price="$150,000"
          source="Kitco"
          iconColor="gold"
        />
      </div>

      <div className={styles.marketPricesFooter}>
        <span className={styles.liveDot} />
        <span className={styles.liveText}>LIVE</span>
        <span className={styles.updateTime}>Updated 10:43 AM</span>
      </div>
    </div>
  );
};
