import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import i18next from "i18next";

// types
import type { CarModel, IronType, IronPrice } from "@/types/ironCarShop";

const columnHelper = createColumnHelper<CarModel>();
const ironTypeColumnHelper = createColumnHelper<IronType>();
const ironPriceColumnHelper = createColumnHelper<
  IronPrice & { customerTypeName?: string }
>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getCarModelColumns = (): ColumnDef<CarModel, any>[] => [
  columnHelper.accessor("id", {
    header: i18next.t("ironManagement.columns.id"),
  }),
  columnHelper.accessor("name", {
    header: i18next.t("ironManagement.columns.name"),
  }),
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getIronTypeColumns = (): ColumnDef<IronType, any>[] => [
  ironTypeColumnHelper.accessor("id", {
    header: i18next.t("ironManagement.columns.id"),
  }),
  ironTypeColumnHelper.accessor("name", {
    header: i18next.t("ironManagement.columns.name"),
  }),
];

export const getIronPriceColumns = (): ColumnDef<
  IronPrice & { customerTypeName?: string },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
>[] => [
  ironPriceColumnHelper.accessor("id", {
    header: i18next.t("ironManagement.columns.id"),
  }),
  ironPriceColumnHelper.accessor("customerTypeName", {
    header: i18next.t("ironManagement.columns.customerType"),
  }),
  ironPriceColumnHelper.accessor("pricePerKg", {
    header: i18next.t("ironManagement.columns.pricePerKg"),
    cell: (info) => info.getValue().toLocaleString(),
  }),
];
