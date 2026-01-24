import { useState, useMemo, type ReactNode } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from "@tanstack/react-table";

// ui-kit
import { Checkbox } from "../Checkbox";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "./Table";

// styles
import styles from "./Table.module.css";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageSize?: number;
  enableSelection?: boolean;
  manualPagination?: boolean;
  pageCount?: number;
  pageIndex?: number;
  onPaginationChange?: (pageIndex: number) => void;
  renderBottomLeft?: () => ReactNode;
}

export const DataTable = <TData, TValue>({
  columns,
  data,
  pageSize = 10,
  enableSelection = false,
  manualPagination = false,
  pageCount,
  pageIndex: controlledPageIndex,
  onPaginationChange,
  renderBottomLeft,
}: DataTableProps<TData, TValue>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [internalPagination, setInternalPagination] = useState({
    pageIndex: 0,
    pageSize: pageSize,
  });

  // Use controlled pageIndex if provided, otherwise use internal state
  const pagination = useMemo(() => {
    if (manualPagination && controlledPageIndex !== undefined) {
      return {
        pageIndex: controlledPageIndex,
        pageSize: pageSize,
      };
    }
    return internalPagination;
  }, [manualPagination, controlledPageIndex, pageSize, internalPagination]);

  const selectionColumn: ColumnDef<TData> = useMemo(
    () => ({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllRowsSelected()}
          onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      ),
      size: 48,
    }),
    [],
  );

  const tableColumns = useMemo(
    () => (enableSelection ? [selectionColumn, ...columns] : columns),
    [columns, selectionColumn, enableSelection],
  );

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      rowSelection: enableSelection ? rowSelection : {},
      pagination,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      const currentPagination =
        manualPagination && controlledPageIndex !== undefined
          ? { pageIndex: controlledPageIndex, pageSize: pageSize }
          : internalPagination;

      const newPagination =
        typeof updater === "function" ? updater(currentPagination) : updater;

      if (manualPagination && controlledPageIndex !== undefined) {
        // Controlled mode: only call the callback, don't update internal state
        if (onPaginationChange) {
          onPaginationChange(newPagination.pageIndex);
        }
      } else {
        // Uncontrolled mode: update internal state
        setInternalPagination(newPagination);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: manualPagination,
    pageCount: manualPagination ? pageCount : undefined,
    getPaginationRowModel: manualPagination
      ? undefined
      : getPaginationRowModel(),
  });

  return (
    <div className={styles.dataTableContainer}>
      <div className={styles.tableWrapper}>
        <Table className={styles.table}>
          <TableHeader className={styles.tableHeader}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className={styles.tableRow}>
                {headerGroup.headers.map((header) => {
                  const isSelect = header.id === "select";
                  return (
                    <TableCell
                      key={header.id}
                      asHeader
                      className={
                        isSelect ? styles.selectionCell : styles.tableCell
                      }
                      onClick={
                        !isSelect
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                      style={{
                        cursor: header.column.getCanSort()
                          ? "pointer"
                          : "default",
                        width: isSelect ? "48px" : "auto",
                      }}
                    >
                      <div
                        className={
                          isSelect
                            ? styles.selectionCellContent
                            : styles.headerCellContent
                        }
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {!isSelect &&
                          ({ asc: " 🔼", desc: " 🔽" }[
                            header.column.getIsSorted() as string
                          ] ??
                            null)}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className={styles.tableBody}>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className={styles.tableRow}>
                  {row.getVisibleCells().map((cell) => {
                    const isSelect = cell.column.id === "select";
                    return (
                      <TableCell
                        key={cell.id}
                        className={
                          isSelect ? styles.selectionCell : styles.tableCell
                        }
                      >
                        <div
                          className={
                            isSelect ? styles.selectionCellContent : ""
                          }
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={tableColumns.length}
                  style={{ textAlign: "center" }}
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className={styles.tableFooter}>
        <div className={styles.footerLeft}>
          {renderBottomLeft ? renderBottomLeft() : null}
        </div>
        <div className={styles.pagination}>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </button>
          <span>
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
