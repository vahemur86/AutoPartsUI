import { useState, useEffect, type RefObject } from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Button, Dropdown, TextField, Switch } from "@/ui-kit";

// types
import type { CustomerType } from "@/types/settings";

// styles
import styles from "./CustomerTypeDropdown.module.css";

export type CustomerTypeForm = Omit<CustomerType, "id" | "isActive"> & {
  isActive?: boolean;
};

interface CustomerTypeDropdownProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  initialData?: (CustomerTypeForm & { id?: number }) | null;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CustomerTypeForm) => void;
}

export const CustomerTypeDropdown = ({
  open,
  anchorRef,
  initialData,
  isLoading = false,
  onOpenChange,
  onSave,
}: CustomerTypeDropdownProps) => {
  const { t } = useTranslation();

  const [code, setCode] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [bonusPercent, setBonusPercent] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [hasTriedSave, setHasTriedSave] = useState(false);

  const isEditMode = !!initialData;

  useEffect(() => {
    if (open) {
      setCode(initialData?.code ?? "");
      setIsDefault(initialData?.isDefault ?? false);
      setBonusPercent(
        initialData ? String(initialData.bonusPercent) : "0",
      );
      setIsActive(initialData?.isActive ?? true);
      setHasTriedSave(false);
    }
  }, [open, initialData]);

  const numBonusPercent = parseFloat(bonusPercent);

  const isCodeValid = code.trim().length > 0;
  const isBonusPercentValid = !isNaN(numBonusPercent) && numBonusPercent >= 0;
  const isValid = isCodeValid && isBonusPercentValid;

  const handleSaveClick = () => {
    setHasTriedSave(true);
    if (!isValid) return;

    onSave({
      code: code.trim(),
      isDefault,
      bonusPercent: numBonusPercent,
      ...(isEditMode && { isActive }),
    });
  };

  const titleText = isEditMode
    ? t("customerTypes.editCustomerType")
    : t("customerTypes.addCustomerType");

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
            label={t("customerTypes.form.code")}
            placeholder={t("customerTypes.form.enterCode")}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            error={hasTriedSave && !isCodeValid}
            disabled={isLoading}
          />

          <TextField
            label={t("customerTypes.form.bonusPercent")}
            placeholder="0"
            type="number"
            value={bonusPercent}
            onChange={(e) => setBonusPercent(e.target.value)}
            error={hasTriedSave && !isBonusPercentValid}
            disabled={isLoading}
          />

          <div className={styles.switchWrapper}>
            <Switch
              checked={isDefault}
              onCheckedChange={setIsDefault}
              label={t("customerTypes.form.isDefault")}
            />
          </div>

          {isEditMode && (
            <div className={styles.switchWrapper}>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                label={t("common.enabled")}
              />
            </div>
          )}
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

