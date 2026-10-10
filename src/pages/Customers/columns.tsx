import type { MouseEvent } from "react";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";

// types
import type { Customer } from "@/types/operator";
import styles from "./Customers.module.css";

const columnHelper = createColumnHelper<Customer>();

export const getCustomerColumns = ({
  onEdit,
  onDelete,
  t,
}: {
  onEdit: (customer: Customer, e: MouseEvent<HTMLElement>) => void;
  onDelete: (customer: Customer) => void;
  t: (key: string) => string;
// TanStack column accessors have distinct value types; DataTable infers this generic.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}): ColumnDef<Customer, any>[] => [
  columnHelper.accessor("id", {
    header: t("customers.columns.id"),
    cell: (info) => info.getValue(),
  }),

  columnHelper.accessor("phone", {
    header: t("customers.columns.phone"),
    cell: (info) => info.getValue() || "-",
  }),

  columnHelper.accessor("fullName", {
    header: t("customers.form.fullName"),
    cell: (info) => info.getValue() || "-",
  }),

  columnHelper.accessor("customerType.code", {
    id: "customerType",
    header: t("customers.columns.customerType"),
    cell: (info) => info.getValue() || "-",
  }),

  columnHelper.accessor("customerType.bonusPercent", {
    id: "bonusPercent",
    header: t("customers.columns.bonusPercent"),
    cell: (info) => {
      const value = info.getValue();
      return value !== undefined ? `${Math.round(value * 100)}%` : "-";
    },
  }),

  columnHelper.accessor("customerType.isActive", {
    id: "isActive",
    header: t("customers.columns.isActive"),
    cell: (info) => {
      const isActive = info.getValue();
      if (isActive === undefined) return "-";
      return (
        <span className={`${styles.statusBadge} ${isActive ? "" : styles.statusInactive}`}>
          {isActive ? t("common.active") : t("common.inactive")}
        </span>
      );
    },
  }),

  columnHelper.display({
    id: "actions",
    header: t("common.actions"),
    cell: ({ row }) => (
      <div className={styles.rowActions}>
        <button
          type="button"
          className={styles.iconAction}
          onClick={(event) => {
            event.stopPropagation();
            onEdit(row.original, event);
          }}
          aria-label={t("common.edit")}
          title={t("common.edit")}
        >
          <Pencil size={15} />
        </button>
        <button
          type="button"
          className={`${styles.iconAction} ${styles.iconActionDanger}`}
          onClick={(event) => {
            event.stopPropagation();
            onDelete(row.original);
          }}
          aria-label={t("common.delete")}
          title={t("common.delete")}
        >
          <Trash2 size={15} />
        </button>
      </div>
    ),
  }),
];
