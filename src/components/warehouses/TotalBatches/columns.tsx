import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { ChevronDown, ChevronRight } from "lucide-react";
import i18next from "i18next";

// components
import { SelectedKgCell } from "./SelectedKg";
import { IconButton } from "@/ui-kit";

// styles
import styles from "./TotalBatches.module.css";

// types
import type { InventoryLot } from "@/types/warehouses/reports";

const columnHelper = createColumnHelper<InventoryLot>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getInventoryLotColumns = (): ColumnDef<InventoryLot, any>[] => {
  return [
  columnHelper.display({
    id: "details",
    header: () => null,
    size: 42,
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
  columnHelper.accessor("id", {
    header: i18next.t("warehouses.totalBatches.columns.id"),
    cell: (info) => `#${info.getValue()}`,
  }),
  columnHelper.accessor("sealNumber", {
    header: i18next.t("warehouses.totalBatches.columns.sealNumber"),
    cell: (info) => info.getValue() || "—",
  }),

  columnHelper.accessor("initialPowderKg", {
    header: i18next.t("warehouses.totalBatches.columns.initialPowderKg"),
    cell: (info) => `${info.getValue()} kg`,
  }),
  columnHelper.accessor("initialCostAmd", {
    header: i18next.t("warehouses.totalBatches.columns.initialCostAmd"),
    cell: (info) => `${info.getValue().toLocaleString()} AMD`,
  }),
  columnHelper.display({
    id: "selectedKg",
    header: i18next.t("warehouses.totalBatches.columns.selectedKg"),
    cell: ({ row, table }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const meta = table.options.meta as any;
      const inventoryLotId = row.original.id;
      const isEmpty = row.original.status === 4;

      return (
        <SelectedKgCell
          inventoryLotId={inventoryLotId}
          initialValue={meta?.selectedKg?.[inventoryLotId]}
          onKgChange={meta?.onKgChange}
          onAdd={meta?.onAdd}
          disabled={isEmpty}
          maxKg={row.original.remainingPowderKg}
          isAdded={meta?.selectedMap?.has(inventoryLotId)}
        />
      );
    },
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

];
};
