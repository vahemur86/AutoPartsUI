import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
// ui-kit
import { ConfirmationModal, IconButton } from "@/ui-kit";
import { Check, Plus } from "lucide-react";
// components
import { WarehouseContent } from "./WarehouseContent";
// types
import type { Warehouse } from "@/types/settings";
// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchWarehouses,
  addWarehouse,
  updateWarehouseInStore,
  removeWarehouse,
} from "@/store/slices/warehousesSlice";
// utils
import { getErrorMessage } from "@/utils";
// styles
import styles from "./WarehouseSettings.module.css";

export const WarehouseSettings = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { warehouses, isLoading, error } = useAppSelector(
    (state) => state.warehouses,
  );

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [warehouseCode, setWarehouseCode] = useState("");
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(
    null,
  );
  const [deletingWarehouse, setDeletingWarehouse] = useState<Warehouse | null>(null);

  const handleAddWarehouse = useCallback(async () => {
    if (!warehouseCode.trim()) {
      toast.error(t("warehouses.validation.enterWarehouseCode"));
      return;
    }

    try {
      if (editingWarehouse) {
        // Update existing warehouse
        await dispatch(
          updateWarehouseInStore({
            id: editingWarehouse.id,
            code: warehouseCode.trim(),
          }),
        ).unwrap();

        toast.success(t("warehouses.success.warehouseUpdated"));
        setEditingWarehouse(null);
      } else {
        // Create new warehouse
        await dispatch(addWarehouse(warehouseCode.trim())).unwrap();
        toast.success(t("warehouses.success.warehouseCreated"));
      }

      setWarehouseCode("");
      setIsFormOpen(false);
    } catch (error: unknown) {
      console.error(error);
      toast.error(
        getErrorMessage(
          error,
          editingWarehouse
            ? t("warehouses.error.failedToUpdate")
            : t("warehouses.error.failedToCreate"),
        ),
      );
    }
  }, [warehouseCode, t, editingWarehouse, dispatch]);

  const handleCloseForm = useCallback(() => {
    setWarehouseCode("");
    setEditingWarehouse(null);
    setIsFormOpen(false);
  }, []);

  const handleOpenForm = useCallback(() => {
    setWarehouseCode("");
    setEditingWarehouse(null);
    setIsFormOpen(true);
  }, []);

  const confirmDeleteWarehouse = useCallback(async () => {
    if (!deletingWarehouse) return;
    try {
      await dispatch(removeWarehouse(deletingWarehouse.id)).unwrap();
      toast.success(t("warehouses.success.warehouseDeleted"));
      if (editingWarehouse?.id === deletingWarehouse.id) {
        setWarehouseCode("");
        setEditingWarehouse(null);
        setIsFormOpen(false);
      }
      setDeletingWarehouse(null);
    } catch (error: unknown) {
      console.error(error);
      toast.error(
        getErrorMessage(error, t("warehouses.error.failedToDelete")),
      );
    }
  }, [dispatch, deletingWarehouse, editingWarehouse, t]);

  const handleEdit = useCallback((warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setWarehouseCode(warehouse.code);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(
    (id: number) => {
      const warehouse = warehouses.find((item) => item.id === id);
      if (warehouse) setDeletingWarehouse(warehouse);
    },
    [warehouses],
  );

  useEffect(() => {
    dispatch(fetchWarehouses());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <div className={styles.warehouseSettingsWrapper}>
      <div className={styles.warehouseSettings}>
        <WarehouseContent
          isFormOpen={isFormOpen}
          isEditing={!!editingWarehouse}
          onOpenForm={handleOpenForm}
          onCloseForm={handleCloseForm}
          actionButtons={
            <div className={styles.actionButtons}>
              <IconButton
                variant="primary"
                size="medium"
                icon={editingWarehouse ? <Check size={16} /> : <Plus size={16} />}
                ariaLabel={editingWarehouse ? t("common.update") : t("common.add")}
                title={editingWarehouse ? t("common.update") : t("common.add")}
                onClick={() => void handleAddWarehouse()}
                disabled={isLoading || !warehouseCode.trim()}
              />
            </div>
          }
          warehouseCode={warehouseCode}
          setWarehouseCode={setWarehouseCode}
          warehouses={warehouses}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <ConfirmationModal
        open={!!deletingWarehouse}
        onOpenChange={(open) => !open && setDeletingWarehouse(null)}
        title={t("warehouses.confirmation.deleteTitle")}
        description={t("warehouses.confirmation.deleteDescription", {
          name: deletingWarehouse?.code ?? "",
        })}
        confirmText={isLoading ? t("common.loading") : t("common.delete")}
        cancelText={t("common.cancel")}
        onConfirm={() => void confirmDeleteWarehouse()}
        onCancel={() => setDeletingWarehouse(null)}
      />
    </div>
  );
};
