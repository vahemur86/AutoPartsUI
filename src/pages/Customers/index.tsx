import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { DataTable, Button, TextField, Select } from "@/ui-kit";

// components
import { SectionHeader } from "@/components/common/SectionHeader";

// services
import {
  getOrCreateCustomer,
  getCustomers,
  updateCustomerType,
  type GetCustomersParams,
} from "@/services/customers";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCustomerTypes } from "@/store/slices/customerTypesSlice";

// types
import type { Customer } from "@/types/operator";

// utils
import { getApiErrorMessage } from "@/utils";

// styles
import styles from "./Customers.module.css";

// columns
import { getCustomerColumns } from "./columns";

const PAGE_SIZE = 20;

export const Customers = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { customerTypes } = useAppSelector((state) => state.customerTypes);

  // State management
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerTypeId, setSelectedCustomerTypeId] = useState("");

  // Filter and pagination state
  const [filterPhone, setFilterPhone] = useState("");
  const [filterCustomerTypeId, setFilterCustomerTypeId] = useState("");
  const [currentPage, setCurrentPage] = useState(0); // 0-indexed for DataTable
  const [totalItems, setTotalItems] = useState(0);

  const anchorRef = useRef<HTMLElement | null>(null);

  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: GetCustomersParams = {
        page: currentPage + 1, // API uses 1-indexed pages
        pageSize: PAGE_SIZE,
      };

      if (filterPhone.trim()) {
        params.phone = filterPhone.trim();
      }

      if (filterCustomerTypeId) {
        params.customerTypeId = parseInt(filterCustomerTypeId);
      }

      const response = await getCustomers(params);

      if (Array.isArray(response)) {
        setCustomers(response);
        setTotalItems(response.length);
      } else {
        setCustomers(response.items || []);
        setTotalItems(response.totalItems || 0);
      }
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, t("customers.error.failedToLoad")));
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterPhone, filterCustomerTypeId, t]);

  useEffect(() => {
    dispatch(fetchCustomerTypes());
  }, [dispatch]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleCreateCustomer = useCallback(async () => {
    if (!filterPhone.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const customer = await getOrCreateCustomer(filterPhone.trim());

      toast.success(t("customers.success.customerCreated"));

      setCustomers((prev) => {
        const existingIndex = prev.findIndex((c) => c.id === customer.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = customer;
          return updated;
        }
        return [customer, ...prev];
      });

      await loadCustomers();
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(error, t("customers.error.failedToCreate"))
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [filterPhone, loadCustomers, t]);

  const handleOpenEdit = useCallback(
    (customer: Customer, e: React.MouseEvent<HTMLElement>) => {
      anchorRef.current = e.currentTarget;
      setEditingCustomer(customer);
      setSelectedCustomerTypeId(customer.customerTypeId?.toString() || "");
      setIsEditModalOpen(true);
    },
    []
  );

  const handleCloseEdit = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingCustomer(null);
    setSelectedCustomerTypeId("");
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingCustomer || !selectedCustomerTypeId) {
      return;
    }

    setIsSubmitting(true);
    try {
      await updateCustomerType(
        editingCustomer.id!,
        parseInt(selectedCustomerTypeId)
      );
      toast.success(t("customers.success.customerUpdated"));
      handleCloseEdit();
      await loadCustomers();
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(error, t("customers.error.failedToUpdate"))
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    editingCustomer,
    selectedCustomerTypeId,
    t,
    handleCloseEdit,
    loadCustomers,
  ]);

  const handleResetFilters = useCallback(() => {
    setFilterPhone("");
    setFilterCustomerTypeId("");
    setCurrentPage(0);
  }, []);

  const handlePaginationChange = useCallback((pageIndex: number) => {
    setCurrentPage(pageIndex);
  }, []);

  const handlePhoneFilterChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilterPhone(e.target.value);
      setCurrentPage(0);
    },
    []
  );

  const handleTypeFilterChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilterCustomerTypeId(e.target.value);
      setCurrentPage(0);
    },
    []
  );

  const columns = useMemo(
    () => getCustomerColumns({ onEdit: handleOpenEdit, t }),
    [handleOpenEdit, t]
  );

  const hasCustomers = customers.length > 0;
  const hasPhoneFilter = filterPhone.trim().length > 0;
  const showCreateButton = !hasCustomers && hasPhoneFilter && !isLoading;

  return (
    <>
      <SectionHeader title={t("header.customers")} />

      <div className={styles.customersContainer}>
        {/* Filters */}
        <div className={styles.filtersSection}>
          <div className={styles.filtersHeader}>
            <h3 className={styles.filtersTitle}>{t("common.filters")}</h3>
            <Button
              variant="secondary"
              size="small"
              onClick={handleResetFilters}
            >
              {t("common.reset")}
            </Button>
          </div>
          <div className={styles.filtersContent}>
            <TextField
              label={t("customers.form.phone")}
              placeholder={t("customers.form.phonePlaceholder")}
              value={filterPhone}
              onChange={handlePhoneFilterChange}
            />
            <Select
              label={t("customers.form.customerType")}
              placeholder={t("customers.form.selectCustomerType")}
              value={filterCustomerTypeId}
              onChange={handleTypeFilterChange}
            >
              <option value="">{t("customers.form.allTypes")}</option>
              {customerTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.code}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Edit Modal */}
        {isEditModalOpen && editingCustomer && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  {t("customers.editCustomer")}
                </h3>
                <button
                  className={styles.modalClose}
                  onClick={handleCloseEdit}
                  aria-label={t("common.close")}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.modalInfo}>
                  <p>
                    <strong>{t("customers.form.phone")}:</strong>{" "}
                    {editingCustomer.phone}
                  </p>
                  {editingCustomer.fullName && (
                    <p>
                      <strong>{t("customers.form.fullName")}:</strong>{" "}
                      {editingCustomer.fullName}
                    </p>
                  )}
                </div>
                <Select
                  label={t("customers.form.customerType")}
                  placeholder={t("customers.form.selectCustomerType")}
                  value={selectedCustomerTypeId}
                  onChange={(e) => setSelectedCustomerTypeId(e.target.value)}
                  error={!selectedCustomerTypeId}
                  helperText={
                    !selectedCustomerTypeId
                      ? t("customers.validation.customerTypeRequired")
                      : ""
                  }
                  disabled={isSubmitting}
                >
                  {customerTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.code}
                    </option>
                  ))}
                </Select>
              </div>
              <div className={styles.modalActions}>
                <Button
                  variant="secondary"
                  onClick={handleCloseEdit}
                  disabled={isSubmitting}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveEdit}
                  disabled={isSubmitting || !selectedCustomerTypeId}
                >
                  {t("common.save")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <h3 className={styles.tableTitle}>
              {t("customers.customersList")}
            </h3>
          </div>
          <div className={styles.tableWrapper}>
            {isLoading ? (
              <div className={styles.loading}>{t("customers.loading")}</div>
            ) : !hasCustomers ? (
              <div className={styles.emptyState}>
                <p>{t("customers.emptyState")}</p>
                {showCreateButton && (
                  <Button
                    variant="primary"
                    onClick={handleCreateCustomer}
                    disabled={isSubmitting}
                  >
                    {t("customers.createCustomer")}
                  </Button>
                )}
              </div>
            ) : (
              <DataTable
                data={customers}
                columns={columns}
                pageSize={PAGE_SIZE}
                manualPagination={true}
                pageCount={Math.ceil(totalItems / PAGE_SIZE)}
                pageIndex={currentPage}
                onPaginationChange={handlePaginationChange}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};
