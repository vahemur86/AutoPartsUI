import type { Warehouse } from "@/types/settings";
import { IconButton } from "@/ui-kit";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import styles from "../WarehouseSettings/WarehouseSettings.module.css";

const columnHelper = createColumnHelper<Warehouse>();

export const getWarehouseColumns = (
  onEdit?: (warehouse: Warehouse) => void,
  onDelete?: (warehouseId: number) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ColumnDef<Warehouse, any>[] => [
  columnHelper.accessor("id", {
    header: "ID",
  }),
  columnHelper.accessor("code", {
    header: "Code",
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const warehouse = row.original;
      return (
        <div className={styles.actionButtonsCell}>
          {onEdit && (
            <IconButton
              variant="secondary"
              size="small"
              icon={<Pencil size={14} />}
              ariaLabel="Edit warehouse"
              onClick={() => onEdit(warehouse)}
            />
          )}
          {onDelete && (
            <IconButton
              variant="secondary"
              size="small"
              icon={<Trash2 size={14} />}
              ariaLabel="Delete warehouse"
              onClick={() => onDelete(warehouse.id)}
            />
          )}
        </div>
      );
    },
  }),
];
