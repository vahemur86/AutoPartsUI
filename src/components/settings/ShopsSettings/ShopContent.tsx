import { useEffect, type FC, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useMinimumLoadingDuration } from "@/hooks/useMinimumLoadingDuration";
import { IconButton, Select, TextField } from "@/ui-kit";
import { Building2, Pencil, Plus, Store, Trash2, X } from "lucide-react";
import styles from "./ShopsSettings.module.css";
import type { Warehouse, Shop } from "@/types/settings";

interface ShopContentProps {
  actionButtons?: ReactNode;
  isFormOpen: boolean;
  isEditing: boolean;
  onOpenForm: () => void;
  onCloseForm: () => void;
  shopKey: string;
  setShopKey: (key: string) => void;
  warehouseId: number;
  setWarehouseId: (id: number) => void;
  warehouses: Warehouse[];
  shops: Shop[];
  isLoading: boolean;
  onEdit?: (shop: Shop) => void;
  onDelete?: (shopId: number) => void;
}

export const ShopContent: FC<ShopContentProps> = ({
  actionButtons,
  isFormOpen,
  isEditing,
  onOpenForm,
  onCloseForm,
  shopKey,
  setShopKey,
  warehouseId,
  setWarehouseId,
  warehouses,
  shops,
  isLoading,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const showSkeleton = useMinimumLoadingDuration(isLoading && shops.length === 0);

  useEffect(() => {
    if (!isFormOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseForm();
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isFormOpen, onCloseForm]);

  return (
    <div className={styles.shopNameSection}>
      <section className={styles.historyContainer} aria-labelledby="shop-list-title">
        <header className={styles.sectionHeading}>
          <div className={styles.listHeading}>
            <Store size={18} aria-hidden="true" />
            <h2 id="shop-list-title">{t("shops.sections.list")}</h2>
          </div>
          <span className={styles.countBadge}>{shops.length}</span>
          <IconButton
            variant="primary"
            size="medium"
            icon={<Plus size={17} />}
            ariaLabel={t("common.add")}
            title={t("common.add")}
            onClick={onOpenForm}
          />
        </header>

        {showSkeleton ? (
          <div className={styles.cardGrid} aria-busy="true" aria-live="polite">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className={styles.cardSkeleton}>
                <div className={styles.skeletonHeading}>
                  <div className={styles.skeletonIcon} />
                  <div className={styles.skeletonLineGroup}>
                    <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                    <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
                  </div>
                </div>
                <div className={styles.skeletonLineWide} />
              </div>
            ))}
          </div>
        ) : shops.length === 0 ? (
          <div className={styles.emptyState}>
            <Store size={24} aria-hidden="true" />
            {t("shops.emptyState")}
          </div>
        ) : (
          <div className={styles.cardGrid}>
            {shops.map((shop) => {
              const warehouse = warehouses.find(
                (item) => item.id === shop.warehouseId,
              );

              return (
                <article className={styles.entityCard} key={shop.id}>
                  <div className={styles.cardIdentity}>
                    <span className={styles.entityIcon} aria-hidden="true">
                      <Store size={19} />
                    </span>
                    <div className={styles.entityCopy}>
                      <span className={styles.entityEyebrow}>
                        {t("settings.navigation.shops")}
                      </span>
                      <h3>{shop.code}</h3>
                    </div>
                  </div>

                  <div className={styles.warehouseLink}>
                    <Building2 size={15} aria-hidden="true" />
                    <span>{t("settings.navigation.warehouse")}</span>
                    <strong>{warehouse?.code ?? shop.warehouseId}</strong>
                  </div>

                  <footer className={styles.cardFooter}>
                    <span className={styles.idBadge}>
                      {t("columns.id")} #{shop.id}
                    </span>
                    <div className={styles.cardActions}>
                      {onEdit && (
                        <IconButton
                          variant="secondary"
                          size="medium"
                          icon={<Pencil size={15} />}
                          ariaLabel={`${t("common.edit")} ${shop.code}`}
                          title={`${t("common.edit")} ${shop.code}`}
                          onClick={() => onEdit(shop)}
                        />
                      )}
                      {onDelete && (
                        <IconButton
                          variant="secondary"
                          size="medium"
                          className={styles.deleteAction}
                          icon={<Trash2 size={15} />}
                          ariaLabel={`${t("common.delete")} ${shop.code}`}
                          title={`${t("common.delete")} ${shop.code}`}
                          onClick={() => onDelete(shop.id)}
                        />
                      )}
                    </div>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {isFormOpen && createPortal(
        <div className={styles.drawerBackdrop} onMouseDown={onCloseForm}>
          <aside
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shop-drawer-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className={styles.drawerHeader}>
              <span className={styles.drawerIcon} aria-hidden="true">
                <Store size={20} />
              </span>
              <div className={styles.drawerHeading}>
                <span>{t("settings.navigation.shops")}</span>
                <h2 id="shop-drawer-title">
                  {isEditing ? t("common.update") : t("shops.sections.form")}
                </h2>
              </div>
              <button
                type="button"
                className={styles.drawerClose}
                onClick={onCloseForm}
                aria-label={t("common.close")}
                title={t("common.close")}
              >
                <X size={18} />
              </button>
            </header>
            <div className={styles.drawerBody}>
              <div className={styles.sectionHeading}>
                <Store size={16} aria-hidden="true" />
                <h2>{t("shops.sections.form")}</h2>
              </div>
              <div className={styles.drawerForm}>
                <TextField
                  label={t("shops.form.shopKey")}
                  value={shopKey}
                  onChange={(event) => setShopKey(event.target.value)}
                  disabled={isLoading}
                  autoFocus
                />
                <Select
                  label={t("shops.form.warehouse")}
                  placeholder={t("shops.form.selectWarehouse")}
                  value={warehouseId > 0 ? warehouseId.toString() : ""}
                  onChange={(event) => setWarehouseId(Number(event.target.value))}
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
            <footer className={styles.drawerFooter}>{actionButtons}</footer>
          </aside>
        </div>,
        document.body,
      )}
    </div>
  );
};
