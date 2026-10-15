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
import { ConfirmationModal, IconButton } from "@/ui-kit";

// icons
import {
  Building2,
  CircleCheck,
  CircleX,
  CreditCard,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  UserRoundCog,
  Wallet,
} from "lucide-react";

// utils
import { getApiErrorMessage } from "@/utils";

// components
import {
  CashRegisterDropdown,
  type CashRegisterForm,
} from "./cashRegistersActions/CashRegisterDropdown";
import { TopUpDropdown } from "./cashRegistersActions/TopUpDropdown";
import { AssignOperatorDropdown } from "./cashRegistersActions/AssignOperatorDropdown";

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
  const { cashRegisters, isLoading } = useAppSelector((state) => state.cashRegisters);
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

  const handleOpenAdd = useCallback(() => {
    setActiveCashRegister(null);
    setIsDropdownOpen(true);
  }, []);

  const handleOpenEdit = useCallback(
    (cashRegister: CashRegister) => {
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

  const activeRegisterCount = useMemo(
    () => cashRegisters.filter((register) => register.isActive).length,
    [cashRegisters],
  );

  return (
    <div className={styles.cashRegistersWrapper}>
      <div className={styles.header}>
        <div className={styles.registerOverview}>
          <div className={styles.registerCountSummary}>
            <span className={styles.overviewIcon}>
              <CreditCard size={18} aria-hidden="true" />
            </span>
            <div>
              <strong>{t("cashRegisters.summary.totalRegisters", { count: cashRegisters.length })}</strong>
              <span>{t("cashRegisters.summary.activeRegisters", { count: activeRegisterCount })}</span>
            </div>
          </div>
        </div>
        <div className={styles.addButtonWrapper}>
          <IconButton
            ariaLabel={t("cashRegisters.addCashRegister")}
            size="medium"
            variant="primary"
            icon={<Plus size={16} />}
            onClick={handleOpenAdd}
          />
          <span className={styles.addButtonText}>
            {t("cashRegisters.addCashRegister")}
          </span>
        </div>
      </div>

      <CashRegisterDropdown
        open={isDropdownOpen}
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

      {isLoading && cashRegisters.length === 0 ? (
        <div className={styles.registerState} role="status" aria-live="polite">
          <LoaderCircle size={24} aria-hidden="true" />
          <span>{t("cashRegisters.loading")}</span>
        </div>
      ) : cashRegisters.length === 0 ? (
        <div className={styles.registerState}>
          <span className={styles.emptyIcon}>
            <CreditCard size={22} aria-hidden="true" />
          </span>
          <strong>{t("cashRegisters.empty.title")}</strong>
          <span>{t("cashRegisters.empty.description")}</span>
        </div>
      ) : (
        <div className={styles.registerGrid}>
          {cashRegisters.map((register) => {
            const shop = shops.find((item) => item.id === register.shopId);
            const assignedOperator = getAssignedOperatorLabel(register.id);

            return (
              <article key={register.id} className={styles.registerCard}>
                <div className={styles.registerCardHeader}>
                  <div className={styles.registerIdentity}>
                    <span className={styles.registerIcon}>
                      <CreditCard size={18} aria-hidden="true" />
                    </span>
                    <div className={styles.registerCodeBlock}>
                      <strong>{register.code}</strong>
                      <span>#{register.id}</span>
                    </div>
                  </div>
                  <span
                    className={`${styles.registerStatus} ${register.isActive ? styles.statusActive : styles.statusInactive}`}
                  >
                    {register.isActive ? (
                      <CircleCheck size={14} aria-hidden="true" />
                    ) : (
                      <CircleX size={14} aria-hidden="true" />
                    )}
                    {register.isActive ? t("common.active") : t("common.inactive")}
                  </span>
                </div>

                <p className={styles.registerDescription}>
                  {register.description || "—"}
                </p>

                <div className={styles.registerMeta}>
                  <div className={styles.registerMetaRow}>
                    <Building2 size={15} aria-hidden="true" />
                    <span>{t("cashRegisters.form.shop")}</span>
                    <strong>{shop?.code || `#${register.shopId}`}</strong>
                  </div>
                  <div className={styles.registerMetaRow}>
                    <UserRound size={15} aria-hidden="true" />
                    <span>{t("cashRegisters.columns.assignedOperator")}</span>
                    <strong>{assignedOperator}</strong>
                  </div>
                </div>

                <div className={styles.registerActions}>
                  <IconButton
                    size="small"
                    variant="primary"
                    icon={<Wallet size={15} />}
                    ariaLabel={t("cashRegisters.topUp.button")}
                    title={t("cashRegisters.topUp.button")}
                    onClick={(event) => handleOpenTopUp(register, event)}
                  />
                  <IconButton
                    size="small"
                    variant="secondary"
                    icon={<UserRoundCog size={15} />}
                    ariaLabel={t("cashRegisters.assignOperator.button")}
                    title={t("cashRegisters.assignOperator.button")}
                    onClick={(event) => handleOpenAssignOperator(register, event)}
                  />
                  <IconButton
                    size="small"
                    variant="secondary"
                    icon={<Pencil size={15} />}
                    ariaLabel={t("common.edit")}
                    title={t("common.edit")}
                    onClick={() => handleOpenEdit(register)}
                  />
                  <IconButton
                    size="small"
                    variant="secondary"
                    className={styles.deleteAction}
                    icon={<Trash2 size={15} />}
                    ariaLabel={t("common.delete")}
                    title={t("common.delete")}
                    onClick={() => setDeletingCashRegister(register)}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
