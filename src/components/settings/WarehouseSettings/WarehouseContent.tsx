import { type FC, useMemo } from "react";
import { DataTable, TextField } from "@/ui-kit";
import styles from "./WarehouseSettings.module.css";
import type { Warehouse } from "@/types/settings";
import { getWarehouseColumns } from "./columns";

interface WarehouseContentProps {
  activeTab: string;
  warehouseCode: string;
  setWarehouseCode: (code: string) => void;
  warehouses: Warehouse[];
  isLoading: boolean;
  onEdit?: (warehouse: Warehouse) => void;
  onDelete?: (warehouseId: number) => void;
}

export const WarehouseContent: FC<WarehouseContentProps> = ({
  activeTab,
  warehouseCode,
  setWarehouseCode,
  warehouses,
  isLoading,
  onEdit,
  onDelete,
}) => {
  const columns = useMemo(
    () => getWarehouseColumns(onEdit, onDelete),
    [onEdit, onDelete]
  );

  return (
    <div className={styles.warehouseNameSection}>
      {activeTab === "add-new" && (
        <TextField
          placeholder="Type"
          label="Warehouse key"
          value={warehouseCode}
          onChange={(e) => setWarehouseCode(e.target.value)}
          disabled={isLoading}
        />
      )}

      {activeTab === "warehouses-history" && (
        <div className={styles.historyContainer}>
          {isLoading ? (
            <div className={styles.loadingState}>Loading warehouses...</div>
          ) : warehouses.length === 0 ? (
            <div className={styles.emptyState}>No warehouses found. </div>
          ) : (
            <DataTable data={warehouses} columns={columns} pageSize={10} />
          )}
        </div>
      )}
    </div>
  );
};
