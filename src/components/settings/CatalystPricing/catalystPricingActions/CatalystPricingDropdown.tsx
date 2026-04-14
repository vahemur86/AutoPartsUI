import { useState, useEffect, type RefObject } from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Button, Dropdown, TextField } from "@/ui-kit";

// types
import type { CatalystPricing } from "@/types/settings";

// styles
import styles from "./CatalystPricingDropdown.module.css";

export type CatalystPricingForm = Omit<CatalystPricing, "id">;

interface CatalystPricingDropdownProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  initialData?: CatalystPricing | null;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CatalystPricing) => void;
}

export const CatalystPricingDropdown = ({
  open,
  anchorRef,
  initialData,
  isLoading = false,
  onOpenChange,
  onSave,
}: CatalystPricingDropdownProps) => {
  const { t } = useTranslation();

  const [ptReducePercent, setPtReducePercent] = useState("");
  const [pdReducePercent, setPdReducePercent] = useState("");
  const [rhReducePercent, setRhReducePercent] = useState("");
  const [transportCost1, setTransportCost1] = useState("");
  const [transportCost2, setTransportCost2] = useState("");
  const [commissionPercent, setCommissionPercent] = useState("");
  const [profitMargin, setProfitMargin] = useState("");
  const [hasTriedSave, setHasTriedSave] = useState(false);

  const isEditMode = !!initialData;

  useEffect(() => {
    if (open && initialData) {
      setPtReducePercent(String(initialData.ptReducePercent));
      setPdReducePercent(String(initialData.pdReducePercent));
      setRhReducePercent(String(initialData.rhReducePercent));
      setTransportCost1(String(initialData.transportCost1UsdPerKg));
      setTransportCost2(String(initialData.transportCost2UsdPerKg));
      setCommissionPercent(String(initialData.commissionPercent));
      setProfitMargin(String(initialData.profitMargin));
      setHasTriedSave(false);
    }
  }, [open, initialData]);

  const numPt = parseFloat(ptReducePercent);
  const numPd = parseFloat(pdReducePercent);
  const numRh = parseFloat(rhReducePercent);
  const numT1 = parseFloat(transportCost1);
  const numT2 = parseFloat(transportCost2);
  const numCommission = parseFloat(commissionPercent);
  const numProfitMargin = parseFloat(profitMargin);

  const isValid =
    !isNaN(numPt) &&
    !isNaN(numPd) &&
    !isNaN(numRh) &&
    !isNaN(numT1) &&
    !isNaN(numT2) &&
    !isNaN(numCommission) &&
    numPt >= 0 &&
    numPt <= 100 &&
    numPd >= 0 &&
    numPd <= 100 &&
    numRh >= 0 &&
    numRh <= 100 &&
    numCommission >= 0 &&
    numCommission <= 100;

  const handleSaveClick = () => {
    setHasTriedSave(true);
    if (!isValid || !initialData) return;

    onSave({
      id: initialData.id,
      ptReducePercent: numPt,
      pdReducePercent: numPd,
      rhReducePercent: numRh,
      transportCost1UsdPerKg: numT1,
      transportCost2UsdPerKg: numT2,
      commissionPercent: numCommission,
      profitMargin: numProfitMargin,
      updatedAt: initialData.updatedAt ?? new Date().toISOString(),
    });
  };

  const titleText = isEditMode ? t("common.update") : t("common.save");

  return (
    <Dropdown
      open={open}
      onOpenChange={onOpenChange}
      anchorRef={anchorRef}
      align="start"
      side="left"
      title={titleText}
    >
      <div className={styles.header}>
        <span className={styles.title}>{titleText}</span>
      </div>

      <div className={styles.content}>
        <div className={styles.grid}>
          <TextField
            label={t("catalystPricing.columns.ptReducePercent")}
            type="number"
            value={ptReducePercent}
            onChange={(e) => setPtReducePercent(e.target.value)}
            error={hasTriedSave && (isNaN(numPt) || numPt > 100 || numPt < 0)}
            disabled={isLoading}
          />

          <TextField
            label={t("catalystPricing.columns.pdReducePercent")}
            type="number"
            value={pdReducePercent}
            onChange={(e) => setPdReducePercent(e.target.value)}
            error={hasTriedSave && (isNaN(numPd) || numPd > 100 || numPd < 0)}
            disabled={isLoading}
          />

          <TextField
            label={t("catalystPricing.columns.rhReducePercent")}
            type="number"
            value={rhReducePercent}
            onChange={(e) => setRhReducePercent(e.target.value)}
            error={hasTriedSave && (isNaN(numRh) || numRh > 100 || numRh < 0)}
            disabled={isLoading}
          />

          <TextField
            label={t("catalystPricing.columns.transportCost1UsdPerKg")}
            type="number"
            value={transportCost1}
            onChange={(e) => setTransportCost1(e.target.value)}
            error={hasTriedSave && isNaN(numT1)}
            disabled={isLoading}
          />

          <TextField
            label={t("catalystPricing.columns.transportCost2UsdPerKg")}
            type="number"
            value={transportCost2}
            onChange={(e) => setTransportCost2(e.target.value)}
            error={hasTriedSave && isNaN(numT2)}
            disabled={isLoading}
          />
          <TextField
            label={t("catalystPricing.columns.commissionPercent")}
            type="number"
            value={commissionPercent}
            onChange={(e) => setCommissionPercent(e.target.value)}
            error={
              hasTriedSave &&
              (isNaN(numCommission) || numCommission > 100 || numCommission < 0)
            }
            disabled={isLoading}
          />

          <TextField
            label={t("catalystPricing.columns.profitMargin")}
            type="number"
            value={profitMargin}
            onChange={(e) => setProfitMargin(e.target.value)}
            error={
              hasTriedSave &&
              (isNaN(numProfitMargin) ||
                numProfitMargin > 100 ||
                numProfitMargin < 0)
            }
            disabled={isLoading}
          />
        </div>

        <div className={styles.actionswithoutDelete}>
          <div className={styles.primaryActions}>
            <Button
              variant="secondary"
              size="medium"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t("common.cancel")}
            </Button>

            <Button
              variant="primary"
              size="medium"
              onClick={handleSaveClick}
              disabled={isLoading}
            >
              {isEditMode ? t("common.update") : t("common.save")}
            </Button>
          </div>
        </div>
      </div>
    </Dropdown>
  );
};
