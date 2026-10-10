import { type FC, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock3,
  UserRound,
  WalletCards,
} from "lucide-react";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchOpenSessionsSummary } from "@/store/slices/cash/dashboardSlice";

// utils
import { getApiErrorMessage } from "@/utils";
import type { OpenSessionSummary } from "@/types/cash";

// styles
import styles from "./OpenSessions.module.css";

const PAGE_SIZE = 10;

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "-";

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatAmd = (value: number) => `${value.toLocaleString()} AMD`;

export const OpenSessions: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { openSessionsSummary, isLoading } = useAppSelector(
    (state) => state.cashDashboard,
  );

  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    dispatch(fetchOpenSessionsSummary({}))
      .unwrap()
      .catch((error) => {
        toast.error(
          getApiErrorMessage(
            error,
            t("cashbox.errors.failedToFetchOpenSessionsSummary"),
          ),
        );
      });
  }, [dispatch, t]);

  const paginatedData = useMemo(() => {
    const startIndex = currentPage * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return openSessionsSummary.slice(startIndex, endIndex);
  }, [openSessionsSummary, currentPage]);

  const totalPages = useMemo(
    () => Math.ceil(openSessionsSummary.length / PAGE_SIZE),
    [openSessionsSummary.length],
  );
  const shownFrom = openSessionsSummary.length === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const shownTo = Math.min((currentPage + 1) * PAGE_SIZE, openSessionsSummary.length);

  return (
    <div className={styles.openSessionsWrapper}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.titleIcon} aria-hidden="true">
            <Clock3 size={19} />
          </span>
          <div className={styles.headerCopy}>
            <span className={styles.eyebrow}>{t("reports.navigationGroups.cashbox")}</span>
            <h1>{t("cashbox.openSessions.title")}</h1>
          </div>
        </div>
        <div className={styles.activeCount}>
          <span className={styles.activeCountIcon} aria-hidden="true">
            <CircleDot size={16} />
          </span>
          <span>{t("cashbox.openSessions.activeCount")}</span>
          <strong>{openSessionsSummary.length}</strong>
        </div>
      </header>

      <div className={styles.sessionsList}>
        {isLoading && openSessionsSummary.length === 0 ? (
          <div className={styles.loadingList} aria-busy="true" aria-live="polite">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className={styles.sessionSkeleton}>
                <div className={styles.skeletonIdentity}>
                  <div className={`${styles.skeletonLine} ${styles.skeletonLineWide}`} />
                  <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                </div>
                <div className={styles.skeletonMetrics}>
                  {Array.from({ length: 4 }).map((__, metricIndex) => (
                    <div key={metricIndex} className={styles.skeletonMetric}>
                      <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
                      <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : paginatedData.length === 0 ? (
          <div className={styles.emptyState}>
            <CircleDot size={22} aria-hidden="true" />
            <span>{t("common.noData")}</span>
          </div>
        ) : (
          paginatedData.map((session: OpenSessionSummary) => (
            <article className={styles.sessionCard} key={session.sessionId}>
              <div className={styles.cardHeader}>
                <div className={styles.sessionIdentity}>
                  <span className={styles.registerIcon} aria-hidden="true">
                    <WalletCards size={19} />
                  </span>
                  <div className={styles.identityCopy}>
                    <div className={styles.sessionTitleLine}>
                      <strong className={styles.sessionId}>#{session.sessionId}</strong>
                      <span className={styles.openBadge}>
                        <span className={styles.openDot} />
                        {t("cashbox.openSessions.statusOpen")}
                      </span>
                    </div>
                    <span className={styles.registerCode}>
                      {t("cashbox.openSessions.columns.cashBoxCode")}: {session.cashBoxCode}
                    </span>
                  </div>
                </div>

                <div className={styles.operatorInfo}>
                  <span className={styles.metaLabel}>
                    {t("cashbox.openSessions.columns.operator")}
                  </span>
                  <strong>
                    <UserRound size={15} aria-hidden="true" />
                    {session.operatorUsername}
                  </strong>
                </div>

                <div className={styles.sessionTimes}>
                  <div>
                    <span className={styles.metaLabel}>
                      <Clock3 size={13} aria-hidden="true" />
                      {t("cashbox.openSessions.columns.openedAt")}
                    </span>
                    <time>{formatDateTime(session.openedAt)}</time>
                  </div>
                  <div>
                    <span className={styles.metaLabel}>
                      <Activity size={13} aria-hidden="true" />
                      {t("cashbox.openSessions.columns.lastActivity")}
                    </span>
                    <time>{formatDateTime(session.lastActivityAt)}</time>
                  </div>
                </div>
              </div>

              <div className={styles.metricsGrid}>
                <div className={styles.metric}>
                  <span>{t("cashbox.openSessions.columns.intakesOffered")}</span>
                  <strong>{session.intakesOfferedCount.toLocaleString()}</strong>
                </div>
                <div className={styles.metric}>
                  <span>{t("cashbox.openSessions.columns.intakesAccepted")}</span>
                  <strong>{session.intakesAcceptedCount.toLocaleString()}</strong>
                </div>
                <div className={styles.metric}>
                  <span>{t("cashbox.openSessions.columns.powderKg")}</span>
                  <strong>{session.acceptedPowderKg.toLocaleString()} kg</strong>
                </div>
                <div className={styles.metric}>
                  <span>
                    <Banknote size={13} aria-hidden="true" />
                    {t("cashbox.openSessions.columns.purchases")}
                  </span>
                  <strong>{formatAmd(session.purchasesAmd)}</strong>
                </div>
                <div className={styles.metric}>
                  <span>
                    <ArrowDownLeft size={13} aria-hidden="true" />
                    {t("cashbox.openSessions.columns.cashIn")}
                  </span>
                  <strong className={session.cashInAmd > 0 ? styles.cashIn : ""}>
                    {session.cashInAmd > 0 ? "+" : ""}
                    {formatAmd(session.cashInAmd)}
                  </strong>
                </div>
                <div className={styles.metric}>
                  <span>
                    <ArrowUpRight size={13} aria-hidden="true" />
                    {t("cashbox.openSessions.columns.cashOut")}
                  </span>
                  <strong className={session.cashOutAmd > 0 ? styles.cashOut : ""}>
                    {session.cashOutAmd > 0 ? "-" : ""}
                    {formatAmd(session.cashOutAmd)}
                  </strong>
                </div>
                <div className={styles.metric}>
                  <span>
                    <CheckCircle2 size={13} aria-hidden="true" />
                    {t("cashbox.openSessions.columns.difference")}
                  </span>
                  <strong
                    className={
                      session.diffAmd < 0
                        ? styles.negative
                        : session.diffAmd > 0
                          ? styles.positive
                          : ""
                    }
                  >
                    {formatAmd(session.diffAmd)}
                  </strong>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <footer className={styles.listFooter}>
        <span className={styles.resultCount}>
          {t("common.results", {
            from: shownFrom,
            to: shownTo,
            total: openSessionsSummary.length,
          })}
        </span>
        {totalPages > 1 && (
          <nav className={styles.pagination} aria-label={t("common.page")}>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
              disabled={currentPage === 0}
              aria-label={t("common.previous")}
            >
              <ChevronLeft size={16} />
              {t("common.previous")}
            </button>
            <span>
              {t("common.page")} {currentPage + 1} {t("common.of")} {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages - 1, page + 1))}
              disabled={currentPage >= totalPages - 1}
              aria-label={t("common.next")}
            >
              {t("common.next")}
              <ChevronRight size={16} />
            </button>
          </nav>
        )}
      </footer>
    </div>
  );
};
