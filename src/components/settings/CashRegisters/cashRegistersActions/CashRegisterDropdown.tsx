import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { CreditCard, Save, X } from "lucide-react";

// ui-kit
import { Button, TextField, Switch, Select } from "@/ui-kit";

// types
import type { CashRegister } from "@/types/cash";
import type { Shop } from "@/types/settings";

// styles
import styles from "./CashRegisterDropdown.module.css";

export type CashRegisterForm = Omit<CashRegister, "id" | "isActive"> & {
  isActive?: boolean;
};

interface CashRegisterDropdownProps {
  open: boolean;
  initialData?: (CashRegisterForm & { id?: number }) | null;
  isLoading?: boolean;
  shops: Shop[];
  onOpenChange: (open: boolean) => void;
  onSave: (data: CashRegisterForm) => void;
}

export const CashRegisterDropdown = ({
  open,
  initialData,
  isLoading = false,
  shops,
  onOpenChange,
  onSave,
}: CashRegisterDropdownProps) => {
  const { t } = useTranslation();

  const [shopId, setShopId] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [hasTriedSave, setHasTriedSave] = useState(false);

  const isEditMode = !!initialData;

  useEffect(() => {
    if (open) {
      setShopId(initialData?.shopId ? String(initialData.shopId) : "");
      setCode(initialData?.code ?? "");
      setDescription(initialData?.description ?? "");
      setIsActive(initialData?.isActive ?? true);
      setHasTriedSave(false);
    }
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

  const isShopIdValid = shopId.trim().length > 0 && !isNaN(Number(shopId));
  const isCodeValid = code.trim().length > 0;
  const isValid = isShopIdValid && isCodeValid;

  const handleSaveClick = () => {
    setHasTriedSave(true);
    if (!isValid) return;

    onSave({
      shopId: Number(shopId),
      code: code.trim(),
      description: description.trim(),
      ...(isEditMode && { isActive }),
    });
  };

  const handleClose = () => {
    if (!isLoading) onOpenChange(false);
  };

  const titleText = isEditMode
    ? t("cashRegisters.editCashRegister")
    : t("cashRegisters.addCashRegister");

  if (!open) return null;

  return createPortal(
    <div className={styles.drawerBackdrop} onMouseDown={handleClose}>
      <aside
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cash-register-drawer-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.drawerHeader}>
          <span className={styles.drawerIcon} aria-hidden="true">
            <CreditCard size={20} />
          </span>
          <h2 id="cash-register-drawer-title">{titleText}</h2>
          <button
            type="button"
            className={styles.drawerClose}
            onClick={handleClose}
            aria-label={t("common.close")}
            title={t("common.close")}
            disabled={isLoading}
          >
            <X size={18} />
          </button>
        </header>

        <div className={styles.drawerBody}>
          <div className={styles.fields}>
            {!isEditMode && (
              <Select
                label={t("cashRegisters.form.shop")}
                placeholder={t("cashRegisters.form.selectShop")}
                value={shopId}
                onChange={(e) => setShopId(e.target.value)}
                searchable
                searchPlaceholder={t("common.search")}
                error={hasTriedSave && !isShopIdValid}
                disabled={isLoading}
              >
                <option value="">{t("cashRegisters.form.selectShop")}</option>
                {shops.map((shop) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.code}
                  </option>
                ))}
              </Select>
            )}

            <TextField
              label={t("cashRegisters.form.code")}
              placeholder={t("cashRegisters.form.enterCode")}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              error={hasTriedSave && !isCodeValid}
              disabled={isLoading}
            />

            <TextField
              label={t("cashRegisters.form.description")}
              placeholder={t("cashRegisters.form.enterDescription")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
            />
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

        <footer className={styles.drawerFooter}>
          <Button
            variant="secondary"
            size="medium"
            onClick={handleClose}
            disabled={isLoading}
          >
            <X size={16} aria-hidden="true" />
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            size="medium"
            onClick={handleSaveClick}
            disabled={isLoading}
          >
            <Save size={16} aria-hidden="true" />
            {isEditMode ? t("common.update") : t("common.save")}
          </Button>
        </footer>
      </aside>
    </div>,
    document.body,
  );
};
