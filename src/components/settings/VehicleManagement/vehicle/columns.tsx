import type { ColumnDef } from "@tanstack/react-table";
import i18next from "i18next";
import type { Vehicle } from "@/types/settings";

export const getVehicleColumns = (): ColumnDef<Vehicle>[] => [
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
    accessorKey: "market",
    header: i18next.t("vehicles.vehicles.columns.market"),
  },
  {
    accessorKey: "horsePower",
    header: i18next.t("vehicles.vehicles.columns.horsePower"),
  },
  {
    accessorKey: "driveType",
    header: i18next.t("vehicles.vehicles.columns.driveType"),
  },
];
