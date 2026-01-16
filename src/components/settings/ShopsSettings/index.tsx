import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button, Tab, TabGroup } from "@/ui-kit";
import styles from "./ShopsSettings.module.css";
import { ShopContent } from "./ShopContent";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchWarehouses } from "@/store/slices/warehousesSlice";
import {
  fetchShops,
  addShop,
  updateShopInStore,
  removeShop,
} from "@/store/slices/shopsSlice";
import type { Shop } from "@/types/settings";

export const ShopsSettings = () => {
  const dispatch = useAppDispatch();
  const { warehouses } = useAppSelector((state) => state.warehouses);
  const { shops, isLoading, error } = useAppSelector((state) => state.shops);
  const [activeTab, setActiveTab] = useState("add-new");
  const [shopKey, setShopKey] = useState("");
  const [warehouseId, setWarehouseId] = useState(0);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);

  useEffect(() => {
    if (warehouses.length === 0) {
      dispatch(fetchWarehouses());
    }
  }, [dispatch, warehouses.length]);

  const handleAddShop = useCallback(async () => {
    if (!shopKey.trim()) {
      toast.error("Please enter a shop key");
      return;
    }
    if (!warehouseId || warehouseId === 0) {
      toast.error("Please select a warehouse");
      return;
    }
    try {
      if (editingShop) {
        // Update existing shop
        await dispatch(
          updateShopInStore({
            id: editingShop.id,
            code: shopKey.trim(),
            warehouseId,
          })
        ).unwrap();
        toast.success("Shop updated successfully");
        setEditingShop(null);
      } else {
        // Create new shop
        await dispatch(addShop({ code: shopKey.trim(), warehouseId })).unwrap();
        toast.success("Shop created successfully");
      }
      // Clear inputs after successful save
      setShopKey("");
      setWarehouseId(0);
    } catch (error: any) {
      console.error(error);
      toast.error(
        error ||
          (editingShop ? "Failed to update shop" : "Failed to create shop")
      );
    }
  }, [shopKey, warehouseId, editingShop, dispatch]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setShopKey("");
    setWarehouseId(0);
    setEditingShop(null);
  }, []);

  const handleEdit = useCallback((shop: Shop) => {
    setEditingShop(shop);
    setShopKey(shop.code);
    setWarehouseId(shop.warehouseId);
    setActiveTab("add-new");
  }, []);

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await dispatch(removeShop(id)).unwrap();
        toast.success("Shop deleted successfully");
      } catch (error: any) {
        console.error(error);
        toast.error(error || "Failed to delete shop");
      }
    },
    [dispatch]
  );

  useEffect(() => {
    if (activeTab === "shops-history") {
      dispatch(fetchShops());
    }
  }, [activeTab, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <div className={styles.shopsSettingsWrapper}>
      <div className={styles.shopsSettings}>
        <div className={styles.tabsContainer}>
          <TabGroup variant="segmented">
            <Tab
              variant="segmented"
              active={activeTab === "add-new"}
              text="Add New Shop"
              onClick={() => handleTabChange("add-new")}
            />
            <Tab
              variant="segmented"
              active={activeTab === "shops-history"}
              text="Shops History"
              onClick={() => handleTabChange("shops-history")}
            />
          </TabGroup>
        </div>

        <ShopContent
          shopKey={shopKey}
          setShopKey={setShopKey}
          activeTab={activeTab}
          warehouseId={warehouseId}
          setWarehouseId={setWarehouseId}
          warehouses={warehouses}
          shops={shops}
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
              setShopKey("");
              setWarehouseId(0);
              setEditingShop(null);
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="medium"
            onClick={handleAddShop}
            disabled={
              isLoading || !shopKey.trim() || !warehouseId || warehouseId === 0
            }
          >
            {editingShop ? "Update" : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
};
