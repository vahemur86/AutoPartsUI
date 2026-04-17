import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

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

const PAGE_SIZE = 30;

export const AdjustedSales = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { adjustmentData, isLoading, error } = useAppSelector(
    (state) => state.powderSales,
  );

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
        <h2 className={styles.title}>{t("powderSales.adjustments.title")}</h2>

        <div className={styles.headerActions}>
          <div
            ref={filterRef}
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
        {isLoading ? (
          <div className={styles.loading}>{t("common.loading")}</div>
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
            onPaginationChange={setCurrentPageIndex}
          />
        )}
      </div>
    </div>
  );
};
