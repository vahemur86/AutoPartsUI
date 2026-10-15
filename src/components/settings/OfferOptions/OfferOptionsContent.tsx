import { useState, type FC, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Button, InteractiveField, ConfirmationModal } from "@/ui-kit";

// icons
import { Plus, Edit, Trash2 } from "lucide-react";

// types
import type { OfferIncreaseOption } from "@/types/settings";

// styles
import styles from "./OfferOptions.module.css";

interface OfferOptionsContentProps {
  options: OfferIncreaseOption[];
  isLoading: boolean;
  onAddNewClick: () => void;
  activeOptionId?: number | null;
  onEditClick?: (optionId: number) => void;
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

  const handleConfirmDelete = () => {
    if (optionToDelete) {
      onDeleteClick?.(optionToDelete.id);
      setOptionToDelete(null);
    }
  };

  return (
    <>
      <div className={styles.header}>
        {shopSelector}
        <Button
          variant="primary"
          size="medium"
          className={styles.addButton}
          onClick={onAddNewClick}
        >
          <Plus size={16} aria-hidden="true" />
          {t("offers.addOption")}
        </Button>
      </div>

      <div className={styles.optionsList}>
        {isLoading ? (
          <div className={styles.loading}>{t("common.loading")}</div>
        ) : options.length === 0 ? (
          <div className={styles.emptyState}>{t("offers.emptyState")}</div>
        ) : (
          options.map((option) => {
            const isActive = option.isActive ?? false;

            return (
              <div
                key={option.id}
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
                      onClick: () => onEditClick?.(option.id),
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
