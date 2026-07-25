import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import i18next from "i18next";

import type { IronPurchasesReportItem } from "@/types/ironCarShop";
import styles from "./IronPurchasesReport.module.css";

const columnHelper = createColumnHelper<IronPurchasesReportItem>();

export const getIronPurchasesReportColumns = (): ColumnDef<
  IronPurchasesReportItem,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
>[] => [
  columnHelper.display({
    id: "purchaseId",
    header: i18next.t("reports.ironPurchases.columns.purchaseId"),
    cell: (info) => {
      const row = info.row.original;
      const value = row.purchaseId ?? row.id;
      return value ? `#${value}` : "-";
    },
  }),
  columnHelper.accessor("dictBrandId", {
    header: i18next.t("reports.ironPurchases.columns.dictBrandId"),
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("brandName", {
    header: i18next.t("reports.ironPurchases.columns.brandName"),
    cell: (info) => info.getValue() || "-",
  }),
  columnHelper.accessor("ironTypeName", {
    header: i18next.t("reports.ironPurchases.columns.ironTypeName"),
    cell: (info) => info.getValue() || "-",
  }),
  columnHelper.accessor("operatorUserId", {
    header: i18next.t("reports.ironPurchases.columns.operatorUserId"),
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("sessionId", {
    header: i18next.t("reports.ironPurchases.columns.sessionId"),
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("customerPhone", {
    header: i18next.t("reports.ironPurchases.columns.customerPhone"),
    cell: (info) => info.getValue() || "-",
  }),
  columnHelper.accessor("weightKg", {
    header: i18next.t("reports.ironPurchases.columns.weightKg"),
    cell: (info) => {
      const value = info.getValue() as number | undefined;
      return value != null ? `${value.toLocaleString()} kg` : "-";
    },
  }),
  columnHelper.accessor("pricePerKg", {
    header: i18next.t("reports.ironPurchases.columns.pricePerKg"),
    cell: (info) => {
      const value = info.getValue() as number | undefined;
      return value != null ? `${value.toLocaleString()} AMD` : "-";
    },
  }),
  columnHelper.accessor("totalAmount", {
    header: i18next.t("reports.ironPurchases.columns.totalAmount"),
    cell: (info) => {
      const value = info.getValue() as number | undefined;
      return value != null ? (
        <span className={styles.totalPriceCell}>{`${value.toLocaleString()} AMD`}</span>
      ) : (
        "-"
      );
    },
  }),
  columnHelper.accessor("purchasedAt", {
    header: i18next.t("reports.ironPurchases.columns.purchasedAt"),
    cell: (info) => {
      const value = info.getValue() as string | undefined;
      return value
        ? new Date(value).toLocaleString(undefined, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-";
    },
  }),
];
