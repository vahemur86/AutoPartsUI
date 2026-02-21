import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import i18next from "i18next";

// types
import type { PurchaseIronResponse } from "@/types/ironCarShop";

// styles
import styles from "./IronSaleReport.module.css";

const columnHelper = createColumnHelper<PurchaseIronResponse>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getIronSaleColumns = (): ColumnDef<
  PurchaseIronResponse,
  any
>[] => [
  columnHelper.display({
    id: "id",
    header: "ID",
    cell: (info) => {
      const row = info.row.original as any;
      const value = row.id ?? row.purchaseId;
      return value ? `#${value}` : "-";
    },
  }),
  columnHelper.accessor("customerId", {
    header: i18next.t("reports.ironSale.columns.customerId"),
    cell: (info) => `#${info.getValue()}`,
  }),
  columnHelper.accessor("ironTypeName", {
    header: i18next.t("reports.ironSale.columns.ironTypeName"),
    cell: (info) => info.getValue() || i18next.t("common.noData"),
  }),
  columnHelper.accessor("weightKg", {
    header: i18next.t("operatorPage.weightKg"),
    cell: (info) => `${info.getValue().toLocaleString()} kg`,
  }),
  columnHelper.accessor("pricePerKg", {
    header: i18next.t("reports.ironSale.columns.pricePerKg"),
    cell: (info) => `${info.getValue().toLocaleString()} AMD`,
  }),
  columnHelper.accessor("totalAmount", {
    header: i18next.t("catalystBuckets.totalPrice"),
    cell: (info) => (
      <span className={styles.totalPriceCell}>
        {info.getValue().toLocaleString()} AMD
      </span>
    ),
  }),
  columnHelper.accessor("purchasedAt", {
    header: i18next.t("common.createdAt"),
    cell: (info) => {
      const value = info.getValue();
      return value ? new Date(value).toLocaleString() : "-";
    },
  }),
];
