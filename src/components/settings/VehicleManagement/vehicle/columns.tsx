import type { ColumnDef } from "@tanstack/react-table";
import type { Vehicle } from "./types";
import { Button } from "@/ui-kit";
import styles from "../VehicleManagement.module.css";

export const getVehicleColumns = (
  withEdit: boolean,
  withDelete: boolean,
  onEdit: (vehicle: Vehicle) => void,
  onDelete: (vehicle: Vehicle) => void
): ColumnDef<Vehicle>[] => [
  { accessorKey: "brand", header: "Brand" },
  { accessorKey: "model", header: "Model" },
  { accessorKey: "year", header: "Year" },
  { accessorKey: "engine", header: "Engine" },
  { accessorKey: "fuelType", header: "Fuel Type" },
  { accessorKey: "status", header: "Status" },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    cell: ({ row }) => {
      const vehicle = row.original;
      return (
        <div className={styles.actionButtonsCell}>
          {withEdit && (
            <Button
              variant="primary"
              size="small"
              aria-label="Edit vehicle"
              onClick={() => onEdit(vehicle)}
            >
              Edit
            </Button>
          )}
          {withDelete && (
            <Button
              variant="danger"
              size="small"
              aria-label="Delete vehicle"
              onClick={() => onDelete(vehicle)}
            >
              Delete
            </Button>
          )}
        </div>
      );
    },
  },
];
