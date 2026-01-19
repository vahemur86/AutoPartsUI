import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import i18next from "i18next";
// ui-kit
import { IconButton } from "@/ui-kit";
// types
import type { Shop, Warehouse } from "@/types/settings";
// styles
import styles from "../VehicleManagement/VehicleManagement.module.css";
import { Pencil, Trash2 } from "lucide-react";

const columnHelper = createColumnHelper<Shop>();

export const getShopColumns = (
  warehouses: Warehouse[],
  onEdit?: (shop: Shop) => void,
  onDelete?: (shopId: number) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ColumnDef<Shop, any>[] => {
  const getWarehouseCode = (warehouseId: number) => {
    const warehouse = warehouses.find((w) => w.id === warehouseId);
    return warehouse ? warehouse.code : warehouseId;
  };

  return [
    columnHelper.accessor("id", {
      header: i18next.t("columns.id"),
    }),
    columnHelper.accessor("code", {
      header: i18next.t("columns.code"),
    }),
    columnHelper.accessor("warehouseId", {
      header: i18next.t("columns.warehouseId"),
      cell: (info) => getWarehouseCode(info.getValue()),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const shop = row.original;
        return (
          <div className={styles.actionButtonsCell}>
            {onEdit && (
              <IconButton
                variant="secondary"
                size="small"
                icon={<Pencil size={14} />}
                ariaLabel={i18next.t("columns.editShop")}
                onClick={() => onEdit(shop)}
              />
            )}
            {onDelete && (
              <IconButton
                variant="secondary"
                size="small"
                icon={<Trash2 size={14} />}
                ariaLabel={i18next.t("columns.deleteShop")}
                onClick={() => onDelete(shop.id)}
              />
            )}
          </div>
        );
      },
    }),
  ];
};
