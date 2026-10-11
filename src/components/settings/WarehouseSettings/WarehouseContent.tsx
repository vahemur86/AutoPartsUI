import { useEffect, type FC, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useMinimumLoadingDuration } from "@/hooks/useMinimumLoadingDuration";
import { IconButton, TextField } from "@/ui-kit";
import { Pencil, Plus, Trash2, Warehouse as WarehouseIcon, X } from "lucide-react";
import styles from "./WarehouseSettings.module.css";
import type { Warehouse } from "@/types/settings";

interface WarehouseContentProps {
  actionButtons?: ReactNode;
  isFormOpen: boolean;
  isEditing: boolean;
  onOpenForm: () => void;
  onCloseForm: () => void;
  warehouseCode: string;
  setWarehouseCode: (code: string) => void;
  warehouses: Warehouse[];
  isLoading: boolean;
  onEdit?: (warehouse: Warehouse) => void;
  onDelete?: (warehouseId: number) => void;
}

export const WarehouseContent: FC<WarehouseContentProps> = ({
  actionButtons,
  isFormOpen,
  isEditing,
  onOpenForm,
  onCloseForm,
  warehouseCode,
  setWarehouseCode,
  warehouses,
  isLoading,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const showSkeleton = useMinimumLoadingDuration(isLoading && warehouses.length === 0);

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
    <div className={styles.warehouseNameSection}>
      <section className={styles.historyContainer} aria-labelledby="warehouse-list-title">
        <header className={styles.sectionHeading}>
          <div className={styles.listHeading}>
            <WarehouseIcon size={18} aria-hidden="true" />
            <h2 id="warehouse-list-title">{t("warehouses.sections.list")}</h2>
          </div>
          <span className={styles.countBadge}>{warehouses.length}</span>
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
        ) : warehouses.length === 0 ? (
          <div className={styles.emptyState}>
            <WarehouseIcon size={24} aria-hidden="true" />
            {t("warehouses.emptyState")}
          </div>
        ) : (
          <div className={styles.cardGrid}>
            {warehouses.map((warehouse) => (
              <article className={styles.entityCard} key={warehouse.id}>
                <div className={styles.cardIdentity}>
                  <span className={styles.entityIcon} aria-hidden="true">
                    <WarehouseIcon size={19} />
                  </span>
                  <div className={styles.entityCopy}>
                    <span className={styles.entityEyebrow}>
                      {t("settings.navigation.warehouse")}
                    </span>
                    <h3>{warehouse.code}</h3>
                  </div>
                </div>

                <footer className={styles.cardFooter}>
                  <span className={styles.idBadge}>
                    {t("columns.id")} #{warehouse.id}
                  </span>
                  <div className={styles.cardActions}>
                    {onEdit && (
                      <IconButton
                        variant="secondary"
                        size="medium"
                        icon={<Pencil size={15} />}
                        ariaLabel={`${t("common.edit")} ${warehouse.code}`}
                        title={`${t("common.edit")} ${warehouse.code}`}
                        onClick={() => onEdit(warehouse)}
                      />
                    )}
                    {onDelete && (
                      <IconButton
                        variant="secondary"
                        size="medium"
                        className={styles.deleteAction}
                        icon={<Trash2 size={15} />}
                        ariaLabel={`${t("common.delete")} ${warehouse.code}`}
                        title={`${t("common.delete")} ${warehouse.code}`}
                        onClick={() => onDelete(warehouse.id)}
                      />
                    )}
                  </div>
                </footer>
              </article>
            ))}
          </div>
        )}
      </section>

      {isFormOpen && createPortal(
        <div className={styles.drawerBackdrop} onMouseDown={onCloseForm}>
          <aside
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            aria-labelledby="warehouse-drawer-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className={styles.drawerHeader}>
              <span className={styles.drawerIcon} aria-hidden="true">
                <WarehouseIcon size={20} />
              </span>
              <div className={styles.drawerHeading}>
                <span>{t("settings.navigation.warehouse")}</span>
                <h2 id="warehouse-drawer-title">
                  {isEditing ? t("common.update") : t("warehouses.sections.form")}
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
              <div className={styles.drawerSectionTitle}>
                {t("warehouses.form.warehouseKey")}
              </div>
              <TextField
                label={t("warehouses.form.warehouseKey")}
                value={warehouseCode}
                onChange={(event) => setWarehouseCode(event.target.value)}
                disabled={isLoading}
                autoFocus
              />
            </div>
            <footer className={styles.drawerFooter}>{actionButtons}</footer>
          </aside>
        </div>,
        document.body,
      )}
    </div>
  );
};
