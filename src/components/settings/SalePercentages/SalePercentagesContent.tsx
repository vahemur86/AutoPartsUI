import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Button, InteractiveField } from "@/ui-kit";
import { Plus, Edit } from "lucide-react";
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
  const handleEditButtonClick = (salePercentageId: number) => {
    onEditClick?.(salePercentageId);
  };

  return (
    <>
      <div className={styles.salePercentagesHeader}>
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
          <div className={styles.loading}>{t("salePercentages.loading")}</div>
        ) : salePercentages.length === 0 ? (
          <div className={styles.emptyState}>
            {t("salePercentages.emptyState")}
          </div>
        ) : (
          salePercentages.map((salePercentage) => {
            const isActive = salePercentage.isActive ?? false;

            return (
              <div
                key={salePercentage.id}
                className={[
                  styles.salePercentageItem,
                  activeSalePercentageId === salePercentage.id
                    ? styles.active
                    : "",
                  isActive ? styles.activePercentage : "",
                ].join(" ")}
              >
                <InteractiveField
                  variant="display"
                  size="medium"
                  displayText={
                    <div className={styles.salePercentageText}>
                      <div className={styles.salePercentageValue}>
                        {salePercentage.percentage}%
                      </div>
                    </div>
                  }
                  actions={{
                    edit: {
                      icon: <Edit size={16} />,
                      onClick: () => {
                        handleEditButtonClick(salePercentage.id);
                      },
                      ariaLabel: t("salePercentages.editSalePercentage", {
                        percent: salePercentage.percentage,
                      }),
                    },
                  }}
                  className={styles.salePercentageField}
                  style={{ padding: "12px 26px" }}
                />
              </div>
            );
          })
        )}
      </div>
    </>
  );
};
