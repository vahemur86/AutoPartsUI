import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { Percent, Save, X } from "lucide-react";
import { Button, Checkbox, TextField } from "@/ui-kit";
import type { SalePercentage } from "@/types/settings";
import styles from "./SalePercentageDropdown.module.css";

export interface AddSalePercentageDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<SalePercentage, "id">) => void;
}

export const AddSalePercentageDropdown = ({
  open,
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
      <aside className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby="sale-percentage-drawer-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className={styles.drawerHeader}>
          <span className={styles.drawerIcon} aria-hidden="true"><Percent size={20} /></span>
          <h2 id="sale-percentage-drawer-title">{t("salePercentages.addSalePercentage")}</h2>
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
