// import { forwardRef, type HTMLAttributes, type TdHTMLAttributes } from "react";
// import styles from './NewTable.module.css'

// export const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
//   ({ children, className = "", ...props }, ref) => (
//     <div className={styles.tableWrapper}>
//       <table ref={ref} className={`${styles.table} ${className}`} {...props}>
//         {children}
//       </table>
//     </div>
//   )
// );

// export const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
//   ({ children, className = "", ...props }, ref) => (
//     <thead ref={ref} className={`${styles.tableHeader} ${className}`} {...props}>
//       {children}
//     </thead>
//   )
// );

// export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
//   ({ children, className = "", ...props }, ref) => (
//     <tbody ref={ref} {...props}>{children}</tbody>
//   )
// );

// export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
//   ({ children, className = "", ...props }, ref) => (
//     <tr ref={ref} className={`${styles.tableRow} ${className}`} {...props}>
//       {children}
//     </tr>
//   )
// );

// export const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement> & { asHeader?: boolean }>(
//   ({ children, className = "", asHeader = false, ...props }, ref) => {
//     const Component = asHeader ? "th" : "td";
//     return (
//       <Component
//         ref={ref}
//         className={`${asHeader ? styles.tableCellHeader : styles.tableCell} ${className}`}
//         {...props}
//       >
//         {children}
//       </Component>
//     );
//   }
// );
