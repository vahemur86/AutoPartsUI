import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

// components
import { SectionHeader } from "@/components/common";
import { UsersDropdown } from "./usersActions/UsersDropdown";

// icons
import userIcon from "@/assets/icons/userVector.svg";

// ui-kit
import { Button, TextField, Select, Switch, DataTable, Modal } from "@/ui-kit";

// services
import { createUser, getUsers, updateUser } from "@/services/users";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchShops } from "@/store/slices/shopsSlice";
import { fetchWarehouses } from "@/store/slices/warehousesSlice";

// types
import type { User, CreateUserPayload } from "@/types/users";
import type { ColumnDef } from "@tanstack/react-table";

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

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editUserType, setEditUserType] = useState("");
  const [editShopId, setEditShopId] = useState("");
  const [editWarehouseId, setEditWarehouseId] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [isMutatingEdit, setIsMutatingEdit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addButtonRef = useRef<HTMLDivElement>(null);

  const isSuperAdmin = currentUser?.role === "SuperAdmin";
  const isAdmin = currentUser?.role === "Admin";

  const filteredRoles = useMemo(() => {
    if (isSuperAdmin) return ROLES;
    return ROLES.filter((r) => r.value !== "SuperAdmin");
  }, [isSuperAdmin]);

  const filteredEditRoles = useMemo(() => {
    if (isSuperAdmin) return ROLES;
    return ROLES.filter((r) => r.value !== "SuperAdmin");
  }, [isSuperAdmin]);

  useEffect(() => {
    if (shops.length === 0) dispatch(fetchShops());
    if (warehouses.length === 0) dispatch(fetchWarehouses());
  }, [dispatch, shops.length, warehouses.length]);

  useEffect(() => {
    if (editRole === "Cashier") {
      setEditUserType("Shop");
      setEditWarehouseId("");
    }
  }, [editRole]);

  const loadUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const loadedUsers = await getUsers();
      setUsers(Array.isArray(loadedUsers) ? loadedUsers : []);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("users.error.failedToLoad")));
    } finally {
      setIsLoadingUsers(false);
    }
  }, [t]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditRole(user.role || "");
    setEditUserType(user.userType || "");
    setEditShopId(user.shopId !== null ? String(user.shopId) : "");
    setEditWarehouseId(user.warehouseId !== null ? String(user.warehouseId) : "");
    setEditPassword("");
    setEditIsActive(user.isActive);
    setIsEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
    setEditPassword("");
  };

  const isEditShopRequired =
    editRole === "Cashier" ||
    editUserType === "Shop" ||
    (editUserType === "System" && !isSuperAdmin);
  const isEditWarehouseRequired =
    editUserType === "Warehouse" ||
    (editUserType === "System" && !isSuperAdmin);

  const isEditFormValid =
    !!editRole &&
    !!editUserType &&
    (isEditShopRequired ? !!editShopId : true) &&
    (isEditWarehouseRequired ? !!editWarehouseId : true);

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    if (!isEditFormValid) {
      toast.error(t("users.validation.fillAllFields"));
      return;
    }

    setIsMutatingEdit(true);
    try {
      const finalShopId =
        editRole === "Cashier"
          ? parseInt(editShopId || "0")
          : editUserType === "Shop"
          ? parseInt(editShopId || "0")
          : null;

      const finalWarehouseId =
        editRole === "Cashier"
          ? null
          : editUserType === "Warehouse"
          ? parseInt(editWarehouseId || "0")
          : null;

      await updateUser({
        id: editingUser.id,
        role: editRole,
        userType: editUserType,
        shopId: finalShopId,
        warehouseId: finalWarehouseId,
        isActive: editIsActive,
        ...(editPassword.trim() ? { password: editPassword.trim() } : {}),
      });

      toast.success(t("users.success.userUpdated"));
      handleCloseEdit();
      void loadUsers();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("users.error.failedToUpdate")));
    } finally {
      setIsMutatingEdit(false);
    }
  };

  const columns = useMemo<ColumnDef<User, any>[]>(
    () => [
      {
        accessorKey: "id",
        header: t("users.table.id"),
      },
      {
        accessorKey: "username",
        header: t("users.table.username"),
      },
      {
        accessorKey: "email",
        header: t("users.table.email"),
      },
      {
        accessorKey: "role",
        header: t("users.table.role"),
      },
      {
        accessorKey: "userType",
        header: t("users.table.userType"),
      },
      {
        accessorKey: "shopId",
        header: t("users.table.shop"),
        cell: (info) => info.getValue() || "-",
      },
      {
        accessorKey: "warehouseId",
        header: t("users.table.warehouse"),
        cell: (info) => info.getValue() || "-",
      },
      {
        accessorKey: "isActive",
        header: t("users.table.active"),
        cell: (info) =>
          info.getValue() ? t("common.active") : t("common.inactive"),
      },
      {
        accessorKey: "createdAt",
        header: t("users.table.createdAt"),
        cell: (info) =>
          new Date(String(info.getValue())).toLocaleString() || "-",
      },
      {
        id: "actions",
        header: t("common.actions"),
        cell: ({ row }) => (
          <div className={styles.actionButtons}>
            <Button
              variant="secondary"
              size="small"
              onClick={() => handleOpenEdit(row.original)}
            >
              {t("common.edit")}
            </Button>
          </div>
        ),
      },
    ],
    [t],
  );

  const handleOpenCreate = () => {
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
  };

  const handleSaveUser = async (payload: CreateUserPayload) => {
    setIsSubmitting(true);

    try {
      await createUser(
        payload.email,
        payload.role,
        payload.userType,
        payload.shopId,
        payload.warehouseId,
        payload.username,
      );

      toast.success(t("users.success.userCreated"));
      handleCloseCreate();
      void loadUsers();
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
        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <h3 className={styles.tableTitle}>{t("users.table.title")}</h3>
            <div className={styles.headerActions}>
              <Button
              variant="secondary"
              onClick={() => void loadUsers()}
              disabled={isLoadingUsers}
            >
              {t("common.refresh")}
            </Button>
            <div ref={addButtonRef}>
              <Button variant="primary" onClick={handleOpenCreate}>
                {t("users.actions.addUser")}
              </Button>
            </div>
            <UsersDropdown
              open={isCreateOpen}
              anchorRef={addButtonRef}
              onOpenChange={setIsCreateOpen}
              onSave={handleSaveUser}
              userTypes={USER_TYPES}
              roles={filteredRoles}
              shops={shops.map((shop) => ({ id: String(shop.id), code: shop.code }))}
              warehouses={warehouses.map((warehouse) => ({ id: String(warehouse.id), code: warehouse.code }))}
              isSubmitting={isSubmitting}
              isSuperAdmin={isSuperAdmin}
              isAdmin={isAdmin}
            />
          </div>
          </div>

          <div className={styles.tableWrapper}>
            {isLoadingUsers ? (
              <div className={styles.tableSkeleton} aria-busy="true" aria-live="polite">
                <div className={styles.tableSkeletonHeader}>
                  <div className={`${styles.skeletonLine} ${styles.skeletonLineWide}`} />
                  <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                </div>
                <div className={styles.tableSkeletonRows}>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className={styles.tableSkeletonRow}>
                      <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
                      <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
                      <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                    </div>
                  ))}
                </div>
              </div>
            ) : users.length === 0 ? (
              <div className={styles.emptyState}>
                {t("users.table.noUsers")}
              </div>
            ) : (
              <DataTable
                data={users}
                columns={columns}
                pageSize={20}
              />
            )}
          </div>
        </div>
      </div>

      <Modal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title={t("users.editModal.title")}
        footer={
          <div className={styles.editModalFooter}>
            <Button
              variant="secondary"
              onClick={handleCloseEdit}
              disabled={isMutatingEdit}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveEdit}
              disabled={isMutatingEdit}
            >
              {t("common.save")}
            </Button>
          </div>
        }
      >
        <div className={styles.editModalBody}>
          <div className={styles.formRow}>
            <div className={styles.formColumn}>
              <Select
                label={t("users.form.role")}
                placeholder={t("users.form.selectRole")}
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                disabled={isMutatingEdit}
              >
                {filteredEditRoles.map((roleOption) => (
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
                value={editUserType}
                onChange={(e) => {
                  setEditUserType(e.target.value);
                  setEditShopId("");
                  setEditWarehouseId("");
                }}
                disabled={editRole === "Cashier" || isMutatingEdit}
              >
                {(editRole === "Cashier"
                  ? USER_TYPES.filter((type) => type.value === "Shop")
                  : USER_TYPES
                ).map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className={styles.formRow}>
            {isEditShopRequired && (
              <div className={styles.formColumn}>
                <Select
                  label={t("users.form.shop")}
                  placeholder={t("users.form.selectShop")}
                  value={editShopId}
                  onChange={(e) => setEditShopId(e.target.value)}
                  disabled={isMutatingEdit}
                >
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>
                      {shop.code}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {isEditWarehouseRequired && (
              <div className={styles.formColumn}>
                <Select
                  label={t("users.form.warehouse")}
                  placeholder={t("users.form.selectWarehouse")}
                  value={editWarehouseId}
                  onChange={(e) => setEditWarehouseId(e.target.value)}
                  disabled={isMutatingEdit}
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

          <div className={styles.formRow}>
            <div className={styles.formColumn}>
              <TextField
                label={t("users.editModal.password")}
                placeholder={t("users.editModal.enterPassword")}
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                disabled={isMutatingEdit}
              />
            </div>
            <div className={styles.formColumn}>
              <Switch
                checked={editIsActive}
                onCheckedChange={setEditIsActive}
                label={t("users.editModal.active")}
                disabled={isMutatingEdit}
              />
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
