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

// columns
import { getCashRegisterColumns } from "./columns";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addCashRegister,
  editCashRegister,
  fetchCashRegisters,
  removeCashRegister,
} from "@/store/slices/cashRegistersSlice";
import { fetchShops } from "@/store/slices/shopsSlice";

// services
import {
  topUpCashRegister as topUpCashRegisterService,
  type TopUpRequest,
} from "@/services/settings/cashRegisters";

// types
import type { CashRegister } from "@/types/settings";

// styles
import styles from "./CashRegisters.module.css";

export const CashRegisters: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { cashRegisters } = useAppSelector((state) => state.cashRegisters);
  const { shops } = useAppSelector((state) => state.shops);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTopUpDropdownOpen, setIsTopUpDropdownOpen] = useState(false);
  const [activeCashRegister, setActiveCashRegister] =
    useState<CashRegister | null>(null);
  const [topUpCashRegister, setTopUpCashRegister] =
    useState<CashRegister | null>(null);
  const [deletingCashRegister, setDeletingCashRegister] =
    useState<CashRegister | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const anchorRef = useRef<HTMLElement | null>(null);
  const topUpAnchorRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    dispatch(fetchShops());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchCashRegisters(undefined));
  }, [dispatch]);

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

  const handleSaveCashRegister = useCallback(
    async (data: CashRegisterForm) => {
      try {
        setIsMutating(true);
        if (activeCashRegister) {
          await dispatch(
            editCashRegister({
              id: activeCashRegister.id,
              ...data,
              isActive: data.isActive ?? true,
            }),
          ).unwrap();
          toast.success(t("cashRegisters.success.updated"));
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { isActive, ...createData } = data;
          await dispatch(addCashRegister(createData)).unwrap();
          toast.success(t("cashRegisters.success.created"));
        }
        await dispatch(fetchCashRegisters(undefined)).unwrap();
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
        await dispatch(fetchCashRegisters(undefined)).unwrap();
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

  const columns = useMemo(
    () =>
      getCashRegisterColumns({
        onEdit: handleOpenEdit,
        onTopUp: handleOpenTopUp,
        onDelete: (cashRegister) => setDeletingCashRegister(cashRegister),
      }),
    [handleOpenEdit, handleOpenTopUp],
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

