import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { callingService } from "@/services/calling";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { CallHistoryPage } from "@/types/calling";
import styles from "./Calling.module.css";

const formatDateTime = (value: string, language: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(language, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
};

const formatDuration = (seconds: number | null) => {
  if (seconds == null) return "—";
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
};

export const CallingHistory = () => {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState<CallHistoryPage | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    void callingService.getHistory(pageNumber, 10)
      .then((result) => {
        if (active) setPage(result);
      })
      .catch((requestError: unknown) => {
        if (active) setError(getApiErrorMessage(requestError, t("calling.historyLoadFailed")));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [pageNumber, t]);

  const totalPages = page ? Math.max(1, Math.ceil(page.totalItems / page.pageSize)) : 1;

  return (
    <section className={styles.history} id="calling-history">
      <header className={styles.historyHeader}>
        <div>
          <span>{t("calling.historyEyebrow")}</span>
          <h3>{t("calling.historyTitle")}</h3>
        </div>
      </header>
      {error && <p className={styles.historyError} role="alert">{error}</p>}
      {loading ? (
        <p className={styles.historyState} role="status">{t("calling.historyLoading")}</p>
      ) : page?.items.length ? (
        <div className={styles.historyList}>
          {page.items.map((item) => (
            <article key={item.callId} className={styles.historyItem}>
              <div>
                <strong>{item.agentName}</strong>
                <span>{formatDateTime(item.startedAt, i18n.resolvedLanguage || i18n.language)}</span>
              </div>
              <div>
                <span className={styles.historyStatus}>
                  {t(`calling.statuses.${item.status}`, { defaultValue: item.status })}
                </span>
                <span>{t("calling.duration")}: {formatDuration(item.durationSeconds)}</span>
              </div>
              <div className={styles.historyDetails}>
                <span>{t("calling.shop")}: {item.shopId}</span>
                {item.assignedCashierId != null && (
                  <span>{t("calling.cashier")}: #{item.assignedCashierId}</span>
                )}
                {item.endedAt && <span>{t("calling.endedAt")}: {formatDateTime(item.endedAt, i18n.resolvedLanguage || i18n.language)}</span>}
              </div>
            </article>
          ))}
        </div>
      ) : !error ? (
        <p className={styles.historyState}>{t("calling.historyEmpty")}</p>
      ) : null}
      {page && page.totalItems > page.pageSize && (
        <div className={styles.historyPager}>
          <button type="button" onClick={() => setPageNumber((current) => Math.max(1, current - 1))} disabled={loading || pageNumber <= 1}>
            {t("calling.previous")}
          </button>
          <span>{pageNumber} / {totalPages}</span>
          <button type="button" onClick={() => setPageNumber((current) => Math.min(totalPages, current + 1))} disabled={loading || pageNumber >= totalPages}>
            {t("calling.next")}
          </button>
        </div>
      )}
    </section>
  );
};
