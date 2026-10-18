import { type FC, useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useMinimumLoadingDuration } from "@/hooks/useMinimumLoadingDuration";

// ui-kit
import { DataTable } from "@/ui-kit";

// icons
import { Filter, BarChart3, FlaskRound } from "lucide-react";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchPowderBatches,
  clearPowderBatchSelection,
  fetchPowderBatchesSummary,
  fetchPowderBatchesSummaryByDate,
} from "@/store/slices/cash/dashboardSlice";

// columns
import { getPowderBatchColumns } from "./columns";

// components
import { FilterPowderBatchesDropdown } from "./FilterPowderBatchesDropdown";
import { PowderBatchesSummaryDropdown } from "./PowderBatchesSummaryDropdown";

// utils
import { getApiErrorMessage, checkIsToday } from "@/utils";

// types
import type { GetPowderBatchesParams } from "@/types/cash";

// styles
import styles from "./PowderBatches.module.css";

const PAGE_SIZE = 10;

export const PowderBatches: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { powderBatches, powderBatchesSummary, isLoading } = useAppSelector(
    (state) => state.cashDashboard,
  );

  const [currentPage, setCurrentPage] = useState(0);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isSummaryDropdownOpen, setIsSummaryDropdownOpen] = useState(false);
  const [isSummaryDelayLoading, setIsSummaryDelayLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<
    Partial<GetPowderBatchesParams>
  >({});
  const filterAnchorRef = useRef<HTMLButtonElement>(null);
  const summaryAnchorRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isSummaryDropdownOpen) {
      setIsSummaryDelayLoading(false);
      return;
    }

    setIsSummaryDelayLoading(true);
    const timeoutId = window.setTimeout(
      () => setIsSummaryDelayLoading(false),
      5000,
    );

    return () => window.clearTimeout(timeoutId);
  }, [isSummaryDropdownOpen]);

  useEffect(() => {
    dispatch(
      fetchPowderBatches({
        fromDate: activeFilters.fromDate,
        toDate: activeFilters.toDate,
        page: currentPage + 1,
        pageSize: PAGE_SIZE,
      }),
    )
      .unwrap()
      .catch((error) => {
        toast.error(
          getApiErrorMessage(
            error,
            t("cashbox.errors.failedToFetchPowderBatches"),
          ),
        );
      });

    return () => {
      dispatch(clearPowderBatchSelection());
    };
  }, [dispatch, t, activeFilters, currentPage]);

  const handleToggleSummary = () => {
    const nextOpen = !isSummaryDropdownOpen;
    setIsSummaryDropdownOpen(nextOpen);

    if (nextOpen) {
      dispatch(fetchPowderBatchesSummary())
        .unwrap()
        .catch((error) => {
          toast.error(
            getApiErrorMessage(
              error,
              t("cashbox.errors.failedToFetchPowderBatchesSummary"),
            ),
          );
        });
    }
  };

  const handleFetchSummaryByDate = useCallback(
    (dateFrom: string, dateTo: string) => {
      dispatch(
        fetchPowderBatchesSummaryByDate({
          dateFrom,
          dateTo,
        }),
      )
        .unwrap()
        .catch((error) => {
          toast.error(
            getApiErrorMessage(
              error,
              t("cashbox.errors.failedToFetchPowderBatchesSummary"),
            ),
          );
        });
    },
    [dispatch, t],
  );

  const handleFetchDefaultSummary = useCallback(() => {
    dispatch(fetchPowderBatchesSummary())
      .unwrap()
      .catch((error) => {
        toast.error(
          getApiErrorMessage(
            error,
            t("cashbox.errors.failedToFetchPowderBatchesSummary"),
          ),
        );
      });
  }, [dispatch, t]);

  const handleApplyFilters = (filters: Partial<GetPowderBatchesParams>) => {
    setActiveFilters(filters);
    setCurrentPage(0);
    setIsFilterDropdownOpen(false);
  };

  const columns = useMemo(() => getPowderBatchColumns(), []);

  const tableData = powderBatches?.results || [];
  const showTableSkeleton = useMinimumLoadingDuration(
    isLoading && tableData.length === 0,
  );

  const totalPages = useMemo(
    () => Math.ceil((powderBatches?.totalItems || 0) / PAGE_SIZE),
    [powderBatches?.totalItems],
  );
  const activeFilterCount = Object.values(activeFilters).filter(
    (value) => value != null && value !== "",
  ).length;

  return (
    <div className={styles.powderBatchesWrapper}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.titleIcon} aria-hidden="true">
            <FlaskRound size={19} />
          </span>
          <div>
            <span className={styles.eyebrow}>{t("reports.navigationGroups.inventory")}</span>
            <h1>{t("cashbox.powderBatches.title")}</h1>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            ref={summaryAnchorRef}
            className={`${styles.actionButton} ${styles.summaryAction} ${isSummaryDropdownOpen ? styles.actionButtonActive : ""}`}
            onClick={handleToggleSummary}
            title={t("cashbox.powderBatches.summary.tooltip")}
            aria-expanded={isSummaryDropdownOpen}
          >
            <BarChart3 size={16} aria-hidden="true" />
            <span className={styles.summaryButtonText}>
              {t("cashbox.powderBatches.summary.button")}
            </span>
          </button>

          <button
            type="button"
            ref={filterAnchorRef}
            className={`${styles.actionButton} ${activeFilterCount ? styles.actionButtonActive : ""}`}
            onClick={() => setIsFilterDropdownOpen(true)}
            aria-expanded={isFilterDropdownOpen}
          >
            <Filter size={16} aria-hidden="true" />
            <span className={styles.filterButtonText}>
              {t("common.filters")}
            </span>
            {activeFilterCount > 0 && (
              <span className={styles.filterCount} aria-hidden="true">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <PowderBatchesSummaryDropdown
        open={isSummaryDropdownOpen}
        anchorRef={summaryAnchorRef}
        onOpenChange={setIsSummaryDropdownOpen}
        summary={powderBatchesSummary}
        isLoading={isLoading || isSummaryDelayLoading}
        onFetchSummaryByDate={handleFetchSummaryByDate}
        onFetchDefaultSummary={handleFetchDefaultSummary}
      />

      <FilterPowderBatchesDropdown
        open={isFilterDropdownOpen}
        anchorRef={filterAnchorRef}
        onOpenChange={setIsFilterDropdownOpen}
        onSave={handleApplyFilters}
      />

      <div className={styles.tableContainer}>
        {showTableSkeleton && tableData.length === 0 ? (
          <div className={styles.tableSkeleton} aria-busy="true" aria-live="polite">
            <div className={styles.tableSkeletonHeader}>
              <div className={`${styles.skeletonLine} ${styles.skeletonLineWide}`} />
              <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
            </div>
            <div className={styles.tableSkeletonRows}>
              {Array.from({ length: 6 }).map((_, index) => (
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
            columns={columns}
            data={tableData}
            pageSize={PAGE_SIZE}
            manualPagination
            pageCount={totalPages}
            pageIndex={currentPage}
            getRowClassName={(row) =>
              [
                checkIsToday(row.createdAt) ? styles.todayRow : "",
                row.hasPreventMergeItems ? styles.specialRow : "",
              ]
                .filter(Boolean)
                .join(" ")
            }
            onPaginationChange={(pageIndex) => {
              setCurrentPage(pageIndex);
            }}
          />
        )}
      </div>
    </div>
  );
};
