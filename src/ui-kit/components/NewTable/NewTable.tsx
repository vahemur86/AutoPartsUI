// import { useState, useMemo } from "react";
// import {
//   useReactTable,
//   getCoreRowModel,
//   getPaginationRowModel,
//   getSortedRowModel,
//   flexRender,
//   type ColumnDef,
//   type SortingState,
// } from "@tanstack/react-table";
// import { Trash2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHeader,
//   TableRow,
// } from "./NewTableData";
// import styles from "./NewTable.module.css";

// interface DataTableProps<TData, TValue> {
//   columns: ColumnDef<TData, TValue>[];
//   data: TData[];
//   variant?: "front" | "rear";
//   pageSize?: number;
//   manualPagination?: boolean;
//   pageCount?: number;
//   pageIndex?: number;
//   onPaginationChange?: (pageIndex: number) => void;
//   onAddRow?: () => void;
//   onDeleteRow?: (id: string) => void;
// }

// export const DataTable = <TData, TValue>({
//   columns,
//   data,
//   variant = "front",
//   pageSize = 10,
//   manualPagination = false,
//   pageCount,
//   pageIndex: controlledPageIndex,
//   onPaginationChange,
//   onAddRow,
//   onDeleteRow,
// }: DataTableProps<TData, TValue>) => {
//   const [sorting, setSorting] = useState<SortingState>([]);
//   const [internalPagination, setInternalPagination] = useState({
//     pageIndex: 0,
//     pageSize,
//   });

//   const pagination = useMemo(() => {
//     if (manualPagination && controlledPageIndex !== undefined) {
//       return { pageIndex: controlledPageIndex, pageSize };
//     }
//     return internalPagination;
//   }, [manualPagination, controlledPageIndex, pageSize, internalPagination]);

//   const table = useReactTable({
//     data,
//     columns,
//     state: { sorting, pagination },
//     onSortingChange: setSorting,
//     onPaginationChange: (updater) => {
//       const next =
//         typeof updater === "function" ? updater(pagination) : updater;
//       if (manualPagination) {
//         onPaginationChange?.(next.pageIndex);
//       } else {
//         setInternalPagination(next);
//       }
//     },
//     getCoreRowModel: getCoreRowModel(),
//     getSortedRowModel: getSortedRowModel(),
//     getPaginationRowModel: manualPagination
//       ? undefined
//       : getPaginationRowModel(),
//     manualPagination,
//     pageCount: manualPagination ? pageCount : undefined,
//   });

//   return (
//     <div className={styles.mainContainer}>
//       <Table>
//         <TableHeader>
//           {table.getHeaderGroups().map((headerGroup) => (
//             <TableRow
//               key={headerGroup.id}
//               style={{ background: "transparent" }}
//             >
//               {headerGroup.headers.map((header) => (
//                 <TableCell
//                   key={header.id}
//                   asHeader
//                   onClick={header.column.getToggleSortingHandler()}
//                   style={{
//                     cursor: header.column.getCanSort() ? "pointer" : "default",
//                   }}
//                 >
//                   {flexRender(
//                     header.column.columnDef.header,
//                     header.getContext(),
//                   )}
//                   {{ asc: " 🔼", desc: " 🔽" }[
//                     header.column.getIsSorted() as string
//                   ] ?? null}
//                 </TableCell>
//               ))}
//               <TableCell asHeader />
//             </TableRow>
//           ))}
//         </TableHeader>
//         <TableBody>
//           {table.getRowModel().rows.map((row) => (
//             <TableRow key={row.id}>
//               {row.getVisibleCells().map((cell) => {
//                 const isSide = cell.column.id === "side";
//                 return (
//                   <TableCell key={cell.id}>
//                     <div
//                       className={
//                         isSide
//                           ? `${styles.sideBadge} ${variant === "front" ? styles.sideGreen : styles.sideBlue}`
//                           : styles.cellField
//                       }
//                     >
//                       {flexRender(
//                         cell.column.columnDef.cell,
//                         cell.getContext(),
//                       )}
//                     </div>
//                   </TableCell>
//                 );
//               })}
//               <TableCell>
//                 <button
//                   className={styles.deleteButton}
//                   onClick={() => onDeleteRow?.((row.original as any).id)}
//                 >
//                   <Trash2 size={16} />
//                 </button>
//               </TableCell>
//             </TableRow>
//           ))}
//         </TableBody>
//       </Table>

//       <div className={styles.tableFooter}>
//         {onAddRow && (
//           <button
//             className={`${styles.addBucketBtn} ${variant === "rear" ? styles.rearVariant : ""}`}
//             onClick={onAddRow}
//           >
//             <Plus size={18} />
//             Add {variant === "front" ? "Front" : "Rear"} Bucket
//           </button>
//         )}

//         <div className={styles.paginationControls}>
//           <button
//             onClick={() => table.previousPage()}
//             disabled={!table.getCanPreviousPage()}
//           >
//             <ChevronLeft size={18} />
//           </button>
//           <span>
//             {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
//           </span>
//           <button
//             onClick={() => table.nextPage()}
//             disabled={!table.getCanNextPage()}
//           >
//             <ChevronRight size={18} />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };
