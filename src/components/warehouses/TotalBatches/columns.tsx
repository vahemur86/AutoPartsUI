import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import i18next from "i18next";

// types
import type { InventoryLot } from "@/types/warehouses/reports";

// utils
import { createStatusMap, getStatusConfig } from "@/utils/statusMapping";

// styles
import styles from "./TotalBatches.module.css";

const columnHelper = createColumnHelper<InventoryLot>();

const STATUS_MAP = createStatusMap(styles);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getInventoryLotColumns = (): ColumnDef<InventoryLot, any>[] => [
  columnHelper.accessor("id", {
    header: "ID",
    cell: (info) => `#${info.getValue()}`,
  }),
  columnHelper.accessor("remainingPowderKg", {
    header: i18next.t("warehouses.totalBatches.columns.remainingPowderKg"),
    cell: (info) => `${info.getValue()} kg`,
  }),
  columnHelper.accessor("remainingCostAmd", {
    header: i18next.t("warehouses.totalBatches.columns.remainingCostAmd"),
    cell: (info) => `${info.getValue().toLocaleString()} AMD`,
  }),
  columnHelper.accessor("remainingPt_g", {
    header: i18next.t("warehouses.totalBatches.columns.remainingPt_g"),
    cell: (info) => `${info.getValue()} g`,
  }),
  columnHelper.accessor("remainingPd_g", {
    header: i18next.t("warehouses.totalBatches.columns.remainingPd_g"),
    cell: (info) => `${info.getValue()} g`,
  }),
  columnHelper.accessor("remainingRh_g", {
    header: i18next.t("warehouses.totalBatches.columns.remainingRh_g"),
    cell: (info) => `${info.getValue()} g`,
  }),
  columnHelper.accessor("initialPowderKg", {
    header: i18next.t("warehouses.totalBatches.columns.initialPowderKg"),
    cell: (info) => `${info.getValue()} kg`,
  }),
  columnHelper.accessor("initialCostAmd", {
    header: i18next.t("warehouses.totalBatches.columns.initialCostAmd"),
    cell: (info) => `${info.getValue().toLocaleString()} AMD`,
  }),
  columnHelper.accessor("status", {
    header: i18next.t("warehouses.totalBatches.columns.status"),
    cell: (info) => {
      const statusValue = info.getValue();
      const statusConfig = getStatusConfig(statusValue, STATUS_MAP);
      return (
        <span className={statusConfig.className}>{statusConfig.label}</span>
      );
    },
  }),
  columnHelper.accessor("createdAt", {
    header: i18next.t("warehouses.totalBatches.columns.createdAt"),
    cell: (info) => new Date(info.getValue()).toLocaleString(),
  }),
  columnHelper.accessor("updatedAt", {
    header: i18next.t("warehouses.totalBatches.columns.updatedAt"),
    cell: (info) => new Date(info.getValue()).toLocaleString(),
  }),
];
