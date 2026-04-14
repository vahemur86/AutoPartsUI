import {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
  type FC,
} from "react";

// ui-kit
import { Button } from "@/ui-kit";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";

// styles
import styles from "./CatalystPricing.module.css";

// redux
import {
  editCatalystPricing,
  fetchCatalystPricing,
} from "@/store/slices/catalystPricingSlice";

import { CatalystPricingDropdown } from "./catalystPricingActions/CatalystPricingDropdown";
import type { CatalystPricing } from "@/types/settings";
import { t } from "i18next";

export const CatalystPricings: FC = () => {
  const dispatch = useAppDispatch();

  const { prices } = useAppSelector((state) => state.catalystPricing);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeRate, setActiveRate] = useState<CatalystPricing | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const anchorRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    dispatch(fetchCatalystPricing(1));
  }, [dispatch]);

  const handleOpenEdit = useCallback(
    (rate: CatalystPricing, e: React.MouseEvent<HTMLElement>) => {
      anchorRef.current = e.currentTarget;
      setActiveRate(rate);
      setIsDropdownOpen(true);
    },
    [],
  );

  const handleSaveRate = useCallback(
    async (data: CatalystPricing) => {
      try {
        setIsMutating(true);
        await dispatch(editCatalystPricing(data)).unwrap();
        await dispatch(fetchCatalystPricing(1)).unwrap();
        setIsDropdownOpen(false);
      } catch (error) {
        console.error("Failed to save:", error);
      } finally {
        setIsMutating(false);
      }
    },
    [dispatch],
  );

  const tableData = useMemo(() => {
    return prices ? [prices] : [];
  }, [prices]);

  return (
    <div className={styles.catalystPricingWrapper}>
      <CatalystPricingDropdown
        open={isDropdownOpen}
        anchorRef={anchorRef}
        initialData={activeRate}
        isLoading={isMutating}
        onOpenChange={setIsDropdownOpen}
        onSave={handleSaveRate}
      />

      <div className={styles.cardsWrapper}>
        {tableData.map((item) => (
          <div key={item.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                {t("catalystPricing.title")} #{item.id}
              </div>
              <Button
                className={styles.editBtn}
                onClick={(e) => handleOpenEdit(item, e)}
              >
                {t("common.edit")}
              </Button>
            </div>

            <div className={styles.cardGrid}>
              <div className={styles.cardItem}>
                <span>{t("catalystPricing.columns.pdReducePercent")}</span>
                <b>{item.pdReducePercent.toFixed(2)}%</b>
              </div>

              <div className={styles.cardItem}>
                <span>{t("catalystPricing.columns.ptReducePercent")}</span>
                <b>{item.ptReducePercent.toFixed(2)}%</b>
              </div>

              <div className={styles.cardItem}>
                <span>{t("catalystPricing.columns.rhReducePercent")}</span>
                <b>{item.rhReducePercent.toFixed(2)}%</b>
              </div>

              <div className={styles.cardItem}>
                <span>
                  {t("catalystPricing.columns.transportCost1UsdPerKg")}
                </span>
                <b>${item.transportCost1UsdPerKg.toFixed(2)}</b>
              </div>

              <div className={styles.cardItem}>
                <span>
                  {t("catalystPricing.columns.transportCost2UsdPerKg")}
                </span>
                <b>${item.transportCost2UsdPerKg.toFixed(2)}</b>
              </div>

              <div className={styles.cardItem}>
                <span>{t("catalystPricing.columns.commissionPercent")}</span>
                <b>{item.commissionPercent.toFixed(2)}%</b>
              </div>

              <div className={styles.cardItem}>
                <span>{t("catalystPricing.columns.profitMargin")}</span>
                <b>{item.profitMargin.toFixed(2)}%</b>
              </div>

              <div className={styles.cardItem}>
                <span>{t("catalystPricing.columns.updatedAt")}</span>
                <b>{new Date(item.updatedAt).toLocaleDateString()}</b>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
