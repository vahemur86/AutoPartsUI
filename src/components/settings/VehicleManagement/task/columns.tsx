import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import i18next from "i18next";
// ui-kit
import { Button } from "@/ui-kit";
// types
import type { Task } from "@/types/settings";
// styles
import styles from "../VehicleManagement.module.css";

const columnHelper = createColumnHelper<Task>();

export const getTaskColumns = (
  {
    withEdit,
    withDelete,
    onEdit,
    onDelete,
  }: {
    withEdit: boolean;
    withDelete: boolean;
    onEdit: (task: Task, e: React.MouseEvent<HTMLElement>) => void;
    onDelete: (task: Task) => void;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ColumnDef<Task, any>[] => [
  columnHelper.accessor("code", {
    header: i18next.t("vehicles.tasks.columns.code"),
  }),
  columnHelper.accessor("laborCost", {
    header: i18next.t("vehicles.tasks.columns.laborCost"),
    cell: (info) => `$${info.getValue()}`,
  }),
  columnHelper.accessor("isActive", {
    header: i18next.t("vehicles.tasks.columns.status"),
    cell: (info) =>
      `${info.getValue() === true ? i18next.t("vehicles.tasks.columns.active") : i18next.t("vehicles.tasks.columns.inactive")}`,
  }),
  columnHelper.display({
    id: "actions",
    header: i18next.t("common.actions"),
    cell: ({ row }) => {
      const task = row.original;
      return (
        <div className={styles.actionButtonsCell}>
          {withEdit && (
            <Button
              variant="primary"
              size="small"
              onClick={(e) => onEdit(task, e)}
            >
              {i18next.t("common.edit")}
            </Button>
          )}
          {withDelete && (
            <Button
              variant="danger"
              size="small"
              onClick={() => onDelete(task)}
            >
              {i18next.t("common.delete")}
            </Button>
          )}
        </div>
      );
    },
  }),
];
