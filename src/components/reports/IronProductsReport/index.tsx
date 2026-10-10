import { type FC, useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useMinimumLoadingDuration } from "@/hooks/useMinimumLoadingDuration";

// icons
import { Boxes, Filter, PackageSearch } from "lucide-react";

// ui-kit
import { DataTable } from "@/ui-kit";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchIronPurchases,
  resetAdminProductsState,
} from "@/store/slices/adminProductsSlice";

// components
import { FilterIronPurchasesDropdown } from "./FilterIronPurchasesDropdown";

// columns & utils
import { getIronPurchaseColumns } from "./columns";
import { getApiErrorMessage } from "@/utils";
import { checkIsToday } from "@/utils/checkIsToday.utils";

// styles
import styles from "./IronProductsReport.module.css";

const PAGE_SIZE = 10;

export const IronProductsReport: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { purchases, isLoading } = useAppSelector(
    (state) => state.adminProducts,
  );
  const showTableSkeleton = useMinimumLoadingDuration(
    isLoading && !purchases?.results?.length,
  );

  const [currentPage, setCurrentPage] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [activeFilters, setActiveFilters] = useState<{
    fromDate: string | null;
    toDate: string | null;
    productId: number | null;
    operatorUserId: number | null;
    cashRegisterId: number | null;
  }>({
    fromDate: null,
    toDate: null,
    productId: null,
    operatorUserId: null,
    cashRegisterId: null,
  });

  const filterAnchorRef = useRef<HTMLButtonElement>(null);

  const cashRegisterId = useMemo(() => {
    const data = JSON.parse(localStorage.getItem("user_data") ?? "{}");
    return data?.cashRegisterId as number | undefined;
  }, []);

  useEffect(() => {
    dispatch(
      fetchIronPurchases({
        cashRegisterId,
        params: {
          Page: currentPage + 1,
          PageSize: PAGE_SIZE,
          FromUtc: activeFilters.fromDate || undefined,
          ToUtc: activeFilters.toDate || undefined,
          ProductId: activeFilters.productId || undefined,
          OperatorUserId: activeFilters.operatorUserId || undefined,
          CashRegisterId: activeFilters.cashRegisterId || undefined,
        },
      }),
    )
      .unwrap()
      .catch((error) => {
        toast.error(
          getApiErrorMessage(error, t("reports.errors.failedToFetch")),
        );
      });

    return () => {
      // Consistency check: reset the reports state on unmount
      dispatch(resetAdminProductsState());
    };
  }, [dispatch, t, activeFilters, currentPage, cashRegisterId]);

  const handleApplyFilters = (filters: typeof activeFilters) => {
    setActiveFilters(filters);
    setCurrentPage(0);
    setIsFilterOpen(false);
  };

  const columns = useMemo(() => getIronPurchaseColumns(), []);

  const totalPages = useMemo(() => {
    const count = purchases?.totalItems || 0;
    return Math.max(Math.ceil(count / PAGE_SIZE), 1);
  }, [purchases?.totalItems]);
  const activeFilterCount = Object.values(activeFilters).filter(
    (value) => value != null && value !== "",
  ).length;
  const rows = purchases?.results || [];

  return (
    <div className={styles.reportWrapper}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.titleIcon} aria-hidden="true"><Boxes size={19} /></span>
          <div>
            <span className={styles.eyebrow}>{t("reports.navigationGroups.iron")}</span>
            <h1>{t("reports.navigation.ironProducts")}</h1>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            ref={filterAnchorRef}
            className={`${styles.filterButton} ${activeFilterCount ? styles.filterButtonActive : ""}`}
            onClick={() => setIsFilterOpen(true)}
            aria-expanded={isFilterOpen}
          >
            <Filter size={15} aria-hidden="true" />
            <span className={styles.filterButtonText}>
              {t("common.filters")}
            </span>
            {activeFilterCount > 0 && <span className={styles.filterCount}>{activeFilterCount}</span>}
          </button>
        </div>
      </header>

      <FilterIronPurchasesDropdown
        open={isFilterOpen}
        anchorRef={filterAnchorRef}
        onOpenChange={setIsFilterOpen}
        onSave={handleApplyFilters}
      />

      <div className={styles.tableToolbar}>
        <div className={styles.tableTitle}>
          <PackageSearch size={15} aria-hidden="true" />
          <span>{t("reports.navigation.ironProducts")}</span>
          <span className={styles.rowCount}>{purchases?.totalItems ?? 0}</span>
        </div>
      </div>

      <div className={styles.tableContainer}>
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
        ) : (
          <DataTable
            manualPagination
            columns={columns}
            data={rows}
            pageSize={PAGE_SIZE}
            pageCount={totalPages}
            pageIndex={currentPage}
            isLoading={isLoading}
            getRowClassName={(row) =>
              checkIsToday(row.purchasedAt) ? styles.todayRow : ""
            }
            onPaginationChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
};
