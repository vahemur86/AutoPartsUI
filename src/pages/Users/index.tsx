import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
// components
import { SectionHeader } from "@/components/common/SectionHeader";
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
  const { shops } = useAppSelector((state) => state.shops);
  const { warehouses } = useAppSelector((state) => state.warehouses);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [userType, setUserType] = useState("");
  const [shopId, setShopId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch shops and warehouses on component mount
  useEffect(() => {
    if (shops.length === 0) {
      dispatch(fetchShops());
    }
    if (warehouses.length === 0) {
      dispatch(fetchWarehouses());
    }
  }, [dispatch, shops.length, warehouses.length]);

  const handleCancel = () => {
    setUsername("");
    setPassword("");
    setRole("");
    setUserType("");
    setShopId("");
    setWarehouseId("");
  };

  const handleSubmit = async () => {
    if (
      !username ||
      !password ||
      !role ||
      !userType ||
      !shopId ||
      !warehouseId
    ) {
      toast.error(t("users.validation.fillAllFields"));
      return;
    }

    setIsSubmitting(true);
    try {
      await createUser(
        username,
        password,
        role,
        userType,
        parseInt(shopId),
        parseInt(warehouseId)
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
                  label={t("users.form.username")}
                  placeholder={t("users.form.enterUsername")}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className={styles.formColumn}>
                <TextField
                  label={t("users.form.password")}
                  type="password"
                  placeholder={t("users.form.enterPassword")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                >
                  {ROLES.map((roleOption) => (
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
                  onChange={(e) => setUserType(e.target.value)}
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
              <div className={styles.formColumn}>
                <Select
                  label={t("users.form.shop")}
                  placeholder={t("users.form.selectShop")}
                  value={shopId}
                  onChange={(e) => setShopId(e.target.value)}
                >
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>
                      {shop.code}
                    </option>
                  ))}
                </Select>
              </div>
              <div className={styles.formColumn}>
                <Select
                  label={t("users.form.warehouse")}
                  placeholder={t("users.form.selectWarehouse")}
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                >
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.code}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <div className={styles.actionButtons}>
            <Button
              variant="secondary"
              size="medium"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              size="medium"
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
