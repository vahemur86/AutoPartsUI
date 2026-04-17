import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import i18next from "i18next";

// types
import type { PowderSaleAdjustments } from "@/types/warehouses/salesLots";

// styles
import styles from "./AdjustedSales.module.css";
import { Tooltip } from "@/ui-kit";

const columnHelper = createColumnHelper<PowderSaleAdjustments>();

const getNumberClass = (value: number) => {
  if (value < 0) return styles.negative;
  if (value > 0) return styles.positive;
  return "";
};

export const getAdjustmentsColumns = (): ColumnDef<
  PowderSaleAdjustments,
  any
>[] => [
  columnHelper.accessor("powderSaleId", {
    header: i18next.t("powderSales.adjustments.columns.powderSaleId"),
  }),

  columnHelper.accessor("currencyCode", {
    header: i18next.t("powderSales.adjustments.columns.currencyCode"),
  }),

  columnHelper.accessor("oldAmount", {
    header: i18next.t("powderSales.adjustments.columns.oldAmount"),
    cell: (info) => `${info.getValue().toLocaleString()}`,
  }),

  columnHelper.accessor("newAmount", {
    header: i18next.t("powderSales.adjustments.columns.newAmount"),
    cell: (info) => `${info.getValue().toLocaleString()}`,
  }),

  columnHelper.accessor("difference", {
    header: i18next.t("powderSales.adjustments.columns.difference"),
    cell: (info) => (
      <span className={getNumberClass(info.getValue())}>
        {info.getValue().toLocaleString()}
      </span>
    ),
  }),

  columnHelper.accessor("oldAmountAmd", {
    header: i18next.t("powderSales.adjustments.columns.oldAmountAmd"),
    cell: (info) => `${info.getValue().toLocaleString()} AMD`,
  }),

  columnHelper.accessor("newAmountAmd", {
    header: i18next.t("powderSales.adjustments.columns.newAmountAmd"),
    cell: (info) => `${info.getValue().toLocaleString()} AMD`,
  }),

  columnHelper.accessor("differenceAmd", {
    header: i18next.t("powderSales.adjustments.columns.differenceAmd"),
    cell: (info) => (
      <span className={getNumberClass(info.getValue())}>
        {info.getValue().toLocaleString()} AMD
      </span>
    ),
  }),

  columnHelper.accessor("exchangeRate", {
    header: i18next.t("powderSales.adjustments.columns.exchangeRate"),
  }),

  columnHelper.accessor("reason", {
    header: i18next.t("powderSales.adjustments.columns.reason"),
    cell: (info) => {
      const text = info.getValue() ?? "";
      const isLongText = text.length > 15;

      const displayValue = isLongText ? `${text.substring(0, 15)}...` : text;
      return isLongText ? (
        <Tooltip content={text}>
          <span>{displayValue}</span>
        </Tooltip>
      ) : (
        <span>{displayValue}</span>
      );
    },
  }),

  columnHelper.accessor("createdAt", {
    header: i18next.t("powderSales.adjustments.columns.createdAt"),
    cell: (info) =>
      new Date(info.getValue()).toLocaleString(undefined, {
        year: "numeric",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
  }),
];
