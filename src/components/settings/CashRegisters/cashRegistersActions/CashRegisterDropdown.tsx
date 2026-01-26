import { useState, useEffect, type RefObject } from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Button, Dropdown, TextField, Switch, Select } from "@/ui-kit";

// types
import type { CashRegister, Shop } from "@/types/settings";

// styles
import styles from "./CashRegisterDropdown.module.css";

export type CashRegisterForm = Omit<CashRegister, "id" | "isActive"> & {
  isActive?: boolean;
};

interface CashRegisterDropdownProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  initialData?: (CashRegisterForm & { id?: number }) | null;
  isLoading?: boolean;
  shops: Shop[];
  onOpenChange: (open: boolean) => void;
  onSave: (data: CashRegisterForm) => void;
}

export const CashRegisterDropdown = ({
  open,
  anchorRef,
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

  const titleText = isEditMode
    ? t("cashRegisters.editCashRegister")
    : t("cashRegisters.addCashRegister");

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
          {!isEditMode && (
            <Select
              label={t("cashRegisters.form.shop")}
              placeholder={t("cashRegisters.form.selectShop")}
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
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

