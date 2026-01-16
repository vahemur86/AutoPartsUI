import { type FC } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  Select,
  TextField,
} from "@/ui-kit";
import styles from "./ShopsSettings.module.css";
import type { Warehouse, Shop } from "@/types/settings";

interface ShopContentProps {
  shopKey: string;
  setShopKey: (key: string) => void;
  activeTab: string;
  warehouseId: number;
  setWarehouseId: (id: number) => void;
  warehouses: Warehouse[];
  shops: Shop[];
  isLoading: boolean;
  onEdit?: (shop: Shop) => void;
  onDelete?: (shopId: number) => void;
}

export const ShopContent: FC<ShopContentProps> = ({
  shopKey,
  setShopKey,
  activeTab,
  warehouseId,
  setWarehouseId,
  warehouses,
  shops,
  isLoading,
  onEdit,
  onDelete,
}) => {
  const getWarehouseCode = (warehouseId: number) => {
    const warehouse = warehouses.find((w) => w.id === warehouseId);
    return warehouse ? warehouse.code : warehouseId;
  };

  return (
    <div className={styles.shopNameSection}>
      {activeTab === "add-new" && (
        <div className={styles.formRow}>
          <div className={styles.formColumn}>
            <TextField
              label="Shop key"
              placeholder="Type"
              value={shopKey}
              onChange={(e) => setShopKey(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className={styles.formColumn}>
            <Select
              label="Warehouse"
              placeholder="Select warehouse"
              value={warehouseId > 0 ? warehouseId.toString() : ""}
              onChange={(e) => setWarehouseId(Number(e.target.value))}
              disabled={isLoading}
            >
              <option value="">Select warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.code}
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}

      {activeTab === "shops-history" && (
        <div className={styles.historyContainer}>
          {isLoading ? (
            <div className={styles.loadingState}>Loading shops...</div>
          ) : shops.length === 0 ? (
            <div className={styles.emptyState}>No shops found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell asHeader>ID</TableCell>
                  <TableCell asHeader>Code</TableCell>
                  <TableCell asHeader>Warehouse ID</TableCell>
                  <TableCell asHeader></TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shops.map((shop) => (
                  <TableRow key={shop.id}>
                    <TableCell>{shop.id}</TableCell>
                    <TableCell>{shop.code}</TableCell>
                    <TableCell>{getWarehouseCode(shop.warehouseId)}</TableCell>
                    <TableCell>
                      <div className={styles.actionButtonsCell}>
                        {onEdit && (
                          <IconButton
                            variant="secondary"
                            size="small"
                            icon={<Pencil size={14} />}
                            ariaLabel="Edit shop"
                            onClick={() => onEdit(shop)}
                          />
                        )}
                        {onDelete && (
                          <IconButton
                            variant="secondary"
                            size="small"
                            icon={<Trash2 size={14} />}
                            ariaLabel="Delete shop"
                            onClick={() => onDelete(shop.id)}
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
