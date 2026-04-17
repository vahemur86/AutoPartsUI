import type { MouseEvent } from "react";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import i18next from "i18next";
import { Button } from "@/ui-kit";
import type { PowderSale } from "@/types/warehouses/salesLots";
import styles from "./SoldBatches.module.css";

const columnHelper = createColumnHelper<PowderSale>();

const getNumberClass = (value: number) => {
  if (value < 0) return styles.negative;
  if (value > 0) return styles.positive;
  return "";
};

export const getSoldBatchesColumns = ({
  onEdit,
}: {
  onEdit: (row: PowderSale, e: MouseEvent<HTMLElement>) => void;
}): ColumnDef<PowderSale, any>[] => [
  columnHelper.accessor("id", {
    header: "ID",
    cell: (info) => `#${info.getValue()}`,
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
    cell: (info) => (
      <span className={getNumberClass(info.getValue())}>
        {info.getValue().toLocaleString()} AMD
      </span>
    ),
  }),

  columnHelper.accessor("soldPowderKg", {
    header: i18next.t("warehouses.soldBatches.columns.soldPowderKg"),
    cell: (info) => `${info.getValue()} kg`,
  }),

  columnHelper.accessor("createdAt", {
    header: i18next.t("warehouses.soldBatches.columns.createdAt"),
    cell: (info) =>
      new Date(info.getValue()).toLocaleString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
  }),

  columnHelper.display({
    id: "actions",
    header: i18next.t("common.actions"),
    cell: ({ row }) => (
      <div style={{ display: "flex", gap: "12px" }}>
        <Button
          variant="primary"
          size="small"
          onClick={(e) => onEdit(row.original, e)}
        >
          {i18next.t("common.correct")}
        </Button>
      </div>
    ),
  }),
];
