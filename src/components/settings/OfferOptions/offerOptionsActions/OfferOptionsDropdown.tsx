import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { Percent, Save, X } from "lucide-react";

// ui-kit
import { Button, TextField } from "@/ui-kit";

// types
import type { OfferIncreaseOption } from "@/types/settings";

// styles
import styles from "./OfferOptionsDropdown.module.css";

export interface OfferIncreaseOptionDropdownProps {
  open: boolean;
  option?: OfferIncreaseOption;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { percent: number; isActive: boolean; id?: number }) => void;
}

export const OfferIncreaseOptionDropdown = ({
  open,
  option,
  onOpenChange,
  onSave,
}: OfferIncreaseOptionDropdownProps) => {
  const { t } = useTranslation();
  const isEdit = !!option;

  const [percentValue, setPercentValue] = useState("");
  const [hasTriedSave, setHasTriedSave] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (option) {
      setPercentValue(option.percent.toString());
    } else {
      setPercentValue("");
    }
    setHasTriedSave(false);
  }, [open, option]);

  const isPercentValid = useMemo(() => {
    const val = parseFloat(percentValue);
    return !isNaN(val) && val >= 0;
  }, [percentValue]);

  const handleSaveClick = () => {
    setHasTriedSave(true);
    if (!isPercentValid) return;

    onSave({
      id: option?.id,
      percent: parseFloat(percentValue),
      isActive: true,
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
      <aside className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby="offer-option-drawer-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className={styles.drawerHeader}>
          <span className={styles.drawerIcon} aria-hidden="true"><Percent size={20} /></span>
          <h2 id="offer-option-drawer-title">
            {isEdit ? t("offers.editOption") : t("offers.addOption")}
          </h2>
          <button type="button" className={styles.drawerClose} onClick={handleClose} aria-label={t("common.close")} title={t("common.close")}>
            <X size={18} />
          </button>
        </header>
        <div className={styles.drawerBody}>
          <TextField
            label={t("offers.form.percent")}
            type="number"
            value={percentValue}
            onChange={(e) => setPercentValue(e.target.value)}
            error={hasTriedSave && !isPercentValid}
            suffix="%"
            autoFocus
          />
        </div>
        <footer className={styles.drawerFooter}>
          <Button variant="secondary" onClick={handleClose}>
            <X size={16} aria-hidden="true" />
            {t("common.cancel")}
          </Button>
          <Button variant="primary" onClick={handleSaveClick}>
            <Save size={16} aria-hidden="true" />
            {t("common.save")}
          </Button>
        </footer>
      </aside>
    </div>,
    document.body,
  );
};
