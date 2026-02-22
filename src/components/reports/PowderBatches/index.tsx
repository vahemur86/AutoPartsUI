import { type FC, useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { DataTable, IconButton } from "@/ui-kit";

// icons
import { Filter, BarChart3 } from "lucide-react";

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
import { getApiErrorMessage, getCashRegisterId, checkIsToday } from "@/utils";

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
  const [activeFilters, setActiveFilters] = useState<
    Partial<GetPowderBatchesParams>
  >({});
  const filterAnchorRef = useRef<HTMLDivElement>(null);
  const summaryAnchorRef = useRef<HTMLDivElement>(null);

  const cashRegisterId = useMemo(() => getCashRegisterId(), []);

  useEffect(() => {
    dispatch(
      fetchPowderBatches({
        cashRegisterId: activeFilters.cashRegisterId || 1,
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
          cashRegisterId,
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
    [dispatch, cashRegisterId, t],
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

  const totalPages = useMemo(
    () => Math.ceil((powderBatches?.totalItems || 0) / PAGE_SIZE),
    [powderBatches?.totalItems],
  );

  return (
    <div className={styles.powderBatchesWrapper}>
      <header className={styles.header}>
        <h1>{t("cashbox.powderBatches.title")}</h1>
        <div className={styles.headerActions}>
          <div
            ref={summaryAnchorRef}
            className={styles.summaryButtonWrapper}
            onClick={handleToggleSummary}
            style={{ cursor: "pointer" }}
            title={t("cashbox.powderBatches.summary.tooltip")}
          >
            <IconButton
              size="small"
              variant="secondary"
              icon={<BarChart3 size={12} color="#e5e7eb" />}
              ariaLabel={t("cashbox.powderBatches.summary.button")}
            />
            <span className={styles.summaryButtonText}>
              {t("cashbox.powderBatches.summary.button")}
            </span>
          </div>

          <div
            ref={filterAnchorRef}
            className={styles.filterButtonWrapper}
            onClick={() => setIsFilterDropdownOpen(true)}
            style={{ cursor: "pointer" }}
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

      <PowderBatchesSummaryDropdown
        open={isSummaryDropdownOpen}
        anchorRef={summaryAnchorRef}
        onOpenChange={setIsSummaryDropdownOpen}
        summary={powderBatchesSummary}
        isLoading={isLoading}
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
        <DataTable
          columns={columns}
          data={tableData}
          pageSize={PAGE_SIZE}
          manualPagination
          pageCount={totalPages}
          pageIndex={currentPage}
          getRowClassName={(row) =>
            checkIsToday(row.createdAt) ? styles.todayRow : ""
          }
          onPaginationChange={(pageIndex) => {
            setCurrentPage(pageIndex);
          }}
        />
      </div>
    </div>
  );
};
