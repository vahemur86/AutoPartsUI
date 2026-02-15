import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import i18next from "i18next";

// ui-kit
import { Button } from "@/ui-kit";

// components
import { ProductInputCell } from "./ProductInputCell";

// types
import type { Product } from "@/types/products";

// styles
import styles from "./AddProduct.module.css";
import type { RefObject } from "react";

const columnHelper = createColumnHelper<Product>();

interface ProductInputs {
  originalPrice: string;
  salePrice: string;
  quantity: string;
}

interface ColumnHandlers {
  onInputChange: (
    productId: number,
    field: keyof ProductInputs,
    value: string,
  ) => void;
  onAdd: (productId: number) => void;
  productInputs: Record<number, ProductInputs>;
  focusedInputRef: RefObject<{
    productId: number;
    field: keyof ProductInputs;
  } | null>;
  isLoading: boolean;
}

export const getProductColumns = ({
  onInputChange,
  onAdd,
  productInputs,
  focusedInputRef,
  isLoading,
}: ColumnHandlers): ColumnDef<Product, any>[] => [
  columnHelper.accessor("id", {
    header: "ID",
    cell: (info) => `#${info.getValue()}`,
  }),
  columnHelper.accessor("code", {
    header: i18next.t("warehouses.addProduct.columns.code"),
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("sku", {
    header: i18next.t("warehouses.addProduct.columns.sku"),
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("brand", {
    header: i18next.t("warehouses.addProduct.columns.brand"),
    cell: (info) => info.getValue()?.code || "-",
  }),
  columnHelper.accessor("category", {
    header: i18next.t("warehouses.addProduct.columns.category"),
    cell: (info) => info.getValue()?.code || "-",
  }),
  columnHelper.display({
    id: "originalPrice",
    header: i18next.t("warehouses.addProduct.columns.originalPrice"),
    cell: ({ row }) => {
      const productId = row.original.id;
      const currentValue = productInputs[productId]?.originalPrice;
      return (
        <ProductInputCell
          productId={productId}
          field="originalPrice"
          initialValue={currentValue}
          onInputChange={onInputChange}
          focusedInputRef={focusedInputRef}
          disabled={isLoading}
        />
      );
    },
  }),
  columnHelper.display({
    id: "salePrice",
    header: i18next.t("warehouses.addProduct.columns.salePrice"),
    cell: ({ row }) => {
      const productId = row.original.id;
      const currentValue = productInputs[productId]?.salePrice;
      return (
        <ProductInputCell
          productId={productId}
          field="salePrice"
          initialValue={currentValue}
          onInputChange={onInputChange}
          focusedInputRef={focusedInputRef}
          disabled={isLoading}
        />
      );
    },
  }),
  columnHelper.display({
    id: "quantity",
    header: i18next.t("warehouses.addProduct.columns.quantity"),
    cell: ({ row }) => {
      const productId = row.original.id;
      const currentValue = productInputs[productId]?.quantity;
      return (
        <ProductInputCell
          productId={productId}
          field="quantity"
          initialValue={currentValue}
          onInputChange={onInputChange}
          focusedInputRef={focusedInputRef}
          disabled={isLoading}
        />
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    header: i18next.t("common.actions"),
    cell: ({ row }) => {
      const productId = row.original.id;
      const inputs = productInputs[productId];
      const originalPrice = parseFloat(inputs?.originalPrice || "0");
      const salePrice = parseFloat(inputs?.salePrice || "0");
      const quantity = parseFloat(inputs?.quantity || "0");

      const isDisabled =
        isLoading ||
        !inputs ||
        !originalPrice ||
        !salePrice ||
        !quantity ||
        quantity <= 0;
      return (
        <div className={styles.actionButtonsCell}>
          <Button
            variant="primary"
            size="small"
            onClick={() => onAdd(productId)}
            disabled={isDisabled}
          >
            {i18next.t("common.add")}
          </Button>
        </div>
      );
    },
  }),
];
