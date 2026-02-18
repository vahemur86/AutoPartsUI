import { useEffect, useMemo, useState, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Button, Checkbox, TextField, Dropdown } from "@/ui-kit";
import type { SalePercentage } from "@/types/settings";
import styles from "./SalePercentageDropdown.module.css";

export interface AddSalePercentageDropdownProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<SalePercentage, "id">) => void;
}

export const AddSalePercentageDropdown = ({
  open,
  anchorRef,
  onOpenChange,
  onSave,
}: AddSalePercentageDropdownProps) => {
  const { t } = useTranslation();
  const [percentageValue, setPercentageValue] = useState("");
  const [isActiveValue, setIsActiveValue] = useState(false);
  const [hasTriedSave, setHasTriedSave] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPercentageValue("");
    setIsActiveValue(false);
    setHasTriedSave(false);
  }, [open]);

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
      percentage: Number(percentageValue),
      isActive: isActiveValue,
    });
    // Parent closes dropdown on success.
  };

  const handleClose = () => onOpenChange(false);

  return (
    <Dropdown
      open={open}
      onOpenChange={onOpenChange}
      anchorRef={anchorRef}
      align="start"
      side="left"
      title={t("salePercentages.addSalePercentage")}
    >
      <div className={styles.header}>
        <span className={styles.title}>
          {t("salePercentages.addSalePercentage")}
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

        <div className={styles.actionswithoutDelete}>
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

