import type { ColumnDef } from "@tanstack/react-table";
import type { Task } from "./types";
import { Button } from "@/ui-kit";
import styles from "../VehicleManagement.module.css";

export const getTaskColumns = (
  withEdit: boolean,
  withDelete: boolean,
  onEdit: (task: Task) => void,
  onDelete: (task: Task) => void,
): ColumnDef<Task>[] => [
  {
    accessorKey: "name",
    header: "Task / Service",
  },
  {
    accessorKey: "type",
    header: "Type",
  },
  {
    accessorKey: "laborCost",
    header: "Labor Cost (USD)",
    cell: (info) => `$${info.getValue<number>()}`,
  },
  {
    accessorKey: "linkedVehiclesCount",
    header: "Linked to Vehicles",
    cell: (info) => {
      const value = info.getValue<number | null>();
      return value ? `${value} Vehicles` : "No";
    },
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => {
      const task = row.original;

      return (
        <div className={styles.actionButtonsCell}>
          {withEdit && (
            <Button
              variant="primary"
              size="small"
              aria-label="Edit task"
              onClick={() => onEdit(task)}
            >
              Edit
            </Button>
          )}
          {withDelete && (
            <Button
              variant="secondary"
              size="small"
              aria-label="Delete task"
              onClick={() => onDelete(task)}
            >
              Delete
            </Button>
          )}
        </div>
      );
    },
  },
];
