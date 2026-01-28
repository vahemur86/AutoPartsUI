import { type FC, useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { DataTable, IconButton } from "@/ui-kit";

// icons
import { Filter } from "lucide-react";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchZReports,
  fetchZReport,
  clearSelection,
} from "@/store/slices/cash/cashboxSessionsSlice";

// components
import { FilterZReportsDropdown } from "./FilterZReportsDropdown";

// columns & utils
import { getZReportColumns } from "./columns";
import { getApiErrorMessage } from "@/utils";
import { checkIsToday } from "@/utils/checkIsToday.utils";

// styles
import styles from "./ZReports.module.css";

const PAGE_SIZE = 10;

const ZReportDetailView: FC<{ sessionId: number }> = ({ sessionId }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { selectedZReport, isLoading } = useAppSelector(
    (state) => state.cashboxSessions,
  );

  useEffect(() => {
    console.log({ selectedZReport });
    if (!isLoading && selectedZReport?.sessionId !== sessionId) {
      dispatch(fetchZReport({ sessionId }))
        .unwrap()
        .catch((error) => {
          toast.error(
            getApiErrorMessage(error, t("cashbox.errors.failedToFetchZReport")),
          );
        });
    }
  }, [sessionId, dispatch, t, selectedZReport?.sessionId, isLoading, selectedZReport]);

  const getDuration = (start: string, end: string) => {
    const durationMs = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (isLoading && selectedZReport?.sessionId !== sessionId) {
    return <div className={styles.detailLoading}>{t("common.loading")}</div>;
  }

  if (!selectedZReport || selectedZReport.sessionId !== sessionId) {
    return <div className={styles.detailError}>{t("common.noData")}</div>;
  }

  return (
    <div className={styles.detailContainer}>
      <div className={styles.detailSection}>
        <h4 className={styles.sectionTitle}>
          {t("cashbox.zReports.details.timeline")}
        </h4>
        <div className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <span>{t("cashbox.zReports.columns.openedAt")}</span>
            <strong>
              {new Date(selectedZReport.openedAt).toLocaleString()}
            </strong>
          </div>
          <div className={styles.detailItem}>
            <span>{t("cashbox.zReports.columns.closedAt")}</span>
            <strong>
              {new Date(selectedZReport.closedAt).toLocaleString()}
            </strong>
          </div>
          <div className={styles.detailItem}>
            <span>{t("cashbox.zReports.details.duration")}</span>
            <strong>
              {getDuration(selectedZReport.openedAt, selectedZReport.closedAt)}
            </strong>
          </div>
          <div className={styles.detailItem}>
            <span>{t("cashbox.zReports.details.operator")}</span>
            <strong>#{selectedZReport.operatorUserId}</strong>
          </div>
        </div>
      </div>

      <div className={styles.detailSection}>
        <h4 className={styles.sectionTitle}>
          {t("cashbox.zReports.details.financials")}
        </h4>
        <div className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <span>{t("cashbox.zReports.columns.totalPurchases")}</span>
            <strong>
              {selectedZReport.totalPurchasesAmd.toLocaleString()} AMD
            </strong>
          </div>
          <div className={styles.detailItem}>
            <span>{t("cashbox.zReports.columns.cashIn")}</span>
            <strong className={styles.positiveText}>
              +{selectedZReport.totalCashInAmd.toLocaleString()} AMD
            </strong>
          </div>
          <div className={styles.detailItem}>
            <span>{t("cashbox.zReports.columns.cashOut")}</span>
            <strong className={styles.negativeText}>
              -{selectedZReport.totalCashOutAmd.toLocaleString()} AMD
            </strong>
          </div>
          <div className={styles.detailItem}>
            <span>{t("cashbox.zReports.details.finalDiff")}</span>
            <strong
              className={
                selectedZReport.diffPurchasesVsCashOutAmd < 0
                  ? styles.negativeText
                  : styles.positiveText
              }
            >
              {selectedZReport.diffPurchasesVsCashOutAmd.toLocaleString()} AMD
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ZReports: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { zReports } = useAppSelector((state) => state.cashboxSessions);

  const [currentPage, setCurrentPage] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
    fromDate: string | null;
    toDate: string | null;
  }>({
    fromDate: null,
    toDate: null,
  });
  const filterAnchorRef = useRef<HTMLDivElement>(null);

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

    return () => {
      dispatch(clearSelection());
    };
  }, [dispatch, t, activeFilters, currentPage]);

  const handleApplyFilters = (filters: {
    fromDate: string | null;
    toDate: string | null;
  }) => {
    setActiveFilters(filters);
    setCurrentPage(0);
    setIsFilterOpen(false);
  };

  const columns = useMemo(() => getZReportColumns(), []);
  const totalPages = useMemo(
    () => Math.ceil((zReports?.totalItems || 0) / PAGE_SIZE),
    [zReports?.totalItems],
  );

  return (
    <div className={styles.zReportsWrapper}>
      <header className={styles.header}>
        <h1>{t("cashbox.zReports.title")}</h1>
        <div className={styles.headerActions}>
          <div
            ref={filterAnchorRef}
            className={styles.filterButtonWrapper}
            onClick={() => setIsFilterOpen(true)}
          >
            <IconButton
              size="small"
              variant="primary"
              icon={<Filter size={12} color="#0e0f11" />}
              ariaLabel={t("common.filters")}
            />
            <span className={styles.filterButtonText}>
              {t("common.filters")}
            </span>
          </div>
        </div>
      </header>

      <FilterZReportsDropdown
        open={isFilterOpen}
        anchorRef={filterAnchorRef}
        onOpenChange={setIsFilterOpen}
        onSave={handleApplyFilters}
      />

      <div className={styles.tableContainer}>
        <DataTable
          columns={columns}
          data={zReports?.results || []}
          pageSize={PAGE_SIZE}
          manualPagination
          pageCount={totalPages}
          pageIndex={currentPage}
          getRowClassName={(row) =>
            checkIsToday(row.openedAt) ? styles.todayRow : ""
          }
          onPaginationChange={setCurrentPage}
          renderSubComponent={({ row }) => (
            <ZReportDetailView sessionId={row.original.sessionId} />
          )}
        />
      </div>
    </div>
  );
};
