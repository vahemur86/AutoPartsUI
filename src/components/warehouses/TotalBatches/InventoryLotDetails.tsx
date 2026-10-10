import i18next from "i18next";
import { useTranslation } from "react-i18next";

import { createStatusMap, getStatusConfig } from "@/utils/statusMapping";
import type { InventoryLot } from "@/types/warehouses/reports";

import styles from "./TotalBatches.module.css";

export const InventoryLotDetails = ({ lot }: { lot: InventoryLot }) => {
  const { t } = useTranslation();
  const statusConfig = getStatusConfig(lot.status, createStatusMap(styles));
  const statusKey: Record<number, string> = {
    1: "available",
    2: "depleted",
    3: "cancelled",
    4: "empty",
  };
  const formatDate = (value: string) =>
    new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className={styles.lotDetails}>
      <div className={styles.lotDetail}>
        <span>{i18next.t("warehouses.totalBatches.columns.status")}</span>
        <span className={statusConfig.className}>
          {t(`warehouses.totalBatches.statuses.${statusKey[lot.status] ?? "unknown"}`)}
        </span>
      </div>
      <div className={styles.lotDetail}>
        <span>{i18next.t("warehouses.totalBatches.columns.createdAt")}</span>
        <strong>{formatDate(lot.createdAt)}</strong>
      </div>
      <div className={styles.lotDetail}>
        <span>{i18next.t("warehouses.totalBatches.columns.updatedAt")}</span>
        <strong>{formatDate(lot.updatedAt)}</strong>
      </div>
    </div>
  );
};