import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { Boxes, ChevronDown, ChevronRight, Sparkles } from "lucide-react";
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

  columnHelper.display({
    id: "lotType",
    header: i18next.t("warehouses.totalBatches.columns.lotType"),
    cell: ({ row }) =>
      row.original.isSpecialCustomerLot ? (
        <span
          className={`${styles.badge} ${styles.badgeWarning}`}
          title={i18next.t("warehouses.totalBatches.lotType.special")}
        >
          <Sparkles size={13} aria-hidden="true" />
          {i18next.t("warehouses.totalBatches.lotType.specialShort")}
        </span>
      ) : (
        <span
          className={`${styles.badge} ${styles.badgeInfo}`}
          title={i18next.t("warehouses.totalBatches.lotType.general")}
        >
          <Boxes size={13} aria-hidden="true" />
          {i18next.t("warehouses.totalBatches.lotType.generalShort")}
        </span>
      ),
  }),

  columnHelper.display({
    id: "sourceType",
    header: i18next.t("warehouses.totalBatches.columns.sourceType"),
    cell: ({ row }) => {
      const sourceType = row.original.sourceType;
      if (sourceType !== "IronDerived" && sourceType !== "Catalyst") {
        return <span className={styles.mutedText}>—</span>;
      }
      const isIronDerived = sourceType === "IronDerived";
      return (
        <span className={`${styles.badge} ${isIronDerived ? styles.badgeWarning : styles.badgeInfo}`}>
          {isIronDerived
            ? i18next.t("warehouses.totalBatches.sourceType.ironDerived")
            : i18next.t("warehouses.totalBatches.sourceType.catalyst")}
        </span>
      );
    },
  }),

  columnHelper.display({
    id: "specialCustomer",
    header: i18next.t("warehouses.totalBatches.columns.specialCustomer"),
    cell: ({ row }) => {
      const lot = row.original;
      if (!lot.isSpecialCustomerLot) {
        return (
          <span className={styles.mutedText}>
            {i18next.t("warehouses.totalBatches.lotType.mergedFromMultiple")}
          </span>
        );
      }
      return (
        lot.specialCustomerName ??
        (lot.specialCustomerId ? `#${lot.specialCustomerId}` : "-")
      );
    },
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
