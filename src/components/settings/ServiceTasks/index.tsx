import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./ServiceTasks.module.css";
import { createColumnHelper } from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { Button, ConfirmationModal, DataTable, Select, TextField } from "@/ui-kit";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRow, setEditingRow] = useState<OtherExpenseItem | null>(null);
  const [deletingRow, setDeletingRow] = useState<OtherExpenseItem | null>(null);

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
  }, []);

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
  }, [editingRow, loadRows, resetForm, t, validatePayload]);

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
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              size="small"
              variant="secondary"
              onClick={() => {
                const item = row.original;
                setEditingRow(item);
                setLocationType(item.locationType);
                setLocationId(String(item.locationId));
                setServiceName(item.serviceName || "");
                setAmount(String(item.amount ?? ""));
                setPaymentDay(String(item.paymentDay ?? ""));
              }}
            >
              {t("common.edit")}
            </Button>
            <Button size="small" variant="danger" onClick={() => setDeletingRow(row.original)}>
              {t("common.delete")}
            </Button>
          </div>
        ),
      }),
    ],
    [t],
  );

  const locationOptions = locationType === OtherExpenseLocationType.Shop ? shops : warehouses;

  return (
    <section>
      <h1>{t("settings.navigation.serviceTasks")}</h1>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", marginBottom: 16 }}>
        <Select
          label={t("settings.otherExpenses.fields.entityType")}
          value={String(locationType)}
          onChange={(e) => {
            setLocationType(Number(e.target.value) as OtherExpenseLocationType);
            setLocationId("");
          }}
          disabled={!!editingRow}
        >
          <option value={OtherExpenseLocationType.Shop}>{t("settings.otherExpenses.entityTypes.shop")}</option>
          <option value={OtherExpenseLocationType.Warehouse}>{t("settings.otherExpenses.entityTypes.warehouse")}</option>
        </Select>

        <Select
          label={t("settings.otherExpenses.fields.entity")}
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          disabled={!!editingRow}
        >
          <option value="">{t("common.select")}</option>
          {locationOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.code}
            </option>
          ))}
        </Select>

        <TextField
          label={t("settings.otherExpenses.fields.name")}
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
          placeholder={t("settings.otherExpenses.placeholders.name")}
        />

        <TextField
          type="number"
          min="0"
          label={t("settings.otherExpenses.fields.price")}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t("settings.otherExpenses.placeholders.price")}
        />

        <TextField
          type="number"
          min="1"
          max="31"
          label={t("settings.otherExpenses.fields.paymentDay")}
          value={paymentDay}
          onChange={(e) => setPaymentDay(e.target.value)}
          placeholder={t("settings.otherExpenses.placeholders.paymentDay")}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
          {editingRow ? t("common.update") : t("common.save")}
        </Button>
        {editingRow && (
          <Button variant="secondary" onClick={resetForm} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
        )}
      </div>

      {isLoading ? (
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
        <DataTable data={rows} columns={columns} pageSize={10} />
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
