import { useTranslation } from "react-i18next";

// icons
import { Coins } from "lucide-react";

// styles
import styles from "../OperatorPage.module.css";

interface MetalPriceProps {
  name: string;
  price: string;
  source: string;
  iconColor: "platinum" | "palladium" | "rhodium" | "exchange";
}

const MetalPrice = ({ name, price, source, iconColor }: MetalPriceProps) => (
  <div className={styles.metalRow}>
    <div className={`${styles.metalIcon} ${styles[iconColor]}`}>
      {iconColor === "exchange" && <Coins size={16} color="white" />}
    </div>
    <div className={styles.metalInfo}>
      <span className={styles.metalName}>{name}</span>
      <span className={styles.metalPrice}>{price}</span>
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
  usdAmdRate?: number;
}

export const LiveMarketPrices = ({
  ptPricePerGram,
  pdPricePerGram,
  rhPricePerGram,
  currencyCode = "USD",
  updatedAt,
  usdAmdRate,
}: LiveMarketPricesProps) => {
  const { t } = useTranslation();

  const formatPrice = (pricePerGram: number | undefined): string => {
    if (pricePerGram === undefined) {
      return t("liveMarketPrices.loading");
    }
    const currencySymbol = currencyCode === "USD" ? "$" : currencyCode;
    return `${currencySymbol} ${pricePerGram.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })} / g`;
  };

  const formatUpdateTime = (dateString?: string): string => {
    const date = dateString ? new Date(dateString) : new Date();
    const isValidDate = !isNaN(date.getTime());
    const finalDate = isValidDate ? date : new Date();

    return t("liveMarketPrices.updated", {
      time: finalDate.toLocaleTimeString(),
    });
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
        {usdAmdRate && (
          <MetalPrice
            name={t("liveMarketPrices.exchangeRate")}
            price={`$ 1 / ${usdAmdRate.toLocaleString()} AMD`}
            source={t("liveMarketPrices.bankSource")}
            iconColor="exchange"
          />
        )}

        <MetalPrice
          name={t("liveMarketPrices.platinum")}
          price={formatPrice(ptPricePerGram)}
          source={t("liveMarketPrices.source")}
          iconColor="platinum"
        />
        <MetalPrice
          name={t("liveMarketPrices.palladium")}
          price={formatPrice(pdPricePerGram)}
          source={t("liveMarketPrices.source")}
          iconColor="palladium"
        />
        <MetalPrice
          name={t("liveMarketPrices.rhodium")}
          price={formatPrice(rhPricePerGram)}
          source={t("liveMarketPrices.source")}
          iconColor="rhodium"
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
