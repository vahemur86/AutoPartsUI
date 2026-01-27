import {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
  type FC,
} from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { ConfirmationModal, DataTable, IconButton } from "@/ui-kit";

// icons
import { Plus } from "lucide-react";

// utils
import { getApiErrorMessage } from "@/utils";

// components
import {
  CashRegisterDropdown,
  type CashRegisterForm,
} from "./cashRegistersActions/CashRegisterDropdown";
import { TopUpDropdown } from "./cashRegistersActions/TopUpDropdown";
import { AssignOperatorDropdown } from "./cashRegistersActions/AssignOperatorDropdown";

// columns
import { getCashRegisterColumns } from "./columns";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addCashRegister,
  editCashRegister,
  fetchCashRegisters,
  removeCashRegister,
} from "@/store/slices/cash/registersSlice";
import { fetchShops } from "@/store/slices/shopsSlice";

// services
import {
  topUpCashRegister as topUpCashRegisterService,
  getCashRegisterOperators,
  type CashRegisterOperatorLink,
} from "@/services/settings/cash/registers";

// types
import type { CashRegister, TopUpRequest } from "@/types/cash";

// styles
import styles from "./CashRegisters.module.css";

export const CashRegisters: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { cashRegisters } = useAppSelector((state) => state.cashRegisters);
  const { shops } = useAppSelector((state) => state.shops);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTopUpDropdownOpen, setIsTopUpDropdownOpen] = useState(false);
  const [isAssignDropdownOpen, setIsAssignDropdownOpen] = useState(false);
  const [activeCashRegister, setActiveCashRegister] =
    useState<CashRegister | null>(null);
  const [topUpCashRegister, setTopUpCashRegister] =
    useState<CashRegister | null>(null);
  const [assignCashRegister, setAssignCashRegister] =
    useState<CashRegister | null>(null);
  const [deletingCashRegister, setDeletingCashRegister] =
    useState<CashRegister | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const [registerOperators, setRegisterOperators] = useState<
    Record<number, CashRegisterOperatorLink[] | null>
  >({});

  const anchorRef = useRef<HTMLElement | null>(null);
  const topUpAnchorRef = useRef<HTMLElement | null>(null);
  const assignAnchorRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    dispatch(fetchShops());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchCashRegisters());
  }, [dispatch]);

  useEffect(() => {
    const fetchRegisterOperators = async () => {
      if (!cashRegisters.length) {
        setRegisterOperators({});
        return;
      }

      try {
        const operatorsByRegisterEntries = await Promise.all(
          cashRegisters.map(async (register) => {
            try {
              const operators = await getCashRegisterOperators(register.id);
              return [
                register.id,
                operators as CashRegisterOperatorLink[] | null,
              ] as const;
            } catch (error) {
              console.error(
                "Failed to fetch operators for cash register:",
                register.id,
                error,
              );
              return [register.id, null] as const;
            }
          }),
        );

        setRegisterOperators(
          operatorsByRegisterEntries.reduce<
            Record<number, CashRegisterOperatorLink[] | null>
          >((acc, [id, operators]) => {
            acc[id] = operators;
            return acc;
          }, {}),
        );
      } catch (error) {
        console.error("Failed to fetch cash register operators:", error);
      }
    };

    void fetchRegisterOperators();
  }, [cashRegisters]);

  const handleOpenAdd = useCallback((e: React.MouseEvent<HTMLElement>) => {
    anchorRef.current = e.currentTarget;
    setActiveCashRegister(null);
    setIsDropdownOpen(true);
  }, []);

  const handleOpenEdit = useCallback(
    (cashRegister: CashRegister, e: React.MouseEvent<HTMLElement>) => {
      anchorRef.current = e.currentTarget;
      setActiveCashRegister(cashRegister);
      setIsDropdownOpen(true);
    },
    [],
  );

  const handleOpenTopUp = useCallback(
    (cashRegister: CashRegister, e: React.MouseEvent<HTMLElement>) => {
      topUpAnchorRef.current = e.currentTarget;
      setTopUpCashRegister(cashRegister);
      setIsTopUpDropdownOpen(true);
    },
    [],
  );

  const handleOpenAssignOperator = useCallback(
    (cashRegister: CashRegister, e: React.MouseEvent<HTMLElement>) => {
      assignAnchorRef.current = e.currentTarget;
      setAssignCashRegister(cashRegister);
      setIsAssignDropdownOpen(true);
    },
    [],
  );

  const handleSaveCashRegister = useCallback(
    async (data: CashRegisterForm) => {
      try {
        setIsMutating(true);

        if (activeCashRegister) {
          await dispatch(
            editCashRegister({
              id: activeCashRegister.id,
              data: {
                code: data.code,
                description: data.description,
                isActive: data.isActive ?? true,
              },
            }),
          ).unwrap();
          toast.success(t("cashRegisters.success.updated"));
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { isActive, ...createData } = data;
          await dispatch(addCashRegister(createData)).unwrap();
          toast.success(t("cashRegisters.success.created"));
        }

        setIsDropdownOpen(false);
      } catch (error: unknown) {
        console.error("Failed to save cash register:", error);
        const errorMessage = getApiErrorMessage(
          error,
          activeCashRegister
            ? t("cashRegisters.error.failedToUpdate")
            : t("cashRegisters.error.failedToCreate"),
        );
        toast.error(errorMessage);
      } finally {
        setIsMutating(false);
      }
    },
    [activeCashRegister, dispatch, t],
  );

  const handleDeleteCashRegister = useCallback(
    async (cashRegister: CashRegister) => {
      try {
        setIsMutating(true);
        await dispatch(removeCashRegister(cashRegister.id)).unwrap();
        await dispatch(fetchCashRegisters()).unwrap();
        setDeletingCashRegister(null);
        toast.success(t("cashRegisters.success.deleted"));
      } catch (error: unknown) {
        console.error("Failed to delete cash register:", error);
        const errorMessage = getApiErrorMessage(
          error,
          t("cashRegisters.error.failedToDelete"),
        );
        toast.error(errorMessage);
      } finally {
        setIsMutating(false);
      }
    },
    [dispatch, t],
  );

  const handleTopUp = useCallback(
    async (data: TopUpRequest) => {
      if (!topUpCashRegister) return;

      try {
        setIsMutating(true);
        await topUpCashRegisterService(topUpCashRegister.id, data);
        toast.success(t("cashRegisters.topUp.success"));
        setIsTopUpDropdownOpen(false);
        setTopUpCashRegister(null);
      } catch (error: unknown) {
        console.error("Failed to top up cash register:", error);
        const errorMessage = getApiErrorMessage(
          error,
          t("cashRegisters.topUp.error"),
        );
        toast.error(errorMessage);
      } finally {
        setIsMutating(false);
      }
    },
    [topUpCashRegister, t],
  );

  const handleAssignedOperator = useCallback(async () => {
    if (assignCashRegister) {
      try {
        const operators = await getCashRegisterOperators(assignCashRegister.id);
        setRegisterOperators((prev) => ({
          ...prev,
          [assignCashRegister.id]: operators,
        }));
      } catch (error) {
        console.error("Failed to refresh operators after assignment:", error);
      }
    }
  }, [assignCashRegister]);

  const getAssignedOperatorLabel = useCallback(
    (cashRegisterId: number) => {
      const operators = registerOperators[cashRegisterId];

      if (!operators || operators.length === 0) {
        return t("cashRegisters.assignedOperator.notAssigned", {
          defaultValue: t("cashRegisters.assignOperator.noOperator", {
            defaultValue: "No operator assigned",
          }),
        });
      }

      const activeOperators = operators.filter((op) => op.isActive);
      if (!activeOperators.length) {
        return t("cashRegisters.assignedOperator.notAssigned", {
          defaultValue: t("cashRegisters.assignOperator.noOperator", {
            defaultValue: "No operator assigned",
          }),
        });
      }

      return activeOperators
        .map((op) => op.username || String(op.userId))
        .join(", ");
    },
    [registerOperators, t],
  );

  const columns = useMemo(
    () =>
      getCashRegisterColumns({
        onEdit: handleOpenEdit,
        onTopUp: handleOpenTopUp,
        onAssignOperator: handleOpenAssignOperator,
        onDelete: (cashRegister) => setDeletingCashRegister(cashRegister),
        getAssignedOperator: getAssignedOperatorLabel,
      }),
    [
      handleOpenEdit,
      handleOpenTopUp,
      handleOpenAssignOperator,
      getAssignedOperatorLabel,
    ],
  );

  return (
    <div className={styles.cashRegistersWrapper}>
      <div className={styles.header}>
        <div className={styles.addButtonWrapper}>
          <IconButton
            ariaLabel={t("cashRegisters.addCashRegister")}
            size="small"
            variant="primary"
            icon={<Plus size={12} color="#0e0f11" />}
            onClick={handleOpenAdd}
          />
          <span className={styles.addButtonText}>
            {t("cashRegisters.addCashRegister")}
          </span>
        </div>
      </div>

      <div className={styles.addCashRegisterButtonMobile}>
        <div className={styles.addButtonWrapperMobile}>
          <IconButton
            size="small"
            variant="primary"
            icon={<Plus size={12} />}
            ariaLabel={t("cashRegisters.addCashRegister")}
            onClick={handleOpenAdd}
          />
          <span className={styles.addButtonText}>
            {t("cashRegisters.addCashRegister")}
          </span>
        </div>
      </div>

      <CashRegisterDropdown
        open={isDropdownOpen}
        anchorRef={anchorRef}
        initialData={activeCashRegister}
        isLoading={isMutating}
        shops={shops}
        onOpenChange={setIsDropdownOpen}
        onSave={handleSaveCashRegister}
      />

      {topUpCashRegister && (
        <TopUpDropdown
          open={isTopUpDropdownOpen}
          anchorRef={topUpAnchorRef}
          cashRegister={topUpCashRegister}
          isLoading={isMutating}
          onOpenChange={setIsTopUpDropdownOpen}
          onTopUp={handleTopUp}
        />
      )}

      {assignCashRegister && (
        <AssignOperatorDropdown
          open={isAssignDropdownOpen}
          anchorRef={assignAnchorRef}
          cashRegister={assignCashRegister}
          isLoading={isMutating}
          assignedUserIds={
            registerOperators[assignCashRegister.id]
              ?.filter((op) => op.isActive)
              .map((op) => op.userId) ?? []
          }
          onOpenChange={setIsAssignDropdownOpen}
          onAssigned={handleAssignedOperator}
        />
      )}

      {!!deletingCashRegister && (
        <ConfirmationModal
          open={!!deletingCashRegister}
          onOpenChange={(open) => !open && setDeletingCashRegister(null)}
          title={t("cashRegisters.confirmation.deleteTitle")}
          description={t("cashRegisters.confirmation.deleteDescription", {
            name: deletingCashRegister?.code,
          })}
          confirmText={isMutating ? t("common.deleting") : t("common.delete")}
          cancelText={t("common.cancel")}
          onConfirm={() =>
            deletingCashRegister &&
            handleDeleteCashRegister(deletingCashRegister)
          }
          onCancel={() => setDeletingCashRegister(null)}
        />
      )}

      <div className={styles.tableWrapper}>
        <DataTable data={cashRegisters} columns={columns} pageSize={10} />
      </div>
    </div>
  );
};
