import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import i18next from "i18next";

// types
import type { PowderSale } from "@/types/warehouses/salesLots";

const columnHelper = createColumnHelper<PowderSale>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSoldBatchesColumns = (): ColumnDef<PowderSale, any>[] => [
  columnHelper.accessor("id", {
    header: "ID",
    cell: (info) => `#${info.getValue()}`,
  }),
  columnHelper.accessor("salesLotId", {
    header: i18next.t("warehouses.soldBatches.columns.salesLotId"),
    cell: (info) => `#${info.getValue()}`,
  }),
  columnHelper.accessor("warehouseId", {
    header: i18next.t("warehouses.soldBatches.columns.warehouseId"),
  }),
  columnHelper.accessor("currencyCode", {
    header: i18next.t("warehouses.soldBatches.columns.currencyCode"),
  }),
  columnHelper.accessor("revenueTotal", {
    header: i18next.t("warehouses.soldBatches.columns.revenueTotal"),
    cell: (info) => info.getValue().toLocaleString(),
  }),
  columnHelper.accessor("revenueTotalAmd", {
    header: i18next.t("warehouses.soldBatches.columns.revenueTotalAmd"),
    cell: (info) => `${info.getValue().toLocaleString()} AMD`,
  }),
  columnHelper.accessor("costAmd", {
    header: i18next.t("warehouses.soldBatches.columns.costAmd"),
    cell: (info) => `${info.getValue().toLocaleString()} AMD`,
  }),
  columnHelper.accessor("profitAmd", {
    header: i18next.t("warehouses.soldBatches.columns.profitAmd"),
    cell: (info) => `${info.getValue().toLocaleString()} AMD`,
  }),
  columnHelper.accessor("soldPowderKg", {
    header: i18next.t("warehouses.soldBatches.columns.soldPowderKg"),
    cell: (info) => `${info.getValue()} kg`,
  }),
  columnHelper.accessor("createdAt", {
    header: i18next.t("warehouses.soldBatches.columns.createdAt"),
    cell: (info) => new Date(info.getValue()).toLocaleString(),
  }),
];
