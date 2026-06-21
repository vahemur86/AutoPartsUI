import {
  createColumnHelper,
  type ColumnDef,
  type Row,
} from "@tanstack/react-table";
import type { RefObject } from "react";
import i18next from "i18next";

// types
import type { WarehouseProductItem } from "@/types/warehouses/warehouseProduct";

// components
import { Checkbox } from "@/ui-kit";
import { QuantityInputCell } from "./QuantityInputCell";

// styles
import styles from "./TransferToShop.module.css";

const columnHelper = createColumnHelper<WarehouseProductItem>();

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch {
    return dateString;
  }
};

interface TransferColumnsMeta {
  selectedProducts: Set<number>;
  quantities: Record<number, string>;
  onToggleSelect: (productId: number) => void;
  onQuantityChange: (productId: number, quantity: string) => void;
  maxQuantity: (productId: number) => number;
  onProductClick: (row: Row<WarehouseProductItem>) => void;
  getProductCode: (productId: number) => string;
  focusedInputRef: RefObject<{
    productId: number;
  } | null>;
}

export const getTransferToShopColumns = (
  meta: TransferColumnsMeta,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ColumnDef<WarehouseProductItem, any>[] => [
  columnHelper.display({
    id: "select",
    header: () => {
      const allSelected = Boolean(
        meta.selectedProducts.size > 0 &&
        Array.from(meta.selectedProducts).every((productId) => {
          const quantity = meta.quantities[productId] || "1";
          const numQuantity = Number(quantity);
          const maxQty = meta.maxQuantity(productId);
          return numQuantity > 0 && numQuantity <= maxQty;
        }),
      );

      return <Checkbox checked={allSelected} disabled />;
    },
    cell: ({ row }) => {
      const productId = row.original.id;
      const isSelected = meta.selectedProducts.has(productId);

      return (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => {
              meta.onToggleSelect(productId);
            }}
          />
        </div>
      );
    },
    size: 48,
  }),
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
        onClick={() => meta.onProductClick(info.row)}
      >
        #{info.getValue()}
      </button>
    ),
  }),
  columnHelper.display({
    id: "productKey",
    header: i18next.t("products.columns.productKey"),
    cell: ({ row }) => meta.getProductCode(row.original.productId),
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
  columnHelper.display({
    id: "transferQuantity",
    header: i18next.t("warehouses.transfer.quantity"),
    cell: ({ row }) => {
      const product = row.original;
      const value = meta.quantities[product.id] || "";
      return (
        <QuantityInputCell
          productId={product.id}
          maxQuantity={product.quantity}
          value={value}
          onChange={(value) => meta.onQuantityChange(product.id, value)}
          focusedInputRef={meta.focusedInputRef}
        />
      );
    },
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
