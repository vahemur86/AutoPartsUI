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

  const { purchases } = useAppSelector((state) => state.adminProducts);

  const [currentPage, setCurrentPage] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [activeFilters, setActiveFilters] = useState<{
    fromDate: string | null;
    toDate: string | null;
    productId: number | null;
  }>({
    fromDate: null,
    toDate: null,
    productId: null,
  });

  const filterAnchorRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className={styles.reportWrapper}>
      <header className={styles.header}>
        <h1>{t("reports.navigation.ironProducts")}</h1>
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

      <FilterIronPurchasesDropdown
        open={isFilterOpen}
        anchorRef={filterAnchorRef}
        onOpenChange={setIsFilterOpen}
        onSave={handleApplyFilters}
      />

      <div className={styles.tableContainer}>
        <DataTable
          manualPagination
          columns={columns}
          data={purchases?.results || []}
          pageSize={PAGE_SIZE}
          pageCount={totalPages}
          pageIndex={currentPage}
          getRowClassName={(row) =>
            checkIsToday(row.purchasedAt) ? styles.todayRow : ""
          }
          onPaginationChange={setCurrentPage}
        />
      </div>
    </div>
  );
};
