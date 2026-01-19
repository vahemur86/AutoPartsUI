import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
// ui-kit
import { Button, Tab, TabGroup } from "@/ui-kit";
// components
import { ShopContent } from "./ShopContent";
// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchWarehouses } from "@/store/slices/warehousesSlice";
import {
  fetchShops,
  addShop,
  updateShopInStore,
  removeShop,
} from "@/store/slices/shopsSlice";
// utils
import { getErrorMessage } from "@/utils";
// types
import type { Shop } from "@/types/settings";
// styles
import styles from "./ShopsSettings.module.css";

export const ShopsSettings = () => {
  const { t } = useTranslation();
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
      toast.error(t("shops.validation.enterShopKey"));
      return;
    }

    if (!warehouseId || warehouseId === 0) {
      toast.error(t("shops.validation.selectWarehouse"));
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

        toast.success(t("shops.success.shopUpdated"));
        setEditingShop(null);
      } else {
        await dispatch(addShop({ code: shopKey.trim(), warehouseId })).unwrap();
        toast.success(t("shops.success.shopCreated"));
      }

      setShopKey("");
      setWarehouseId(0);
    } catch (error: unknown) {
      console.error(error);
      toast.error(
        getErrorMessage(
          error,
          editingShop
            ? t("shops.error.failedToUpdate")
            : t("shops.error.failedToCreate")
        )
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
        toast.success(t("shops.success.shopDeleted"));
      } catch (error: unknown) {
        console.error(error);
        toast.error(getErrorMessage(error, t("shops.error.failedToDelete")));
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
              text={t("shops.tabs.addNew")}
              onClick={() => handleTabChange("add-new")}
            />
            <Tab
              variant="segmented"
              active={activeTab === "shops-history"}
              text={t("shops.tabs.shopsHistory")}
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
            {t("common.cancel")}
          </Button>

          <Button
            variant="primary"
            size="medium"
            onClick={handleAddShop}
            disabled={
              isLoading || !shopKey.trim() || !warehouseId || warehouseId === 0
            }
          >
            {editingShop ? t("common.update") : t("common.save")}
          </Button>
        </div>
      )}
    </div>
  );
};
