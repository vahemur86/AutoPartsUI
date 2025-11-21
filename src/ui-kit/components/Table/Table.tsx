import React from "react";
import styles from "./Table.module.css";

export interface TableProps
  extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export interface TableHeaderProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

export interface TableBodyProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

export interface TableRowProps
  extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
}

export interface TableCellProps
  extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children?: React.ReactNode;
  asHeader?: boolean;
}

export const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <div className={styles.tableWrapper}>
        <table ref={ref} className={`${styles.table} ${className}`} {...props}>
          {children}
        </table>
      </div>
    );
  }
);

Table.displayName = "Table";

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  TableHeaderProps
>(({ children, className = "", ...props }, ref) => {
  return (
    <thead
      ref={ref}
      className={`${styles.tableHeader} ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
});

TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  TableBodyProps
>(({ children, className = "", ...props }, ref) => {
  return (
    <tbody ref={ref} className={`${styles.tableBody} ${className}`} {...props}>
      {children}
    </tbody>
  );
});

TableBody.displayName = "TableBody";

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <tr ref={ref} className={`${styles.tableRow} ${className}`} {...props}>
        {children}
      </tr>
    );
  }
);

TableRow.displayName = "TableRow";

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ children, className = "", asHeader = false, ...props }, ref) => {
    const Component = asHeader ? "th" : "td";
    return (
      <Component
        ref={ref as any}
        className={`${styles.tableCell} ${
          asHeader ? styles.tableCellHeader : ""
        } ${className}`}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

TableCell.displayName = "TableCell";
