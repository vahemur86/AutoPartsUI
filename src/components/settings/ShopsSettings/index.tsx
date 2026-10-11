import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
// ui-kit
import { Button, ConfirmationModal, IconButton } from "@/ui-kit";
import { Check, Plus } from "lucide-react";
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

  const [isShopFormOpen, setIsShopFormOpen] = useState(false);
  const [shopKey, setShopKey] = useState("");
  const [warehouseId, setWarehouseId] = useState(0);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [deletingShop, setDeletingShop] = useState<Shop | null>(null);
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
      setIsShopFormOpen(false);
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

  const handleOpenShopForm = useCallback(() => {
    setShopKey("");
    setWarehouseId(0);
    setEditingShop(null);
    setIsShopFormOpen(true);
  }, []);

  const handleCloseShopForm = useCallback(() => {
    setShopKey("");
    setWarehouseId(0);
    setEditingShop(null);
    setIsShopFormOpen(false);
  }, []);

  const confirmDeleteShop = useCallback(async () => {
    if (!deletingShop) return;
    try {
      await dispatch(removeShop(deletingShop.id)).unwrap();
      toast.success(t("shops.success.shopDeleted"));
      if (editingShop?.id === deletingShop.id) {
        setShopKey("");
        setWarehouseId(0);
        setEditingShop(null);
        setIsShopFormOpen(false);
      }
      setDeletingShop(null);
    } catch (error: unknown) {
      console.error(error);
      toast.error(getErrorMessage(error, t("shops.error.failedToDelete")));
    }
  }, [dispatch, deletingShop, editingShop, t]);

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
    setIsShopFormOpen(true);
  }, []);

  const handleDelete = useCallback(
    (id: number) => {
      const shop = shops.find((item) => item.id === id);
      if (shop) setDeletingShop(shop);
    },
    [shops],
  );

  useEffect(() => {
    dispatch(fetchShops());
  }, [dispatch]);

  useEffect(() => {
    if (shops.length === 0) {
      if (pricingShopId !== 0) setPricingShopId(0);
      return;
    }

    if (!shops.some((shop) => shop.id === pricingShopId)) {
      setPricingShopId(shops[0].id);
    }
  }, [shops, pricingShopId]);

  useEffect(() => {
    if (pricingShopId === 0) return;

    loadShopPricing(pricingShopId);
  }, [pricingShopId, loadShopPricing]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <div className={styles.shopsSettingsWrapper}>
      <div className={styles.shopsSettings}>
        <ShopContent
          isFormOpen={isShopFormOpen}
          isEditing={!!editingShop}
          onOpenForm={handleOpenShopForm}
          onCloseForm={handleCloseShopForm}
          actionButtons={
            <div className={styles.managementActions}>
              <IconButton
                variant="primary"
                size="medium"
                icon={editingShop ? <Check size={16} /> : <Plus size={16} />}
                ariaLabel={editingShop ? t("common.update") : t("common.add")}
                title={editingShop ? t("common.update") : t("common.add")}
                onClick={() => void handleAddShop()}
                disabled={isLoading || !shopKey.trim() || warehouseId === 0}
              />
            </div>
          }
          shopKey={shopKey}
          setShopKey={setShopKey}
          warehouseId={warehouseId}
          setWarehouseId={setWarehouseId}
          warehouses={warehouses}
          shops={shops}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <section className={styles.pricingSection} aria-labelledby="shop-pricing-title">
          <header className={styles.sectionHeading}>
            <h2 id="shop-pricing-title">{t("shops.pricing.sectionTitle")}</h2>
          </header>
          <ShopPricingContent
            actionButtons={
              <div className={styles.actionButtons}>
                <Button
                  variant="secondary"
                  size="medium"
                  onClick={() => void loadShopPricing(pricingShopId)}
                  disabled={isPricingLoading || isSavingPricing || isApplyingPricing}
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
        </section>
      </div>

      <ConfirmationModal
        open={!!deletingShop}
        onOpenChange={(open) => !open && setDeletingShop(null)}
        title={t("shops.confirmation.deleteTitle")}
        description={t("shops.confirmation.deleteDescription", {
          name: deletingShop?.code ?? "",
        })}
        confirmText={isLoading ? t("common.loading") : t("common.delete")}
        cancelText={t("common.cancel")}
        onConfirm={() => void confirmDeleteShop()}
        onCancel={() => setDeletingShop(null)}
      />
    </div>
  );
};
