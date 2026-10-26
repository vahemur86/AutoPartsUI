import { type FC, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileCheck2,
  Landmark,
  Scale,
  ShoppingCart,
  UserRound,
} from "lucide-react";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchZReports } from "@/store/slices/cash/cashboxSessionsSlice";

// components
import { FilterZReportsDropdown } from "./FilterZReportsDropdown";

// types & utils
import type { ZReport } from "@/types/cash";
import { getApiErrorMessage } from "@/utils";

// styles
import styles from "./ZReports.module.css";

const PAGE_SIZE = 10;

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatAmd = (value: number) => `${value.toLocaleString()} AMD`;

const formatDuration = (report: ZReport, t: ReturnType<typeof useTranslation>["t"]) => {
  const durationMs = new Date(report.closedAt).getTime() - new Date(report.openedAt).getTime();
  if (!Number.isFinite(durationMs) || durationMs < 0) return "-";

  const totalMinutes = Math.floor(durationMs / 60_000);
  return t("cashbox.zReports.details.durationFormat", {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  });
};

export const ZReports: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { zReports, isLoading } = useAppSelector(
    (state) => state.cashboxSessions,
  );

  const [currentPage, setCurrentPage] = useState(0);
  const [activeFilters, setActiveFilters] = useState<{
    fromDate: string | null;
    toDate: string | null;
  }>({
    fromDate: null,
    toDate: null,
  });
  useEffect(() => {
    dispatch(
      fetchZReports({
        page: currentPage + 1,
        pageSize: PAGE_SIZE,
        fromDate: activeFilters.fromDate || undefined,
        toDate: activeFilters.toDate || undefined,
      }),
    )
      .unwrap()
      .catch((error) => {
        toast.error(
          getApiErrorMessage(error, t("cashbox.errors.failedToFetchZReports")),
        );
      });

  }, [dispatch, t, activeFilters, currentPage]);

  const handleApplyFilters = (filters: {
    fromDate: string | null;
    toDate: string | null;
  }) => {
    setActiveFilters(filters);
    setCurrentPage(0);
  };

  const reports = zReports?.results ?? [];
  const totalPages = useMemo(
    () => Math.ceil((zReports?.totalItems || 0) / PAGE_SIZE),
    [zReports?.totalItems],
  );
  const totalItems = zReports?.totalItems || 0;
  const shownFrom = totalItems === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const shownTo = Math.min((currentPage + 1) * PAGE_SIZE, totalItems);

  return (
    <div className={styles.zReportsWrapper}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.titleIcon} aria-hidden="true">
            <FileCheck2 size={19} />
          </span>
          <div>
            <span className={styles.eyebrow}>{t("reports.navigationGroups.cashbox")}</span>
            <h1>{t("cashbox.zReports.title")}</h1>
          </div>
        </div>
      </header>

      <FilterZReportsDropdown
        onSave={handleApplyFilters}
      />

      <div className={styles.reportList}>
        {isLoading && reports.length === 0 ? (
          <div className={styles.loadingList} aria-busy="true" aria-live="polite">
            {Array.from({ length: 2 }).map((_, index) => (
              <div className={styles.reportSkeleton} key={index}>
                <div className={styles.skeletonHeader}>
                  <div className={`${styles.skeletonLine} ${styles.skeletonLineWide}`} />
                  <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                </div>
                <div className={styles.skeletonMetrics}>
                  {Array.from({ length: 4 }).map((__, metricIndex) => (
                    <div className={styles.skeletonMetric} key={metricIndex}>
                      <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
                      <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className={styles.emptyState}>
            <FileCheck2 size={22} aria-hidden="true" />
            <span>{t("common.noData")}</span>
          </div>
        ) : (
          reports.map((report) => (
            <ZReportCard key={report.id} report={report} />
          ))
        )}
      </div>

      <footer className={styles.listFooter}>
        <span className={styles.resultCount}>
          {t("common.results", {
            from: shownFrom,
            to: shownTo,
            total: totalItems,
          })}
        </span>
        {totalPages > 1 && (
          <nav className={styles.pagination} aria-label={t("common.page")}>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
              disabled={isLoading || currentPage === 0}
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
              disabled={isLoading || currentPage >= totalPages - 1}
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

const ZReportCard: FC<{ report: ZReport }> = ({ report }) => {
  const { t } = useTranslation();
  const totalNonCashIn = report.totalNonCashInAmd ?? report.totalNonCashIn ?? 0;
  const totalNonCashOut = report.totalNonCashOutAmd ?? report.totalNonCashOut ?? 0;
  const differenceClass = report.diffPurchasesVsCashOutAmd < 0
    ? styles.negative
    : report.diffPurchasesVsCashOutAmd > 0
      ? styles.positive
      : "";

  return (
    <article className={styles.reportCard}>
      <header className={styles.cardHeader}>
        <div className={styles.reportIdentity}>
          <span className={styles.reportIcon} aria-hidden="true">
            <FileCheck2 size={19} />
          </span>
          <div className={styles.identityCopy}>
            <div className={styles.reportTitleLine}>
              <h2>{t("cashbox.zReports.details.reportNumber", { id: report.id })}</h2>
              <span className={styles.generatedBadge}>
                <CheckCircle2 size={13} aria-hidden="true" />
                {t("cashbox.zReports.details.generated")}
              </span>
            </div>
            <div className={styles.reportMeta}>
              <span>{t("cashbox.cashboxReport.registerLabel")} #{report.cashBoxId}</span>
              <span>{t("cashbox.zReports.details.sessionLabel")} #{report.sessionId}</span>
            </div>
          </div>
        </div>

        <div className={styles.operatorInfo}>
          <span>{t("cashbox.zReports.details.operator")}</span>
          <strong>
            <UserRound size={14} aria-hidden="true" />
            #{report.operatorUserId}
          </strong>
        </div>
      </header>

      <div className={styles.timeline}>
        <div className={styles.timePoint}>
          <span className={styles.timeLabel}>
            <Clock3 size={13} aria-hidden="true" />
            {t("cashbox.zReports.columns.openedAt")}
          </span>
          <time>{formatDateTime(report.openedAt)}</time>
        </div>
        <span className={styles.timelineLine} aria-hidden="true" />
        <div className={styles.timePoint}>
          <span className={styles.timeLabel}>
            <CheckCircle2 size={13} aria-hidden="true" />
            {t("cashbox.zReports.columns.closedAt")}
          </span>
          <time>{formatDateTime(report.closedAt)}</time>
        </div>
        <div className={styles.duration}>
          <span>{t("cashbox.zReports.details.duration")}</span>
          <strong>{formatDuration(report, t)}</strong>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        <div className={`${styles.metric} ${styles.intakeMetric}`}>
          <span>
            <ClipboardList size={13} aria-hidden="true" />
            {t("cashbox.zReports.columns.intakeCount")}
          </span>
          <strong>{report.intakeCount.toLocaleString()}</strong>
        </div>
        <div className={`${styles.metric} ${styles.purchaseMetric}`}>
          <span>
            <ShoppingCart size={13} aria-hidden="true" />
            {t("cashbox.zReports.columns.totalPurchases")}
          </span>
          <strong>{formatAmd(report.totalPurchasesAmd)}</strong>
        </div>
        <div className={`${styles.metric} ${styles.cashInMetric}`}>
          <span>
            <Banknote size={13} aria-hidden="true" />
            <ArrowDownLeft size={13} aria-hidden="true" />
            {t("cashbox.zReports.columns.cashIn")}
          </span>
          <strong>
            {report.totalCashInAmd > 0 ? "+" : ""}
            {formatAmd(report.totalCashInAmd)}
          </strong>
        </div>
        <div className={`${styles.metric} ${styles.cashOutMetric}`}>
          <span>
            <Banknote size={13} aria-hidden="true" />
            <ArrowUpRight size={13} aria-hidden="true" />
            {t("cashbox.zReports.columns.cashOut")}
          </span>
          <strong>
            {report.totalCashOutAmd > 0 ? "-" : ""}
            {formatAmd(report.totalCashOutAmd)}
          </strong>
        </div>
        <div className={`${styles.metric} ${styles.nonCashInMetric}`}>
          <span className={styles.nonCashMetricLabel}>
            <Landmark size={13} aria-hidden="true" />
            <ArrowDownLeft size={13} aria-hidden="true" />
            {t("cashbox.zReports.columns.nonCashIn")}
          </span>
          <strong>
            {totalNonCashIn > 0 ? "+" : ""}
            {formatAmd(totalNonCashIn)}
          </strong>
        </div>
        <div className={`${styles.metric} ${styles.nonCashOutMetric}`}>
          <span className={styles.nonCashMetricLabel}>
            <Landmark size={13} aria-hidden="true" />
            <ArrowUpRight size={13} aria-hidden="true" />
            {t("cashbox.zReports.columns.nonCashOut")}
          </span>
          <strong>
            {totalNonCashOut > 0 ? "-" : ""}
            {formatAmd(totalNonCashOut)}
          </strong>
        </div>
        <div className={`${styles.metric} ${styles.differenceMetric}`}>
          <span>
            <Scale size={13} aria-hidden="true" />
            {t("cashbox.zReports.columns.difference")}
          </span>
          <strong className={differenceClass}>
            {formatAmd(report.diffPurchasesVsCashOutAmd)}
          </strong>
        </div>
      </div>

      <div className={styles.cashOutBreakdown}>
        <span>{t("cashbox.zReports.details.catalystCashOut")}</span>
        <strong>{formatAmd(report.catalystCashOutAmd)}</strong>
        <span>{t("cashbox.zReports.details.ironCashOut")}</span>
        <strong>{formatAmd(report.ironCashOutAmd)}</strong>
      </div>
    </article>
  );
};
