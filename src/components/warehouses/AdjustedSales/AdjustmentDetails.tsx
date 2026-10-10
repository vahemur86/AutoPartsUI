import { useTranslation } from "react-i18next";
import { CalendarDays, FileText, RefreshCw, Sparkles } from "lucide-react";

import type { PowderSaleAdjustments } from "@/types/warehouses/salesLots";

import styles from "./AdjustedSales.module.css";

export const AdjustmentDetails = ({
  adjustment,
}: {
  adjustment: PowderSaleAdjustments;
}) => {
  const { t } = useTranslation();

  return (
    <div className={styles.adjustmentDetails}>
      <div className={styles.adjustmentMeta}>
        {adjustment.hasSpecialCustomerLots && (
          <span className={styles.specialBadge}>
            <Sparkles size={13} aria-hidden="true" />
            {t("warehouses.totalBatches.lotType.specialShort")}
          </span>
        )}
        <span className={styles.metaItem}>
          <CalendarDays size={14} aria-hidden="true" />
          {new Date(adjustment.createdAt).toLocaleString(undefined, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <span className={styles.metaItem}>
          <RefreshCw size={14} aria-hidden="true" />
          {t("powderSales.adjustments.columns.exchangeRate")}: {adjustment.exchangeRate.toLocaleString()}
        </span>
      </div>

      <div className={styles.reasonDetails}>
        <span className={styles.reasonIcon} aria-hidden="true">
          <FileText size={15} />
        </span>
        <span>
          <span className={styles.reasonLabel}>
            {t("powderSales.adjustments.columns.reason")}
          </span>
          <strong>{adjustment.reason || t("common.notSpecified")}</strong>
        </span>
      </div>
    </div>
  );
};