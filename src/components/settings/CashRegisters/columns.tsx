import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import i18next from "i18next";

// ui-kit
import { Button } from "@/ui-kit";

// types
import type { CashRegister } from "@/types/settings";

// styles
import styles from "./CashRegisters.module.css";

const columnHelper = createColumnHelper<CashRegister>();

export const getCashRegisterColumns = (
  {
    onEdit,
    onDelete,
  }: {
    onEdit: (
      cashRegister: CashRegister,
      e: React.MouseEvent<HTMLElement>,
    ) => void;
    onDelete: (cashRegister: CashRegister) => void;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ColumnDef<CashRegister, any>[] => [
  columnHelper.accessor("code", {
    header: i18next.t("cashRegisters.columns.code"),
  }),
  columnHelper.accessor("description", {
    header: i18next.t("cashRegisters.columns.description"),
  }),
  columnHelper.accessor("shopId", {
    header: i18next.t("cashRegisters.columns.shopId"),
  }),
  columnHelper.accessor("isActive", {
    header: i18next.t("cashRegisters.columns.status"),
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
        <Button
          variant="danger"
          size="small"
          onClick={() => onDelete(row.original)}
        >
          {i18next.t("common.delete")}
        </Button>
      </div>
    ),
  }),
];

