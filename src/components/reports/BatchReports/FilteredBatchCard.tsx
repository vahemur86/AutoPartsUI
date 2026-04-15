import type { BatchDetailsForFilterItem } from "@/types/cash/dashboard";
import { Phone, User } from "lucide-react";
import type { FC } from "react";

interface FilteredBatchCardProps {
  batch: BatchDetailsForFilterItem;
  t: (key: string) => string;
  styles: Record<string, string>;
}

export const FilteredBatchCard: FC<FilteredBatchCardProps> = ({
  batch,
  t,
  styles,
}) => {
  const getNumberClass = (value: number) => {
    if (value < 0) return styles.negative;
    if (value > 0) return styles.positive;
    return "";
  };

  const item = batch.items?.[0];

  return (
    <div className={styles.itemCard}>
      <div className={styles.itemCardHeader}>
        <div className={styles.intakeMain}>
          <span>#{batch.sessionId}</span>
          <strong>{batch.totalPowderKg} kg</strong>
        </div>

        <div className={styles.supplierTag}>
          <User size={10} />
          <span>
            {item?.supplierClientName} ({item?.supplierClientType})
          </span>
        </div>
      </div>

      <div className={styles.itemCardContent}>
        <div className={styles.contactInfo}>
          <div className={styles.infoRow}>
            <Phone size={10} />
            <span>{item?.supplierClientPhone}</span>
          </div>

          <div className={styles.infoRow}>
            <span>{t("cashbox.batches.details.percent")}:</span>
            <strong>
              {((item?.supplierClientTypePercent ?? 0) * 100).toFixed(2)}%
            </strong>
          </div>

          <div className={styles.infoRow}>
            <span>{t("cashbox.batches.details.offerIncreaseStepOrder")}:</span>
            <strong>{item?.offerIncreaseStepOrder ?? 0}</strong>
          </div>

          <div className={styles.infoRow}>
            <span>{t("cashbox.batches.details.offerIncreasePercent")}:</span>
            <strong>{item?.offerIncreasePercent ?? 0}%</strong>
          </div>
        </div>

        <div className={styles.metalConcentrationGrid}>
          <div className={styles.metalItem}>
            <span>Pt</span>
            <strong>
              {item?.ptPerKg_g ?? 0} <small>g/kg</small>
            </strong>
          </div>

          <div className={styles.metalItem}>
            <span>Pd</span>
            <strong>
              {item?.pdPerKg_g ?? 0} <small>g/kg</small>
            </strong>
          </div>

          <div className={styles.metalItem}>
            <span>Rh</span>
            <strong>
              {item?.rhPerKg_g ?? 0} <small>g/kg</small>
            </strong>
          </div>
        </div>

        <div className={styles.financialStats}>
          <div className={styles.statLine}>
            <span>{t("cashbox.batches.details.cost")}</span>
            <strong>{(item?.costAmd ?? 0).toLocaleString()} AMD</strong>
          </div>

          <div className={styles.statLine2}>
            <span>{t("cashbox.batches.details.sales")}</span>
            <strong>
              {(item?.estimatedSalesAmd ?? 0).toLocaleString()} AMD
            </strong>
          </div>

          <div className={styles.statLine}>
            <span>{t("cashbox.batches.details.purchaseProfitAmd")}</span>
            <strong>
              {(item?.purchaseProfitAmd ?? 0).toLocaleString()} AMD
            </strong>
          </div>

          <div className={styles.statLine}>
            <span>{t("cashbox.batches.details.profitDiffAmd")}</span>
            <strong className={getNumberClass(item?.profitDiffAmd ?? 0)}>
              {(item?.profitDiffAmd ?? 0) > 0 ? "+" : ""}
              {(item?.profitDiffAmd ?? 0).toLocaleString()} AMD
            </strong>
          </div>

          <div className={styles.statLine2}>
            <span>{t("cashbox.batches.details.expectedProfitAmd")}</span>
            <strong>
              {(item?.expectedProfitAmd ?? 0).toLocaleString()} AMD
            </strong>
          </div>

          <div className={styles.statLine}>
            <span>{t("cashbox.batches.details.liveProfitPercent")}</span>
            <strong className={getNumberClass(item?.liveProfitPercent ?? 0)}>
              {(item?.liveProfitPercent ?? 0) > 0 ? "+" : ""}
              {(item?.liveProfitPercent ?? 0).toFixed(2)}%
            </strong>
          </div>

          <div className={`${styles.statLine} ${styles.profitLine}`}></div>

          <div className={styles.fxRate}>
            Rate: {item?.fxRateToAmd ?? 0} AMD
          </div>

          <div className={styles.metalPricesFooter}>
            <span>Pt: {(item?.ptPricePerKg ?? 0).toLocaleString()} $</span>
            <span>Pd: {(item?.pdPricePerKg ?? 0).toLocaleString()} $</span>
            <span>Rh: {(item?.rhPricePerKg ?? 0).toLocaleString()} $</span>
          </div>
        </div>
      </div>
    </div>
  );
};
