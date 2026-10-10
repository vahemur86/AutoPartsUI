import { useState, useCallback, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useMinimumLoadingDuration } from "@/hooks/useMinimumLoadingDuration";

// icons
import { Pencil, Plus, RotateCcw, Search, X } from "lucide-react";

// ui-kit
import {
  DataTable,
  Button,
  Select,
  TextField,
  ConfirmationModal,
} from "@/ui-kit";

// components
import { SectionHeader } from "@/components/common";
import { CustomersDropdown } from "./customersActions/CustomersDropdown";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCustomerTypes } from "@/store/slices/customerTypesSlice";
import {
  fetchCustomers,
  createCustomer,
  updateCustomerType,
  removeCustomer,
} from "@/store/slices/customersSlice";

// utils
import { getCustomerColumns } from "./columns";

// types
import type { Customer, CreateCustomerRequest } from "@/types/operator";

// styles
import styles from "./Customers.module.css";

const PAGE_SIZE = 20;

export const Customers = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  // Redux Selectors
  const { customerTypes } = useAppSelector((state) => state.customerTypes);
  const {
    items: customers = [],
    isLoading,
    isSubmitting,
    totalItems = 0,
  } = useAppSelector((state) => state.customers);
  const showTableSkeleton = useMinimumLoadingDuration(
    isLoading && customers.length === 0,
  );

  // UI State
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerTypeId, setSelectedCustomerTypeId] =
    useState<string>("");
  const [isMutating, setIsMutating] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(
    null,
  );

  // Filters State
  const [filterPhone, setFilterPhone] = useState<string>("");
  const [filterCustomerTypeId, setFilterCustomerTypeId] = useState<string>("");
  const [filterGender, setFilterGender] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);

  const loadCustomers = useCallback(() => {
    dispatch(
      fetchCustomers({
        page: currentPage + 1,
        pageSize: PAGE_SIZE,
        phone: filterPhone.trim() || undefined,
        customerTypeId: filterCustomerTypeId
          ? parseInt(filterCustomerTypeId)
          : undefined,
        gender: filterGender !== null ? filterGender : undefined,
      }),
    );
  }, [currentPage, filterPhone, filterCustomerTypeId, filterGender, dispatch]);

  useEffect(() => {
    dispatch(fetchCustomerTypes());
  }, [dispatch]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    if (!isEditModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsEditModalOpen(false);
    };
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isEditModalOpen]);

  const handleCreateSubmit = async (data: CreateCustomerRequest) => {
    try {
      await dispatch(createCustomer({ data })).unwrap();
      toast.success(t("customers.success.customerCreated"));
      setIsAddDropdownOpen(false);
      loadCustomers();
    } catch (error) {
      console.error("Failed to create customer:", error);
    }
  };

  const handleDeleteCustomer = useCallback(
    async (customer: Customer) => {
      try {
        setDeletingCustomer(null);
        setIsMutating(true);
        await dispatch(removeCustomer(customer.id)).unwrap();
      } catch (error) {
        console.error("Failed to delete customer", error);
      } finally {
        setIsMutating(false);
      }
    },
    [dispatch],
  );

  const handleResetFilters = useCallback(() => {
    setFilterPhone("");
    setFilterCustomerTypeId("");
    setFilterGender(null);
    setCurrentPage(0);
  }, []);

  const handleSaveEdit = async () => {
    if (!editingCustomer || !selectedCustomerTypeId) return;
    try {
      await dispatch(
        updateCustomerType({
          customerId: editingCustomer.id,
          customerTypeId: parseInt(selectedCustomerTypeId),
        }),
      ).unwrap();
      toast.success(t("customers.success.customerUpdated"));
      setIsEditModalOpen(false);
      setEditingCustomer(null);
      loadCustomers();
    } catch (error) {
      console.error("Failed to update customer type:", error);
    }
  };

  const handleOpenEdit = useCallback((customer: Customer) => {
    setEditingCustomer(customer);
    setSelectedCustomerTypeId(customer.customerTypeId.toString());
    setIsEditModalOpen(true);
  }, []);

  const columns = useMemo(
    () =>
      getCustomerColumns({
        onEdit: handleOpenEdit,
        onDelete: (customer) => setDeletingCustomer(customer),
        t,
      }),
    [handleOpenEdit, t],
  );

  const hasActiveFilters =
    filterPhone !== "" || filterCustomerTypeId !== "" || filterGender !== null;

  return (
    <>
      <SectionHeader
        title={t("header.customers")}
        actions={
          <div className={styles.headerActions}>
            {hasActiveFilters && (
              <Button
                className={`${styles.customerButton} ${styles.neutralButton}`}
                onClick={handleResetFilters}
                aria-label={t("customers.actions.resetFilters")}
                title={t("customers.actions.resetFilters")}
              >
                <RotateCcw size={15} />
                {t("common.reset")}
              </Button>
            )}
            <Button
              className={`${styles.customerButton} ${styles.primaryButton}`}
              onClick={() => setIsAddDropdownOpen(true)}
            >
              <Plus size={16} />
              {t("customers.actions.addCustomer")}
            </Button>
          </div>
        }
      />

      <main className={styles.customersPage}>
        <div className={styles.listHeading}>
          <h2>{t("customers.customersList")}</h2>
        </div>

        <div className={styles.filters}>
          <TextField
            label={t("customers.form.phone")}
            value={filterPhone}
            onChange={(event) => {
              setCurrentPage(0);
              setFilterPhone(event.target.value);
            }}
            icon={<Search size={15} />}
          />
          <Select
            label={t("customers.form.customerType")}
            value={filterCustomerTypeId}
            onChange={(event) => {
              setCurrentPage(0);
              setFilterCustomerTypeId(event.target.value);
            }}
          >
            <option value="">{t("customers.form.allTypes")}</option>
            {customerTypes.map((type) => (
              <option key={type.id} value={type.id?.toString()}>
                {type.code}
              </option>
            ))}
          </Select>
          <Select
            label={t("customers.form.gender")}
            value={filterGender === null ? "" : String(filterGender)}
            onChange={(event) => {
              setCurrentPage(0);
              setFilterGender(
                event.target.value === "" ? null : Number(event.target.value),
              );
            }}
          >
            <option value="">{t("common.all")}</option>
            <option value="0">{t("common.gender.unknown")}</option>
            <option value="1">{t("common.gender.male")}</option>
            <option value="2">{t("common.gender.female")}</option>
          </Select>
        </div>

        <div className={styles.tableWrapper}>
          <div className={styles.tableShell}>
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
            ) : (
              <DataTable
                data={customers ?? []}
                columns={columns}
                isLoading={isLoading}
                pageSize={PAGE_SIZE}
                manualPagination
                pageCount={Math.ceil((totalItems ?? 0) / PAGE_SIZE)}
                pageIndex={currentPage}
                frozenConfig={{
                  right: ["actions"],
                }}
                onPaginationChange={setCurrentPage}
                noResultsText={t("customers.emptyState")}
                loadingText={t("customers.loading")}
              />
            )}
          </div>
        </div>
        <div className={styles.resultCount}>
          {t("customers.results", { shown: customers.length, total: totalItems })}
        </div>
      </main>

      <CustomersDropdown
        open={isAddDropdownOpen}
        onOpenChange={setIsAddDropdownOpen}
        onSave={handleCreateSubmit}
        isSubmitting={isSubmitting}
      />

      {isEditModalOpen && editingCustomer && createPortal(
        <div className={styles.backdrop} onMouseDown={(event) => event.currentTarget === event.target && setIsEditModalOpen(false)}>
          <aside className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby="customer-edit-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div className={styles.headerIcon} aria-hidden="true">
                <Pencil size={19} />
              </div>
              <div className={styles.headerCopy}>
                <span className={styles.eyebrow}>{t("header.customers")}</span>
                <h2 id="customer-edit-title">{t("customers.editCustomer")}</h2>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setIsEditModalOpen(false)}
                aria-label={t("common.close")}
                title={t("common.close")}
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.drawerBody}>
              <div className={styles.modalInfo}>
                <p>
                  <strong>{t("customers.form.phone")}:</strong>{" "}
                  {editingCustomer.phone}
                </p>
                <p>
                  <strong>{t("customers.form.fullName")}:</strong>{" "}
                  {editingCustomer.fullName || "-"}
                </p>
              </div>
              <Select
                label={t("customers.form.customerType")}
                value={selectedCustomerTypeId}
                onChange={(e) => setSelectedCustomerTypeId(e.target.value)}
              >
                {customerTypes.map((type) => (
                  <option key={type.id} value={type.id.toString()}>
                    {type.code}
                  </option>
                ))}
              </Select>
            </div>
            <div className={styles.drawerFooter}>
              <Button
                className={`${styles.customerButton} ${styles.neutralButton}`}
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSubmitting}
              >
                {t("common.cancel")}
              </Button>
              <Button
                className={`${styles.customerButton} ${styles.primaryButton}`}
                onClick={handleSaveEdit}
                disabled={isSubmitting || !selectedCustomerTypeId}
              >
                {t("common.save")}
              </Button>
            </div>
          </aside>
        </div>,
        document.body,
      )}

      {!!deletingCustomer && (
        <ConfirmationModal
          open={!!deletingCustomer}
          onOpenChange={(open) => !open && setDeletingCustomer(null)}
          title={t("customers.confirmation.deleteTitle")}
          description={t("customers.confirmation.deleteDescription", {
            code: deletingCustomer?.fullName || deletingCustomer?.phone,
          })}
          confirmText={
            isMutating
              ? t("customers.confirmation.deleting")
              : t("customers.confirmation.delete")
          }
          cancelText={t("common.cancel")}
          onConfirm={() =>
            deletingCustomer && handleDeleteCustomer(deletingCustomer)
          }
          onCancel={() => setDeletingCustomer(null)}
        />
      )}
    </>
  );
};
