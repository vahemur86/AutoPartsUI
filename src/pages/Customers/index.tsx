import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// icons
import { Plus, Filter, RotateCcw } from "lucide-react";

// ui-kit
import { DataTable, Button, Select, IconButton } from "@/ui-kit";

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

  // UI State
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState<boolean>(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] =
    useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerTypeId, setSelectedCustomerTypeId] =
    useState<string>("");

  // Filters State
  const [filterPhone, setFilterPhone] = useState<string>("");
  const [filterCustomerTypeId, setFilterCustomerTypeId] = useState<string>("");
  const [filterGender, setFilterGender] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(0);

  const addBtnRef = useRef<HTMLDivElement>(null);
  const filterBtnRef = useRef<HTMLDivElement>(null);

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

  const handleApplyFilters = (filters: {
    phone: string;
    customerTypeId: string;
    gender: number | null;
  }) => {
    setFilterPhone(filters.phone);
    setFilterCustomerTypeId(filters.customerTypeId);
    setFilterGender(filters.gender);
    setCurrentPage(0);
  };

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
    () => getCustomerColumns({ onEdit: handleOpenEdit, t }),
    [handleOpenEdit, t],
  );

  const hasActiveFilters =
    filterPhone !== "" || filterCustomerTypeId !== "" || filterGender !== null;

  return (
    <>
      <SectionHeader title={t("header.customers")} />

      <div className={styles.customersContainer}>
        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <h3 className={styles.tableTitle}>
              {t("customers.customersList")}
            </h3>
            <div className={styles.headerActions}>
              {hasActiveFilters && (
                <div
                  className={styles.addButtonContainer}
                  onClick={handleResetFilters}
                >
                  <IconButton
                    ariaLabel="Reset filters"
                    variant="secondary"
                    size="small"
                    icon={<RotateCcw size={12} color="#fff" />}
                  />
                  <span className={styles.addButtonLabel}>
                    {t("common.reset")}
                  </span>
                </div>
              )}

              <div
                ref={filterBtnRef}
                className={styles.addButtonContainer}
                onClick={() => setIsFilterDropdownOpen(true)}
              >
                <IconButton
                  ariaLabel="Open filters"
                  variant="secondary"
                  size="small"
                  icon={<Filter size={12} color="#fff" />}
                />
                <span className={styles.addButtonLabel}>
                  {t("common.filters")}
                </span>
              </div>

              <div
                ref={addBtnRef}
                className={styles.addButtonContainer}
                onClick={() => setIsAddDropdownOpen(true)}
              >
                <IconButton
                  ariaLabel="Add customer"
                  variant="primary"
                  size="small"
                  icon={<Plus size={12} color="#0e0f11" />}
                />
                <span className={styles.addButtonLabel}>
                  {t("offers.addOption")}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            {isLoading ? (
              <div className={styles.loading}>{t("customers.loading")}</div>
            ) : (
              <DataTable
                data={customers ?? []}
                columns={columns}
                pageSize={PAGE_SIZE}
                manualPagination
                pageCount={Math.ceil((totalItems ?? 0) / PAGE_SIZE)}
                pageIndex={currentPage}
                frozenConfig={{
                  right: ["actions"],
                }}
                onPaginationChange={setCurrentPage}
              />
            )}
          </div>
        </div>
      </div>

      <CustomersDropdown
        type="add"
        open={isAddDropdownOpen}
        anchorRef={addBtnRef}
        onOpenChange={setIsAddDropdownOpen}
        onSave={handleCreateSubmit}
        isSubmitting={isSubmitting}
      />

      <CustomersDropdown
        type="filter"
        open={isFilterDropdownOpen}
        anchorRef={filterBtnRef}
        onOpenChange={setIsFilterDropdownOpen}
        customerTypes={customerTypes}
        filters={{
          phone: filterPhone,
          customerTypeId: filterCustomerTypeId,
          gender: filterGender,
        }}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {isEditModalOpen && editingCustomer && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {t("customers.editCustomer")}
              </h3>
              <button
                className={styles.modalClose}
                onClick={() => setIsEditModalOpen(false)}
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
            <div className={styles.modalActions}>
              <Button
                variant="secondary"
                onClick={() => setIsEditModalOpen(false)}
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
    </>
  );
};
