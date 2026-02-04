import { useState, useMemo, Fragment, type ReactNode } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type GroupingState,
  type ExpandedState,
  type Row,
  type TableMeta,
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
  groupBy?: string[];
  meta?: TableMeta<TData>;
  getRowClassName?: (row: TData) => string;
  renderSubComponent?: (props: { row: Row<TData> }) => ReactNode;
}

export const DataTable = <TData, TValue>({
  columns,
  data,
  meta,
  pageSize = 10,
  enableSelection = false,
  manualPagination = false,
  pageCount,
  pageIndex: controlledPageIndex,
  onPaginationChange,
  renderBottomLeft,
  groupBy = [],
  getRowClassName,
  renderSubComponent,
}: DataTableProps<TData, TValue>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [grouping, setGrouping] = useState<GroupingState>(groupBy);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const [internalPagination, setInternalPagination] = useState({
    pageIndex: 0,
    pageSize: pageSize,
  });

  const pagination = useMemo(() => {
    if (manualPagination && controlledPageIndex !== undefined) {
      return { pageIndex: controlledPageIndex, pageSize: pageSize };
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
    meta,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getRowId: (row: any) => row.id,
    state: {
      sorting,
      rowSelection: enableSelection ? rowSelection : {},
      pagination,
      grouping,
      expanded,
    },
    getRowCanExpand: () => !!renderSubComponent,
    onExpandedChange: (updater) => {
      const nextExpanded =
        typeof updater === "function" ? updater(expanded) : updater;
      const latestExpandedKey = Object.keys(nextExpanded).find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (key) => !(expanded as any)[key],
      );

      setExpanded(latestExpandedKey ? { [latestExpandedKey]: true } : {});
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onGroupingChange: setGrouping,
    onPaginationChange: (updater) => {
      const currentPagination =
        manualPagination && controlledPageIndex !== undefined
          ? { pageIndex: controlledPageIndex, pageSize: pageSize }
          : internalPagination;

      const newPagination =
        typeof updater === "function" ? updater(currentPagination) : updater;

      if (manualPagination && controlledPageIndex !== undefined) {
        if (onPaginationChange) onPaginationChange(newPagination.pageIndex);
      } else {
        setInternalPagination(newPagination);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
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
              table.getRowModel().rows.map((row) => {
                const rowCustomClass = getRowClassName
                  ? getRowClassName(row.original)
                  : "";

                return (
                  <Fragment key={row.id}>
                    <TableRow
                      className={`${styles.tableRow} ${rowCustomClass}`}
                      data-state={
                        row.getIsExpanded() ? "expanded" : "collapsed"
                      }
                    >
                      {row.getVisibleCells().map((cell) => {
                        const isSelect = cell.column.id === "select";

                        if (
                          cell.getIsGrouped() ||
                          cell.getIsAggregated() ||
                          cell.getIsPlaceholder()
                        ) {
                          return null;
                        }

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

                    {row.getIsExpanded() && renderSubComponent && (
                      <TableRow className={styles.expandedDetailRow}>
                        <TableCell colSpan={row.getVisibleCells().length}>
                          <div className={styles.expandedDetailContent}>
                            {renderSubComponent({ row })}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
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
        <div className={styles.footerLeft}>{renderBottomLeft?.()}</div>
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
