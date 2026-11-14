import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getOtherExpensePayments } from "@/services/otherExpenses";
import {
  OtherExpensePaymentMethod,
  type OtherExpenseItem,
  type OtherExpensePaymentReport,
} from "@/types/otherExpenses";
import type { Shop } from "@/types/settings";
import type { CashRegister } from "@/types/cash";
import { getExpenseRegisterShopIds, loadCashRegisters } from "./registerOptions";
import { PaymentRecords } from "./PaymentRecords";
import { toExclusiveDate } from "./paymentUtils";
import styles from "./ServiceTasks.module.css";

interface PaymentHistoryPanelProps {
  expense: OtherExpenseItem;
  shops: Shop[];
  refreshKey: number;
}

const PAGE_SIZE = 50;

export const PaymentHistoryPanel = ({
  expense,
  shops,
  refreshKey,
}: PaymentHistoryPanelProps) => {
  const { t } = useTranslation();
  const shopIds = useMemo(
    () => getExpenseRegisterShopIds(expense.locationType, expense.locationId, shops),
    [expense.locationId, expense.locationType, shops],
  );
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [report, setReport] = useState<OtherExpensePaymentReport | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [cashRegisterId, setCashRegisterId] = useState("");
  const [method, setMethod] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRegisters, setIsLoadingRegisters] = useState(true);
  const [registerError, setRegisterError] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setIsLoadingRegisters(true);
    setRegisterError("");
    if (shopIds.length === 0) {
      setRegisters([]);
      setIsLoadingRegisters(false);
      return () => {
        active = false;
      };
    }

    void loadCashRegisters(shopIds)
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
      })
      .finally(() => {
        if (active) setIsLoadingRegisters(false);
      });

    return () => {
      active = false;
    };
  }, [shopIds, t]);

  const loadPayments = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await getOtherExpensePayments(expense.id, {
        fromDate: fromDate || undefined,
        toDate: toExclusiveDate(toDate),
        cashRegisterId: cashRegisterId ? Number(cashRegisterId) : undefined,
        method:
          method === OtherExpensePaymentMethod.Cash ||
          method === OtherExpensePaymentMethod.NonCash
            ? method
            : undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setReport(result);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : t("settings.otherExpenses.payment.historyLoadFailed"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [cashRegisterId, expense.id, fromDate, method, page, t, toDate]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments, refreshKey]);

  const totalPages = Math.max(1, Math.ceil((report?.totalCount ?? 0) / PAGE_SIZE));

  return (
    <section className={styles.historyPanel} aria-label={t("settings.otherExpenses.payment.historyTitle")}>
      <div className={styles.panelTitle}>
        <h3>{t("settings.otherExpenses.payment.historyTitle")}</h3>
        <button type="button" className={styles.textButton} onClick={() => void loadPayments()}>
          {t("common.refresh")}
        </button>
      </div>
      <div className={styles.filtersGrid}>
        <label className={styles.fieldLabel}>
          {t("settings.otherExpenses.payment.fromDate")}
          <input type="date" value={fromDate} onChange={(event) => {
            setFromDate(event.target.value);
            setPage(1);
          }} />
        </label>
        <label className={styles.fieldLabel}>
          {t("settings.otherExpenses.payment.toDate")}
          <input type="date" value={toDate} onChange={(event) => {
            setToDate(event.target.value);
            setPage(1);
          }} />
        </label>
        <label className={styles.fieldLabel}>
          {t("settings.otherExpenses.payment.cashRegister")}
          <select value={cashRegisterId} onChange={(event) => {
            setCashRegisterId(event.target.value);
            setPage(1);
          }} disabled={isLoadingRegisters}>
            <option value="">{t("settings.otherExpenses.payment.allRegisters")}</option>
            {registers.map((register) => (
              <option key={register.id} value={register.id}>{register.code}</option>
            ))}
          </select>
        </label>
        <label className={styles.fieldLabel}>
          {t("settings.otherExpenses.payment.method")}
          <select value={method} onChange={(event) => {
            setMethod(event.target.value);
            setPage(1);
          }}>
            <option value="">{t("settings.otherExpenses.payment.allMethods")}</option>
            <option value={OtherExpensePaymentMethod.Cash}>{t("settings.otherExpenses.payment.cashPart")}</option>
            <option value={OtherExpensePaymentMethod.NonCash}>{t("settings.otherExpenses.payment.nonCashPart")}</option>
          </select>
        </label>
      </div>

      {report && (
        <div className={styles.paymentTotals}>
          <span>{t("settings.otherExpenses.payment.cashTotal")}: <strong>{report.totalCashAmount.toLocaleString()} AMD</strong></span>
          <span>{t("settings.otherExpenses.payment.nonCashTotal")}: <strong>{report.totalNonCashAmount.toLocaleString()} AMD</strong></span>
          <span>{t("settings.otherExpenses.payment.recordsCount", { count: report.totalCount })}</span>
        </div>
      )}
      {error && <p className={styles.formError} role="alert">{error}</p>}
      {registerError && <p className={styles.formError} role="alert">{registerError}</p>}
      {isLoading ? (
        <p className={styles.loadingText} aria-live="polite">{t("common.loading")}</p>
      ) : (
        <PaymentRecords payments={report?.payments ?? []} registers={registers} />
      )}
      {report && totalPages > 1 && (
        <div className={styles.pagination}>
          <button type="button" className={styles.textButton} onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1}>
            {t("common.previous")}
          </button>
          <span>{t("settings.otherExpenses.payment.page", { page, totalPages })}</span>
          <button type="button" className={styles.textButton} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages}>
            {t("common.next")}
          </button>
        </div>
      )}
    </section>
  );
};
