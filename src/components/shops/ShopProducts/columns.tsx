import {
  createColumnHelper,
  type ColumnDef,
  type Row,
} from "@tanstack/react-table";
import { ChevronDown, ChevronRight } from "lucide-react";
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): ColumnDef<ShopProductItem, any>[] =>
  [
    columnHelper.accessor("id", {
      header: i18next.t("shops.products.columns.id"),
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
          aria-expanded={info.row.getIsExpanded()}
          aria-label={i18next.t("shops.products.toggleDetails", { id: info.getValue() || "-" })}
          title={i18next.t("shops.products.toggleDetails", { id: info.getValue() || "-" })}
        >
          <span className={styles.productIdText}>#{info.getValue() || "-"}</span>
          {info.row.getIsExpanded() ? <ChevronDown size={13} aria-hidden="true" /> : <ChevronRight size={13} aria-hidden="true" />}
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
      cell: (info) => Number(info.getValue() || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
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
