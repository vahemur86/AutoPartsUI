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
        <span>{i18next.t("warehouses.totalBatches.columns.sealNumber")}</span>
        <strong>{lot.sealNumber || "—"}</strong>
      </div>
      <div className={styles.lotDetail}>
        <span>{i18next.t("warehouses.totalBatches.columns.lotType")}</span>
        <strong>
          {lot.isSpecialCustomerLot
            ? t("warehouses.totalBatches.lotType.special")
            : t("warehouses.totalBatches.lotType.general")}
        </strong>
      </div>
      {lot.sourceType && (
        <div className={styles.lotDetail}>
          <span>{i18next.t("warehouses.totalBatches.columns.sourceType")}</span>
          <strong>
            {lot.sourceType === "IronDerived"
              ? t("warehouses.totalBatches.sourceType.ironDerived")
              : lot.sourceType === "Catalyst"
                ? t("warehouses.totalBatches.sourceType.catalyst")
                : lot.sourceType}
          </strong>
        </div>
      )}
      <div className={styles.lotDetail}>
        <span>{i18next.t("warehouses.totalBatches.columns.specialCustomer")}</span>
        <strong>
          {lot.isSpecialCustomerLot
            ? lot.specialCustomerName ??
              (lot.specialCustomerId ? `#${lot.specialCustomerId}` : "-")
            : t("warehouses.totalBatches.lotType.mergedFromMultiple")}
        </strong>
      </div>
      {lot.processingBatchId != null && (
        <div className={styles.lotDetail}>
          <span>{i18next.t("warehouses.totalBatches.columns.processingBatchId")}</span>
          <strong>#{lot.processingBatchId}</strong>
        </div>
      )}
      {lot.containsIronPowder != null && (
        <div className={styles.lotDetail}>
          <span>{i18next.t("warehouses.totalBatches.columns.containsIronPowder")}</span>
          <strong>{t(lot.containsIronPowder ? "common.yes" : "common.no")}</strong>
        </div>
      )}
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