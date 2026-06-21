import {
  createColumnHelper,
  type ColumnDef,
  type Row,
} from "@tanstack/react-table";
import i18next from "i18next";

// types
import type { ShopProductItem } from "@/types/warehouses/warehouseProduct";
import styles from "./ShopProducts.module.css";

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
  ({
    onProductClick,
    getProductCode,
  }: {
    onProductClick: (row: Row<ShopProductItem>) => void;
    getProductCode: (row: ShopProductItem) => string;
  }): ColumnDef<ShopProductItem, any>[] =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [
    columnHelper.accessor("id", {
      header: "ID",
      cell: (info) => `#${info.getValue()}`,
    }),
    columnHelper.accessor("productId", {
      header: i18next.t("shops.products.columns.productId", {
        defaultValue: "Product ID",
      }),
      cell: (info) => (
        <button
          type="button"
          className={styles.productIdButton}
          onClick={() => onProductClick(info.row)}
        >
          #{info.getValue() || "-"}
        </button>
      ),
    }),
    columnHelper.display({
      id: "productKey",
      header: i18next.t("products.columns.productKey"),
      cell: ({ row }) => getProductCode(row.original),
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
      cell: (info) => (info.getValue() ? formatDate(info.getValue()) : "-"),
    }),
  ];
