import { useRef, createRef, useCallback, type FC, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { IconButton, InteractiveField } from "@/ui-kit";
import { Plus, Edit } from "lucide-react";
import type { SalePercentage } from "@/types/settings";
import styles from "./SalePercentages.module.css";

interface SalePercentagesContentProps {
  salePercentages: SalePercentage[];
  isLoading: boolean;
  onAddNewClick: (anchorEl: HTMLElement | null) => void;
  activeSalePercentageId?: number | null;
  onEditClick?: (
    salePercentageId: number,
    anchorEl: HTMLElement | null,
  ) => void;
}

export const SalePercentagesContent: FC<SalePercentagesContentProps> = ({
  salePercentages,
  isLoading,
  onAddNewClick,
  activeSalePercentageId,
  onEditClick,
}) => {
  const { t } = useTranslation();
  const salePercentageItemRefs = useRef<
    Map<number, RefObject<HTMLDivElement | null>>
  >(new Map());

  const getOrCreateItemRef = (salePercentageId: number) => {
    if (!salePercentageItemRefs.current.has(salePercentageId)) {
      salePercentageItemRefs.current.set(
        salePercentageId,
        createRef<HTMLDivElement>(),
      );
    }
    return salePercentageItemRefs.current.get(salePercentageId)!;
  };

  const addButtonDesktopWrapperRef = useRef<HTMLDivElement>(null);
  const addButtonMobileWrapperRef = useRef<HTMLDivElement>(null);

  const handleAddClick = (isMobile: boolean) => {
    const wrapper = isMobile
      ? addButtonMobileWrapperRef.current
      : addButtonDesktopWrapperRef.current;

    onAddNewClick(wrapper);
  };

  const handleEditButtonClick = useCallback(
    (salePercentageId: number, event?: React.MouseEvent<HTMLButtonElement>) => {
      if (event?.currentTarget) {
        onEditClick?.(salePercentageId, event.currentTarget);
        return;
      }

      setTimeout(() => {
        const itemRef = getOrCreateItemRef(salePercentageId);
        const root = itemRef.current;
        if (!root) return;

        const actionsWrapper = root.querySelector(
          '[class*="actionsWrapper"], [class*="actions"]',
        );
        if (actionsWrapper) {
          const editButton = actionsWrapper.querySelector(
            "button",
          ) as HTMLElement | null;
          if (editButton) {
            onEditClick?.(salePercentageId, editButton);
          }
        } else {
          const editButton = root.querySelector("button") as HTMLElement | null;
          if (editButton) {
            onEditClick?.(salePercentageId, editButton);
          }
        }
      }, 0);
    },
    [onEditClick],
  );

  return (
    <>
      <div className={styles.salePercentagesHeader}>
        <div
          ref={addButtonDesktopWrapperRef}
          className={styles.addButtonWrapper}
        >
          <IconButton
            variant="primary"
            size="small"
            icon={<Plus size={12} color="#0e0f11" />}
            ariaLabel={t("salePercentages.addNew")}
            onClick={() => handleAddClick(false)}
          />
          <span className={styles.addButtonText}>
            {t("salePercentages.addSalePercentage")}
          </span>
        </div>
      </div>

      {/* List */}
      <div className={styles.salePercentagesList}>
        {isLoading ? (
          <div className={styles.loading}>{t("salePercentages.loading")}</div>
        ) : salePercentages.length === 0 ? (
          <div className={styles.emptyState}>
            {t("salePercentages.emptyState")}
          </div>
        ) : (
          salePercentages.map((salePercentage) => {
            const itemRef = getOrCreateItemRef(salePercentage.id);
            const isActive = salePercentage.isActive ?? false;

            return (
              <div
                key={salePercentage.id}
                ref={itemRef}
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

      {/* Mobile add button */}
      <div className={styles.addButtonMobile}>
        <div
          ref={addButtonMobileWrapperRef}
          className={styles.addButtonWrapper}
        >
          <IconButton
            variant="primary"
            size="small"
            icon={<Plus size={12} />}
            ariaLabel={t("salePercentages.addNew")}
            onClick={() => handleAddClick(true)}
          />
          <span className={styles.addButtonText}>
            {t("salePercentages.addSalePercentage")}
          </span>
        </div>
      </div>
    </>
  );
};
