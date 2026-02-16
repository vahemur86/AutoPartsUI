import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import i18next from "i18next";

// types
import type { PowderBatch } from "@/types/cash";

// styles
import styles from "./PowderBatches.module.css";

const columnHelper = createColumnHelper<PowderBatch>();

const STATUS_MAP: Record<number, { label: string; className: string }> = {
  1: { label: "Open", className: styles.statusOpen },
  2: { label: "Partially Sold", className: styles.statusPartiallySold },
  3: { label: "Sold", className: styles.statusSold },
  4: { label: "Cancelled", className: styles.statusCancelled },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getPowderBatchColumns = (): ColumnDef<PowderBatch, any>[] => [
  columnHelper.accessor("id", {
    header: "ID",
    cell: (info) => `#${info.getValue()}`,
  }),
  columnHelper.accessor("createdAt", {
    header: i18next.t("cashbox.powderBatches.columns.createdAt"),
    cell: (info) => new Date(info.getValue()).toLocaleString(),
  }),
  columnHelper.accessor("intakeCount", {
    header: i18next.t("cashbox.powderBatches.columns.intakes"),
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("totalPowderKg", {
    header: i18next.t("cashbox.powderBatches.columns.weight"),
    cell: (info) => `${info.getValue().toLocaleString()} kg`,
  }),
  columnHelper.accessor("ptPerKg_g", {
    header: i18next.t("cashbox.powderBatches.columns.ptPerKg_g"),
    cell: (info) => `${info.getValue().toLocaleString()} g`,
  }),
  columnHelper.accessor("pdPerKg_g", {
    header: i18next.t("cashbox.powderBatches.columns.pdPerKg_g"),
    cell: (info) => `${info.getValue().toLocaleString()} g`,
  }),
  columnHelper.accessor("rhPerKg_g", {
    header: i18next.t("cashbox.powderBatches.columns.rhPerKg_g"),
    cell: (info) => `${info.getValue().toLocaleString()} g`,
  }),
  columnHelper.accessor("avgFxRateToAmd", {
    header: "Avg FX",
    cell: (info) =>
      info.getValue().toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      }),
  }),
  columnHelper.accessor("avgPdPricePerKg", {
    header: "Avg Pd",
    cell: (info) =>
      `${info.getValue().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AMD`,
  }),
  columnHelper.accessor("avgPtPricePerKg", {
    header: "Avg Pt",
    cell: (info) =>
      `${info.getValue().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AMD`,
  }),
  columnHelper.accessor("avgRhPricePerKg", {
    header: "Avg Rh",
    cell: (info) =>
      `${info.getValue().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AMD`,
  }),
  columnHelper.accessor("status", {
    header: i18next.t("cashbox.powderBatches.columns.status"),
    cell: (info) => {
      const statusValue = info.getValue();
      const statusConfig = STATUS_MAP[statusValue] || {
        label: "Unknown",
        className: "",
      };

      return (
        <span className={statusConfig.className}>{statusConfig.label}</span>
      );
    },
  }),
];
