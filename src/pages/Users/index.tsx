import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

// components
import { SectionHeader } from "@/components/common";

// icons
import userIcon from "@/assets/icons/userVector.svg";

// ui-kit
import { Button, TextField, Select } from "@/ui-kit";

// services
import { createUser } from "@/services/users";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchShops } from "@/store/slices/shopsSlice";
import { fetchWarehouses } from "@/store/slices/warehousesSlice";

// constants
import { ROLES, USER_TYPES } from "@/constants/settings/users";

// utils
import { getErrorMessage } from "@/utils";

// styles
import styles from "./Users.module.css";

export const UserManagement = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { user: currentUser } = useAppSelector((state) => state.auth);
  const { shops } = useAppSelector((state) => state.shops);
  const { warehouses } = useAppSelector((state) => state.warehouses);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [userType, setUserType] = useState("");
  const [shopId, setShopId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  const isSuperAdmin = currentUser?.role === "SuperAdmin";
  const isAdmin = currentUser?.role === "Admin";

  const isShopRequired =
    userType === "Shop" || (userType === "System" && !isSuperAdmin);
  const isWarehouseRequired =
    userType === "Warehouse" || (userType === "System" && !isSuperAdmin);

  const isEmailValid = /\S+@\S+\.\S+/.test(email);
  const isRoleValid = !!role;
  const isUserTypeValid = !!userType;

  const isShopValid = isShopRequired ? !!shopId : true;
  const isWarehouseValid = isWarehouseRequired ? !!warehouseId : true;

  const isFormValid =
    isEmailValid &&
    isRoleValid &&
    isUserTypeValid &&
    isShopValid &&
    isWarehouseValid;

  const filteredRoles = useMemo(() => {
    if (isSuperAdmin) return ROLES;
    return ROLES.filter((r) => r.value !== "SuperAdmin");
  }, [isSuperAdmin]);

  useEffect(() => {
    if (isAdmin && currentUser) {
      setUserType(currentUser.userType || "");
      if (currentUser.userType === "Shop") {
        setShopId(String(currentUser.shopId || ""));
        setWarehouseId("0");
      } else if (currentUser.userType === "Warehouse") {
        setWarehouseId(String(currentUser.warehouseId || ""));
        setShopId("0");
      }
    }
  }, [isAdmin, currentUser]);

  useEffect(() => {
    if (shops.length === 0) dispatch(fetchShops());
    if (warehouses.length === 0) dispatch(fetchWarehouses());
  }, [dispatch, shops.length, warehouses.length]);

  const handleCancel = () => {
    setEmail("");
    setRole("");
    setHasTriedSubmit(false);
    if (isSuperAdmin) {
      setUserType("");
      setShopId("");
      setWarehouseId("");
    }
  };

  const handleSubmit = async () => {
    setHasTriedSubmit(true);

    if (!isFormValid) return;

    setIsSubmitting(true);

    const finalShopId =
      isSuperAdmin && userType === "System" ? null : parseInt(shopId || "0");

    const finalWarehouseId =
      isSuperAdmin && userType === "System"
        ? null
        : parseInt(warehouseId || "0");

    try {
      await createUser(
        email,
        role,
        userType,
        finalShopId,
        finalWarehouseId,
        email,
      );

      toast.success(t("users.success.userCreated"));
      handleCancel();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("users.error.failedToCreate")));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SectionHeader
        title={t("header.users")}
        icon={<img src={userIcon} alt={t("users.iconAlt")} />}
      />

      <div className={styles.usersContainer}>
        <div className={styles.formWrapper}>
          <div className={styles.formContainer}>
            <div className={styles.formRow}>
              <div className={styles.formColumn}>
                <TextField
                  label={t("users.form.email")}
                  placeholder={t("users.form.enterEmail")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={hasTriedSubmit && !isEmailValid}
                  helperText={
                    hasTriedSubmit && !isEmailValid
                      ? t("users.validation.emailInvalid")
                      : ""
                  }
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formColumn}>
                <Select
                  label={t("users.form.role")}
                  placeholder={t("users.form.selectRole")}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  error={hasTriedSubmit && !isRoleValid}
                  helperText={
                    hasTriedSubmit && !isRoleValid
                      ? t("users.validation.roleRequired")
                      : ""
                  }
                  disabled={isSubmitting}
                >
                  {filteredRoles.map((roleOption) => (
                    <option key={roleOption.value} value={roleOption.value}>
                      {roleOption.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className={styles.formColumn}>
                <Select
                  label={t("users.form.userType")}
                  placeholder={t("users.form.selectUserType")}
                  value={userType}
                  onChange={(e) => {
                    setUserType(e.target.value);
                    setShopId("");
                    setWarehouseId("");
                  }}
                  error={hasTriedSubmit && !isUserTypeValid}
                  helperText={
                    hasTriedSubmit && !isUserTypeValid
                      ? t("users.validation.userTypeRequired")
                      : ""
                  }
                  disabled={isAdmin || isSubmitting}
                >
                  {USER_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className={styles.formRow}>
              {isShopRequired && (
                <div className={styles.formColumn}>
                  <Select
                    label={t("users.form.shop")}
                    placeholder={t("users.form.selectShop")}
                    value={shopId}
                    onChange={(e) => setShopId(e.target.value)}
                    disabled={(isAdmin && userType === "Shop") || isSubmitting}
                    error={hasTriedSubmit && !isShopValid}
                    helperText={
                      hasTriedSubmit && !isShopValid
                        ? t("users.validation.shopRequired")
                        : ""
                    }
                  >
                    {shops.map((shop) => (
                      <option key={shop.id} value={shop.id}>
                        {shop.code}
                      </option>
                    ))}
                  </Select>
                </div>
              )}

              {isWarehouseRequired && (
                <div className={styles.formColumn}>
                  <Select
                    label={t("users.form.warehouse")}
                    placeholder={t("users.form.selectWarehouse")}
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    disabled={
                      (isAdmin && userType === "Warehouse") || isSubmitting
                    }
                    error={hasTriedSubmit && !isWarehouseValid}
                    helperText={
                      hasTriedSubmit && !isWarehouseValid
                        ? t("users.validation.warehouseRequired")
                        : ""
                    }
                  >
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.code}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
          </div>

          <div className={styles.actionButtons}>
            <Button
              variant="secondary"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {t("common.save")}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
