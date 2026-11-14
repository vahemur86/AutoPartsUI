import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  BadgeCheck,
  CalendarDays,
  CircleDollarSign,
  CreditCard,
  Eye,
  History,
  Pencil,
  Plus,
  Search,
  Store,
  Trash2,
  Warehouse,
  Wrench,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useMinimumLoadingDuration } from "@/hooks/useMinimumLoadingDuration";
import { Button, ConfirmationModal, TextField } from "@/ui-kit";
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
import {
  OtherExpenseLocationType,
  type OtherExpenseCreatePayload,
  type OtherExpenseItem,
} from "@/types/otherExpenses";
import { ExpensePaymentsReport } from "./ExpensePaymentsReport";
import { PaymentDrawer } from "./PaymentDrawer";
import { PaymentHistoryPanel } from "./PaymentHistoryPanel";
import styles from "./ServiceTasks.module.css";

const money = (value: number): string =>
  `${Number(value || 0).toLocaleString()} AMD`;

export const ServiceTasks = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { shops } = useAppSelector((state) => state.shops);
  const { warehouses } = useAppSelector((state) => state.warehouses);

  const [rows, setRows] = useState<OtherExpenseItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const showSkeleton = useMinimumLoadingDuration(isLoading);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRow, setEditingRow] = useState<OtherExpenseItem | null>(null);
  const [deletingRow, setDeletingRow] = useState<OtherExpenseItem | null>(null);
  const [paymentExpense, setPaymentExpense] = useState<OtherExpenseItem | null>(null);
  const [historyExpenseId, setHistoryExpenseId] = useState<number | null>(null);
  const [historyView, setHistoryView] = useState<"report" | "service">("report");
  const [paymentRefreshKey, setPaymentRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"services" | "history">("services");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [search, setSearch] = useState("");

  const [locationType, setLocationType] = useState<OtherExpenseLocationType>(
    OtherExpenseLocationType.Shop,
  );
  const [locationId, setLocationId] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDay, setPaymentDay] = useState("");

  const loadRows = useCallback(async () => {
    setIsLoading(true);
    try {
      setRows(await getOtherExpenses());
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("settings.otherExpenses.error.loadFailed"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    dispatch(fetchShops());
    dispatch(fetchWarehouses());
    void loadRows();
  }, [dispatch, loadRows]);

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

  const openEditForm = useCallback((item: OtherExpenseItem, viewOnly = false) => {
    setEditingRow(item);
    setLocationType(item.locationType);
    setLocationId(String(item.locationId));
    setServiceName(item.serviceName || "");
    setAmount(String(item.amount ?? ""));
    setPaymentDay(String(item.paymentDay ?? ""));
    setIsViewOnly(viewOnly);
    setIsDrawerOpen(true);
  }, []);

  const validatePayload = useCallback((): OtherExpenseCreatePayload | null => {
    const trimmedName = serviceName.trim();
    const resolvedLocationId = Number(locationId);
    const resolvedAmount = Number(amount);
    const resolvedPaymentDay = Number(paymentDay);

    if (!trimmedName) {
      toast.error(t("settings.otherExpenses.validation.nameRequired"));
      return null;
    }
    if (!Number.isInteger(resolvedLocationId) || resolvedLocationId <= 0) {
      toast.error(t("settings.otherExpenses.validation.entityRequired"));
      return null;
    }
    if (!Number.isFinite(resolvedAmount) || resolvedAmount <= 0) {
      toast.error(t("settings.otherExpenses.validation.priceRequired"));
      return null;
    }
    if (
      !Number.isInteger(resolvedPaymentDay) ||
      resolvedPaymentDay < 1 ||
      resolvedPaymentDay > 31
    ) {
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
      toast.error(
        error instanceof Error
          ? error.message
          : t("settings.otherExpenses.error.saveFailed"),
      );
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
      toast.error(
        error instanceof Error
          ? error.message
          : t("settings.otherExpenses.error.deleteFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [deletingRow, loadRows, t]);

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

  const historyExpense = rows.find((item) => item.id === historyExpenseId) ?? null;
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

  const handlePaymentSuccess = useCallback((balancesRefreshed: boolean) => {
    toast.success(t("settings.otherExpenses.payment.success"));
    if (!balancesRefreshed) {
      toast.error(t("settings.otherExpenses.payment.balanceRefreshFailed"));
    }
    setPaymentRefreshKey((key) => key + 1);
  }, [t]);

  return (
    <section className={styles.page}>
      <SectionHeader
        title={activeTab === "services"
          ? t("settings.navigation.serviceTasks")
          : t("settings.otherExpenses.payment.historyTitle")}
        icon={activeTab === "services"
          ? <Wrench size={17} aria-hidden="true" />
          : <History size={17} aria-hidden="true" />}
        actions={activeTab === "services" ? (
          <Button
            className={`${actionStyles.referralButton} ${actionStyles.referralPrimary}`}
            onClick={openCreateForm}
          >
            <Plus size={16} aria-hidden="true" />
            {t("settings.otherExpenses.addService")}
          </Button>
        ) : undefined}
      />

      <div className={styles.pageTabs} role="tablist" aria-label={t("settings.otherExpenses.tabs.label")}>
        <button
          type="button"
          role="tab"
          id="service-list-tab"
          aria-controls="service-list-panel"
          aria-selected={activeTab === "services"}
          className={`${styles.pageTab} ${activeTab === "services" ? styles.selectedPageTab : ""}`}
          onClick={() => setActiveTab("services")}
        >
          <Wrench size={15} aria-hidden="true" />
          {t("settings.otherExpenses.tabs.services")}
        </button>
        <button
          type="button"
          role="tab"
          id="payment-history-tab"
          aria-controls="payment-history-panel"
          aria-selected={activeTab === "history"}
          className={`${styles.pageTab} ${activeTab === "history" ? styles.selectedPageTab : ""}`}
          onClick={() => setActiveTab("history")}
        >
          <History size={15} aria-hidden="true" />
          {t("settings.otherExpenses.tabs.paymentHistory")}
        </button>
      </div>

      {activeTab === "services" ? (
      <div
        className={styles.tabPanel}
        role="tabpanel"
        id="service-list-panel"
        aria-labelledby="service-list-tab"
      >
      <div className={styles.introCard}>
        <div className={styles.introIcon} aria-hidden="true"><CircleDollarSign size={22} /></div>
        <div>
          <h2>{t("settings.otherExpenses.pageTitle")}</h2>
          <p>{t("settings.otherExpenses.pageDescription")}</p>
        </div>
        <div className={styles.introCount}>
          <strong>{rows.length}</strong>
          <span>{t("settings.otherExpenses.servicesCount")}</span>
        </div>
      </div>

      <div className={styles.toolbar}>
        <TextField
          className={styles.searchField}
          label={t("common.search")}
          placeholder={t("settings.otherExpenses.searchPlaceholder")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          icon={<Search size={15} aria-hidden="true" />}
        />
        <span className={styles.resultsCount}>
          {t("settings.otherExpenses.resultsCount", {
            shown: filteredRows.length,
            total: rows.length,
          })}
        </span>
      </div>

      {showSkeleton ? (
        <div className={styles.cardGrid} aria-busy="true" aria-live="polite">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className={styles.serviceCardSkeleton} key={index} />
          ))}
        </div>
      ) : filteredRows.length === 0 ? (
        <div className={styles.emptyServices}>
          <div className={styles.emptyIcon} aria-hidden="true"><Store size={23} /></div>
          <h3>{t("settings.otherExpenses.emptyState")}</h3>
          <p>{t("settings.otherExpenses.emptyDescription")}</p>
          {rows.length === 0 && (
            <button type="button" className={`${styles.formButton} ${styles.primaryButton}`} onClick={openCreateForm}>
              <Plus size={15} aria-hidden="true" />{t("settings.otherExpenses.addService")}
            </button>
          )}
        </div>
      ) : (
        <div className={styles.cardGrid}>
          {filteredRows.map((item) => {
            const isShop = item.locationType === OtherExpenseLocationType.Shop;
            return (
              <article
                className={`${styles.serviceCard} ${item.isActive ? "" : styles.inactiveServiceCard}`}
                key={item.id}
              >
                <div className={styles.serviceCardTop}>
                  <div className={styles.serviceTypeIcon} aria-hidden="true">
                    {isShop ? <Store size={19} /> : <Warehouse size={19} />}
                  </div>
                  <div className={styles.serviceIdentity}>
                    <span className={styles.locationLabel}>
                      {isShop
                        ? t("settings.otherExpenses.entityTypes.shop")
                        : t("settings.otherExpenses.entityTypes.warehouse")}
                      {" · "}{item.locationName || "-"}
                    </span>
                    <h3>{item.serviceName}</h3>
                  </div>
                  <span className={item.isActive ? styles.activeBadge : styles.inactiveBadge}>
                    {item.isActive
                      ? t("settings.otherExpenses.status.active")
                      : t("settings.otherExpenses.status.inactive")}
                  </span>
                </div>

                <div className={styles.serviceFacts}>
                  <div className={styles.serviceFact}>
                    <span><CircleDollarSign size={14} aria-hidden="true" />{t("settings.otherExpenses.referenceAmount")}</span>
                    <strong>{money(item.amount)}</strong>
                  </div>
                  <div className={styles.serviceFact}>
                    <span><CalendarDays size={14} aria-hidden="true" />{t("settings.otherExpenses.referencePaymentDay")}</span>
                    <strong>{item.paymentDay}</strong>
                  </div>
                </div>
                <p className={styles.referenceNote}>{t("settings.otherExpenses.referenceNote")}</p>

                <div className={styles.serviceActions}>
                  <button
                    type="button"
                    className={`${styles.formButton} ${styles.primaryButton}`}
                    onClick={() => setPaymentExpense(item)}
                    disabled={!item.isActive}
                  >
                    <CreditCard size={15} aria-hidden="true" />
                    {t("settings.otherExpenses.recordPayment")}
                  </button>
                  <button
                    type="button"
                    className={`${styles.formButton} ${styles.secondaryButton}`}
                    onClick={() => {
                      setHistoryExpenseId(item.id);
                      setHistoryView("service");
                      setActiveTab("history");
                    }}
                  >
                    <History size={15} aria-hidden="true" />
                    {t("settings.otherExpenses.payment.historyTitle")}
                  </button>
                  <div className={styles.iconActions}>
                    <button
                      type="button"
                      className={styles.rowAction}
                      onClick={() => openEditForm(item, true)}
                      aria-label={t("settings.otherExpenses.actions.view")}
                      title={t("settings.otherExpenses.actions.view")}
                    >
                      <Eye size={14} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={styles.rowAction}
                      onClick={() => openEditForm(item)}
                      aria-label={t("common.edit")}
                      title={t("common.edit")}
                    >
                      <Pencil size={14} aria-hidden="true" />
                    </button>
                    {item.isActive && (
                      <button
                        type="button"
                        className={`${styles.rowAction} ${styles.rowActionDelete}`}
                        onClick={() => setDeletingRow(item)}
                        aria-label={t("settings.otherExpenses.deactivate")}
                        title={t("settings.otherExpenses.deactivate")}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>

              </article>
            );
          })}
        </div>
      )}

      </div>
      ) : (
        <div
          className={styles.tabPanel}
          role="tabpanel"
          id="payment-history-panel"
          aria-labelledby="payment-history-tab"
        >
          <div className={styles.historyViewTabs} role="tablist" aria-label={t("settings.otherExpenses.tabs.paymentHistory")}>
            <button
              type="button"
              role="tab"
              aria-selected={historyView === "report"}
              className={`${styles.historyViewTab} ${historyView === "report" ? styles.selectedHistoryViewTab : ""}`}
              onClick={() => setHistoryView("report")}
            >
              {t("settings.otherExpenses.payment.allPayments")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={historyView === "service"}
              className={`${styles.historyViewTab} ${historyView === "service" ? styles.selectedHistoryViewTab : ""}`}
              onClick={() => setHistoryView("service")}
              disabled={!historyExpense}
            >
              {historyExpense
                ? t("settings.otherExpenses.payment.serviceHistoryFor", { name: historyExpense.serviceName })
                : t("settings.otherExpenses.payment.serviceHistory")}
            </button>
          </div>
          {historyView === "service" && historyExpense ? (
            <PaymentHistoryPanel
              expense={historyExpense}
              shops={shops}
              refreshKey={paymentRefreshKey}
            />
          ) : (
            <ExpensePaymentsReport
              shops={shops}
              warehouses={warehouses}
              refreshKey={paymentRefreshKey}
            />
          )}
        </div>
      )}

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
              <div className={styles.drawerIcon} aria-hidden="true"><Wrench size={20} /></div>
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
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            <div className={styles.drawerBody}>
              <div className={styles.drawerSectionHeading}>
                <BadgeCheck size={15} aria-hidden="true" />
                <span>{t("settings.otherExpenses.fields.name")}</span>
              </div>
              {!isViewOnly && (
                <p className={styles.referenceNote}>{t("settings.otherExpenses.definitionNote")}</p>
              )}
              <div className={styles.formGrid}>
                <label className={styles.fieldLabel}>
                  {t("settings.otherExpenses.fields.entityType")}
                  <select
                    value={String(locationType)}
                    onChange={(event) => {
                      const nextType = Number(event.target.value);
                      if (
                        nextType === OtherExpenseLocationType.Shop ||
                        nextType === OtherExpenseLocationType.Warehouse
                      ) {
                        setLocationType(nextType);
                      }
                      setLocationId("");
                    }}
                    disabled={!!editingRow || isViewOnly || isSubmitting}
                  >
                    <option value={OtherExpenseLocationType.Shop}>{t("settings.otherExpenses.entityTypes.shop")}</option>
                    <option value={OtherExpenseLocationType.Warehouse}>{t("settings.otherExpenses.entityTypes.warehouse")}</option>
                  </select>
                </label>

                <label className={styles.fieldLabel}>
                  {t("settings.otherExpenses.fields.entity")}
                  <select
                    value={locationId}
                    onChange={(event) => setLocationId(event.target.value)}
                    disabled={!!editingRow || isViewOnly || isSubmitting}
                  >
                    <option value="">{t("common.select")}</option>
                    {locationOptions.map((item) => (
                      <option key={item.id} value={item.id}>{item.code}</option>
                    ))}
                  </select>
                </label>

                <label className={styles.fieldLabel}>
                  {t("settings.otherExpenses.fields.name")}
                  <input
                    value={serviceName}
                    onChange={(event) => setServiceName(event.target.value)}
                    placeholder={t("settings.otherExpenses.placeholders.name")}
                    disabled={isViewOnly || isSubmitting}
                    autoFocus={!isViewOnly}
                  />
                </label>

                <label className={styles.fieldLabel}>
                  {t("settings.otherExpenses.fields.price")}
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder={t("settings.otherExpenses.placeholders.price")}
                    disabled={isViewOnly || isSubmitting}
                  />
                </label>

                <label className={`${styles.fieldLabel} ${styles.drawerWide}`}>
                  {t("settings.otherExpenses.fields.paymentDay")}
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={paymentDay}
                    onChange={(event) => setPaymentDay(event.target.value)}
                    placeholder={t("settings.otherExpenses.placeholders.paymentDay")}
                    disabled={isViewOnly || isSubmitting}
                  />
                </label>
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

      {paymentExpense && (
        <PaymentDrawer
          expense={paymentExpense}
          shops={shops}
          onClose={() => setPaymentExpense(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      <ConfirmationModal
        open={!!deletingRow}
        onOpenChange={(open) => !open && setDeletingRow(null)}
        title={t("settings.otherExpenses.confirmation.deleteTitle")}
        description={t("settings.otherExpenses.confirmation.deleteDescription", {
          name: deletingRow?.serviceName || "-",
        })}
        confirmText={isSubmitting ? t("common.loading") : t("settings.otherExpenses.deactivate")}
        cancelText={t("common.cancel")}
        onConfirm={handleDelete}
        onCancel={() => setDeletingRow(null)}
      />
    </section>
  );
};
