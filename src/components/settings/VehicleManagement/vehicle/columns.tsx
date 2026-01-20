import type { ColumnDef } from "@tanstack/react-table";
import i18next from "i18next";
import { Button } from "@/ui-kit";
import styles from "../VehicleManagement.module.css";
import type { Vehicle } from "@/types/settings";

export const getVehicleColumns = (
  withEdit: boolean,
  withDelete: boolean,
  onEdit: (vehicle: Vehicle) => void,
  onDelete: (vehicle: Vehicle) => void
): ColumnDef<Vehicle>[] => [
  {
    accessorKey: "brand",
    header: i18next.t("vehicles.vehicles.columns.brand"),
  },
  {
    accessorKey: "model",
    header: i18next.t("vehicles.vehicles.columns.model"),
  },
  { accessorKey: "year", header: i18next.t("vehicles.vehicles.columns.year") },
  {
    accessorKey: "engine",
    header: i18next.t("vehicles.vehicles.columns.engine"),
  },
  {
    accessorKey: "fuelType",
    header: i18next.t("vehicles.vehicles.columns.fuelType"),
  },
  {
    id: "actions",
    header: i18next.t("common.actions"),
    enableSorting: false,
    cell: ({ row }) => {
      const vehicle = row.original;
      return (
        <div className={styles.actionButtonsCell}>
          {withEdit && (
            <Button
              variant="primary"
              size="small"
              aria-label={i18next.t("vehicles.ariaLabels.editVehicle")}
              onClick={() => onEdit(vehicle)}
            >
              {i18next.t("common.edit")}
            </Button>
          )}
          {withDelete && (
            <Button
              variant="danger"
              size="small"
              aria-label={i18next.t("vehicles.ariaLabels.deleteVehicle")}
              onClick={() => onDelete(vehicle)}
            >
              {i18next.t("common.delete")}
            </Button>
          )}
        </div>
      );
    },
  },
];
