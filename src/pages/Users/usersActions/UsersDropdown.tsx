import { useState, useEffect, useCallback, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { LoaderCircle, Mail, UserRoundPlus } from "lucide-react";

import { Button, Select, TextField } from "@/ui-kit";
import { FormDrawer } from "@/components/common/FormDrawer";

import styles from "../Users.module.css";

// types
import type { CreateUserPayload } from "@/types/users";
import type { AgentDto } from "@/types/agents";

interface UsersDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CreateUserPayload) => void;
  userTypes: { value: string; label: string }[];
  roles: { value: string; label: string }[];
  shops: { id: string; code: string }[];
  isLoadingShops: boolean;
  shopLoadError: string | null;
  onRetryShops: () => void;
  warehouses: { id: string; code: string }[];
  agents: AgentDto[];
  linkedAgentIds: string[];
  isLoadingAgents: boolean;
  agentLoadError: string;
  onRetryAgents: () => void;
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
  username: "",
  agentId: "",
  selectedCountry: "AM" as const,
};

export const UsersDropdown = ({
  open,
  onOpenChange,
  onSave,
  userTypes,
  roles,
  shops,
  isLoadingShops,
  shopLoadError,
  onRetryShops,
  warehouses,
  agents,
  linkedAgentIds,
  isLoadingAgents,
  agentLoadError,
  onRetryAgents,
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
  const isAgent = form.role === "Agent";
  const resolvedUserType = isCashier || isAgent ? "Shop" : form.userType;
  const isShopRequired =
    isCashier || isAgent || resolvedUserType === "Shop" || (resolvedUserType === "System" && !isSuperAdmin);
  const isWarehouseRequired =
    !isAgent && (resolvedUserType === "Warehouse" || (resolvedUserType === "System" && !isSuperAdmin));

  const isEmailValid = /\S+@\S+\.\S+/.test(form.email.trim());
  const isUsernameValid = form.username.trim().length > 0;
  const isRoleValid = !!form.role;
  const isUserTypeValid = !!resolvedUserType;
  const isShopValid = isShopRequired ? Number.isInteger(Number(form.shopId)) && Number(form.shopId) > 0 : true;
  const isWarehouseValid = isWarehouseRequired ? !!form.warehouseId : true;
  const isAgentValid = !isAgent || !!form.agentId.trim();

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
    if (!isEmailValid || !isUsernameValid || !isRoleValid || !isUserTypeValid || !isShopValid || !isWarehouseValid || !isAgentValid) return;

    onSave({
      email: form.email.trim(),
      role: form.role,
      userType: resolvedUserType,
      shopId: form.shopId ? parseInt(form.shopId, 10) : null,
      warehouseId: isAgent ? null : form.warehouseId ? parseInt(form.warehouseId, 10) : null,
      username: form.username.trim(),
      ...(isAgent ? { agentId: form.agentId } : {}),
    });
  };

  const handleRoleChange = (role: string) => {
    updateField({
      role,
      userType: role === "Agent" || role === "Cashier" ? "Shop" : "",
      shopId: "",
      warehouseId: "",
      agentId: "",
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
          label={t("users.form.username")}
          placeholder={t("users.form.enterUsername")}
          value={form.username}
          onChange={(e: ChangeEvent<HTMLInputElement>) => updateField({ username: e.target.value })}
          error={hasTriedSubmit && !isUsernameValid}
          helperText={hasTriedSubmit && !isUsernameValid ? t("users.validation.usernameRequired") : ""}
          disabled={isSubmitting}
        />

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
          onChange={(e: ChangeEvent<HTMLSelectElement>) => handleRoleChange(e.target.value)}
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
          disabled={isAdmin || isSubmitting || isCashier || isAgent}
        >
          <option value="">{t("users.form.selectUserType")}</option>
          {(isCashier || isAgent
            ? userTypes.filter((type) => type.value === "Shop")
            : userTypes
          ).map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </Select>

        {isAgent && (
          <>
            <Select
              label={t("users.form.agent")}
              placeholder={t("users.form.selectAgent")}
              value={form.agentId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => updateField({ agentId: e.target.value })}
              error={hasTriedSubmit && !isAgentValid}
              helperText={hasTriedSubmit && !isAgentValid ? t("users.validation.agentRequired") : ""}
              disabled={isSubmitting || isLoadingAgents || !!agentLoadError}
            >
              <option value="">{t("users.form.selectAgent")}</option>
              {agents.map((agent) => {
                const fullName = [agent.firstName, agent.lastName].filter(Boolean).join(" ") || agent.customer?.fullName || agent.code;
                return (
                  <option key={agent.id} value={agent.id} disabled={linkedAgentIds.includes(agent.id)}>
                    {fullName} · {agent.code}
                  </option>
                );
              })}
            </Select>
            {isLoadingAgents && <span className={styles.agentLookupMessage}>{t("users.status.loadingAgents")}</span>}
            {agentLoadError && (
              <div className={styles.agentLookupError} role="alert">
                <span>{agentLoadError}</span>
                <Button variant="secondary" size="small" onClick={onRetryAgents} disabled={isSubmitting}>{t("common.retry")}</Button>
              </div>
            )}
            {!isLoadingAgents && !agentLoadError && agents.length === 0 && (
              <span className={styles.agentLookupMessage}>{t("users.status.noAvailableAgents")}</span>
            )}
          </>
        )}

        {isShopRequired && (
          <Select
            label={t("users.form.shop")}
            placeholder={t("users.form.selectShop")}
            value={form.shopId}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => updateField({ shopId: e.target.value })}
            error={hasTriedSubmit && !isShopValid}
            helperText={hasTriedSubmit && !isShopValid ? t("users.validation.shopRequired") : ""}
            disabled={isSubmitting || isLoadingShops || !!shopLoadError}
          >
            <option value="">{t("users.form.selectShop")}</option>
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.code}
              </option>
            ))}
          </Select>
        )}
        {isShopRequired && isLoadingShops && (
          <span className={styles.agentLookupMessage}>{t("users.status.loadingShops")}</span>
        )}
        {isShopRequired && shopLoadError && (
          <div className={styles.agentLookupError} role="alert">
              <span>{shopLoadError}</span>
              <Button variant="secondary" size="small" onClick={onRetryShops} disabled={isSubmitting}>{t("common.retry")}</Button>
          </div>
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
