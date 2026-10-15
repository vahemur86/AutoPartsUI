import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { Percent, Save, Trash2, X } from "lucide-react";
import { Button, Checkbox, TextField } from "@/ui-kit";
import type { SalePercentage } from "@/types/settings";
import styles from "./SalePercentageDropdown.module.css";

export interface EditSalePercentageDropdownProps {
  open: boolean;
  salePercentage: SalePercentage;
  onOpenChange: (open: boolean) => void;
  onSave: (data: SalePercentage) => void;
  onDelete?: (id: number) => void;
}

export const EditSalePercentageDropdown = ({
  open,
  salePercentage,
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

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return createPortal(
    <div className={styles.drawerBackdrop} onMouseDown={handleClose}>
      <aside className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby="sale-percentage-edit-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className={styles.drawerHeader}>
          <span className={styles.drawerIcon} aria-hidden="true"><Percent size={20} /></span>
          <h2 id="sale-percentage-edit-title">{t("salePercentages.editSalePercentageTitle")}</h2>
          <button type="button" className={styles.drawerClose} onClick={handleClose} aria-label={t("common.close")} title={t("common.close")}>
            <X size={18} />
          </button>
        </header>
        <div className={styles.drawerBody}>
          <TextField
            label={t("salePercentages.form.percent")}
            type="number"
            value={percentageValue}
            onChange={(e) => setPercentageValue(e.target.value)}
            error={hasTriedSave && (!percentageValue.trim() || isNaN(Number(percentageValue)) || Number(percentageValue) < 0 || Number(percentageValue) > 100)}
            suffix="%"
            autoFocus
          />
          <div className={styles.drawerToggle}>
            <span className={styles.sectionTitle}>{t("salePercentages.form.activePercentage")}</span>
            <Checkbox checked={isActiveValue} onCheckedChange={setIsActiveValue} label={t("salePercentages.form.useAsActive")} />
          </div>
        </div>
        <footer className={styles.drawerFooter}>
          {onDelete && (
            <Button variant="danger" size="medium" onClick={() => onDelete(salePercentage.id)} className={styles.drawerDelete}>
              <Trash2 size={16} aria-hidden="true" />
              {t("salePercentages.deleteSalePercentage")}
            </Button>
          )}
          <Button variant="secondary" size="medium" onClick={handleClose}>
            <X size={16} aria-hidden="true" />
            {t("common.cancel")}
          </Button>
          <Button variant="primary" size="medium" onClick={handleSaveClick}>
            <Save size={16} aria-hidden="true" />
            {t("common.save")}
          </Button>
        </footer>
      </aside>
    </div>,
    document.body,
  );
};

