import { useEffect, useState, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { Button, Dropdown, Select } from "@/ui-kit";

// services
import { getUsers } from "@/services/users";

// stores
import { useAppDispatch } from "@/store/hooks";
import { assignOperator } from "@/store/slices/cash/registersSlice";

// types
import type { CashRegister, Operator } from "@/types/cash/registers";

// styles
import styles from "./AssignOperatorDropdown.module.css";

interface AssignOperatorDropdownProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  cashRegister: CashRegister;
  isLoading?: boolean;
  assignedUserIds?: number[];
  onOpenChange: (open: boolean) => void;
  onAssigned: () => void;
}

export const AssignOperatorDropdown = ({
  open,
  anchorRef,
  cashRegister,
  isLoading = false,
  assignedUserIds = [],
  onOpenChange,
  onAssigned,
}: AssignOperatorDropdownProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const [operators, setOperators] = useState<Operator[]>([]);
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>("");
  const [isLoadingOperators, setIsLoadingOperators] = useState(false);
  const [hasTriedSave, setHasTriedSave] = useState(false);

  type AssignableUser = Operator & {
    role?: string | number;
    userType?: string;
    shopId?: number;
  };

  useEffect(() => {
    if (open) {
      setHasTriedSave(false);
      fetchOperators();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cashRegister.id, assignedUserIds]);

  const fetchOperators = async () => {
    try {
      setIsLoadingOperators(true);
      const response = await getUsers();
      const users = (
        Array.isArray(response)
          ? response
          : Array.isArray((response as { items?: unknown[] })?.items)
            ? (response as { items: unknown[] }).items
            : Array.isArray((response as { data?: unknown[] })?.data)
              ? (response as { data: unknown[] }).data
              : []
      ) as AssignableUser[];

      const assignableUsers = users.filter((user) => {
        const roleName =
          typeof user.role === "string" ? user.role.toLowerCase() : "";
        const roleId =
          typeof user.role === "number" ? user.role : Number.NaN;
        const userType = (user.userType || "").toLowerCase();

        const isBlockedAdminRole =
          roleName === "admin" ||
          roleName === "superadmin" ||
          roleId === 0 ||
          roleId === 1;
        const isOperatorOrCashier =
          roleName === "operator" ||
          roleName === "cashier" ||
          roleId === 2 ||
          roleId === 3 ||
          (!roleName && Number.isNaN(roleId) && userType === "shop");

        const isFromSameShop = Number(user.shopId) === Number(cashRegister.shopId);
        return !isBlockedAdminRole && isOperatorOrCashier && isFromSameShop;
      });

      setOperators(assignableUsers);

      // Preselect the first already-assigned operator, if any exist in the list
      const defaultAssignedId =
        assignedUserIds.find((assignedId) =>
          assignableUsers.some((op) => op.id === assignedId),
        ) ?? null;

      setSelectedOperatorId(
        defaultAssignedId !== null ? String(defaultAssignedId) : "",
      );
    } catch (error) {
      console.error("Failed to fetch operators:", error);
    } finally {
      setIsLoadingOperators(false);
    }
  };

  const isOperatorValid =
    selectedOperatorId.trim().length > 0 &&
    !Number.isNaN(Number(selectedOperatorId));

  const handleAssignClick = async () => {
    setHasTriedSave(true);
    if (!isOperatorValid) return;

    try {
      await dispatch(
        assignOperator({
          cashRegisterId: cashRegister.id,
          userId: Number(selectedOperatorId),
        }),
      ).unwrap();
      toast.success(t("cashRegisters.assignOperator.success"));
      onAssigned();
      onOpenChange(false);
    } catch (error) {
      const fallbackMessage = t("cashRegisters.assignOperator.error", {
        defaultValue: "Failed to assign operator",
      });

      const errorMessage =
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : fallbackMessage;

      toast.error(errorMessage);
    }
  };

  const titleText = t("cashRegisters.assignOperator.title");

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
        {isLoadingOperators ? (
          <div className={styles.loadingState}>
            {t("cashRegisters.assignOperator.loading")}
          </div>
        ) : (
          <div className={styles.grid}>
            <Select
              label={t("cashRegisters.assignOperator.operator", {
                defaultValue: "User",
              })}
              placeholder={t("cashRegisters.assignOperator.selectOperator", {
                defaultValue: "Select user",
              })}
              value={selectedOperatorId}
              onChange={(e) => setSelectedOperatorId(e.target.value)}
              disabled={isLoading}
              error={hasTriedSave && !isOperatorValid}
            >
              <option value="">
                {t("cashRegisters.assignOperator.selectOperator", {
                  defaultValue: "Select user",
                })}
              </option>
              {operators.map((op) => {
                const isAlreadyAssigned = assignedUserIds.includes(op.id);
                const assignedLabel = t(
                  "cashRegisters.assignOperator.alreadyAssigned",
                  { defaultValue: "assigned" },
                );

                const rawRole = (op as AssignableUser).role;
                const roleKey =
                  typeof rawRole === "string"
                    ? rawRole.toLowerCase()
                    : rawRole === 2
                      ? "operator"
                      : rawRole === 3
                        ? "cashier"
                        : "";
                const roleLabel = roleKey
                  ? t(`common.roles.${roleKey}`, {
                      defaultValue: roleKey,
                    })
                  : "";

                return (
                  <option
                    key={op.id}
                    value={op.id}
                    disabled={isAlreadyAssigned}
                  >
                    {op.username}
                    {roleLabel ? ` - ${roleLabel}` : ""}
                    {isAlreadyAssigned ? ` (${assignedLabel})` : ""}
                  </option>
                );
              })}
            </Select>
          </div>
        )}

        <div className={styles.actions}>
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
            onClick={handleAssignClick}
            disabled={isLoading || isLoadingOperators}
          >
            {t("cashRegisters.assignOperator.submit")}
          </Button>
        </div>
      </div>
    </Dropdown>
  );
};
