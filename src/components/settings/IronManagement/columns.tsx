import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import i18next from "i18next";

// types
import type {
  CarModel,
  IronType,
  IronPrice,
  IronTypePriceByCustomer,
} from "@/types/ironCarShop";

const columnHelper = createColumnHelper<CarModel>();
const ironTypeColumnHelper = createColumnHelper<IronType>();
const ironPriceColumnHelper = createColumnHelper<IronPrice & { customerTypeName?: string }>();
const ironTypePriceByCustomerHelper =
  createColumnHelper<IronTypePriceByCustomer>();

export const getCarModelColumns = (): ColumnDef<CarModel, any>[] => [
  columnHelper.accessor("id", {
    header: i18next.t("ironManagement.columns.id"),
  }),
  columnHelper.accessor("name", {
    header: i18next.t("ironManagement.columns.name"),
  }),
];

export const getIronTypeColumns = (): ColumnDef<IronType, any>[] => [
  ironTypeColumnHelper.accessor("id", {
    header: i18next.t("ironManagement.columns.id"),
  }),
  ironTypeColumnHelper.accessor("name", {
    header: i18next.t("ironManagement.columns.name"),
  }),
];

export const getIronPriceColumns = (): ColumnDef<IronPrice & { customerTypeName?: string }, any>[] => [
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

export const getIronTypePriceByCustomerColumns = (): ColumnDef<IronTypePriceByCustomer, any>[] => [
  ironTypePriceByCustomerHelper.accessor("customerTypeName", {
    header: i18next.t("ironManagement.columns.customerType"),
  }),
  ironTypePriceByCustomerHelper.accessor("pricePerKg", {
    header: i18next.t("ironManagement.columns.pricePerKg"),
    cell: (info) => info.getValue().toLocaleString(),
  }),
];

