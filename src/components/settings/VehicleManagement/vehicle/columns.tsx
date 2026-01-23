import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import i18next from "i18next";

// ui-kit
import { Button } from "@/ui-kit";

// types
import type { Vehicle } from "@/types/settings";

// styles
import styles from "../VehicleManagement.module.css";

const columnHelper = createColumnHelper<Vehicle>();

interface GetVehicleColumnsProps {
  onViewBuckets: (vehicle: Vehicle, e: React.MouseEvent<HTMLElement>) => void;
  onCalculatePrice: (vehicle: Vehicle) => void;
  isSuperAdmin: boolean;
}

export const getVehicleColumns = ({
  onViewBuckets,
  onCalculatePrice,
  isSuperAdmin,
}: GetVehicleColumnsProps): ColumnDef<Vehicle, unknown>[] => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: ColumnDef<Vehicle, any>[] = [
    columnHelper.accessor("brand", {
      header: i18next.t("vehicles.vehicles.columns.brand"),
    }),
    columnHelper.accessor("model", {
      header: i18next.t("vehicles.vehicles.columns.model"),
    }),
    columnHelper.accessor("year", {
      header: i18next.t("vehicles.vehicles.columns.year"),
    }),
    columnHelper.accessor("engine", {
      header: i18next.t("vehicles.vehicles.columns.engine"),
    }),
    columnHelper.accessor("fuelType", {
      header: i18next.t("vehicles.vehicles.columns.fuelType"),
    }),
    columnHelper.accessor("market", {
      header: i18next.t("vehicles.vehicles.columns.market"),
    }),
    columnHelper.accessor("horsePower", {
      header: i18next.t("vehicles.vehicles.columns.horsePower"),
    }),
    columnHelper.accessor("driveType", {
      header: i18next.t("vehicles.vehicles.columns.driveType"),
    }),
  ];

  // Action buttons are only visible if the user is a SuperAdmin
  if (isSuperAdmin) {
    columns.push(
      columnHelper.display({
        id: "actions",
        header: i18next.t("common.actions"),
        cell: ({ row }) => {
          const vehicle = row.original;
          return (
            <div className={styles.actionButtonsCell}>
              <Button
                variant="secondary"
                size="small"
                onClick={(e) => onViewBuckets(vehicle, e)}
              >
                {i18next.t("vehicles.vehicles.actions.viewBuckets")}
              </Button>
              <Button
                variant="primary"
                size="small"
                onClick={() => onCalculatePrice(vehicle)}
              >
                {i18next.t("vehicles.vehicles.actions.calculatePrice")}
              </Button>
            </div>
          );
        },
      }),
    );
  }

  return columns;
};
