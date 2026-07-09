import { type FC, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { DataTable, TextField } from "@/ui-kit";
import styles from "./WarehouseSettings.module.css";
import type { Warehouse } from "@/types/settings";
import { getWarehouseColumns } from "./columns";

interface WarehouseContentProps {
  actionButtons?: ReactNode;
  activeTab: string;
  warehouseCode: string;
  setWarehouseCode: (code: string) => void;
  warehouses: Warehouse[];
  isLoading: boolean;
  onEdit?: (warehouse: Warehouse) => void;
  onDelete?: (warehouseId: number) => void;
}

export const WarehouseContent: FC<WarehouseContentProps> = ({
  actionButtons,
  activeTab,
  warehouseCode,
  setWarehouseCode,
  warehouses,
  isLoading,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const columns = useMemo(
    () => getWarehouseColumns({ onEdit, onDelete }),
    [onEdit, onDelete],
  );

  return (
    <div className={styles.warehouseNameSection}>
      {activeTab === "add-new" && (
        <>
          {actionButtons}

          <TextField
            placeholder={t("warehouses.form.type")}
            label={t("warehouses.form.warehouseKey")}
            value={warehouseCode}
            onChange={(e) => setWarehouseCode(e.target.value)}
            disabled={isLoading}
          />
        </>
      )}

      {activeTab === "warehouses-history" && (
        <div className={styles.historyContainer}>
          {isLoading ? (
            <div className={styles.tableSkeleton} aria-busy="true" aria-live="polite">
              <div className={styles.tableSkeletonHeader}>
                <div className={`${styles.skeletonLine} ${styles.skeletonLineWide}`} />
                <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
              </div>
              <div className={styles.tableSkeletonRows}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className={styles.tableSkeletonRow}>
                    <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
                    <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
                    <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                  </div>
                ))}
              </div>
            </div>
          ) : warehouses.length === 0 ? (
            <div className={styles.emptyState}>
              {t("warehouses.emptyState")}
            </div>
          ) : (
            <DataTable data={warehouses} columns={columns} pageSize={10} />
          )}
        </div>
      )}
    </div>
  );
};
