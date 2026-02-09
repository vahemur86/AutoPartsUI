import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import i18next from "i18next";
import { useRef, useEffect, memo } from "react";

// ui-kit
import { TextField, Button } from "@/ui-kit";

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

interface ProductInputCellProps {
  productId: number;
  field: keyof ProductInputs;
  value: string;
  onInputChange: (
    productId: number,
    field: keyof ProductInputs,
    value: string,
  ) => void;
  focusedInputRef: RefObject<{
    productId: number;
    field: keyof ProductInputs;
  } | null>;
  isLoading: boolean;
}

const ProductInputCell = memo(
  ({
    productId,
    field,
    value,
    onInputChange,
    focusedInputRef,
    isLoading,
  }: ProductInputCellProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const shouldRestoreFocus = useRef(false);

    useEffect(() => {
      if (
        focusedInputRef.current?.productId === productId &&
        focusedInputRef.current?.field === field &&
        inputRef.current
      ) {
        shouldRestoreFocus.current = true;
        // Use double requestAnimationFrame to ensure focus happens after DOM update
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (inputRef.current && shouldRestoreFocus.current) {
              inputRef.current.focus();
              const length = inputRef.current.value.length;
              inputRef.current.setSelectionRange(length, length);
              focusedInputRef.current = null;
              shouldRestoreFocus.current = false;
            }
          });
        });
      }
    }, [productId, field, focusedInputRef, value]);

    return (
      <div className={styles.inputCell}>
        <TextField
          ref={inputRef}
          type="number"
          value={value}
          onChange={(e) => {
            if (document.activeElement === inputRef.current) {
              focusedInputRef.current = { productId, field };
            }
            onInputChange(productId, field, e.target.value);
          }}
          onFocus={() => {
            focusedInputRef.current = { productId, field };
          }}
          placeholder="0"
          min="0"
          step="1"
          disabled={isLoading}
        />
      </div>
    );
  },
);

ProductInputCell.displayName = "ProductInputCell";

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
      const currentValue = productInputs[productId]?.originalPrice ?? "";
      return (
        <ProductInputCell
          productId={productId}
          field="originalPrice"
          value={currentValue}
          onInputChange={onInputChange}
          focusedInputRef={focusedInputRef}
          isLoading={isLoading}
        />
      );
    },
  }),
  columnHelper.display({
    id: "salePrice",
    header: i18next.t("warehouses.addProduct.columns.salePrice"),
    cell: ({ row }) => {
      const productId = row.original.id;
      const currentValue = productInputs[productId]?.salePrice ?? "";
      return (
        <ProductInputCell
          productId={productId}
          field="salePrice"
          value={currentValue}
          onInputChange={onInputChange}
          focusedInputRef={focusedInputRef}
          isLoading={isLoading}
        />
      );
    },
  }),
  columnHelper.display({
    id: "quantity",
    header: i18next.t("warehouses.addProduct.columns.quantity"),
    cell: ({ row }) => {
      const productId = row.original.id;
      const currentValue = productInputs[productId]?.quantity ?? "";
      return (
        <ProductInputCell
          productId={productId}
          field="quantity"
          value={currentValue}
          onInputChange={onInputChange}
          focusedInputRef={focusedInputRef}
          isLoading={isLoading}
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
