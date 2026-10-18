import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { useMinimumLoadingDuration } from "@/hooks/useMinimumLoadingDuration";
import { LoaderCircle, Pencil, Plus, RefreshCw, UsersRound } from "lucide-react";

// components
import { SectionHeader } from "@/components/common";
import { FormDrawer } from "@/components/common/FormDrawer";
import { UsersDropdown } from "./usersActions/UsersDropdown";

// ui-kit
import { Button, TextField, Select, Switch, DataTable } from "@/ui-kit";

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

const roleBadgeStyles: Record<string, string> = {
  SuperAdmin: styles.roleSuperAdmin,
  Admin: styles.roleAdmin,
  Programmer: styles.roleProgrammer,
  Operator: styles.roleOperator,
  Cashier: styles.roleCashier,
};

export const UserManagement = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

    const { user: currentUser } = useAppSelector((state) => state.auth);
  const { shops } = useAppSelector((state) => state.shops);
  const { warehouses } = useAppSelector((state) => state.warehouses);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const showTableSkeleton = useMinimumLoadingDuration(isLoadingUsers);
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

  const handleEditOpenChange = useCallback(
    (open: boolean) => {
      if (isMutatingEdit && !open) return;
      if (open) {
        setIsEditModalOpen(true);
      } else {
        handleCloseEdit();
      }
    },
    [isMutatingEdit],
  );

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
        cell: (info) => {
          const role = String(info.getValue() ?? "");
          const roleKey = role === "SuperAdmin" ? "superAdmin" : role.toLowerCase();

          return (
            <span className={`${styles.roleBadge} ${roleBadgeStyles[role] ?? styles.roleDefault}`}>
              {t(`users.roles.${roleKey}`, { defaultValue: role || "-" })}
            </span>
          );
        },
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
            <button
              type="button"
              className={styles.tableAction}
              onClick={() => handleOpenEdit(row.original)}
              aria-label={t("common.edit")}
              title={t("common.edit")}
            >
              <Pencil size={14} aria-hidden="true" />
            </button>
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
        icon={<UsersRound size={17} aria-hidden="true" />}
      />

      <div className={styles.usersContainer}>
        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <h3 className={styles.tableTitle}>{t("users.table.title")}</h3>
            <div className={styles.headerActions}>
              <Button
                variant="secondary"
                className={styles.refreshButton}
                onClick={() => void loadUsers()}
                disabled={isLoadingUsers}
              >
                <RefreshCw size={15} />
                {t("common.refresh")}
              </Button>
              <Button className={styles.usersPrimaryButton} onClick={handleOpenCreate}>
                <Plus size={16} />
                {t("users.actions.addUser")}
              </Button>
              <UsersDropdown
                open={isCreateOpen}
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
            {showTableSkeleton ? (
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

      <FormDrawer
        open={isEditModalOpen}
        onOpenChange={handleEditOpenChange}
        eyebrow={t("header.users")}
        title={t("users.editModal.title")}
        titleId="user-edit-title"
        closeLabel={t("common.close")}
        closeDisabled={isMutatingEdit}
        icon={<Pencil size={20} />}
        footer={
          <div className={styles.editDrawerFooter}>
            <Button
              variant="secondary"
              onClick={handleCloseEdit}
              disabled={isMutatingEdit}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              className={styles.usersEditSaveButton}
              onClick={handleSaveEdit}
              disabled={isMutatingEdit}
              aria-busy={isMutatingEdit}
            >
              {isMutatingEdit && (
                <LoaderCircle className={styles.editSaveSpinner} size={15} aria-hidden="true" />
              )}
              {isMutatingEdit ? t("common.saving") : t("common.save")}
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
      </FormDrawer>
    </>
  );
};
