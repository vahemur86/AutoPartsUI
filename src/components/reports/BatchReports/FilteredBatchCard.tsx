import type { FC } from "react";
import type { BatchDetailsForFilterItem } from "@/types/cash/dashboard";
import {
  ArrowLeftRight,
  BadgeDollarSign,
  ChartColumnIncreasing,
  CircleDollarSign,
  ExternalLink,
  Gauge,
  Hash,
  ListOrdered,
  Percent,
  Phone,
  Target,
  TrendingUp,
  User,
  Wallet,
  Weight,
} from "lucide-react";

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
          <span className={styles.intakeId}><Hash size={13} aria-hidden="true" />{batch.id}</span>
          <strong><Weight size={14} aria-hidden="true" />{batch.powderKg ?? 0} kg</strong>
        </div>
      </div>

      <div className={styles.itemCardContent}>
        <div className={styles.contactInfo}>
          <div className={styles.infoRow}>
            <User size={10} />
            <span className={styles.clientIdentity}>
              <span className={styles.clientName}>{batch.supplierClientName}</span>
              <span className={styles.clientType}>{batch.supplierClientType}</span>
            </span>
          </div>

          <div className={styles.infoRow}>
            <Phone size={10} />
            <span>{batch.supplierClientPhone}</span>
          </div>

          <div className={styles.infoRow}>
            <Percent size={13} aria-hidden="true" />
            <span className={styles.infoLabel}>{t("cashbox.batches.details.percent")}</span>
            <strong>
              {((batch.supplierClientTypePercent ?? 0) * 100).toFixed(2)}%
            </strong>
          </div>

          <div className={styles.infoRow}>
            <ListOrdered size={13} aria-hidden="true" />
            <span className={styles.infoLabel}>{t("cashbox.batches.details.offerIncreaseStepOrder")}</span>
            <strong>{batch.offerIncreaseStepOrder ?? 0}</strong>
          </div>

          <div className={styles.infoRow}>
            <TrendingUp size={13} aria-hidden="true" />
            <span className={styles.infoLabel}>{t("cashbox.batches.details.offerIncreasePercent")}</span>
            <strong>{batch.offerIncreasePercent ?? 0}%</strong>
          </div>

          <div className={styles.infoRow}>
            <Target size={13} aria-hidden="true" />
            <span className={styles.infoLabel}>{t("cashbox.batches.details.customerRealPercent")}</span>
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
            <span className={styles.statLabel}><Wallet size={14} aria-hidden="true" />{t("cashbox.batches.details.cost")}</span>
            <strong>{(batch.costAmd ?? 0).toLocaleString()} AMD</strong>
          </div>

          <div className={styles.statLine2}>
            <span className={styles.statLabel}><ChartColumnIncreasing size={14} aria-hidden="true" />{t("cashbox.batches.details.sales")}</span>
            <strong>
              {(batch.estimatedSalesAmd ?? 0).toLocaleString()} AMD
            </strong>
          </div>

          <div className={styles.statLine}>
            <span className={styles.statLabel}><BadgeDollarSign size={14} aria-hidden="true" />{t("cashbox.batches.details.purchaseProfitAmd")}</span>
            <strong>
              {(batch.purchaseProfitAmd ?? 0).toLocaleString()} AMD
            </strong>
          </div>

          <div className={styles.statLine}>
            <span className={styles.statLabel}><ArrowLeftRight size={14} aria-hidden="true" />{t("cashbox.batches.details.profitDiffAmd")}</span>
            <strong className={getNumberClass(batch.profitDiffAmd ?? 0)}>
              {(batch.profitDiffAmd ?? 0) > 0 ? "+" : ""}
              {(batch.profitDiffAmd ?? 0).toLocaleString()} AMD
            </strong>
          </div>

          <div className={styles.statLine2}>
            <span className={styles.statLabel}><CircleDollarSign size={14} aria-hidden="true" />{t("cashbox.batches.details.expectedProfitAmd")}</span>
            <strong>
              {(batch.expectedProfitAmd ?? 0).toLocaleString()} AMD
            </strong>
          </div>

          <div className={styles.statLine}>
            <span className={styles.statLabel}><Gauge size={14} aria-hidden="true" />{t("cashbox.batches.details.liveProfitPercent")}</span>
            <strong className={getNumberClass(batch.liveProfitPercent ?? 0)}>
              {(batch.liveProfitPercent ?? 0) > 0 ? "+" : ""}
              {(batch.liveProfitPercent ?? 0).toFixed(2)}%
            </strong>
          </div>

          <div className={styles.fxRate}>
            <span className={styles.fxRateLabel}>
              <ArrowLeftRight size={13} aria-hidden="true" />
              USD / AMD
            </span>
            <strong className={styles.fxRateValue}>
              <span>1 USD</span>
              <span className={styles.fxRateEquals}>=</span>
              <b>{(batch.fxRateToAmd ?? 0).toLocaleString()} AMD</b>
            </strong>
            <a
              className={styles.fxRateSource}
              href="https://rate.am"
              target="_blank"
              rel="noreferrer"
            >
              rate.am <ExternalLink size={11} aria-hidden="true" />
            </a>
          </div>

          <div className={styles.metalPricesFooter}>
            <div className={styles.metalPricesHeading}>USD / kg</div>
            <div className={styles.metalPricesGrid}>
              <div className={styles.metalPriceItem}>
                <span className={styles.metalPriceSymbol}>Pt</span>
                <strong>${(batch.ptPricePerKg ?? 0).toLocaleString()}</strong>
              </div>
              <div className={styles.metalPriceItem}>
                <span className={styles.metalPriceSymbol}>Pd</span>
                <strong>${(batch.pdPricePerKg ?? 0).toLocaleString()}</strong>
              </div>
              <div className={styles.metalPriceItem}>
                <span className={styles.metalPriceSymbol}>Rh</span>
                <strong>${(batch.rhPricePerKg ?? 0).toLocaleString()}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
