import { useTranslation } from "react-i18next";

import { createStatusMapForSale, getStatusConfig } from "@/utils/statusMapping";
import type { BaseLot } from "@/types/warehouses/salesLots";

import styles from "./BatchesToSale.module.css";

const statusKeys: Record<number, string> = {
  1: "open",
  2: "sold",
  3: "cancelled",
};

export const SalesLotDetails = ({ lot }: { lot: BaseLot }) => {
  const { t } = useTranslation();
  const status = getStatusConfig(lot.status, createStatusMapForSale(styles));

  return (
    <div className={styles.lotDetails}>
      <div className={styles.lotDetail}>
        <span>{t("warehouses.batchesToSale.columns.status")}</span>
        <span className={status.className}>
          {t(`warehouses.batchesToSale.statuses.${statusKeys[lot.status] ?? "unknown"}`)}
        </span>
      </div>
      <div className={styles.lotDetail}>
        <span>{t("warehouses.batchesToSale.columns.createdAt")}</span>
        <strong>
          {new Date(lot.createdAt).toLocaleString(undefined, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </strong>
      </div>
      <div className={styles.lotDetail}>
        <span>{t("warehouses.batchesToSale.columns.soldAt")}</span>
        <strong>
          {lot.soldAt
            ? new Date(lot.soldAt).toLocaleString(undefined, {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-"}
        </strong>
      </div>
    </div>
  );
};