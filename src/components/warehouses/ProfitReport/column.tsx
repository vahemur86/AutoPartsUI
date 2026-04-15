import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import i18next from "i18next";

// types
import type { DailyProfitReportItem } from "@/types/warehouses/reports";

// styles (reuse same or create new if needed)
import styles from "./DailyReports.module.css";

const columnHelper = createColumnHelper<DailyProfitReportItem>();

const getNumberClass = (value: number) => {
  if (value < 0) return styles.negative;
  if (value > 0) return styles.positive;
  return "";
};

export const getDailyProfitColumns = (): ColumnDef<
  DailyProfitReportItem,
  any
>[] => [
  columnHelper.accessor("date", {
    header: i18next.t("warehouse.dailyProfit.columns.date"),
    cell: (info) =>
      new Date(info.getValue()).toLocaleString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
  }),

  columnHelper.accessor("revenueAmd", {
    header: i18next.t("warehouse.dailyProfit.columns.revenueAmd"),
    cell: (info) => `${info.getValue().toLocaleString()} AMD`,
  }),

  columnHelper.accessor("costAmd", {
    header: i18next.t("warehouse.dailyProfit.columns.costAmd"),
    cell: (info) => `${info.getValue().toLocaleString()} AMD`,
  }),

  columnHelper.accessor("profitAmd", {
    header: i18next.t("warehouse.dailyProfit.columns.profitAmd"),
    cell: (info) => (
      <span className={getNumberClass(info.getValue())}>
        {info.getValue().toLocaleString()} AMD
      </span>
    ),
  }),

  columnHelper.accessor("soldPowderKg", {
    header: i18next.t("warehouse.dailyProfit.columns.soldPowderKg"),
    cell: (info) => `${info.getValue()} kg`,
  }),
];
