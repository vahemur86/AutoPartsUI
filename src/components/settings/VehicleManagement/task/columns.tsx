import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";

// ui-kit
import { Button } from "@/ui-kit";

// types
import type { Task } from "@/types/settings";

// styles
import styles from "../VehicleManagement.module.css";

const columnHelper = createColumnHelper<Task>();

export const getTaskColumns = (
  withEdit: boolean,
  withDelete: boolean,
  onEdit: (task: Task, e: React.MouseEvent<HTMLElement>) => void,
  onDelete: (task: Task) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ColumnDef<Task, any>[] => [
  columnHelper.accessor("code", {
    header: "Code",
  }),
  columnHelper.accessor("laborCost", {
    header: "Labor Cost (USD)",
    cell: (info) => `$${info.getValue()}`,
  }),
  columnHelper.accessor("isActive", {
    header: "Status",
    cell: (info) => `${info.getValue() === true ? "Active" : "Inactive"}`,
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
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
              Edit
            </Button>
          )}
          {withDelete && (
            <Button
              variant="danger"
              size="small"
              onClick={() => onDelete(task)}
            >
              Delete
            </Button>
          )}
        </div>
      );
    },
  }),
];
