import { type FC, useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { DataTable, IconButton } from "@/ui-kit";

// icons
import { Filter } from "lucide-react";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPowderSales } from "@/store/slices/warehouses/powderSalesSlice";

// components
import { FilterSoldBatchesDropdown } from "./FilterSoldBatchesDropdown";

// columns & utils
import { getSoldBatchesColumns } from "./columns";
import { getApiErrorMessage } from "@/utils";
import { checkIsToday } from "@/utils/checkIsToday.utils";

// styles
import styles from "./SoldBatches.module.css";

const PAGE_SIZE = 50;

export const SoldBatches: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { data, error } = useAppSelector((state) => state.powderSales);

  const [currentPage, setCurrentPage] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
    fromUtc: string | null;
    toUtc: string | null;
  }>({
    fromUtc: null,
    toUtc: null,
  });
  const filterAnchorRef = useRef<HTMLDivElement>(null);

  const cashRegisterId = useMemo(() => {
    try {
      const rawData = localStorage.getItem("user_data");
      const userData = rawData ? JSON.parse(rawData) : {};
      return userData.cashRegisterId ? Number(userData.cashRegisterId) : 1;
    } catch {
      return 1;
    }
  }, []);

  useEffect(() => {
    dispatch(
      fetchPowderSales({
        cashRegisterId,
        fromUtc: activeFilters.fromUtc || undefined,
        toUtc: activeFilters.toUtc || undefined,
        page: currentPage + 1,
        pageSize: PAGE_SIZE,
      }),
    )
      .unwrap()
      .catch((error) => {
        toast.error(
          getApiErrorMessage(
            error,
            t("warehouses.soldBatches.errors.failedToFetch"),
          ),
        );
      });
  }, [dispatch, activeFilters, currentPage, cashRegisterId, t]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleApplyFilters = (filters: {
    fromUtc: string | null;
    toUtc: string | null;
  }) => {
    setActiveFilters(filters);
    setCurrentPage(0);
    setIsFilterOpen(false);
  };

  const columns = useMemo(() => getSoldBatchesColumns(), []);
  const totalPages = Math.ceil((data?.totalItems || 0) / PAGE_SIZE);

  return (
    <div className={styles.soldBatchesWrapper}>
      <header className={styles.header}>
        <h1>{t("warehouses.soldBatches.title")}</h1>
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

      <FilterSoldBatchesDropdown
        open={isFilterOpen}
        anchorRef={filterAnchorRef}
        onOpenChange={setIsFilterOpen}
        onSave={handleApplyFilters}
      />

      <div className={styles.tableContainer}>
        <DataTable
          columns={columns}
          data={data?.results || []}
          pageSize={PAGE_SIZE}
          manualPagination
          pageCount={totalPages}
          pageIndex={currentPage}
          getRowClassName={(row) =>
            checkIsToday(row.createdAt) ? styles.todayRow : ""
          }
          onPaginationChange={setCurrentPage}
        />
      </div>
    </div>
  );
};
