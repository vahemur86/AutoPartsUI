import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

// ui-kit
import { Button, Tab, TabGroup } from "@/ui-kit";

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
  const dispatch = useAppDispatch();
  const { warehouses, isLoading, error } = useAppSelector(
    (state) => state.warehouses,
  );

  const [activeTab, setActiveTab] = useState("add-new");
  const [warehouseCode, setWarehouseCode] = useState("");
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(
    null,
  );

  const handleAddWarehouse = useCallback(async () => {
    if (!warehouseCode.trim()) {
      toast.error("Please enter a warehouse code");
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

        toast.success("Warehouse updated successfully");
        setEditingWarehouse(null);
      } else {
        // Create new warehouse
        await dispatch(addWarehouse(warehouseCode.trim())).unwrap();
        toast.success("Warehouse created successfully");
      }

      setWarehouseCode("");
    } catch (error: unknown) {
      console.error(error);
      toast.error(
        getErrorMessage(
          error,
          editingWarehouse
            ? "Failed to update warehouse"
            : "Failed to create warehouse",
        ),
      );
    }
  }, [warehouseCode, editingWarehouse, dispatch]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setWarehouseCode("");
    setEditingWarehouse(null);
  }, []);

  const handleEdit = useCallback((warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setWarehouseCode(warehouse.code);
    setActiveTab("add-new");
  }, []);

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await dispatch(removeWarehouse(id)).unwrap();
        toast.success("Warehouse deleted successfully");
      } catch (error: unknown) {
        console.error(error);
        toast.error(getErrorMessage(error, "Failed to delete warehouse"));
      }
    },
    [dispatch],
  );

  useEffect(() => {
    if (activeTab === "warehouses-history") {
      dispatch(fetchWarehouses());
    }
  }, [activeTab, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <div className={styles.warehouseSettingsWrapper}>
      <div className={styles.warehouseSettings}>
        <div className={styles.tabsContainer}>
          <TabGroup variant="segmented">
            <Tab
              variant="segmented"
              active={activeTab === "add-new"}
              text="Add New Warehouse"
              onClick={() => handleTabChange("add-new")}
            />
            <Tab
              variant="segmented"
              active={activeTab === "warehouses-history"}
              text="Warehouses History"
              onClick={() => handleTabChange("warehouses-history")}
            />
          </TabGroup>
        </div>

        <WarehouseContent
          activeTab={activeTab}
          warehouseCode={warehouseCode}
          setWarehouseCode={setWarehouseCode}
          warehouses={warehouses}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {activeTab === "add-new" && (
        <div className={styles.actionButtons}>
          <Button
            variant="secondary"
            size="medium"
            onClick={() => {
              setWarehouseCode("");
              setEditingWarehouse(null);
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="medium"
            onClick={handleAddWarehouse}
            disabled={isLoading || !warehouseCode.trim()}
          >
            {editingWarehouse ? "Update" : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
};
