import {
  useState,
  useCallback,
  useEffect,
  type FC,
} from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { Button, ConfirmationModal, IconButton } from "@/ui-kit";

// icons
import { Layers2, Pencil, Percent, Plus, Star, Trash2, UsersRound } from "lucide-react";
import { useMinimumLoadingDuration } from "@/hooks/useMinimumLoadingDuration";

// utils
import { getApiErrorMessage } from "@/utils";

// components
import {
  CustomerTypeDropdown,
  type CustomerTypeForm,
} from "./customerTypesActions/CustomerTypeDropdown";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addCustomerType,
  editCustomerType,
  fetchCustomerTypes,
  removeCustomerType,
} from "@/store/slices/customerTypesSlice";

// types
import type { CustomerType } from "@/types/settings";

// styles
import styles from "./CustomerTypes.module.css";

const typeAccentClasses = [
  styles.accentGold,
  styles.accentSage,
  styles.accentCopper,
  styles.accentBlue,
  styles.accentRose,
];

export const CustomerTypes: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { customerTypes, isLoading } = useAppSelector(
    (state) => state.customerTypes,
  );

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeCustomerType, setActiveCustomerType] =
    useState<CustomerType | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [deletingCustomerType, setDeletingCustomerType] =
    useState<CustomerType | null>(null);

  const showSkeleton = useMinimumLoadingDuration(
    isLoading && customerTypes.length === 0,
  );

  useEffect(() => {
    dispatch(fetchCustomerTypes());
  }, [dispatch]);

  const handleOpenAdd = useCallback(() => {
    setActiveCustomerType(null);
    setIsDropdownOpen(true);
  }, []);

  const handleOpenEdit = useCallback(
    (customerType: CustomerType) => {
      setActiveCustomerType(customerType);
      setIsDropdownOpen(true);
    },
    [],
  );

  const handleSaveCustomerType = useCallback(
    async (data: CustomerTypeForm) => {
      try {
        setIsMutating(true);
        if (activeCustomerType) {
          // For edit, isActive is always included from the dropdown
          await dispatch(
            editCustomerType({
              id: activeCustomerType.id,
              ...data,
              isActive: data.isActive ?? true,
            }),
          ).unwrap();
          toast.success(t("customerTypes.success.updated"));
        } else {
          // For create, exclude isActive as it's not in the POST payload
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { isActive, ...createData } = data;
          await dispatch(addCustomerType(createData)).unwrap();
          toast.success(t("customerTypes.success.created"));
        }
        await dispatch(fetchCustomerTypes()).unwrap();
        setIsDropdownOpen(false);
      } catch (error: unknown) {
        console.error("Failed to save customer type:", error);
        const errorMessage = getApiErrorMessage(
          error,
          activeCustomerType
            ? t("customerTypes.error.failedToUpdate")
            : t("customerTypes.error.failedToCreate"),
        );
        toast.error(errorMessage);
      } finally {
        setIsMutating(false);
      }
    },
    [activeCustomerType, dispatch, t],
  );

  const handleDeleteCustomerType = useCallback(
    async (customerType: CustomerType) => {
      try {
        setIsMutating(true);
        await dispatch(removeCustomerType(customerType.id)).unwrap();
        await dispatch(fetchCustomerTypes()).unwrap();
        setDeletingCustomerType(null);
      } catch (error) {
        console.error("Failed to delete customer type:", error);
      } finally {
        setIsMutating(false);
      }
    },
    [dispatch],
  );

  return (
    <div className={styles.customerTypesWrapper}>
      <div className={styles.header}>
        <div className={styles.headerMeta}>
          <h2>{t("customerTypes.listTitle")}</h2>
          <span className={styles.countBadge}>{customerTypes.length}</span>
        </div>
        <Button className={styles.createButton} onClick={handleOpenAdd}>
          <Plus size={16} />
          {t("customerTypes.addCustomerType")}
        </Button>
      </div>

      <CustomerTypeDropdown
        open={isDropdownOpen}
        initialData={activeCustomerType}
        isLoading={isMutating}
        onOpenChange={setIsDropdownOpen}
        onSave={handleSaveCustomerType}
      />

      {!!deletingCustomerType && (
        <ConfirmationModal
          open={!!deletingCustomerType}
          onOpenChange={(open) => !open && setDeletingCustomerType(null)}
          title={t("customerTypes.confirmation.deleteTitle")}
          description={t("customerTypes.confirmation.deleteDescription", {
            code: deletingCustomerType?.code,
          })}
          confirmText={
            isMutating
              ? t("customerTypes.confirmation.deleting")
              : t("customerTypes.confirmation.delete")
          }
          cancelText={t("common.cancel")}
          onConfirm={() =>
            deletingCustomerType &&
            handleDeleteCustomerType(deletingCustomerType)
          }
          onCancel={() => setDeletingCustomerType(null)}
        />
      )}

      {showSkeleton ? (
        <div
          className={styles.cardGrid}
          aria-busy="true"
          aria-live="polite"
          aria-label={t("customerTypes.loading")}
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className={styles.cardSkeleton}>
              <div className={styles.skeletonHeading}>
                <span className={styles.skeletonIcon} />
                <div className={styles.skeletonLines}>
                  <span />
                  <span />
                </div>
              </div>
              <span className={styles.skeletonMetric} />
            </div>
          ))}
        </div>
      ) : customerTypes.length === 0 ? (
        <div className={styles.emptyState}>
          <UsersRound size={24} aria-hidden="true" />
          <span>{t("customerTypes.emptyState")}</span>
        </div>
      ) : (
        <div className={styles.cardGrid}>
          {customerTypes.map((customerType, index) => {
            const accentClass = customerType.isDefault
              ? styles.accentGold
              : customerType.preventInventoryMerge
                ? styles.accentSage
                : typeAccentClasses[index % typeAccentClasses.length];

            return (
              <article
                className={`${styles.customerTypeCard} ${accentClass}`}
                key={customerType.id}
              >
                <header className={styles.cardHeader}>
                  <div className={styles.typeIdentity}>
                    <span className={styles.typeIcon} aria-hidden="true">
                      <UsersRound size={18} />
                    </span>
                    <div className={styles.typeCopy}>
                      <span className={styles.cardEyebrow}>
                        {t("customerTypes.columns.code")}
                      </span>
                      <h3>{customerType.code}</h3>
                    </div>
                  </div>
                  <span
                    className={`${styles.statusBadge} ${customerType.isActive ? styles.statusActive : styles.statusInactive}`}
                  >
                    <span className={styles.statusDot} />
                    {customerType.isActive
                      ? t("common.active")
                      : t("common.inactive")}
                  </span>
                </header>

                <div className={styles.bonusMetric}>
                  <span className={styles.bonusIcon} aria-hidden="true">
                    <Percent size={17} />
                  </span>
                  <div className={styles.bonusCopy}>
                    <span>{t("customerTypes.columns.bonusPercent")}</span>
                    <strong>{customerType.bonusPercent}%</strong>
                  </div>
                </div>

                <div className={styles.attributes}>
                  <div className={styles.attribute}>
                    <Star size={14} aria-hidden="true" />
                    <span>{t("customerTypes.columns.isDefault")}</span>
                    <strong>
                      {customerType.isDefault ? t("common.yes") : t("common.no")}
                    </strong>
                  </div>
                  <div className={styles.attribute}>
                    <Layers2 size={14} aria-hidden="true" />
                    <span>{t("customerTypes.columns.preventInventoryMerge")}</span>
                    <strong>
                      {customerType.preventInventoryMerge
                        ? t("common.yes")
                        : t("common.no")}
                    </strong>
                  </div>
                </div>

                <footer className={styles.cardFooter}>
                  <span className={styles.idBadge}>#{customerType.id}</span>
                  <div className={styles.cardActions}>
                    <IconButton
                      variant="secondary"
                      size="medium"
                      icon={<Pencil size={15} />}
                      ariaLabel={`${t("common.edit")} ${customerType.code}`}
                      title={`${t("common.edit")} ${customerType.code}`}
                      onClick={() => handleOpenEdit(customerType)}
                    />
                    <IconButton
                      variant="secondary"
                      size="medium"
                      className={styles.deleteAction}
                      icon={<Trash2 size={15} />}
                      ariaLabel={`${t("common.delete")} ${customerType.code}`}
                      title={`${t("common.delete")} ${customerType.code}`}
                      onClick={() => setDeletingCustomerType(customerType)}
                    />
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
