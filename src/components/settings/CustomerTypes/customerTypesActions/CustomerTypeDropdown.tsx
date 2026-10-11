import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { UsersRound, X } from "lucide-react";

import { Button, Switch, TextField } from "@/ui-kit";
import type { CustomerType } from "@/types/settings";
import styles from "./CustomerTypeDropdown.module.css";

export type CustomerTypeForm = Omit<CustomerType, "id" | "isActive"> & {
  isActive?: boolean;
};

interface CustomerTypeDropdownProps {
  open: boolean;
  initialData?: (CustomerTypeForm & { id?: number }) | null;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CustomerTypeForm) => void;
}

export const CustomerTypeDropdown = ({
  open,
  initialData,
  isLoading = false,
  onOpenChange,
  onSave,
}: CustomerTypeDropdownProps) => {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [bonusPercent, setBonusPercent] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [preventInventoryMerge, setPreventInventoryMerge] = useState(false);
  const [hasTriedSave, setHasTriedSave] = useState(false);
  const isEditMode = Boolean(initialData);

  useEffect(() => {
    if (!open) return;
    setCode(initialData?.code ?? "");
    setIsDefault(initialData?.isDefault ?? false);
    setBonusPercent(initialData ? String(initialData.bonusPercent) : "0");
    setIsActive(initialData?.isActive ?? true);
    setPreventInventoryMerge(initialData?.preventInventoryMerge ?? false);
    setHasTriedSave(false);
  }, [open, initialData]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onOpenChange]);

  const numericBonusPercent = Number.parseFloat(bonusPercent);
  const isCodeValid = code.trim().length > 0;
  const isBonusPercentValid = Number.isFinite(numericBonusPercent) && numericBonusPercent >= 0;

  const handleSave = () => {
    setHasTriedSave(true);
    if (!isCodeValid || !isBonusPercentValid) return;

    onSave({
      code: code.trim(),
      isDefault,
      bonusPercent: numericBonusPercent,
      preventInventoryMerge,
      ...(isEditMode ? { isActive } : {}),
    });
  };

  const title = isEditMode
    ? t("customerTypes.editCustomerType")
    : t("customerTypes.addCustomerType");

  if (!open) return null;

  return createPortal(
    <div className={styles.drawerBackdrop} onMouseDown={() => onOpenChange(false)}>
      <aside
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-type-drawer-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.drawerHeader}>
          <span className={styles.drawerIcon} aria-hidden="true">
            <UsersRound size={20} />
          </span>
          <div className={styles.drawerHeading}>
            <span>{t("customerTypes.columns.code")}</span>
            <h2 id="customer-type-drawer-title">{title}</h2>
          </div>
          <button
            type="button"
            className={styles.drawerClose}
            onClick={() => onOpenChange(false)}
            aria-label={t("common.close")}
            title={t("common.close")}
          >
            <X size={18} />
          </button>
        </header>

        <div className={styles.drawerBody}>
          <div className={styles.sectionTitle}>{t("customerTypes.columns.code")}</div>
          <div className={styles.grid}>
            <TextField
              label={t("customerTypes.form.code")}
              placeholder={t("customerTypes.form.enterCode")}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              error={hasTriedSave && !isCodeValid}
              disabled={isLoading}
            />
            <TextField
              label={t("customerTypes.form.bonusPercent")}
              placeholder="0"
              type="number"
              min="0"
              value={bonusPercent}
              onChange={(event) => setBonusPercent(event.target.value)}
              error={hasTriedSave && !isBonusPercentValid}
              disabled={isLoading}
            />
            <div className={styles.switchWrapper}>
              <Switch
                checked={isDefault}
                onCheckedChange={setIsDefault}
                label={t("customerTypes.form.isDefault")}
                disabled={isLoading}
              />
            </div>
            <div className={styles.switchWrapper}>
              <Switch
                checked={preventInventoryMerge}
                onCheckedChange={setPreventInventoryMerge}
                label={t("customerTypes.form.preventInventoryMerge")}
                disabled={isLoading}
              />
              <span className={styles.switchHint}>
                {t("customerTypes.form.preventInventoryMergeHint")}
              </span>
            </div>
            {isEditMode && (
              <div className={styles.switchWrapper}>
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  label={t("common.enabled")}
                  disabled={isLoading}
                />
              </div>
            )}
          </div>
        </div>

        <footer className={styles.drawerFooter}>
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
            onClick={handleSave}
            disabled={isLoading}
          >
            {isEditMode ? t("common.update") : t("common.save")}
          </Button>
        </footer>
      </aside>
    </div>,
    document.body,
  );
};
