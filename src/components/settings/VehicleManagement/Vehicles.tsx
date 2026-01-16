import { useMemo, type FC } from "react";
import {
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/ui-kit";
import styles from "./VehicleManagement.module.css";
import { Plus } from "lucide-react";

interface VehiclesProps {
  withEdit?: boolean;
  withDelete?: boolean;
}

export const Vehicles: FC<VehiclesProps> = ({
  withEdit = true,
  withDelete = true,
}) => {
  const tasksCells = useMemo(
    () => [
      { id: "brand", label: "Brand" },
      { id: "model", label: "Model" },
      { id: "year", label: "Year" },
      { id: "engine", label: "Engine" },
      { id: "fuel-type", label: "Fuel Type" },
      { id: "status", label: "Status" },
      { id: "actions", label: "Actions" },
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
    <>
      <div className={styles.addNewButton}>
        <div
          // ref={addButtonDesktopWrapperRef}
          className={styles.addButtonWrapper}
        >
          <IconButton
            // ref={addButtonDesktopRef}
            variant="primary"
            size="small"
            icon={<Plus size={12} color="#0e0f11" />}
            ariaLabel="Add New"
            onClick={() => {}}
          />
          <span className={styles.addButtonText}>Add vehicle</span>
        </div>
      </div>

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
          <TableCell>Toyota</TableCell>
          <TableCell>Camry</TableCell>
          <TableCell>2018</TableCell>
          <TableCell>2.5L L4</TableCell>
          <TableCell>Gasoline</TableCell>
          <TableCell>Active</TableCell>

          <TableCell>
            <div className={styles.actionButtonsCell}>
              {withEdit && (
                <Button
                  variant="primary"
                  size="small"
                  aria-label="Edit vehicle"
                  onClick={handleEdit}
                >
                  Edit
                </Button>
              )}

              {withDelete && (
                <Button
                  variant="secondary"
                  size="small"
                  aria-label="Delete vehicle"
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              )}
            </div>
          </TableCell>
        </TableBody>
      </Table>
    </>
  );
};
