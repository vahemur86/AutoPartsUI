import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import i18next from "i18next";

// ui-kit
import { IconButton } from "@/ui-kit";

// icons
import { Pencil } from "lucide-react";

// types
import type { IronProduct } from "@/store/slices/adminProductsSlice";

// styles
import styles from "@/components/products/General/Content.module.css";

const columnHelper = createColumnHelper<IronProduct>();

interface ColumnHandlers {
  onEdit: (
    product: IronProduct,
    buttonRef: React.RefObject<HTMLElement>,
  ) => void;
}

export const getIronProductColumns = ({
  onEdit,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
}: ColumnHandlers): ColumnDef<IronProduct, any>[] => {
  return [
    columnHelper.accessor("id", {
      header: "ID",
      cell: (info) => `#${info.getValue()}`,
    }),
    columnHelper.accessor("code", {
      header: i18next.t("products.columns.code"),
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("name", {
      header: i18next.t("products.columns.name"),
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("unitPrice", {
      header: i18next.t("products.columns.price"),
      cell: (info) => `${info.getValue()?.toLocaleString() ?? 0} AMD`,
    }),
    columnHelper.display({
      id: "actions",
      header: i18next.t("common.actions"),
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
          </div>
        );
      },
    }),
  ];
};
