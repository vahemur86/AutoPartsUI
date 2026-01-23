import { useState, useMemo } from "react";
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
}

export const DataTable = <TData, TValue>({
  columns,
  data,
  pageSize = 10,
  enableSelection = false,
}: DataTableProps<TData, TValue>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

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
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: pageSize,
      },
    },
  });

  return (
    <div className={styles.dataTableContainer}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const isSelect = header.id === "select";
                return (
                  <TableCell
                    key={header.id}
                    asHeader
                    className={isSelect ? styles.selectionCell : ""}
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
                        ({
                          asc: " 🔼",
                          desc: " 🔽",
                        }[header.column.getIsSorted() as string] ??
                          null)}
                    </div>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  const isSelect = cell.column.id === "select";
                  return (
                    <TableCell
                      key={cell.id}
                      className={isSelect ? styles.selectionCell : ""}
                    >
                      <div
                        className={isSelect ? styles.selectionCellContent : ""}
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
  );
};
