import {
  useRef,
  createRef,
  useState,
  type FC,
  type RefObject,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { IconButton, InteractiveField, ConfirmationModal } from "@/ui-kit";

// icons
import { Plus, Edit, Trash2 } from "lucide-react";

// types
import type { OfferIncreaseOption } from "@/types/settings";

// styles
import styles from "./OfferOptions.module.css";

interface OfferOptionsContentProps {
  options: OfferIncreaseOption[];
  isLoading: boolean;
  onAddNewClick: (anchorEl: HTMLElement | null) => void;
  activeOptionId?: number | null;
  onEditClick?: (optionId: number, anchorEl: HTMLElement | null) => void;
  onDeleteClick?: (id: number) => void;
  shopSelector: ReactNode;
}

export const OfferOptionsContent: FC<OfferOptionsContentProps> = ({
  options,
  isLoading,
  onAddNewClick,
  activeOptionId,
  onEditClick,
  onDeleteClick,
  shopSelector,
}) => {
  const { t } = useTranslation();
  const [optionToDelete, setOptionToDelete] =
    useState<OfferIncreaseOption | null>(null);

  const itemRefs = useRef<Map<number, RefObject<HTMLDivElement | null>>>(
    new Map(),
  );

  const getOrCreateItemRef = (id: number) => {
    if (!itemRefs.current.has(id)) {
      itemRefs.current.set(id, createRef<HTMLDivElement>());
    }
    return itemRefs.current.get(id)!;
  };

  const desktopAddRef = useRef<HTMLDivElement>(null);
  const mobileAddRef = useRef<HTMLDivElement>(null);

  const handleConfirmDelete = () => {
    if (optionToDelete) {
      onDeleteClick?.(optionToDelete.id);
      setOptionToDelete(null);
    }
  };

  return (
    <>
      <div className={styles.header}>
        <div ref={desktopAddRef} className={styles.addButtonContainer}>
          <IconButton
            variant="primary"
            size="small"
            icon={<Plus size={12} color="#0e0f11" />}
            ariaLabel={t("offers.addNew")}
            onClick={() => onAddNewClick(desktopAddRef.current)}
          />
          <span className={styles.addButtonLabel}>{t("offers.addOption")}</span>
        </div>

        <div ref={mobileAddRef} className={styles.mobileAddButton}>
          <div className={styles.addButtonContainerMobile}>
            <IconButton
              variant="primary"
              size="small"
              icon={<Plus size={12} color="#0e0f11" />}
              ariaLabel={t("offers.addNew")}
              onClick={() => onAddNewClick(mobileAddRef.current)}
            />
            <span className={styles.addButtonLabel}>
              {t("offers.addOption")}
            </span>
          </div>
        </div>
      </div>

      {shopSelector}

      <div className={styles.optionsList}>
        {isLoading ? (
          <div className={styles.loading}>{t("common.loading")}</div>
        ) : options.length === 0 ? (
          <div className={styles.emptyState}>{t("offers.emptyState")}</div>
        ) : (
          options.map((option) => {
            const itemRef = getOrCreateItemRef(option.id);
            const isActive = option.isActive ?? false;

            return (
              <div
                key={option.id}
                ref={itemRef}
                className={[
                  styles.optionItem,
                  activeOptionId === option.id ? styles.isActiveState : "",
                  isActive ? styles.activeOption : "",
                ].join(" ")}
              >
                <InteractiveField
                  variant="display"
                  size="medium"
                  displayText={
                    <div className={styles.optionContent}>
                      <div className={styles.percentText}>
                        {option.percent}% {t("offers.increase")}
                      </div>
                      <div className={styles.statusText}>
                        {isActive
                          ? t("offers.status.active")
                          : t("offers.status.inactive")}
                      </div>
                    </div>
                  }
                  actions={{
                    edit: {
                      icon: <Edit size={16} />,
                      onClick: () => {
                        const btn = itemRef.current?.querySelector(
                          "button",
                        ) as HTMLElement;
                        onEditClick?.(option.id, btn || itemRef.current);
                      },
                      ariaLabel: t("offers.editOption"),
                    },
                    delete: {
                      icon: <Trash2 size={16} />,
                      onClick: () => setOptionToDelete(option),
                      ariaLabel: t("offers.deleteOption"),
                    },
                  }}
                  className={styles.optionField}
                  style={{ padding: "12px 26px" }}
                />
              </div>
            );
          })
        )}
      </div>

      {!!optionToDelete && (
        <ConfirmationModal
          open={!!optionToDelete}
          onOpenChange={(open) => !open && setOptionToDelete(null)}
          title={t("offers.confirmation.deleteTitle")}
          description={t("offers.confirmation.deleteDescription", {
            percent: optionToDelete.percent,
          })}
          confirmText={t("common.delete")}
          cancelText={t("common.cancel")}
          onConfirm={handleConfirmDelete}
          onCancel={() => setOptionToDelete(null)}
        />
      )}
    </>
  );
};
