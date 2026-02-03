import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import i18next from "i18next";

// types
import type { BaseLot } from "@/types/warehouses/salesLots";

const columnHelper = createColumnHelper<BaseLot>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSalesLotColumns = (): ColumnDef<BaseLot, any>[] => [
  columnHelper.accessor("status", {
    header: i18next.t("warehouses.batchesToSale.columns.status"),
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
