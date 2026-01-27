import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import i18next from "i18next";

// icons
import { ChevronDown, ChevronRight } from "lucide-react";

// types
import type { Batch } from "@/types/cash";

// styles
import styles from "./BatchReports.module.css";

const columnHelper = createColumnHelper<Batch>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getBatchReportColumns = (): ColumnDef<Batch, any>[] => [
  columnHelper.display({
    id: "expander",
    header: () => null,
    cell: ({ row }) => (
      <button
        type="button"
        onClick={row.getToggleExpandedHandler()}
        className={styles.expandTrigger}
      >
        {row.getIsExpanded() ? (
          <ChevronDown size={18} />
        ) : (
          <ChevronRight size={18} />
        )}
      </button>
    ),
  }),
  columnHelper.accessor("id", {
    header: "ID",
    cell: (info) => `#${info.getValue()}`,
  }),
  columnHelper.accessor("createdAt", {
    header: i18next.t("cashbox.batches.columns.createdAt"),
    cell: (info) => new Date(info.getValue()).toLocaleString(),
  }),
  columnHelper.accessor("intakeCount", {
    header: i18next.t("cashbox.batches.columns.intakes"),
  }),
  columnHelper.accessor("totalPowderKg", {
    header: i18next.t("cashbox.batches.columns.weight"),
    cell: (info) => `${info.getValue().toLocaleString()} kg`,
  }),
];
