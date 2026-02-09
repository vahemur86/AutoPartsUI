import type { MouseEvent } from "react";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";

// ui-kit
import { Button } from "@/ui-kit";

// types
import type { Customer } from "@/types/operator";

const columnHelper = createColumnHelper<Customer>();

export const getCustomerColumns = ({
  onEdit,
  t,
}: {
  onEdit: (customer: Customer, e: MouseEvent<HTMLElement>) => void;
  t: (key: string) => string;
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
      return value !== undefined ? `${value * 100}%` : "-";
    },
  }),

  columnHelper.accessor("customerType.isActive", {
    id: "isActive",
    header: t("customers.columns.isActive"),
    cell: (info) => {
      const isActive = info.getValue();
      if (isActive === undefined) return "-";
      return isActive ? t("common.active") : t("common.inactive");
    },
  }),

  columnHelper.display({
    id: "actions",
    header: t("common.actions"),
    cell: ({ row }) => (
      <div style={{ display: "flex", gap: "12px" }}>
        <Button
          variant="primary"
          size="small"
          onClick={(e) => onEdit(row.original, e)}
        >
          {t("common.edit")}
        </Button>
      </div>
    ),
  }),
];
