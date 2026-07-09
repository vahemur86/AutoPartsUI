import { useState, useEffect, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Dropdown, TextField, Button, Select } from "@/ui-kit";

// styles
import styles from "../Users.module.css";

// types
import type { CreateUserPayload } from "@/types/users";

interface UsersDropdownProps {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CreateUserPayload) => void;
  userTypes: { value: string; label: string }[];
  roles: { value: string; label: string }[];
  shops: { id: string; code: string }[];
  warehouses: { id: string; code: string }[];
  isSubmitting?: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

const initialFormState = {
  email: "",
  role: "",
  userType: "",
  shopId: "",
  warehouseId: "",
  selectedCountry: "AM" as const,
};

export const UsersDropdown = ({
  open,
  anchorRef,
  onOpenChange,
  onSave,
  userTypes,
  roles,
  shops,
  warehouses,
  isSubmitting = false,
  isSuperAdmin,
  isAdmin,
}: UsersDropdownProps) => {
  const { t } = useTranslation();
  const [form, setForm] = useState(initialFormState);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  const isCashier = form.role === "Cashier";
  const isShopRequired =
    isCashier || form.userType === "Shop" || (form.userType === "System" && !isSuperAdmin);
  const isWarehouseRequired =
    form.userType === "Warehouse" || (form.userType === "System" && !isSuperAdmin);

  const isEmailValid = /\S+@\S+\.\S+/.test(form.email);
  const isRoleValid = !!form.role;
  const isUserTypeValid = !!form.userType;
  const isShopValid = isShopRequired ? !!form.shopId : true;
  const isWarehouseValid = isWarehouseRequired ? !!form.warehouseId : true;

  useEffect(() => {
    if (open) {
      setForm(initialFormState);
      setHasTriedSubmit(false);
    }
  }, [open]);

  const updateField = (updates: Partial<typeof form>) =>
    setForm((prev) => ({ ...prev, ...updates }));

  const handleSave = () => {
    setHasTriedSubmit(true);
    if (!isEmailValid || !isRoleValid || !isUserTypeValid || !isShopValid || !isWarehouseValid) return;

    onSave({
      email: form.email,
      role: form.role,
      userType: form.userType,
      shopId: form.shopId ? parseInt(form.shopId, 10) : null,
      warehouseId: form.warehouseId ? parseInt(form.warehouseId, 10) : null,
      username: form.email,
    });
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dropdown
      open={open}
      onOpenChange={onOpenChange}
      anchorRef={anchorRef}
      align="start"
      side="bottom"
      title={t("users.tabs.create")}
      contentClassName={styles.dropdownContent}
    >
      <div className={styles.dropdownContentInner}>
        <TextField
          label={t("users.form.email")}
          placeholder={t("users.form.enterEmail")}
          value={form.email}
          onChange={(e: ChangeEvent<HTMLInputElement>) => updateField({ email: e.target.value })}
          error={hasTriedSubmit && !isEmailValid}
          helperText={hasTriedSubmit && !isEmailValid ? t("users.validation.emailInvalid") : ""}
          disabled={isSubmitting}
        />

        <Select
          label={t("users.form.role")}
          placeholder={t("users.form.selectRole")}
          value={form.role}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => updateField({ role: e.target.value })}
          error={hasTriedSubmit && !isRoleValid}
          helperText={hasTriedSubmit && !isRoleValid ? t("users.validation.roleRequired") : ""}
          disabled={isSubmitting}
        >
          <option value="">{t("users.form.selectRole")}</option>
          {roles.map((roleOption) => (
            <option key={roleOption.value} value={roleOption.value}>
              {roleOption.label}
            </option>
          ))}
        </Select>

        <Select
          label={t("users.form.userType")}
          placeholder={t("users.form.selectUserType")}
          value={form.userType}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => updateField({ userType: e.target.value, shopId: "", warehouseId: "" })}
          error={hasTriedSubmit && !isUserTypeValid}
          helperText={hasTriedSubmit && !isUserTypeValid ? t("users.validation.userTypeRequired") : ""}
          disabled={isAdmin || isSubmitting || isCashier}
        >
          <option value="">{t("users.form.selectUserType")}</option>
          {userTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </Select>

        {isShopRequired && (
          <Select
            label={t("users.form.shop")}
            placeholder={t("users.form.selectShop")}
            value={form.shopId}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => updateField({ shopId: e.target.value })}
            error={hasTriedSubmit && !isShopValid}
            helperText={hasTriedSubmit && !isShopValid ? t("users.validation.shopRequired") : ""}
            disabled={isSubmitting}
          >
            <option value="">{t("users.form.selectShop")}</option>
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.code}
              </option>
            ))}
          </Select>
        )}

        {isWarehouseRequired && (
          <Select
            label={t("users.form.warehouse")}
            placeholder={t("users.form.selectWarehouse")}
            value={form.warehouseId}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => updateField({ warehouseId: e.target.value })}
            error={hasTriedSubmit && !isWarehouseValid}
            helperText={hasTriedSubmit && !isWarehouseValid ? t("users.validation.warehouseRequired") : ""}
            disabled={isSubmitting}
          >
            <option value="">{t("users.form.selectWarehouse")}</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.code}
              </option>
            ))}
          </Select>
        )}

        <div className={styles.dropdownActions}>
          <Button variant="secondary" onClick={handleCancel} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isSubmitting}>
            {t("common.save")}
          </Button>
        </div>
      </div>
    </Dropdown>
  );
};
