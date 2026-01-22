import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import i18next from "i18next";

// ui-kit
import { Button } from "@/ui-kit";

// types
import type { Vehicle } from "@/types/settings";

// styles
import styles from "../VehicleManagement.module.css";

const columnHelper = createColumnHelper<Vehicle>();

export const getVehicleColumns = ({
  onViewBuckets,
  onCalculatePrice,
}: {
  onViewBuckets: (vehicle: Vehicle, e: React.MouseEvent<HTMLElement>) => void;
  onCalculatePrice: (vehicle: Vehicle) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): ColumnDef<Vehicle, any>[] => [
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
];
