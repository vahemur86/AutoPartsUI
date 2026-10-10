import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useMinimumLoadingDuration } from "@/hooks/useMinimumLoadingDuration";

// ui-kit
import { DataTable, IconButton } from "@/ui-kit";

// columns

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";

// utils
import { getCashRegisterId } from "@/utils";

// styles
import styles from "./AdjustedSales.module.css";
import { fetchPowderSalesAdjustments } from "@/store/slices/warehouses/powderSalesSlice";
import { getAdjustmentsColumns } from "./column";
import { FilterAdjustedSalesDropdown } from "./FilterAdjustedSales";
import { Filter } from "lucide-react";
import { AdjustmentDetails } from "./AdjustmentDetails";

const PAGE_SIZE = 30;

export const AdjustedSales = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { adjustmentData, isLoading, error } = useAppSelector(
    (state) => state.powderSales,
  );
  const showTableSkeleton = useMinimumLoadingDuration(isLoading);

  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const cashRegisterId = useMemo(() => getCashRegisterId(), []);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<{
    fromUtc: string | null;
    toUtc: string | null;
  }>({
    fromUtc: null,
    toUtc: null,
  });

  useEffect(() => {
    dispatch(
      fetchPowderSalesAdjustments({
        cashRegisterId,
        page: currentPageIndex + 1,
        pageSize: PAGE_SIZE,
        fromUtc: filters.fromUtc ?? undefined,
        toUtc: filters.toUtc ?? undefined,
      }),
    );
  }, [dispatch, cashRegisterId, currentPageIndex, filters]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const columns = useMemo(() => getAdjustmentsColumns(), []);

  const pageCount = Math.ceil((adjustmentData?.totalItems || 0) / PAGE_SIZE);

  const filterRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className={styles.batchesToSaleWrapper}>
      <div className={styles.header}>
        <div className={styles.headerActions}>
          <div
            ref={filterRef}
            className={styles.filterButtonWrapper}
          >
            <IconButton
              size="small"
              variant="primary"
              className={styles.filterIcon}
              icon={<Filter size={14} aria-hidden="true" />}
              ariaLabel={t("common.filters")}
              onClick={() => setIsFilterOpen(true)}
            />
            <span className={styles.filterButtonText}>
              {t("common.filters")}
            </span>
          </div>
        </div>
      </div>

      <FilterAdjustedSalesDropdown
        open={isFilterOpen}
        anchorRef={filterRef}
        onOpenChange={setIsFilterOpen}
        onSave={(values: { fromUtc: string | null; toUtc: string | null }) => {
          setFilters(values);
          setCurrentPageIndex(0);
        }}
      />

      <div className={styles.tableSection}>
        {showTableSkeleton ? (
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
        ) : !adjustmentData?.results?.length ? (
          <div className={styles.emptyState}>{t("common.noData")}</div>
        ) : (
          <DataTable
            data={adjustmentData.results}
            columns={columns}
            pageSize={PAGE_SIZE}
            manualPagination
            pageCount={pageCount}
            pageIndex={currentPageIndex}
            getRowClassName={(row) =>
              row.hasSpecialCustomerLots ? styles.specialRow : ""
            }
            onPaginationChange={setCurrentPageIndex}
            renderSubComponent={({ row }) => (
              <AdjustmentDetails adjustment={row.original} />
            )}
          />
        )}
      </div>
    </div>
  );
};
