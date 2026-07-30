import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import i18next from "i18next";

// types
import type { SpecialCustomerBreakdown } from "@/types/warehouses/reports";

const columnHelper = createColumnHelper<SpecialCustomerBreakdown>();

const formatKg = (value: number) =>
  `${(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })} kg`;

const formatAmd = (value: number) => `${(value ?? 0).toLocaleString()} AMD`;

export const getSpecialLotsColumns = (): ColumnDef<
  SpecialCustomerBreakdown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
>[] => [
  columnHelper.accessor("specialCustomerName", {
    header: i18next.t("reports.specialLots.columns.customerName"),
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("totalLotsCount", {
    header: i18next.t("reports.specialLots.columns.totalLots"),
  }),
  columnHelper.accessor("totalPowderKg", {
    header: i18next.t("reports.specialLots.columns.totalPowderKg"),
    cell: (info) => formatKg(info.getValue()),
  }),
  columnHelper.accessor("totalCostAmd", {
    header: i18next.t("reports.specialLots.columns.totalCostAmd"),
    cell: (info) => formatAmd(info.getValue()),
  }),
  columnHelper.accessor("remainingPowderKg", {
    header: i18next.t("reports.specialLots.columns.remainingPowderKg"),
    cell: (info) => formatKg(info.getValue()),
  }),
  columnHelper.accessor("remainingCostAmd", {
    header: i18next.t("reports.specialLots.columns.remainingCostAmd"),
    cell: (info) => formatAmd(info.getValue()),
  }),
  columnHelper.display({
    id: "soldPercent",
    header: i18next.t("reports.specialLots.columns.soldPercent"),
    cell: ({ row }) => {
      const { totalPowderKg, remainingPowderKg } = row.original;
      if (!totalPowderKg) return "-";
      const percent =
        ((totalPowderKg - remainingPowderKg) / totalPowderKg) * 100;
      return `${percent.toFixed(1)}%`;
    },
  }),
  columnHelper.accessor("revenueAmd", {
    header: i18next.t("reports.specialLots.columns.revenueAmd"),
    cell: (info) => formatAmd(info.getValue()),
  }),
  columnHelper.accessor("profitAmd", {
    header: i18next.t("reports.specialLots.columns.profitAmd"),
    cell: (info) => formatAmd(info.getValue()),
  }),
];
