import { useMemo, type FC } from "react";
import { useTranslation } from "react-i18next";
import { Button, IconButton } from "@/ui-kit";
import { CheckCircle2, CirclePercent, Pencil, Plus, XCircle } from "lucide-react";
import type { SalePercentage } from "@/types/settings";
import styles from "./SalePercentages.module.css";

interface SalePercentagesContentProps {
  salePercentages: SalePercentage[];
  isLoading: boolean;
  onAddNewClick: () => void;
  activeSalePercentageId?: number | null;
  onEditClick?: (salePercentageId: number) => void;
}

export const SalePercentagesContent: FC<SalePercentagesContentProps> = ({
  salePercentages,
  isLoading,
  onAddNewClick,
  activeSalePercentageId,
  onEditClick,
}) => {
  const { t } = useTranslation();
  const activeCount = useMemo(
    () => salePercentages.filter((item) => item.isActive).length,
    [salePercentages],
  );

  return (
    <>
      <div className={styles.salePercentagesHeader}>
        <div className={styles.overview}>
          <div className={styles.countSummary}>
            <span className={styles.overviewIcon}>
              <CirclePercent size={18} aria-hidden="true" />
            </span>
            <div>
              <strong>
                {t("salePercentages.summary.total", {
                  count: salePercentages.length,
                })}
              </strong>
              <span>
                {t("salePercentages.summary.active", { count: activeCount })}
              </span>
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
          {t("salePercentages.addSalePercentage")}
        </Button>
      </div>

      <div className={styles.salePercentagesList}>
        {isLoading ? (
          <div className={styles.salePercentageState} role="status" aria-live="polite">
            <span className={styles.stateIcon}>
              <CirclePercent size={22} aria-hidden="true" />
            </span>
            <span>{t("salePercentages.loading")}</span>
          </div>
        ) : salePercentages.length === 0 ? (
          <div className={styles.salePercentageState}>
            <span className={styles.stateIcon}>
              <CirclePercent size={22} aria-hidden="true" />
            </span>
            <strong>{t("salePercentages.empty.title")}</strong>
            <span>{t("salePercentages.empty.description")}</span>
          </div>
        ) : (
          <div className={styles.salePercentageGrid}>
            {salePercentages.map((salePercentage) => {
              const isActive = salePercentage.isActive ?? false;
              const isEditing = activeSalePercentageId === salePercentage.id;

              return (
                <article
                  key={salePercentage.id}
                  className={styles.salePercentageCard}
                  data-active={isActive}
                  data-editing={isEditing}
                >
                  <div className={styles.cardHeader}>
                    <span className={styles.percentIcon}>
                      <CirclePercent size={19} aria-hidden="true" />
                    </span>
                    <IconButton
                      size="small"
                      variant="secondary"
                      icon={<Pencil size={15} />}
                      ariaLabel={t("salePercentages.editSalePercentage", {
                        percent: salePercentage.percentage,
                      })}
                      title={t("salePercentages.editSalePercentage", {
                        percent: salePercentage.percentage,
                      })}
                      onClick={() => onEditClick?.(salePercentage.id)}
                      aria-expanded={isEditing}
                    />
                  </div>
                  <div className={styles.percentageValue}>
                    <strong>{salePercentage.percentage}%</strong>
                    <span>{t("salePercentages.form.percent")}</span>
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
                        ? t("salePercentages.status.active")
                        : t("salePercentages.status.inactive")}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};
