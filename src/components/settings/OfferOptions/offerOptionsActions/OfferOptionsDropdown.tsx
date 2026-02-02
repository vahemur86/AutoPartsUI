import { useEffect, useMemo, useState, type RefObject } from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Button, TextField, Dropdown } from "@/ui-kit";

// types
import type { OfferIncreaseOption } from "@/types/settings";

// styles
import styles from "./OfferOptionsDropdown.module.css";

export interface OfferIncreaseOptionDropdownProps {
  open: boolean;
  option?: OfferIncreaseOption;
  anchorRef?: RefObject<HTMLElement | null>;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { percent: number; isActive: boolean; id?: number }) => void;
}

export const OfferIncreaseOptionDropdown = ({
  open,
  option,
  anchorRef,
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

  return (
    <Dropdown
      open={open}
      onOpenChange={onOpenChange}
      anchorRef={anchorRef}
      align="start"
      side="left"
      title={isEdit ? t("offers.editOption") : t("offers.addOption")}
    >
      <div className={styles.header}>
        <span className={styles.title}>
          {isEdit ? t("offers.editOption") : t("offers.addOption")}
        </span>
      </div>
      <div className={styles.content}>
        <div className={styles.fields}>
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
        <div className={styles.actions}>
          <div className={styles.primaryActions}>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" onClick={handleSaveClick}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      </div>
    </Dropdown>
  );
};
