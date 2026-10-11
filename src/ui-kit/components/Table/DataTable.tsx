import { useState, useMemo, Fragment, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
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
  type Column,
} from "@tanstack/react-table";

// ui-kit
import { Checkbox } from "../Checkbox";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "./Table";

// styles
import styles from "./Table.module.css";

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageSize?: number;
  enableSelection?: boolean;
  manualPagination?: boolean;
  pageCount?: number;
  pageIndex?: number;
  onPaginationChange?: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  pageSizeLabel?: ReactNode;
  paginationRangeLabel?: (range: { from: number; to: number; total: number }) => ReactNode;
  canNextPage?: boolean;
  paginationLabel?: ReactNode;
  getRowId?: (row: TData) => string;
  renderBottomLeft?: () => ReactNode;
  groupBy?: string[];
  meta?: TableMeta<TData>;
  getRowClassName?: (row: TData) => string;
  renderSubComponent?: (props: { row: Row<TData> }) => ReactNode;
  frozenConfig?: { left?: string[]; right?: string[] };
  freezeHeader?: boolean;
  fitContainer?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  noResultsText?: string;
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
  onPageSizeChange,
  pageSizeOptions,
  pageSizeLabel,
  paginationRangeLabel,
  canNextPage,
  paginationLabel,
  getRowId,
  renderBottomLeft,
  groupBy = [],
  getRowClassName,
  renderSubComponent,
  frozenConfig,
  freezeHeader = true,
  fitContainer = false,
  isLoading = false,
  loadingText,
  noResultsText,
}: DataTableProps<TData, TValue>) => {
  const { t } = useTranslation();

  const resolvedLoadingText = loadingText ?? t("common.loading");
  const resolvedNoResultsText = noResultsText ?? t("common.noData");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [grouping, setGrouping] = useState<GroupingState>(groupBy);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const [internalPagination, setInternalPagination] = useState({
    pageIndex: 0,
    pageSize: pageSize,
  });

  const pagination = useMemo(() => {
    if (controlledPageIndex !== undefined) {
      return {
        pageIndex: controlledPageIndex,
        pageSize: onPageSizeChange ? pageSize : manualPagination ? pageSize : internalPagination.pageSize,
      };
    }
    return internalPagination;
  }, [controlledPageIndex, manualPagination, onPageSizeChange, pageSize, internalPagination]);

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
    getRowId: (row: any, index) => getRowId?.(row) ?? String(row.id ?? index),
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
        controlledPageIndex !== undefined
          ? {
              pageIndex: controlledPageIndex,
              pageSize: manualPagination || onPageSizeChange
                ? pageSize
                : internalPagination.pageSize,
            }
          : internalPagination;

      const newPagination =
        typeof updater === "function" ? updater(currentPagination) : updater;

      if (controlledPageIndex !== undefined) {
        onPaginationChange?.(newPagination.pageIndex);
        if (onPageSizeChange && newPagination.pageSize !== currentPagination.pageSize) {
          onPageSizeChange(newPagination.pageSize);
        } else if (!manualPagination) {
          setInternalPagination((current) => ({
            ...current,
            pageSize: newPagination.pageSize,
          }));
        }
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
      autoResetPageIndex: false,
  });

  const getStickyStyles = (
    column: Column<TData, unknown>,
  ): React.CSSProperties => {
    const isLeft = frozenConfig?.left?.includes(column.id);
    const isRight = frozenConfig?.right?.includes(column.id);

    if (isLeft) {
      return {
        position: "sticky",
        left: `${column.getStart("left")}px`,
        zIndex: 3,
      };
    }
    if (isRight) {
      return {
        position: "sticky",
        right: `${column.getAfter("right")}px`,
        zIndex: 3,
      };
    }
    return {};
  };

  const paginationState = table.getState().pagination;
  const totalRows = table.getPrePaginationRowModel().rows.length;
  const rangeFrom = totalRows === 0
    ? 0
    : paginationState.pageIndex * paginationState.pageSize + 1;
  const rangeTo = Math.min(
    (paginationState.pageIndex + 1) * paginationState.pageSize,
    totalRows,
  );
  const totalPages = table.getPageCount();

  return (
    <div className={styles.dataTableContainer}>
      <div className={styles.tableWrapper}>
        <Table className={`${styles.table} ${fitContainer ? styles.fitContainerTable : ""}`}>
          <TableHeader
            className={`${styles.tableHeader} ${freezeHeader ? styles.stickyHeader : ""}`}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className={styles.tableRow}>
                {headerGroup.headers.map((header) => {
                  const isSelect = header.id === "select";
                  const isGroupHeader = header.subHeaders.length > 0;
                  const stickyStyles = getStickyStyles(header.column);
                  const isFrozen = !!stickyStyles.position;

                  return (
                    <TableCell
                      key={header.id}
                      asHeader
                      colSpan={header.colSpan}
                      className={`${isSelect ? styles.selectionCell : styles.tableCell} ${isFrozen ? styles.frozenCell : ""} ${isGroupHeader ? styles.groupHeaderCell : ""}`}
                      onClick={
                        !isSelect && !header.isPlaceholder
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                      style={{
                        ...stickyStyles,
                        cursor: header.column.getCanSort()
                          ? "pointer"
                          : "default",
                        width: isSelect ? "48px" : fitContainer ? undefined : header.getSize(),
                      }}
                    >
                      {!header.isPlaceholder && (
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
                      )}
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
                        const stickyStyles = getStickyStyles(cell.column);
                        const isFrozen = !!stickyStyles.position;

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
                            style={stickyStyles}
                            className={`${isSelect ? styles.selectionCell : styles.tableCell} ${isFrozen ? styles.frozenCell : ""}`}
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
                  {isLoading ? resolvedLoadingText : resolvedNoResultsText}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className={styles.tableFooter}>
        <div className={styles.footerLeft}>
          {renderBottomLeft?.()}
          {(paginationRangeLabel || pageSizeOptions?.length) && (
            <div className={styles.paginationDetails}>
              {paginationRangeLabel?.({
                from: rangeFrom,
                to: rangeTo,
                total: totalRows,
              })}
              {pageSizeOptions && pageSizeOptions.length > 0 && (
                <label className={styles.pageSizeControl}>
                  <span>{pageSizeLabel}</span>
                  <select
                    value={paginationState.pageSize}
                    onChange={(event) => table.setPageSize(Number(event.target.value))}
                    aria-label={typeof pageSizeLabel === "string" ? pageSizeLabel : undefined}
                  >
                    {pageSizeOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}
        </div>
        <div className={styles.pagination}>
          <button
            onClick={() => table.previousPage()}
            disabled={isLoading || !table.getCanPreviousPage()}
          >
            {t("common.previous")}
          </button>
          <span>
            {paginationLabel ?? <>
              {t("common.page")} {totalPages === 0 ? 0 : paginationState.pageIndex + 1}{" "}
              {t("common.of")} {totalPages}
            </>}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={isLoading || !(canNextPage ?? table.getCanNextPage())}
          >
            {t("common.next")}
          </button>
        </div>
      </div>
    </div>
  );
};
