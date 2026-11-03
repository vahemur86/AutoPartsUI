import { useMemo, useState, type FC, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Button, IconButton, ConfirmationModal } from "@/ui-kit";

// icons
import { CheckCircle2, CirclePercent, Pencil, Plus, Trash2, XCircle } from "lucide-react";

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
  const activeCount = useMemo(
    () => options.filter((option) => option.isActive).length,
    [options],
  );

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
        <div className={styles.overview}>
          <div className={styles.countSummary}>
            <span className={styles.overviewIcon}>
              <CirclePercent size={18} aria-hidden="true" />
            </span>
            <div>
              <strong>{t("offers.summary.total", { count: options.length })}</strong>
              <span>{t("offers.summary.active", { count: activeCount })}</span>
            </div>
          </div>
        </div>
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
          <div className={styles.optionState} role="status" aria-live="polite">
            <span className={styles.stateIcon}>
              <CirclePercent size={22} aria-hidden="true" />
            </span>
            <span>{t("offers.loading")}</span>
          </div>
        ) : options.length === 0 ? (
          <div className={styles.optionState}>
            <span className={styles.stateIcon}>
              <CirclePercent size={22} aria-hidden="true" />
            </span>
            <strong>{t("offers.empty.title")}</strong>
            <span>{t("offers.empty.description")}</span>
          </div>
        ) : (
          <div className={styles.optionGrid}>
            {options.map((option) => {
              const isActive = option.isActive ?? false;
              const isEditing = activeOptionId === option.id;

              return (
                <article
                  key={option.id}
                  className={styles.optionCard}
                  data-active={isActive}
                  data-editing={isEditing}
                >
                  <div className={styles.optionCardHeader}>
                    <span className={styles.optionIcon}>
                      <CirclePercent size={19} aria-hidden="true" />
                    </span>
                    <div className={styles.cardActions}>
                      <IconButton
                        size="small"
                        variant="secondary"
                        icon={<Pencil size={15} />}
                        ariaLabel={t("offers.editOption")}
                        title={t("offers.editOption")}
                        onClick={() => onEditClick?.(option.id)}
                        aria-expanded={isEditing}
                      />
                      <IconButton
                        size="small"
                        variant="secondary"
                        icon={<Trash2 size={15} />}
                        ariaLabel={t("offers.deleteOption")}
                        title={t("offers.deleteOption")}
                        onClick={() => setOptionToDelete(option)}
                      />
                    </div>
                  </div>
                  <div className={styles.optionValue}>
                    <strong>{option.percent}%</strong>
                    <span>{t("offers.increase")}</span>
                  </div>
                  <div className={styles.cardStatusRow}>
                    <span
                      className={`${styles.statusBadge} ${
                        isActive ? styles.statusActive : styles.statusInactive
                      }`}
                    >
                      {isActive ? (
                        <CheckCircle2 size={14} aria-hidden="true" />
                      ) : (
                        <XCircle size={14} aria-hidden="true" />
                      )}
                      {isActive
                        ? t("offers.status.active")
                        : t("offers.status.inactive")}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
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
