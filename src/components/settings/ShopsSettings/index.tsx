import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
// ui-kit
import { Button, Tab, TabGroup } from "@/ui-kit";
// components
import { ShopContent } from "./ShopContent";
import { ShopPricingContent } from "./ShopPricingContent";
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
import { getCashRegisterId, getErrorMessage } from "@/utils";
// types
import type { Shop, ShopPricing } from "@/types/settings";

// services
import {
  applyShopPricingToExisting,
  createShopPricing,
  getShopPricingByShopId,
} from "@/services/settings/shopPricing";
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
  const [pricingShopId, setPricingShopId] = useState(0);
  const [markupPercentage, setMarkupPercentage] = useState("");
  const [pricingSettings, setPricingSettings] = useState<ShopPricing | null>(null);
  const [isPricingLoading, setIsPricingLoading] = useState(false);
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [isApplyingPricing, setIsApplyingPricing] = useState(false);

  const cashRegisterId = getCashRegisterId();

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
          }),
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
            : t("shops.error.failedToCreate"),
        ),
      );
    }
  }, [shopKey, warehouseId, t, editingShop, dispatch]);

  const handleDeleteShop = useCallback(async () => {
    if (!editingShop) {
      return;
    }

    const shouldDelete = window.confirm(t("common.areYouSure"));
    if (!shouldDelete) {
      return;
    }

    try {
      await dispatch(removeShop(editingShop.id)).unwrap();
      toast.success(t("shops.success.shopDeleted"));
      setShopKey("");
      setWarehouseId(0);
      setEditingShop(null);
    } catch (error: unknown) {
      console.error(error);
      toast.error(getErrorMessage(error, t("shops.error.failedToDelete")));
    }
  }, [dispatch, editingShop, t]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setShopKey("");
    setWarehouseId(0);
    setEditingShop(null);
  }, []);

  const loadShopPricing = useCallback(
    async (shopId: number) => {
      if (!shopId) {
        setPricingSettings(null);
        setMarkupPercentage("");
        return;
      }

      setIsPricingLoading(true);
      try {
        const settings = await getShopPricingByShopId(shopId, cashRegisterId);
        setPricingSettings(settings);
        setMarkupPercentage(
          settings ? settings.markupPercentage.toString() : "",
        );
      } catch (error: unknown) {
        setPricingSettings(null);
        setMarkupPercentage("");
        toast.error(
          getErrorMessage(error, t("shops.pricing.error.failedToLoad")),
        );
      } finally {
        setIsPricingLoading(false);
      }
    },
    [cashRegisterId, t],
  );

  const handleSavePricing = useCallback(async () => {
    if (!pricingShopId) {
      toast.error(t("shops.pricing.validation.selectShop"));
      return;
    }

    const parsedMarkup = Number(markupPercentage);
    if (!markupPercentage.trim() || Number.isNaN(parsedMarkup) || parsedMarkup < 0) {
      toast.error(t("shops.pricing.validation.enterValidMarkup"));
      return;
    }

    setIsSavingPricing(true);
    try {
      const response = await createShopPricing(
        pricingShopId,
        parsedMarkup,
        cashRegisterId,
      );
      setPricingSettings(response);
      setMarkupPercentage(response.markupPercentage.toString());
      toast.success(t("shops.pricing.success.saved"));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("shops.pricing.error.failedToSave")));
    } finally {
      setIsSavingPricing(false);
    }
  }, [pricingShopId, markupPercentage, cashRegisterId, t]);

  const handleApplyPricingToExisting = useCallback(async () => {
    if (!pricingShopId) {
      toast.error(t("shops.pricing.validation.selectShop"));
      return;
    }

    setIsApplyingPricing(true);
    try {
      await applyShopPricingToExisting(pricingShopId, cashRegisterId);
      toast.success(t("shops.pricing.success.applied"));
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error, t("shops.pricing.error.failedToApply")),
      );
    } finally {
      setIsApplyingPricing(false);
    }
  }, [pricingShopId, cashRegisterId, t]);

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
    [dispatch, t],
  );

  useEffect(() => {
    if (activeTab === "shops-history") {
      dispatch(fetchShops());
    }
  }, [activeTab, dispatch]);

  useEffect(() => {
    if (activeTab === "shop-pricing") {
      dispatch(fetchShops());
    }
  }, [activeTab, dispatch]);

  useEffect(() => {
    if (activeTab !== "shop-pricing") {
      return;
    }

    if (shops.length > 0 && pricingShopId === 0) {
      setPricingShopId(shops[0].id);
    }
  }, [activeTab, shops, pricingShopId]);

  useEffect(() => {
    if (activeTab !== "shop-pricing" || pricingShopId === 0) {
      return;
    }

    loadShopPricing(pricingShopId);
  }, [activeTab, pricingShopId, loadShopPricing]);

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
            <Tab
              variant="segmented"
              active={activeTab === "shop-pricing"}
              text={t("shops.tabs.shopPricing")}
              onClick={() => handleTabChange("shop-pricing")}
            />
          </TabGroup>
        </div>

        {(activeTab === "add-new" || activeTab === "shops-history") && (
          <ShopContent
            actionButtons={
              activeTab === "add-new" ? (
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

                  {editingShop && (
                    <Button
                      variant="secondary"
                      size="medium"
                      onClick={handleDeleteShop}
                      disabled={isLoading}
                    >
                      {t("common.delete")}
                    </Button>
                  )}

                  <Button
                    variant="primary"
                    size="medium"
                    onClick={handleAddShop}
                    disabled={
                      isLoading ||
                      !shopKey.trim() ||
                      !warehouseId ||
                      warehouseId === 0
                    }
                  >
                    {editingShop ? t("common.update") : t("common.add")}
                  </Button>
                </div>
              ) : undefined
            }
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
        )}

        {activeTab === "shop-pricing" && (
          <ShopPricingContent
            actionButtons={
              <div className={styles.actionButtons}>
                <Button
                  variant="secondary"
                  size="medium"
                  onClick={() => {
                    setPricingSettings(null);
                    setMarkupPercentage("");
                  }}
                  disabled={isSavingPricing || isApplyingPricing}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="secondary"
                  size="medium"
                  onClick={handleApplyPricingToExisting}
                  disabled={
                    isPricingLoading ||
                    isSavingPricing ||
                    isApplyingPricing ||
                    pricingShopId === 0 ||
                    !pricingSettings
                  }
                >
                  {t("shops.pricing.applyToExisting")}
                </Button>
                <Button
                  variant="primary"
                  size="medium"
                  onClick={handleSavePricing}
                  disabled={
                    isPricingLoading ||
                    isSavingPricing ||
                    isApplyingPricing ||
                    pricingShopId === 0 ||
                    !markupPercentage.trim()
                  }
                >
                  {t("shops.pricing.save")}
                </Button>
              </div>
            }
            shops={shops}
            selectedShopId={pricingShopId}
            setSelectedShopId={setPricingShopId}
            markupPercentage={markupPercentage}
            setMarkupPercentage={setMarkupPercentage}
            pricingSettings={pricingSettings}
            isLoading={isPricingLoading || isLoading}
          />
        )}
      </div>
    </div>
  );
};
