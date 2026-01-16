import { useMemo, type FC } from "react";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/ui-kit";
import styles from "./VehicleManagement.module.css";

interface TasksProps {
  withEdit?: boolean;
  withDelete?: boolean;
}

export const Tasks: FC<TasksProps> = ({
  withEdit = true,
  withDelete = true,
}) => {
  const tasksCells = useMemo(
    () => [
      { id: "task", label: "Task/Service" },
      { id: "type", label: "Type" },
      { id: "labor-cost", label: "Labor Cost (USD)" },
      { id: "linked-to-vehicles", label: "Linked to Vehicles" },
      { id: "actions", label: "" },
    ],
    []
  );

  const handleEdit = () => {
    console.log("Edit Clicked");
  };

  const handleDelete = () => {
    console.log("Delete Clicked");
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {tasksCells.map(({ id, label }) => (
            <TableCell key={id} asHeader>
              {label}
            </TableCell>
          ))}
        </TableRow>
      </TableHeader>

      <TableBody>
        <TableCell>Task/Service Value</TableCell>
        <TableCell>Type Value</TableCell>
        <TableCell>Labor Cost (USD) Value</TableCell>
        <TableCell>Linked to Vehicles Value</TableCell>

        <TableCell>
          <div className={styles.actionButtonsCell}>
            {withEdit && (
              <Button
                variant="primary"
                size="small"
                aria-label="Edit shop"
                onClick={handleEdit}
              >
                Edit
              </Button>
            )}

            {withDelete && (
              <Button
                variant="secondary"
                size="small"
                aria-label="Delete shop"
                onClick={handleDelete}
              >
                Delete
              </Button>
            )}
          </div>
        </TableCell>
      </TableBody>
    </Table>
  );
};
