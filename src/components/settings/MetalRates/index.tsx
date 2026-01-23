import {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
  type FC,
} from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { ConfirmationModal, DataTable, IconButton } from "@/ui-kit";

// icons
import { Plus } from "lucide-react";

// components
import {
  MetalRateDropdown,
  type MetalRateForm,
} from "./metalRatesActions/MetalRateDropdown";

// columns
import { getMetalRateColumns } from "./columns";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addMetalRate,
  editMetalRate,
  fetchMetalRates,
  removeMetalRate,
} from "@/store/slices/metalRatesSlice";

// types
import type { MetalRate } from "@/types/settings";

// styles
import styles from "./MetalRates.module.css";

export const MetalRates: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { metalRates } = useAppSelector((state) => state.metalRates);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeRate, setActiveRate] = useState<MetalRate | null>(null);
  const [deletingRate, setDeletingRate] = useState<MetalRate | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const anchorRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    dispatch(fetchMetalRates());
  }, [dispatch]);

  const handleOpenAdd = useCallback((e: React.MouseEvent<HTMLElement>) => {
    anchorRef.current = e.currentTarget;
    setActiveRate(null);
    setIsDropdownOpen(true);
  }, []);

  const handleOpenEdit = useCallback(
    (rate: MetalRate, e: React.MouseEvent<HTMLElement>) => {
      anchorRef.current = e.currentTarget;
      setActiveRate(rate);
      setIsDropdownOpen(true);
    },
    [],
  );

  const handleSaveRate = useCallback(
    async (data: MetalRateForm) => {
      try {
        setIsMutating(true);
        if (activeRate) {
          await dispatch(
            editMetalRate({ id: activeRate.id, ...data }),
          ).unwrap();
        } else {
          await dispatch(addMetalRate(data)).unwrap();
        }
        await dispatch(fetchMetalRates()).unwrap();
        setIsDropdownOpen(false);
      } catch (error) {
        console.error("Failed to save metal rate:", error);
      } finally {
        setIsMutating(false);
      }
    },
    [activeRate, dispatch],
  );

  const handleDeleteRate = useCallback(
    async (rate: MetalRate) => {
      try {
        setIsMutating(true);
        await dispatch(removeMetalRate(rate.id)).unwrap();
        await dispatch(fetchMetalRates()).unwrap();
        setDeletingRate(null);
      } catch (error) {
        console.error("Failed to delete metal rate:", error);
      } finally {
        setIsMutating(false);
      }
    },
    [dispatch],
  );

  const columns = useMemo(
    () => getMetalRateColumns({ onEdit: handleOpenEdit }),
    [handleOpenEdit],
  );

  return (
    <div className={styles.metalRatesWrapper}>
      <div className={styles.header}>
        <div className={styles.addButtonWrapper}>
          <IconButton
            ariaLabel={t("metals.addRate")}
            size="small"
            variant="primary"
            icon={<Plus size={12} color="#0e0f11" />}
            onClick={handleOpenAdd}
          />
          <span className={styles.addButtonText}>{t("metals.addRate")}</span>
        </div>
      </div>

      <div className={styles.addRateButtonMobile}>
        <div className={styles.addButtonWrapperMobile}>
          <IconButton
            size="small"
            variant="primary"
            icon={<Plus size={12} />}
            ariaLabel={t("metals.addRate")}
            onClick={handleOpenAdd}
          />
          <span className={styles.addButtonText}>{t("metals.addRate")}</span>
        </div>
      </div>

      <MetalRateDropdown
        open={isDropdownOpen}
        anchorRef={anchorRef}
        initialData={activeRate}
        isLoading={isMutating}
        onOpenChange={setIsDropdownOpen}
        onSave={handleSaveRate}
      />

      {!!deletingRate && (
        <ConfirmationModal
          open={!!deletingRate}
          onOpenChange={(open) => !open && setDeletingRate(null)}
          title={t("metals.confirmation.deleteTitle")}
          description={t("metals.confirmation.deleteDescription", {
            name: deletingRate?.currencyCode,
          })}
          confirmText={isMutating ? t("common.deleting") : t("common.delete")}
          cancelText={t("common.cancel")}
          onConfirm={() => deletingRate && handleDeleteRate(deletingRate)}
          onCancel={() => setDeletingRate(null)}
        />
      )}

      <div className={styles.tableWrapper}>
        <DataTable data={metalRates} columns={columns} pageSize={10} />
      </div>
    </div>
  );
};
