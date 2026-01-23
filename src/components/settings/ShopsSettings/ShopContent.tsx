import { type FC, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { DataTable, Select, TextField } from "@/ui-kit";
import styles from "./ShopsSettings.module.css";
import type { Warehouse, Shop } from "@/types/settings";
import { getShopColumns } from "./columns";

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
  const { t } = useTranslation();

  const columns = useMemo(
    () => getShopColumns({ warehouses, onEdit, onDelete }),
    [warehouses, onEdit, onDelete],
  );

  return (
    <div className={styles.shopNameSection}>
      {activeTab === "add-new" && (
        <div className={styles.formRow}>
          <div className={styles.formColumn}>
            <TextField
              label={t("shops.form.shopKey")}
              placeholder={t("shops.form.type")}
              value={shopKey}
              onChange={(e) => setShopKey(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className={styles.formColumn}>
            <Select
              label={t("shops.form.warehouse")}
              placeholder={t("shops.form.selectWarehouse")}
              value={warehouseId > 0 ? warehouseId.toString() : ""}
              onChange={(e) => setWarehouseId(Number(e.target.value))}
              disabled={isLoading}
            >
              <option value="">{t("shops.form.selectWarehouse")}</option>
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
            <div className={styles.loadingState}>{t("shops.loading")}</div>
          ) : shops.length === 0 ? (
            <div className={styles.emptyState}>{t("shops.emptyState")}</div>
          ) : (
            <DataTable data={shops} columns={columns} pageSize={10} />
          )}
        </div>
      )}
    </div>
  );
};
