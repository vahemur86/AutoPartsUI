import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import i18next from "i18next";
import { useRef, useEffect, memo } from "react";

// ui-kit
import { TextField, Button } from "@/ui-kit";

// types
import type { InventoryLot } from "@/types/warehouses/reports";

// utils
import { createStatusMap, getStatusConfig } from "@/utils/statusMapping";

// styles
import styles from "./TotalBatches.module.css";
import type { RefObject } from "react";

const columnHelper = createColumnHelper<InventoryLot>();

const STATUS_MAP = createStatusMap(styles);

interface ColumnHandlers {
  onKgChange: (inventoryLotId: number, powderKg: number) => void;
  onAdd: (inventoryLotId: number, powderKg: number) => void;
  selectedKg: Record<number, number>;
  focusedInputRef: RefObject<number | null>;
}

interface SelectedKgInputCellProps {
  inventoryLotId: number;
  value: number | undefined;
  onKgChange: (inventoryLotId: number, powderKg: number) => void;
  focusedInputRef: RefObject<number | null>;
}

const SelectedKgInputCell = memo(
  ({
    inventoryLotId,
    value,
    onKgChange,
    focusedInputRef,
  }: SelectedKgInputCellProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const shouldRestoreFocus = useRef(false);

    useEffect(() => {
      if (focusedInputRef.current === inventoryLotId && inputRef.current) {
        shouldRestoreFocus.current = true;
        // Use double requestAnimationFrame to ensure focus happens after DOM update
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (inputRef.current && shouldRestoreFocus.current) {
              inputRef.current.focus();
              // Set cursor to end of input
              const length = inputRef.current.value.length;
              inputRef.current.setSelectionRange(length, length);
              // Clear the focus tracking
              focusedInputRef.current = null;
              shouldRestoreFocus.current = false;
            }
          });
        });
      }
    }, [inventoryLotId, focusedInputRef, value]);

    return (
      <div className={styles.selectedKgInput}>
        <TextField
          ref={inputRef}
          type="number"
          value={value ? value.toString() : ""}
          onChange={(e) => {
            if (document.activeElement === inputRef.current) {
              focusedInputRef.current = inventoryLotId;
            }
            const newValue = parseFloat(e.target.value) || 0;
            onKgChange(inventoryLotId, newValue);
          }}
          onFocus={() => {
            focusedInputRef.current = inventoryLotId;
          }}
          placeholder="0"
          min="0"
          step="0.01"
        />
      </div>
    );
  },
);

SelectedKgInputCell.displayName = "SelectedKgInputCell";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getInventoryLotColumns = ({
  onKgChange,
  onAdd,
  selectedKg,
  focusedInputRef,
}: ColumnHandlers): ColumnDef<InventoryLot, any>[] => [
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
  columnHelper.display({
    id: "selectedKg",
    header: i18next.t("warehouses.totalBatches.columns.selectedKg"),
    cell: ({ row }) => {
      const inventoryLotId = row.original.id;
      const currentValue = selectedKg[inventoryLotId];
      return (
        <SelectedKgInputCell
          inventoryLotId={inventoryLotId}
          value={currentValue}
          onKgChange={onKgChange}
          focusedInputRef={focusedInputRef}
        />
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    header: i18next.t("common.actions"),
    cell: ({ row }) => {
      const inventoryLotId = row.original.id;
      const powderKg = selectedKg[inventoryLotId] || 0;
      return (
        <div className={styles.actionButtonsCell}>
          <Button
            variant="primary"
            size="small"
            onClick={() => onAdd(inventoryLotId, powderKg)}
            disabled={!powderKg || powderKg <= 0}
          >
            {i18next.t("common.add")}
          </Button>
        </div>
      );
    },
  }),
];
