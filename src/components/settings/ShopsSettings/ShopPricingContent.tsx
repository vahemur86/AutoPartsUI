import { type FC, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Select, TextField } from "@/ui-kit";

// types
import type { Shop, ShopPricing } from "@/types/settings";

// styles
import styles from "./ShopsSettings.module.css";

interface ShopPricingContentProps {
  actionButtons?: ReactNode;
  shops: Shop[];
  selectedShopId: number;
  setSelectedShopId: (id: number) => void;
  markupPercentage: string;
  setMarkupPercentage: (value: string) => void;
  pricingSettings: ShopPricing | null;
  isLoading: boolean;
}

export const ShopPricingContent: FC<ShopPricingContentProps> = ({
  actionButtons,
  shops,
  selectedShopId,
  setSelectedShopId,
  markupPercentage,
  setMarkupPercentage,
  pricingSettings,
  isLoading,
}) => {
  const { t } = useTranslation();

  return (
    <div className={styles.shopNameSection}>
      {actionButtons}

      <div className={styles.formRow}>
        <div className={styles.formColumn}>
          <Select
            label={t("shops.pricing.shop")}
            placeholder={t("shops.pricing.selectShop")}
            value={selectedShopId > 0 ? selectedShopId.toString() : ""}
            onChange={(e) => setSelectedShopId(Number(e.target.value) || 0)}
            disabled={isLoading}
          >
            <option value="">{t("shops.pricing.selectShop")}</option>
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.code}
              </option>
            ))}
          </Select>
        </div>

        <div className={styles.formColumn}>
          <TextField
            label={t("shops.pricing.markupPercentage")}
            placeholder={t("shops.pricing.markupPlaceholder")}
            value={markupPercentage}
            onChange={(e) => setMarkupPercentage(e.target.value)}
            disabled={isLoading || selectedShopId === 0}
            suffix="%"
          />
        </div>
      </div>

      <div className={styles.pricingSummary}>
        {selectedShopId === 0 ? (
          <div className={styles.loadingState}>{t("shops.pricing.selectShop")}</div>
        ) : isLoading ? (
          <div className={styles.loadingState}>{t("shops.pricing.loading")}</div>
        ) : pricingSettings ? (
          <div className={styles.pricingDetailsGrid}>
            <div className={styles.pricingDetailsRow}>
              <span className={styles.pricingLabel}>{t("shops.pricing.currentMarkup")}</span>
              <span className={styles.pricingValue}>{pricingSettings.markupPercentage}%</span>
            </div>
            <div className={styles.pricingDetailsRow}>
              <span className={styles.pricingLabel}>{t("shops.pricing.isActive")}</span>
              <span className={styles.pricingValue}>
                {pricingSettings.isActive ? t("common.yes") : t("common.no")}
              </span>
            </div>
            <div className={styles.pricingDetailsRow}>
              <span className={styles.pricingLabel}>{t("shops.pricing.updatedAt")}</span>
              <span className={styles.pricingValue}>
                {pricingSettings.updatedAt || pricingSettings.createdAt}
              </span>
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>{t("shops.pricing.noSettings")}</div>
        )}
      </div>
    </div>
  );
};
