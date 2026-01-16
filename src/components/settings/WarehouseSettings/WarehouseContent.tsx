import { type FC } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TextField,
} from "@/ui-kit";
import styles from "./WarehouseSettings.module.css";
import type { Warehouse } from "@/types/settings";

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell asHeader>ID</TableCell>
                  <TableCell asHeader>Code</TableCell>
                  <TableCell asHeader></TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouses.map((warehouse) => (
                  <TableRow key={warehouse.id}>
                    <TableCell>{warehouse.id}</TableCell>
                    <TableCell>{warehouse.code}</TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
};
