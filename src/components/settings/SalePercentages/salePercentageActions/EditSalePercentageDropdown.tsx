import { useEffect, useMemo, useState, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Button, Checkbox, TextField, Dropdown } from "@/ui-kit";
import type { SalePercentage } from "@/types/settings";
import styles from "./SalePercentageDropdown.module.css";

export interface EditSalePercentageDropdownProps {
  open: boolean;
  salePercentage: SalePercentage;
  anchorRef?: RefObject<HTMLElement | null>;
  onOpenChange: (open: boolean) => void;
  onSave: (data: SalePercentage) => void;
  onDelete?: (id: number) => void;
}

export const EditSalePercentageDropdown = ({
  open,
  salePercentage,
  anchorRef,
  onOpenChange,
  onSave,
  onDelete,
}: EditSalePercentageDropdownProps) => {
  const { t } = useTranslation();
  const [percentageValue, setPercentageValue] = useState(
    salePercentage.percentage.toString()
  );
  const [isActiveValue, setIsActiveValue] = useState(
    salePercentage.isActive ?? false
  );
  const [hasTriedSave, setHasTriedSave] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPercentageValue(salePercentage.percentage.toString());
    setIsActiveValue(salePercentage.isActive ?? false);
    setHasTriedSave(false);
  }, [open, salePercentage]);

  const isValid = useMemo(() => {
    const numValue = Number(percentageValue);
    return (
      percentageValue.trim() !== "" &&
      !isNaN(numValue) &&
      numValue >= 0 &&
      numValue <= 100
    );
  }, [percentageValue]);

  const handleSaveClick = () => {
    setHasTriedSave(true);
    if (!isValid) return;

    onSave({
      id: salePercentage.id,
      percentage: Number(percentageValue),
      isActive: isActiveValue,
    });
  };

  const handleClose = () => onOpenChange(false);

  return (
    <Dropdown
      open={open}
      onOpenChange={onOpenChange}
      anchorRef={anchorRef}
      align="start"
      side="left"
      title={t("salePercentages.editSalePercentageTitle")}
    >
      <div className={styles.header}>
        <span className={styles.title}>
          {t("salePercentages.editSalePercentageTitle")}
        </span>
      </div>

      <div className={styles.content}>
        <div className={styles.fields}>
          <TextField
            label={t("salePercentages.form.percent")}
            type="number"
            value={percentageValue}
            onChange={(e) => setPercentageValue(e.target.value)}
            error={
              hasTriedSave &&
              (!percentageValue.trim() ||
                isNaN(Number(percentageValue)) ||
                Number(percentageValue) < 0 ||
                Number(percentageValue) > 100)
            }
            suffix="%"
            autoFocus
          />
        </div>

        <div className={styles.toggles}>
          <span className={styles.sectionTitle}>
            {t("salePercentages.form.activePercentage")}
          </span>
          <Checkbox
            checked={isActiveValue}
            onCheckedChange={setIsActiveValue}
            label={t("salePercentages.form.useAsActive")}
          />
        </div>

        <div className={styles.actions}>
          {onDelete && (
            <Button
              variant="secondary"
              size="medium"
              onClick={() => onDelete(salePercentage.id)}
              className={styles.deleteButton}
            >
              {t("salePercentages.deleteSalePercentage")}
            </Button>
          )}

          <div className={styles.primaryActions}>
            <Button variant="secondary" size="medium" onClick={handleClose}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" size="medium" onClick={handleSaveClick}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      </div>
    </Dropdown>
  );
};

