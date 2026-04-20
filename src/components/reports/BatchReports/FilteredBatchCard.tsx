import type { FC } from "react";
import type { BatchDetailsForFilterItem } from "@/types/cash/dashboard";
import { Phone, User } from "lucide-react";

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

  return (
    <div className={styles.itemCard}>
      <div className={styles.itemCardHeader}>
        <div className={styles.intakeMain}>
          <span>#{batch.id}</span>
          <strong>{batch.powderKg ?? 0} kg</strong>
        </div>
      </div>

      <div className={styles.itemCardContent}>
        <div className={styles.contactInfo}>
          <div className={styles.infoRow}>
            <User size={10} />
            <span>
              {batch.supplierClientName} ({batch.supplierClientType})
            </span>
          </div>

          <div className={styles.infoRow}>
            <Phone size={10} />
            <span>{batch.supplierClientPhone}</span>
          </div>

          <div className={styles.infoRow}>
            <span>{t("cashbox.batches.details.percent")}:</span>
            <strong>
              {((batch.supplierClientTypePercent ?? 0) * 100).toFixed(2)}%
            </strong>
          </div>

          <div className={styles.infoRow}>
            <span>{t("cashbox.batches.details.offerIncreaseStepOrder")}:</span>
            <strong>{batch.offerIncreaseStepOrder ?? 0}</strong>
          </div>

          <div className={styles.infoRow}>
            <span>{t("cashbox.batches.details.offerIncreasePercent")}:</span>
            <strong>{batch.offerIncreasePercent ?? 0}%</strong>
          </div>

          <div className={styles.infoRow}>
            <span>{t("cashbox.batches.details.customerRealPercent")}:</span>
            <strong>{batch.customerRealPercent ?? 0}%</strong>
          </div>
        </div>

        <div className={styles.metalConcentrationGrid}>
          <div className={styles.metalItem}>
            <span>Pt</span>
            <strong>
              {batch.ptPerKg_g ?? 0} <small>g/kg</small>
            </strong>
          </div>

          <div className={styles.metalItem}>
            <span>Pd</span>
            <strong>
              {batch.pdPerKg_g ?? 0} <small>g/kg</small>
            </strong>
          </div>

          <div className={styles.metalItem}>
            <span>Rh</span>
            <strong>
              {batch.rhPerKg_g ?? 0} <small>g/kg</small>
            </strong>
          </div>
        </div>

        <div className={styles.financialStats}>
          <div className={styles.statLine}>
            <span>{t("cashbox.batches.details.cost")}</span>
            <strong>{(batch.costAmd ?? 0).toLocaleString()} AMD</strong>
          </div>

          <div className={styles.statLine2}>
            <span>{t("cashbox.batches.details.sales")}</span>
            <strong>
              {(batch.estimatedSalesAmd ?? 0).toLocaleString()} AMD
            </strong>
          </div>

          <div className={styles.statLine}>
            <span>{t("cashbox.batches.details.purchaseProfitAmd")}</span>
            <strong>
              {(batch.purchaseProfitAmd ?? 0).toLocaleString()} AMD
            </strong>
          </div>

          <div className={styles.statLine}>
            <span>{t("cashbox.batches.details.profitDiffAmd")}</span>
            <strong className={getNumberClass(batch.profitDiffAmd ?? 0)}>
              {(batch.profitDiffAmd ?? 0) > 0 ? "+" : ""}
              {(batch.profitDiffAmd ?? 0).toLocaleString()} AMD
            </strong>
          </div>

          <div className={styles.statLine2}>
            <span>{t("cashbox.batches.details.expectedProfitAmd")}</span>
            <strong>
              {(batch.expectedProfitAmd ?? 0).toLocaleString()} AMD
            </strong>
          </div>

          <div className={styles.statLine}>
            <span>{t("cashbox.batches.details.liveProfitPercent")}</span>
            <strong className={getNumberClass(batch.liveProfitPercent ?? 0)}>
              {(batch.liveProfitPercent ?? 0) > 0 ? "+" : ""}
              {(batch.liveProfitPercent ?? 0).toFixed(2)}%
            </strong>
          </div>

          <div className={styles.fxRate}>
            Rate: {batch.fxRateToAmd ?? 0} AMD
          </div>

          <div className={styles.metalPricesFooter}>
            <span>Pt: {(batch.ptPricePerKg ?? 0).toLocaleString()} $</span>
            <span>Pd: {(batch.pdPricePerKg ?? 0).toLocaleString()} $</span>
            <span>Rh: {(batch.rhPricePerKg ?? 0).toLocaleString()} $</span>
          </div>
        </div>
      </div>
    </div>
  );
};
