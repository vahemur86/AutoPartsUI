import { useState, useEffect, useCallback, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { LoaderCircle, Mail, UserRoundPlus } from "lucide-react";

import { Button, Select, TextField } from "@/ui-kit";
import { FormDrawer } from "@/components/common/FormDrawer";

import styles from "../Users.module.css";

// types
import type { CreateUserPayload } from "@/types/users";

interface UsersDropdownProps {
  open: boolean;
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

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (isSubmitting && !nextOpen) return;
      onOpenChange(nextOpen);
    },
    [isSubmitting, onOpenChange],
  );

  const isCashier = form.role === "Cashier";
  const resolvedUserType = isCashier ? "Shop" : form.userType;
  const isShopRequired =
    isCashier || resolvedUserType === "Shop" || (resolvedUserType === "System" && !isSuperAdmin);
  const isWarehouseRequired =
    resolvedUserType === "Warehouse" || (resolvedUserType === "System" && !isSuperAdmin);

  const isEmailValid = /\S+@\S+\.\S+/.test(form.email);
  const isRoleValid = !!form.role;
  const isUserTypeValid = !!resolvedUserType;
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
      userType: resolvedUserType,
      shopId: form.shopId ? parseInt(form.shopId, 10) : null,
      warehouseId: form.warehouseId ? parseInt(form.warehouseId, 10) : null,
      username: form.email,
    });
  };

  const handleCancel = () => {
    handleOpenChange(false);
  };

  return (
    <FormDrawer
      open={open}
      onOpenChange={handleOpenChange}
      eyebrow={t("header.users")}
      title={t("users.tabs.create")}
      titleId="user-create-title"
      closeLabel={t("common.close")}
      closeDisabled={isSubmitting}
      icon={<UserRoundPlus size={20} />}
      footer={
        <>
          <Button variant="secondary" onClick={handleCancel} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button
            className={styles.usersPrimaryButton}
            variant="primary"
            onClick={handleSave}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting && (
              <LoaderCircle
                className={styles.submitSpinner}
                size={15}
                aria-hidden="true"
              />
            )}
            {isSubmitting
              ? t("users.actions.creatingAndSending")
              : t("common.save")}
          </Button>
        </>
      }
    >
      <div className={styles.userCreateForm}>
        <TextField
          label={t("users.form.email")}
          placeholder={t("users.form.enterEmail")}
          value={form.email}
          onChange={(e: ChangeEvent<HTMLInputElement>) => updateField({ email: e.target.value })}
          error={hasTriedSubmit && !isEmailValid}
          helperText={hasTriedSubmit && !isEmailValid ? t("users.validation.emailInvalid") : ""}
          disabled={isSubmitting}
          icon={<Mail size={15} />}
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
          value={resolvedUserType}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => updateField({ userType: e.target.value, shopId: "", warehouseId: "" })}
          error={hasTriedSubmit && !isUserTypeValid}
          helperText={hasTriedSubmit && !isUserTypeValid ? t("users.validation.userTypeRequired") : ""}
          disabled={isAdmin || isSubmitting || isCashier}
        >
          <option value="">{t("users.form.selectUserType")}</option>
          {(isCashier
            ? userTypes.filter((type) => type.value === "Shop")
            : userTypes
          ).map((type) => (
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

      </div>
      {isSubmitting && (
        <div className={styles.submitProgress} role="status" aria-live="polite">
          <LoaderCircle
            className={styles.submitProgressSpinner}
            size={17}
            aria-hidden="true"
          />
          <span>{t("users.status.creatingAndSending")}</span>
        </div>
      )}
    </FormDrawer>
  );
};
