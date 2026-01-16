import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  type TableHTMLAttributes,
  type TdHTMLAttributes,
} from "react";
import styles from "./Table.module.css";

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

export interface TableHeaderProps
  extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export interface TableBodyProps
  extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
}

export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode;
  asHeader?: boolean;
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
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

export const TableHeader = forwardRef<
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

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <tbody
        ref={ref}
        className={`${styles.tableBody} ${className}`}
        {...props}
      >
        {children}
      </tbody>
    );
  }
);

TableBody.displayName = "TableBody";

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <tr ref={ref} className={`${styles.tableRow} ${className}`} {...props}>
        {children}
      </tr>
    );
  }
);

TableRow.displayName = "TableRow";

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
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
