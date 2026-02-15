import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import i18next from "i18next";

// ui-kit
import { IconButton } from "@/ui-kit";

// icons
import { Pencil, Trash2 } from "lucide-react";

// types
import type { Product } from "@/types/products";

// styles
import styles from "./ProductsContent.module.css";

const columnHelper = createColumnHelper<Product>();

interface ColumnHandlers {
  brands: Array<{ id: number; code: string }>;
  categories: Array<{ id: number; code: string }>;
  unitTypes: Array<{ id: number; code: string }>;
  boxSizes: Array<{ id: number; code: string }>;
  onEdit: (product: Product, buttonRef: React.RefObject<HTMLElement>) => void;
  onDelete: (productId: number) => void;
}

const getNameById = (
  id: number,
  items: Array<{ id: number; code: string }>,
): string => {
  const item = items.find((i) => i.id === id);
  return item?.code || `${i18next.t("products.idPrefix")}${id}`;
};

export const getProductColumns = ({
  brands,
  categories,
  unitTypes,
  boxSizes,
  onEdit,
  onDelete,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: ColumnHandlers): ColumnDef<Product, any>[] => {
  return [
    columnHelper.accessor("id", {
      header: i18next.t("products.columns.id"),
      cell: (info) => `#${info.getValue()}`,
    }),
    columnHelper.accessor("code", {
      header: i18next.t("products.columns.productKey"),
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("sku", {
      header: i18next.t("products.columns.sku"),
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("brandId", {
      header: i18next.t("products.columns.brand"),
      cell: (info) => getNameById(info.getValue(), brands),
    }),
    columnHelper.accessor("categoryId", {
      header: i18next.t("products.columns.category"),
      cell: (info) => getNameById(info.getValue(), categories),
    }),
    columnHelper.accessor("unitTypeId", {
      header: i18next.t("products.columns.unitType"),
      cell: (info) => getNameById(info.getValue(), unitTypes),
    }),
    columnHelper.accessor("boxSizeId", {
      header: i18next.t("products.columns.boxSize"),
      cell: (info) => getNameById(info.getValue(), boxSizes),
    }),
    columnHelper.accessor("vehicleDependent", {
      header: i18next.t("products.columns.vehicleDependent"),
      cell: (info) =>
        info.getValue() ? i18next.t("common.yes") : i18next.t("common.no"),
    }),
    columnHelper.display({
      id: "actions",
      header: i18next.t("products.columns.actions"),
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className={styles.actionsCell}>
            <IconButton
              variant="secondary"
              size="small"
              icon={<Pencil size={14} color="#ffffff" />}
              ariaLabel={i18next.t("common.edit")}
              onClick={(e) => {
                const buttonRef = {
                  current: e.currentTarget,
                } as React.RefObject<HTMLElement>;
                onEdit(product, buttonRef);
              }}
            />
            <IconButton
              variant="secondary"
              size="small"
              icon={<Trash2 size={14} color="#ffffff" />}
              ariaLabel={i18next.t("common.delete")}
              onClick={() => onDelete(product.id)}
            />
          </div>
        );
      },
    }),
  ];
};
