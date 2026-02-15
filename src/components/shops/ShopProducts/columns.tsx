import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import i18next from "i18next";

// types
import type { ShopProductItem } from "@/types/warehouses/warehouseProduct";

const columnHelper = createColumnHelper<ShopProductItem>();

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch {
    return dateString;
  }
};

export const getShopProductColumns =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (): ColumnDef<ShopProductItem, any>[] => [
    columnHelper.accessor("id", {
      header: "ID",
      cell: (info) => `#${info.getValue()}`,
    }),
    columnHelper.accessor("productId", {
      header: i18next.t("shops.products.columns.productId"),
      cell: (info) => `#${info.getValue()}`,
    }),
    columnHelper.accessor("salePrice", {
      header: i18next.t("shops.products.columns.salePrice"),
      cell: (info) => info.getValue().toFixed(2),
    }),
    columnHelper.accessor("quantity", {
      header: i18next.t("shops.products.columns.quantity"),
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("createdAt", {
      header: i18next.t("shops.products.columns.createdAt"),
      cell: (info) => formatDate(info.getValue()),
    }),
    columnHelper.accessor("updatedAt", {
      header: i18next.t("shops.products.columns.updatedAt"),
      cell: (info) => formatDate(info.getValue()),
    }),
  ];
