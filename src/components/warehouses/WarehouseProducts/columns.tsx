import {
  createColumnHelper,
  type ColumnDef,
  type Row,
} from "@tanstack/react-table";
import i18next from "i18next";

// types
import type { WarehouseProductItem } from "@/types/warehouses/warehouseProduct";

// styles
import styles from "./WarehouseProducts.module.css";

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
  ({
    onProductClick,
    getProductCode,
  }: {
    onProductClick: (row: Row<WarehouseProductItem>) => void;
    getProductCode: (productId: number) => string;
  }): ColumnDef<WarehouseProductItem, any>[] =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [
    columnHelper.accessor("id", {
      header: "ID",
      cell: (info) => `#${info.getValue()}`,
    }),
    columnHelper.accessor("productId", {
      header: i18next.t("warehouses.products.columns.productId"),
      cell: (info) => (
        <button
          type="button"
          className={styles.productIdButton}
          onClick={() => onProductClick(info.row)}
        >
          #{info.getValue()}
        </button>
      ),
    }),
    columnHelper.display({
      id: "productKey",
      header: i18next.t("products.columns.productKey"),
      cell: ({ row }) => getProductCode(row.original.productId),
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
