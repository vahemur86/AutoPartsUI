import type { MouseEvent } from "react";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import i18next from "i18next";
import { Banknote, ChevronDown, ChevronRight } from "lucide-react";
import { Button, IconButton } from "@/ui-kit";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): ColumnDef<PowderSale, any>[] => [
  columnHelper.display({
    id: "expander",
    header: () => null,
    cell: ({ row }) => (
      <IconButton
        type="button"
        variant="secondary"
        size="small"
        icon={row.getIsExpanded() ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        ariaLabel={i18next.t("common.details")}
        title={i18next.t("common.details")}
        className={styles.detailsButton}
        onClick={row.getToggleExpandedHandler()}
      />
    ),
  }),
  columnHelper.accessor("salesLotId", {
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

  columnHelper.display({
    id: "actions",
    header: i18next.t("common.actions"),
    cell: ({ row }) => (
      <div className={styles.actionCell}>
        <Button
          variant="primary"
          size="small"
          className={styles.adjustButton}
          onClick={(e) => onEdit(row.original, e)}
        >
          <Banknote size={15} aria-hidden="true" />
          {i18next.t("warehouses.soldBatches.editSoldBatch")}
        </Button>
      </div>
    ),
  }),
];
