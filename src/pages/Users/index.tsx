import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { useMinimumLoadingDuration } from "@/hooks/useMinimumLoadingDuration";
import { KeyRound, LoaderCircle, Pencil, Plus, RefreshCw, UsersRound } from "lucide-react";

// components
import { SectionHeader } from "@/components/common";
import { FormDrawer } from "@/components/common/FormDrawer";
import { UsersDropdown } from "./usersActions/UsersDropdown";

// ui-kit
import { Button, Select, Switch, DataTable } from "@/ui-kit";

// services
import {
  createUser,
  getUsers,
  sendUserPasswordReset,
  updateUser,
} from "@/services/users";

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
import { agentsService } from "@/services/agents";
import { AgentStatus, type AgentDto } from "@/types/agents";

// styles
import styles from "./Users.module.css";

const roleBadgeStyles: Record<string, string> = {
  SuperAdmin: styles.roleSuperAdmin,
  Admin: styles.roleAdmin,
  Programmer: styles.roleProgrammer,
  Operator: styles.roleOperator,
  Cashier: styles.roleCashier,
  Agent: styles.roleAgent,
};

const getAgentName = (agent: AgentDto) =>
  [agent.firstName, agent.lastName].filter(Boolean).join(" ") ||
  agent.customer?.fullName ||
  agent.code;

const getAgentLabel = (agent: AgentDto | undefined, agentId: string) =>
  agent ? `${getAgentName(agent)} (${agent.code})` : agentId;

export const UserManagement = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { user: currentUser } = useAppSelector((state) => state.auth);
  const { shops, isLoading: isLoadingShops, error: shopLoadError } = useAppSelector((state) => state.shops);
  const { warehouses } = useAppSelector((state) => state.warehouses);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [agents, setAgents] = useState<AgentDto[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [agentLoadError, setAgentLoadError] = useState("");
  const [agentLoadRetry, setAgentLoadRetry] = useState(0);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const showTableSkeleton = useMinimumLoadingDuration(isLoadingUsers);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editUserType, setEditUserType] = useState("");
  const [editShopId, setEditShopId] = useState("");
  const [editWarehouseId, setEditWarehouseId] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [isMutatingEdit, setIsMutatingEdit] = useState(false);
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSuperAdmin = currentUser?.role === "SuperAdmin";
  const isAdmin = currentUser?.role === "Admin";
  const linkedAgentIds = useMemo(
    () => users.map((user) => user.agentId).filter((agentId): agentId is string => !!agentId),
    [users],
  );
  const availableAgents = useMemo(
    () => agents.filter((agent) => Number(agent.status) === AgentStatus.Active && !linkedAgentIds.includes(agent.id)),
    [agents, linkedAgentIds],
  );
  const agentById = useMemo(() => new Map(agents.map((agent) => [agent.id, agent])), [agents]);

  const filteredRoles = useMemo(() => {
    if (isSuperAdmin) return ROLES;
    return ROLES.filter((r) => r.value !== "SuperAdmin");
  }, [isSuperAdmin]);

  const filteredEditRoles = useMemo(() => {
    return ROLES.filter((role) => role.value !== "Agent" && (isSuperAdmin || role.value !== "SuperAdmin"));
  }, [isSuperAdmin]);

  const editRoleOptions = useMemo(
    () => editingUser?.role === "Agent"
      ? [...filteredEditRoles, { value: "Agent", label: t("users.roles.agent") }]
      : filteredEditRoles,
    [editingUser?.role, filteredEditRoles, t],
  );

  useEffect(() => {
    if (shops.length === 0) dispatch(fetchShops());
    if (warehouses.length === 0) dispatch(fetchWarehouses());
  }, [dispatch, shops.length, warehouses.length]);

  useEffect(() => {
    let active = true;
    const loadAgents = async () => {
      setIsLoadingAgents(true);
      setAgentLoadError("");
      try {
        const allAgents: AgentDto[] = [];
        let page = 1;
        let totalItems = 0;
        do {
          const result = await agentsService.getAgents({ page, pageSize: 100 });
          allAgents.push(...(result.results ?? []));
          totalItems = result.totalItems ?? allAgents.length;
          if (!result.results?.length) break;
          page += 1;
        } while (allAgents.length < totalItems);
        if (active) setAgents(allAgents);
      } catch (error: unknown) {
        if (active) setAgentLoadError(getErrorMessage(error, t("users.error.failedToLoadAgents")));
      } finally {
        if (active) setIsLoadingAgents(false);
      }
    };
    void loadAgents();
    return () => { active = false; };
  }, [agentLoadRetry, t]);

  useEffect(() => {
    if (editRole === "Cashier" || editRole === "Agent") {
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
    setEditIsActive(user.isActive);
    setIsEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const handleEditOpenChange = useCallback(
    (open: boolean) => {
      if ((isMutatingEdit || isSendingPasswordReset) && !open) return;
      if (open) {
        setIsEditModalOpen(true);
      } else {
        handleCloseEdit();
      }
    },
    [isMutatingEdit, isSendingPasswordReset],
  );

  const isEditShopRequired =
    editRole === "Cashier" ||
    editRole === "Agent" ||
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

  const handleSendPasswordReset = async () => {
    if (!editingUser) return;

    setIsSendingPasswordReset(true);
    try {
      await sendUserPasswordReset(editingUser.id);
      toast.success(
        t("users.success.passwordResetSent", { email: editingUser.email }),
      );
    } catch (error: unknown) {
      toast.error(
        getErrorMessage(error, t("users.error.failedToSendPasswordReset")),
      );
    } finally {
      setIsSendingPasswordReset(false);
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
        accessorFn: (user) => user.agentId ? getAgentLabel(agentById.get(user.agentId), user.agentId) : "",
        id: "agent",
        header: t("users.table.agent"),
        cell: ({ row }) => row.original.agentId
          ? getAgentLabel(agentById.get(row.original.agentId), row.original.agentId)
          : "-",
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
    [agentById, t],
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
      if (payload.role === "Agent") {
        if (!payload.agentId || !payload.shopId || payload.userType !== "Shop" || payload.warehouseId !== null) {
          toast.error(t("users.validation.agentAssignmentRequired"));
          return;
        }

        const currentUsers = await getUsers();
        const connectedUser = (Array.isArray(currentUsers) ? currentUsers : []).find(
          (user: User) => user.agentId === payload.agentId,
        );
        if (connectedUser) {
          setUsers(Array.isArray(currentUsers) ? currentUsers : []);
          toast.error(t("users.error.agentAlreadyLinked"));
          return;
        }
      }

      await createUser(
        payload.email,
        payload.role,
        payload.userType,
        payload.shopId,
        payload.warehouseId,
        payload.username,
        payload.agentId,
      );

      toast.success(payload.role === "Agent" ? t("users.success.agentUserCreated") : t("users.success.userCreated"));
      handleCloseCreate();
      await loadUsers();
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
                isLoadingShops={isLoadingShops}
                shopLoadError={shopLoadError}
                onRetryShops={() => void dispatch(fetchShops())}
                warehouses={warehouses.map((warehouse) => ({ id: String(warehouse.id), code: warehouse.code }))}
                agents={availableAgents}
                linkedAgentIds={linkedAgentIds}
                isLoadingAgents={isLoadingAgents}
                agentLoadError={agentLoadError}
                onRetryAgents={() => setAgentLoadRetry((current) => current + 1)}
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
        closeDisabled={isMutatingEdit || isSendingPasswordReset}
        icon={<Pencil size={20} />}
        footer={
          <div className={styles.editDrawerFooter}>
            <Button
              variant="secondary"
              onClick={handleCloseEdit}
              disabled={isMutatingEdit || isSendingPasswordReset}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              className={styles.usersEditSaveButton}
              onClick={handleSaveEdit}
              disabled={isMutatingEdit || isSendingPasswordReset}
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
                disabled={isMutatingEdit || editingUser?.role === "Agent"}
              >
                {editRoleOptions.map((roleOption) => (
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
                disabled={editRole === "Cashier" || editRole === "Agent" || isMutatingEdit}
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
              <Button
                variant="secondary"
                onClick={() => void handleSendPasswordReset()}
                disabled={isMutatingEdit || isSendingPasswordReset}
                aria-busy={isSendingPasswordReset}
              >
                {isSendingPasswordReset ? (
                  <LoaderCircle
                    className={styles.editSaveSpinner}
                    size={15}
                    aria-hidden="true"
                  />
                ) : (
                  <KeyRound size={15} aria-hidden="true" />
                )}
                {isSendingPasswordReset
                  ? t("users.actions.sendingPasswordReset")
                  : t("users.actions.sendPasswordReset")}
              </Button>
            </div>
            <div className={styles.formColumn}>
              <Switch
                checked={editIsActive}
                onCheckedChange={setEditIsActive}
                label={t("users.editModal.active")}
                disabled={isMutatingEdit || isSendingPasswordReset}
              />
            </div>
          </div>
        </div>
      </FormDrawer>
    </>
  );
};
