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
  fetchPowderBatches,
  clearPowderBatchSelection,
} from "@/store/slices/cash/dashboardSlice";

// columns
import { getPowderBatchColumns } from "./columns";

// components
import { FilterPowderBatchesDropdown } from "./FilterPowderBatchesDropdown";

// utils
import { getApiErrorMessage } from "@/utils";
import { checkIsToday } from "@/utils/checkIsToday.utils";

// types
import type { GetPowderBatchesParams } from "@/types/cash";

// styles
import styles from "./PowderBatches.module.css";

const PAGE_SIZE = 10;

export const PowderBatches: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { powderBatches } = useAppSelector((state) => state.cashDashboard);

  const [currentPage, setCurrentPage] = useState(0);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<
    Partial<GetPowderBatchesParams>
  >({});
  const filterAnchorRef = useRef<HTMLDivElement>(null);

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
