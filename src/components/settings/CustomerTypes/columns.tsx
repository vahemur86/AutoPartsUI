import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import i18next from "i18next";

// ui-kit
import { Button } from "@/ui-kit";

// types
import type { CustomerType } from "@/types/settings";

// styles
import styles from "./CustomerTypes.module.css";

const columnHelper = createColumnHelper<CustomerType>();

export const getCustomerTypeColumns = (
  {
    onEdit,
  }: {
    onEdit: (
      customerType: CustomerType,
      e: React.MouseEvent<HTMLElement>,
    ) => void;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ColumnDef<CustomerType, any>[] => [
  columnHelper.accessor("code", {
    header: i18next.t("customerTypes.columns.code"),
  }),
  columnHelper.accessor("isDefault", {
    header: i18next.t("customerTypes.columns.isDefault"),
    cell: (info) =>
      info.getValue()
        ? i18next.t("common.yes")
        : i18next.t("common.no"),
  }),
  columnHelper.accessor("bonusPercent", {
    header: i18next.t("customerTypes.columns.bonusPercent"),
    cell: (info) => `${info.getValue()}%`,
  }),
  columnHelper.accessor("isActive", {
    header: i18next.t("customerTypes.columns.status"),
    cell: (info) =>
      info.getValue()
        ? i18next.t("common.active")
        : i18next.t("common.inactive"),
  }),
  columnHelper.display({
    id: "actions",
    header: i18next.t("common.actions"),
    cell: ({ row }) => (
      <div className={styles.actionButtonsCell}>
        <Button
          variant="primary"
          size="small"
          onClick={(e) => onEdit(row.original, e)}
        >
          {i18next.t("common.edit")}
        </Button>
      </div>
    ),
  }),
];

