import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import i18next from "i18next";

// types
import type { WarehouseProductItem } from "@/types/warehouses/warehouseProduct";

const columnHelper = createColumnHelper<WarehouseProductItem>();

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch {
    return dateString;
  }
};

export const getWarehouseProductColumns =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (): ColumnDef<WarehouseProductItem, any>[] => [
    columnHelper.accessor("id", {
      header: "ID",
      cell: (info) => `#${info.getValue()}`,
    }),
    columnHelper.accessor("productId", {
      header: i18next.t("warehouses.products.columns.productId"),
      cell: (info) => `#${info.getValue()}`,
    }),
    columnHelper.accessor("originalPrice", {
      header: i18next.t("warehouses.products.columns.originalPrice"),
      cell: (info) => info.getValue().toFixed(2),
    }),
    columnHelper.accessor("salePrice", {
      header: i18next.t("warehouses.products.columns.salePrice"),
      cell: (info) => info.getValue().toFixed(2),
    }),
    columnHelper.accessor("quantity", {
      header: i18next.t("warehouses.products.columns.quantity"),
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("createdAt", {
      header: i18next.t("warehouses.products.columns.createdAt"),
      cell: (info) => formatDate(info.getValue()),
    }),
    columnHelper.accessor("updatedAt", {
      header: i18next.t("warehouses.products.columns.updatedAt"),
      cell: (info) => formatDate(info.getValue()),
    }),
  ];
