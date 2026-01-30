import { useEffect, useMemo, useState, type RefObject } from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Button, Switch, TextField, Dropdown } from "@/ui-kit";

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
  onDelete?: (id: number) => void;
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
  const [isActiveValue, setIsActiveValue] = useState(true);
  const [hasTriedSave, setHasTriedSave] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (option) {
      setPercentValue(option.percent.toString());
      setIsActiveValue(option.isActive);
    } else {
      setPercentValue("");
      setIsActiveValue(true);
    }
    setHasTriedSave(false);
  }, [open, option]);

  const isValid = useMemo(() => {
    const val = parseFloat(percentValue);
    return !isNaN(val) && val >= 0;
  }, [percentValue]);

  const handleSaveClick = () => {
    setHasTriedSave(true);
    if (!isValid) return;

    onSave({
      id: option?.id,
      percent: parseFloat(percentValue),
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
            error={hasTriedSave && !isValid}
            suffix="%"
          />
        </div>

        <div className={styles.toggles}>
          <Switch
            checked={isActiveValue}
            onCheckedChange={setIsActiveValue}
            label={t("offers.form.active")}
          />
        </div>

        <div className={styles.actions}>
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
