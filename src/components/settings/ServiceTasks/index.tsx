import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./ServiceTasks.module.css";
import { createColumnHelper } from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  BadgeCheck,
  CalendarDays,
  CircleDollarSign,
  Eye,
  Pencil,
  Plus,
  Search,
  Store,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { useMinimumLoadingDuration } from "@/hooks/useMinimumLoadingDuration";

import { Button, ConfirmationModal, DataTable, Select, TextField } from "@/ui-kit";
import { SectionHeader } from "@/components/common";
import actionStyles from "@/pages/ReferralPersons/ReferralActions.module.css";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchShops } from "@/store/slices/shopsSlice";
import { fetchWarehouses } from "@/store/slices/warehousesSlice";
import {
  createOtherExpense,
  deleteOtherExpense,
  getOtherExpenses,
  updateOtherExpense,
} from "@/services/otherExpenses";
import { getCashRegisterId } from "@/utils";
import {
  OtherExpenseLocationType,
  type OtherExpenseCreatePayload,
  type OtherExpenseItem,
} from "@/types/otherExpenses";

const columnHelper = createColumnHelper<OtherExpenseItem>();

const money = (value: number): string => `${value.toLocaleString()} AMD`;

export const ServiceTasks = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { shops } = useAppSelector((state) => state.shops);
  const { warehouses } = useAppSelector((state) => state.warehouses);

  const [rows, setRows] = useState<OtherExpenseItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const showTableSkeleton = useMinimumLoadingDuration(isLoading);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRow, setEditingRow] = useState<OtherExpenseItem | null>(null);
  const [deletingRow, setDeletingRow] = useState<OtherExpenseItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [search, setSearch] = useState("");

  const [locationType, setLocationType] = useState<OtherExpenseLocationType>(OtherExpenseLocationType.Shop);
  const [locationId, setLocationId] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDay, setPaymentDay] = useState("");

  const cashRegisterId = useMemo(() => getCashRegisterId(0), []);

  const loadRows = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getOtherExpenses();
      setRows(response.filter((item) => item.isActive !== false));
    } catch (error) {
      const message = error instanceof Error ? error.message : t("settings.otherExpenses.error.loadFailed");
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    dispatch(fetchShops({ cashRegisterId }));
    dispatch(fetchWarehouses());
    void loadRows();
  }, [dispatch, cashRegisterId, loadRows]);

  const resetForm = useCallback(() => {
    setLocationType(OtherExpenseLocationType.Shop);
    setLocationId("");
    setServiceName("");
    setAmount("");
    setPaymentDay("");
    setEditingRow(null);
    setIsViewOnly(false);
    setIsDrawerOpen(false);
  }, []);

  const openCreateForm = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  const openEditForm = useCallback((item: OtherExpenseItem) => {
    setEditingRow(item);
    setLocationType(item.locationType);
    setLocationId(String(item.locationId));
    setServiceName(item.serviceName || "");
    setAmount(String(item.amount ?? ""));
    setPaymentDay(String(item.paymentDay ?? ""));
    setIsViewOnly(false);
    setIsDrawerOpen(true);
  }, []);

  const openViewForm = useCallback((item: OtherExpenseItem) => {
    openEditForm(item);
    setIsViewOnly(true);
  }, [openEditForm]);

  const validatePayload = useCallback((): OtherExpenseCreatePayload | null => {
    const trimmedName = serviceName.trim();
    const resolvedLocationId = Number(locationId || 0);
    const resolvedAmount = Number(amount || 0);
    const resolvedPaymentDay = Number(paymentDay || 0);

    if (!trimmedName) {
      toast.error(t("settings.otherExpenses.validation.nameRequired"));
      return null;
    }

    if (!resolvedLocationId) {
      toast.error(t("settings.otherExpenses.validation.entityRequired"));
      return null;
    }

    if (!Number.isFinite(resolvedAmount) || resolvedAmount <= 0) {
      toast.error(t("settings.otherExpenses.validation.priceRequired"));
      return null;
    }

    if (!Number.isInteger(resolvedPaymentDay) || resolvedPaymentDay < 1 || resolvedPaymentDay > 31) {
      toast.error(t("settings.otherExpenses.validation.paymentDayRequired"));
      return null;
    }

    return {
      locationId: resolvedLocationId,
      locationType,
      serviceName: trimmedName,
      amount: resolvedAmount,
      paymentDay: resolvedPaymentDay,
    };
  }, [amount, locationId, locationType, paymentDay, serviceName, t]);

  const handleSubmit = useCallback(async () => {
    if (isViewOnly) return;
    const payload = validatePayload();
    if (!payload) return;

    setIsSubmitting(true);
    try {
      if (editingRow) {
        await updateOtherExpense(editingRow.id, {
          serviceName: payload.serviceName,
          amount: payload.amount,
          paymentDay: payload.paymentDay,
        });
        toast.success(t("settings.otherExpenses.success.updated"));
      } else {
        await createOtherExpense(payload);
        toast.success(t("settings.otherExpenses.success.created"));
      }

      resetForm();
      await loadRows();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("settings.otherExpenses.error.saveFailed");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [editingRow, isViewOnly, loadRows, resetForm, t, validatePayload]);

  const handleDelete = useCallback(async () => {
    if (!deletingRow) return;

    setIsSubmitting(true);
    try {
      await deleteOtherExpense(deletingRow.id);
      toast.success(t("settings.otherExpenses.success.deleted"));
      setDeletingRow(null);
      await loadRows();
    } catch (error) {
      const message = error instanceof Error ? error.message : t("settings.otherExpenses.error.deleteFailed");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [deletingRow, loadRows, t]);

  const columns = useMemo<ColumnDef<OtherExpenseItem, unknown>[]>(
    () => [
      columnHelper.display({
        id: "locationName",
        header: t("settings.otherExpenses.columns.entity"),
        cell: ({ row }) => row.original.locationName || "-",
      }),
      columnHelper.display({
        id: "locationType",
        header: t("settings.otherExpenses.columns.entityType"),
        cell: ({ row }) =>
          row.original.locationType === OtherExpenseLocationType.Shop
            ? t("settings.otherExpenses.entityTypes.shop")
            : t("settings.otherExpenses.entityTypes.warehouse"),
      }),
      columnHelper.display({
        id: "serviceName",
        header: t("settings.otherExpenses.columns.name"),
        cell: ({ row }) => row.original.serviceName || "-",
      }),
      columnHelper.display({
        id: "amount",
        header: t("settings.otherExpenses.columns.price"),
        cell: ({ row }) => money(Number(row.original.amount || 0)),
      }),
      columnHelper.display({
        id: "paymentDay",
        header: t("settings.otherExpenses.columns.paymentDay"),
        cell: ({ row }) => String(row.original.paymentDay || "-"),
      }),
      columnHelper.display({
        id: "actions",
        header: t("common.actions"),
        cell: ({ row }) => (
          <div className={styles.rowActions}>
            <button
              type="button"
              className={styles.rowAction}
              onClick={() => openViewForm(row.original)}
              aria-label={t("settings.otherExpenses.actions.view")}
              title={t("settings.otherExpenses.actions.view")}
            >
              <Eye size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.rowAction}
              onClick={() => openEditForm(row.original)}
              aria-label={t("common.edit")}
              title={t("common.edit")}
            >
              <Pencil size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`${styles.rowAction} ${styles.rowActionDelete}`}
              onClick={() => setDeletingRow(row.original)}
              aria-label={t("common.delete")}
              title={t("common.delete")}
            >
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </div>
        ),
      }),
    ],
    [openEditForm, openViewForm, t],
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return rows;

    return rows.filter((item) =>
      [
        item.locationName,
        item.serviceName,
        item.amount,
        item.paymentDay,
        item.locationType === OtherExpenseLocationType.Shop
          ? t("settings.otherExpenses.entityTypes.shop")
          : t("settings.otherExpenses.entityTypes.warehouse"),
      ].some((value) => String(value ?? "").toLocaleLowerCase().includes(query)),
    );
  }, [rows, search, t]);

  const locationOptions = locationType === OtherExpenseLocationType.Shop ? shops : warehouses;
  const drawerTitle = isViewOnly
    ? t("settings.otherExpenses.viewTitle")
    : editingRow
      ? t("settings.otherExpenses.editTitle")
      : t("settings.otherExpenses.createTitle");

  useEffect(() => {
    if (!isDrawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) resetForm();
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isDrawerOpen, isSubmitting, resetForm]);

  return (
    <section className={styles.page}>
      <SectionHeader
        title={t("settings.navigation.serviceTasks")}
        icon={<Wrench size={17} aria-hidden="true" />}
        actions={
          <Button
            className={`${actionStyles.referralButton} ${actionStyles.referralPrimary}`}
            onClick={openCreateForm}
          >
            <Plus size={16} aria-hidden="true" />
            {t("common.add")}
          </Button>
        }
      />

      <div className={styles.toolbar}>
        <TextField
          className={styles.searchField}
          label={t("common.search")}
          placeholder={t("settings.otherExpenses.searchPlaceholder")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          icon={<Search size={15} aria-hidden="true" />}
        />
      </div>

      <div className={styles.tableSection}>
        <div className={styles.tableHeading}>
          <h3>{t("settings.otherExpenses.listTitle")}</h3>
          <span>{filteredRows.length} / {rows.length}</span>
        </div>
        {showTableSkeleton ? (
          <div className={styles.tableSkeleton} aria-busy="true" aria-live="polite">
            <div className={styles.tableSkeletonHeader}>
              <div className={`${styles.skeletonLine} ${styles.skeletonLineWide}`} />
              <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
            </div>
            <div className={styles.tableSkeletonRows}>
              {Array.from({ length: 5 }).map((_, index) => (
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
            data={filteredRows}
            columns={columns}
            pageSize={10}
            noResultsText={t("settings.otherExpenses.emptyState")}
          />
        )}
      </div>

      {isDrawerOpen && createPortal(
        <div
          className={styles.drawerBackdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSubmitting) resetForm();
          }}
        >
          <aside
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-task-drawer-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className={styles.drawerHeader}>
              <div className={styles.drawerIcon} aria-hidden="true">
                <Wrench size={20} />
              </div>
              <div className={styles.drawerHeaderCopy}>
                <span className={styles.drawerEyebrow}>{t("settings.navigation.serviceTasks")}</span>
                <h2 id="service-task-drawer-title">{drawerTitle}</h2>
              </div>
              <button
                type="button"
                className={styles.drawerClose}
                onClick={resetForm}
                disabled={isSubmitting}
                aria-label={t("common.close")}
                title={t("common.close")}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            <div className={styles.drawerBody}>
              <div className={styles.drawerSectionHeading}>
                <BadgeCheck size={15} aria-hidden="true" />
                <span>{t("settings.otherExpenses.fields.name")}</span>
              </div>
              <div className={styles.formGrid}>
                <Select
                  label={t("settings.otherExpenses.fields.entityType")}
                  value={String(locationType)}
                  onChange={(event) => {
                    setLocationType(Number(event.target.value) as OtherExpenseLocationType);
                    setLocationId("");
                  }}
                  disabled={!!editingRow || isViewOnly || isSubmitting}
                >
                  <option value={OtherExpenseLocationType.Shop}>{t("settings.otherExpenses.entityTypes.shop")}</option>
                  <option value={OtherExpenseLocationType.Warehouse}>{t("settings.otherExpenses.entityTypes.warehouse")}</option>
                </Select>

                <Select
                  label={t("settings.otherExpenses.fields.entity")}
                  value={locationId}
                  onChange={(event) => setLocationId(event.target.value)}
                  disabled={!!editingRow || isViewOnly || isSubmitting}
                >
                  <option value="">{t("common.select")}</option>
                  {locationOptions.map((item) => (
                    <option key={item.id} value={item.id}>{item.code}</option>
                  ))}
                </Select>

                <TextField
                  label={t("settings.otherExpenses.fields.name")}
                  value={serviceName}
                  onChange={(event) => setServiceName(event.target.value)}
                  placeholder={t("settings.otherExpenses.placeholders.name")}
                  icon={<Store size={15} aria-hidden="true" />}
                  disabled={isViewOnly || isSubmitting}
                  autoFocus={!isViewOnly}
                />

                <TextField
                  type="number"
                  min="0"
                  label={t("settings.otherExpenses.fields.price")}
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder={t("settings.otherExpenses.placeholders.price")}
                  icon={<CircleDollarSign size={15} aria-hidden="true" />}
                  disabled={isViewOnly || isSubmitting}
                />

                <div className={styles.drawerWide}>
                  <TextField
                    type="number"
                    min="1"
                    max="31"
                    label={t("settings.otherExpenses.fields.paymentDay")}
                    value={paymentDay}
                    onChange={(event) => setPaymentDay(event.target.value)}
                    placeholder={t("settings.otherExpenses.placeholders.paymentDay")}
                    icon={<CalendarDays size={15} aria-hidden="true" />}
                    disabled={isViewOnly || isSubmitting}
                  />
                </div>
              </div>
            </div>

            <footer className={styles.drawerFooter}>
              <Button
                variant="secondary"
                className={`${actionStyles.referralButton} ${actionStyles.referralNeutral}`}
                onClick={resetForm}
                disabled={isSubmitting}
              >
                {isViewOnly ? t("common.close") : t("common.cancel")}
              </Button>
              {!isViewOnly && (
                <Button
                  className={`${actionStyles.referralButton} ${actionStyles.referralPrimary}`}
                  onClick={() => void handleSubmit()}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t("common.loading") : t("common.save")}
                </Button>
              )}
            </footer>
          </aside>
        </div>,
        document.body,
      )}

      <ConfirmationModal
        open={!!deletingRow}
        onOpenChange={(open) => !open && setDeletingRow(null)}
        title={t("settings.otherExpenses.confirmation.deleteTitle")}
        description={t("settings.otherExpenses.confirmation.deleteDescription", {
          name: deletingRow?.serviceName || "-",
        })}
        confirmText={isSubmitting ? t("common.loading") : t("common.delete")}
        cancelText={t("common.cancel")}
        onConfirm={handleDelete}
        onCancel={() => setDeletingRow(null)}
      />
    </section>
  );
};
