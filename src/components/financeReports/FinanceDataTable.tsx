import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable, type DataTableProps } from "@/ui-kit";
import { getFinanceColumnIcon } from "./tableUtils";
import styles from "./FinanceReports.module.css";

export const FinanceDataTable = <TData, TValue>(
  props: DataTableProps<TData, TValue>,
) => {
  const columns = useMemo(
    () =>
      props.columns.map((column) => {
        if (typeof column.header !== "string") return column;

        const columnDefinition = column as typeof column & {
          accessorKey?: string;
          id?: string;
        };
        const columnKey =
          columnDefinition.accessorKey ?? columnDefinition.id ?? column.header;
        const HeaderIcon = getFinanceColumnIcon(columnKey);
        const label = column.header;

        return {
          ...column,
          header: () => (
            <span className={styles.dynamicColumnHeader}>
              <HeaderIcon size={13} aria-hidden="true" />
              {label}
            </span>
          ),
        } as ColumnDef<TData, TValue>;
      }),
    [props.columns],
  );

  return <DataTable {...props} columns={columns} />;
};