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
  onEdit: (
    customer: Customer,
    e: React.MouseEvent<HTMLElement>,
  ) => void;
  t: (key: string) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): ColumnDef<Customer, any>[] => [
  columnHelper.accessor("id", {
    header: t("customers.columns.id"),
  }),
  columnHelper.accessor("phone", {
    header: t("customers.columns.phone"),
  }),
  columnHelper.accessor("customerType", {
    header: t("customers.columns.customerType"),
    cell: (info) => {
      const customerType = info.getValue();
      return customerType?.code || "-";
    },
  }),
  columnHelper.accessor("customerType", {
    id: "bonusPercent",
    header: t("customers.columns.bonusPercent"),
    cell: (info) => {
      const customerType = info.getValue();
      return customerType?.bonusPercent !== undefined
        ? `${customerType.bonusPercent}%`
        : "-";
    },
  }),
  columnHelper.accessor("customerType", {
    id: "isActive",
    header: t("customers.columns.isActive"),
    cell: (info) => {
      const customerType = info.getValue();
      return customerType?.isActive !== undefined
        ? customerType.isActive
          ? t("common.active")
          : t("common.inactive")
        : "-";
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

