import { useTranslation } from "react-i18next";
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
      <span className={styles.metalPrice}>{price} / g</span>
      <span className={styles.metalSource}>{source}</span>
    </div>
  </div>
);

interface LiveMarketPricesProps {
  ptPricePerGram?: number;
  pdPricePerGram?: number;
  rhPricePerGram?: number;
  currencyCode?: string;
  updatedAt?: string;
}

export const LiveMarketPrices = ({
  ptPricePerGram,
  pdPricePerGram,
  rhPricePerGram,
  currencyCode = "USD",
  updatedAt,
}: LiveMarketPricesProps) => {
  const { t } = useTranslation();

  // Convert price per gram to price per kg (multiply by 1000)
  const formatPrice = (pricePerGram: number | undefined): string => {
    if (pricePerGram === undefined) {
      return t("liveMarketPrices.loading");
    }
    const pricePerKg = pricePerGram * 1000;
    const currencySymbol = currencyCode === "USD" ? "$" : currencyCode;
    return `${currencySymbol} ${pricePerKg.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  // Format update time
  const formatUpdateTime = (dateString?: string): string => {
    if (!dateString) {
      return t("liveMarketPrices.updated", {
        time: new Date().toLocaleTimeString(),
      });
    }
    try {
      const date = new Date(dateString);
      return t("liveMarketPrices.updated", {
        time: date.toLocaleTimeString(),
      });
    } catch {
      return t("liveMarketPrices.updated", {
        time: new Date().toLocaleTimeString(),
      });
    }
  };

  return (
    <div className={styles.marketPricesCard}>
      <div className={styles.marketPricesHeader}>
        <h2 className={styles.cardTitle}>{t("liveMarketPrices.title")}</h2>

        <div className={styles.liveIndicator}>
          <span className={styles.liveDot} />
          <span className={styles.liveText}>{t("liveMarketPrices.live")}</span>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.metalsList}>
        <MetalPrice
          name={t("liveMarketPrices.platinum")}
          price={formatPrice(ptPricePerGram)}
          source={t("liveMarketPrices.source")}
          iconColor="silver"
        />
        <MetalPrice
          name={t("liveMarketPrices.palladium")}
          price={formatPrice(pdPricePerGram)}
          source={t("liveMarketPrices.source")}
          iconColor="gold"
        />
        <MetalPrice
          name={t("liveMarketPrices.rhodium")}
          price={formatPrice(rhPricePerGram)}
          source={t("liveMarketPrices.source")}
          iconColor="gold"
        />
      </div>

      <div className={styles.marketPricesFooter}>
        <span className={styles.liveDot} />
        <span className={styles.liveText}>{t("liveMarketPrices.live")}</span>
        <span className={styles.updateTime}>{formatUpdateTime(updatedAt)}</span>
      </div>
    </div>
  );
};
