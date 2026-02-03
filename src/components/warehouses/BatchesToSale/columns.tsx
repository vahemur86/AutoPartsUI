import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import i18next from "i18next";

// types
import type { BaseLot } from "@/types/warehouses/salesLots";

// utils
import { createStatusMapForSale, getStatusConfig } from "@/utils/statusMapping";

// styles
import styles from "./BatchesToSale.module.css";

const columnHelper = createColumnHelper<BaseLot>();

const STATUS_MAP = createStatusMapForSale(styles);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSalesLotColumns = (): ColumnDef<BaseLot, any>[] => [
  columnHelper.accessor("id", {
    header: "ID",
    cell: (info) => `#${info.getValue()}`,
  }),
  columnHelper.accessor("status", {
    header: i18next.t("warehouses.batchesToSale.columns.status"),
    cell: (info) => {
      const statusValue = info.getValue();
      const statusConfig = getStatusConfig(statusValue, STATUS_MAP);
      return (
        <span className={statusConfig.className}>{statusConfig.label}</span>
      );
    },
  }),
  columnHelper.accessor("totalPowderKg", {
    header: i18next.t("warehouses.batchesToSale.columns.totalPowderKg"),
    cell: (info) => `${info.getValue()} kg`,
  }),
  columnHelper.accessor("costTotalAmd", {
    header: i18next.t("warehouses.batchesToSale.columns.costTotalAmd"),
    cell: (info) => `${info.getValue().toLocaleString()} AMD`,
  }),
  columnHelper.accessor("ptTotal_g", {
    header: i18next.t("warehouses.batchesToSale.columns.ptTotal_g"),
    cell: (info) => `${info.getValue()} g`,
  }),
  columnHelper.accessor("pdTotal_g", {
    header: i18next.t("warehouses.batchesToSale.columns.pdTotal_g"),
    cell: (info) => `${info.getValue()} g`,
  }),
  columnHelper.accessor("rhTotal_g", {
    header: i18next.t("warehouses.batchesToSale.columns.rhTotal_g"),
    cell: (info) => `${info.getValue()} g`,
  }),
  columnHelper.accessor("createdAt", {
    header: i18next.t("warehouses.batchesToSale.columns.createdAt"),
    cell: (info) => new Date(info.getValue()).toLocaleString(),
  }),
  columnHelper.accessor("soldAt", {
    header: i18next.t("warehouses.batchesToSale.columns.soldAt"),
    cell: (info) => {
      const value = info.getValue();
      return value ? new Date(value).toLocaleString() : "-";
    },
  }),
];
