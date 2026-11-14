import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Shop, Warehouse } from "@/types/settings";
import type { CashRegister } from "@/types/cash";
import {
  OtherExpenseLocationType,
  OtherExpensePaymentMethod,
  type OtherExpensePaymentReport,
  type OtherExpensePaymentsReportFilters,
} from "@/types/otherExpenses";
import { getOtherExpensePaymentsReport } from "@/services/otherExpenses";
import { loadCashRegisters } from "./registerOptions";
import { PaymentRecords } from "./PaymentRecords";
import { toExclusiveDate } from "./paymentUtils";
import styles from "./ServiceTasks.module.css";

interface ExpensePaymentsReportProps {
  shops: Shop[];
  warehouses: Warehouse[];
  refreshKey: number;
}

const PAGE_SIZE = 50;

export const ExpensePaymentsReport = ({
  shops,
  warehouses,
  refreshKey,
}: ExpensePaymentsReportProps) => {
  const { t } = useTranslation();
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [report, setReport] = useState<OtherExpensePaymentReport | null>(null);
  const [locationType, setLocationType] = useState("");
  const [locationId, setLocationId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [cashRegisterId, setCashRegisterId] = useState("");
  const [method, setMethod] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const locations = useMemo(() => {
    if (locationType === String(OtherExpenseLocationType.Shop)) {
      return shops.map((shop) => ({ id: shop.id, name: shop.code }));
    }
    if (locationType === String(OtherExpenseLocationType.Warehouse)) {
      return warehouses.map((warehouse) => ({ id: warehouse.id, name: warehouse.code }));
    }
    return [];
  }, [locationType, shops, warehouses]);

  useEffect(() => {
    let active = true;
    void loadCashRegisters()
      .then((items) => {
        if (active) setRegisters(items);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setRegisterError(
            loadError instanceof Error
              ? loadError.message
              : t("settings.otherExpenses.payment.registersLoadFailed"),
          );
        }
      });
    return () => {
      active = false;
    };
  }, [t]);

  const loadReport = useCallback(async (nextPage = 1) => {
    setIsLoading(true);
    setError("");
    const filters: OtherExpensePaymentsReportFilters = {
      fromDate: fromDate || undefined,
      toDate: toExclusiveDate(toDate),
      cashRegisterId: cashRegisterId ? Number(cashRegisterId) : undefined,
      method:
        method === OtherExpensePaymentMethod.Cash ||
        method === OtherExpensePaymentMethod.NonCash
          ? method
          : undefined,
      page: nextPage,
      pageSize: PAGE_SIZE,
    };
    if (locationType === String(OtherExpenseLocationType.Shop)) {
      filters.locationType = OtherExpenseLocationType.Shop;
    } else if (locationType === String(OtherExpenseLocationType.Warehouse)) {
      filters.locationType = OtherExpenseLocationType.Warehouse;
    }
    if (locationId) {
      filters.locationId = Number(locationId);
    }

    try {
      const result = await getOtherExpensePaymentsReport(filters);
      setReport(result);
      setPage(nextPage);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : t("settings.otherExpenses.payment.reportLoadFailed"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [cashRegisterId, fromDate, locationId, locationType, method, t, toDate]);

  useEffect(() => {
    void loadReport(1);
  }, [loadReport, refreshKey]);

  const totalPages = Math.max(1, Math.ceil((report?.totalCount ?? 0) / PAGE_SIZE));
  const selectedTotal = method === OtherExpensePaymentMethod.Cash
    ? report?.totalCashAmount ?? 0
    : method === OtherExpensePaymentMethod.NonCash
      ? report?.totalNonCashAmount ?? 0
      : (report?.totalCashAmount ?? 0) + (report?.totalNonCashAmount ?? 0);

  return (
    <section className={styles.reportSection}>
      <div className={styles.reportHeading}>
        <div className={styles.reportTitle}>
          <div className={styles.reportIcon} aria-hidden="true"><BarChart3 size={19} /></div>
          <div>
            <span className={styles.drawerEyebrow}>{t("settings.otherExpenses.payment.reportEyebrow")}</span>
            <h2>{t("settings.otherExpenses.payment.reportTitle")}</h2>
          </div>
        </div>
        <button
          type="button"
          className={`${styles.formButton} ${styles.primaryButton}`}
          onClick={() => void loadReport(1)}
        >
          <Search size={15} aria-hidden="true" />
          {t("settings.otherExpenses.payment.applyFilters")}
        </button>
      </div>

      <div className={styles.reportFilters}>
        <label className={styles.fieldLabel}>
          {t("settings.otherExpenses.fields.entityType")}
          <select value={locationType} onChange={(event) => {
            setLocationType(event.target.value);
            setLocationId("");
          }}>
            <option value="">{t("settings.otherExpenses.payment.allLocations")}</option>
            <option value={OtherExpenseLocationType.Shop}>{t("settings.otherExpenses.entityTypes.shop")}</option>
            <option value={OtherExpenseLocationType.Warehouse}>{t("settings.otherExpenses.entityTypes.warehouse")}</option>
          </select>
        </label>
        {locationType && (
          <label className={styles.fieldLabel}>
            {t("settings.otherExpenses.fields.entity")}
            <select value={locationId} onChange={(event) => setLocationId(event.target.value)}>
              <option value="">{t("settings.otherExpenses.payment.allLocations")}</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </select>
          </label>
        )}
        <label className={styles.fieldLabel}>
          {t("settings.otherExpenses.payment.fromDate")}
          <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
        </label>
        <label className={styles.fieldLabel}>
          {t("settings.otherExpenses.payment.toDate")}
          <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
        </label>
        <label className={styles.fieldLabel}>
          {t("settings.otherExpenses.payment.cashRegister")}
          <select value={cashRegisterId} onChange={(event) => setCashRegisterId(event.target.value)}>
            <option value="">{t("settings.otherExpenses.payment.allRegisters")}</option>
            {registers.map((register) => (
              <option key={register.id} value={register.id}>{register.code}</option>
            ))}
          </select>
        </label>
        <label className={styles.fieldLabel}>
          {t("settings.otherExpenses.payment.method")}
          <select value={method} onChange={(event) => setMethod(event.target.value)}>
            <option value="">{t("settings.otherExpenses.payment.allMethods")}</option>
            <option value={OtherExpensePaymentMethod.Cash}>{t("settings.otherExpenses.payment.cashPart")}</option>
            <option value={OtherExpensePaymentMethod.NonCash}>{t("settings.otherExpenses.payment.nonCashPart")}</option>
          </select>
        </label>
      </div>

      <div className={styles.reportSummary}>
        <div>
          <span>{t("settings.otherExpenses.payment.filteredTotal")}</span>
          <strong>{selectedTotal.toLocaleString()} AMD</strong>
        </div>
        <div>
          <span>{t("settings.otherExpenses.payment.cashTotal")}</span>
          <strong>{(report?.totalCashAmount ?? 0).toLocaleString()} AMD</strong>
        </div>
        <div>
          <span>{t("settings.otherExpenses.payment.nonCashTotal")}</span>
          <strong>{(report?.totalNonCashAmount ?? 0).toLocaleString()} AMD</strong>
        </div>
        <div>
          <span>{t("settings.otherExpenses.payment.records")}</span>
          <strong>{report?.totalCount ?? 0}</strong>
        </div>
      </div>

      {error && <p className={styles.formError} role="alert">{error}</p>}
      {registerError && <p className={styles.formError} role="alert">{registerError}</p>}
      {isLoading ? (
        <p className={styles.loadingText} aria-live="polite">{t("common.loading")}</p>
      ) : (
        <PaymentRecords payments={report?.payments ?? []} registers={registers} />
      )}
      {report && totalPages > 1 && (
        <div className={styles.pagination}>
          <button type="button" className={styles.textButton} onClick={() => void loadReport(page - 1)} disabled={page <= 1}>
            {t("common.previous")}
          </button>
          <span>{t("settings.otherExpenses.payment.page", { page, totalPages })}</span>
          <button type="button" className={styles.textButton} onClick={() => void loadReport(page + 1)} disabled={page >= totalPages}>
            {t("common.next")}
          </button>
        </div>
      )}
    </section>
  );
};
