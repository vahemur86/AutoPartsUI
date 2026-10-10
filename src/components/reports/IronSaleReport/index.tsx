import { type FC, useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { DataTable } from "@/ui-kit";

// icons
import { Boxes, Filter, PackageSearch } from "lucide-react";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchIronSales,
  resetIronSaleReportsState,
} from "@/store/slices/ironSaleReportsSlice";

// components
import { FilterIronPurchasesDropdown } from "../IronProductsReport/FilterIronPurchasesDropdown";

// columns & utils
import { getIronSaleColumns } from "./columns";
import { getApiErrorMessage, getCashRegisterId } from "@/utils";
import { checkIsToday } from "@/utils/checkIsToday.utils";

// styles
import styles from "../IronProductsReport/IronProductsReport.module.css";

const PAGE_SIZE = 20;

export const IronSaleReport: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { sales, isLoading } = useAppSelector((state) => state.ironSaleReports);

  const [currentPage, setCurrentPage] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    fromDate: null as string | null,
    toDate: null as string | null,
    productId: null as number | null,
    operatorUserId: null as number | null,
    cashRegisterId: null as number | null,
  });

  const filterAnchorRef = useRef<HTMLButtonElement>(null);
  const cashRegisterId = useMemo(() => getCashRegisterId(), []);

  useEffect(() => {
    dispatch(
      fetchIronSales({
        cashRegisterId,
        params: {
          FromUtc: activeFilters.fromDate || undefined,
          ToUtc: activeFilters.toDate || undefined,
          ProductId: activeFilters.productId || undefined,
          OperatorUserId: activeFilters.operatorUserId || undefined,
          CashRegisterId: activeFilters.cashRegisterId || undefined,
          Page: currentPage + 1,
          PageSize: PAGE_SIZE,
          lang: localStorage.getItem("i18nextLng") || "en",
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
      dispatch(resetIronSaleReportsState());
    };
  }, [dispatch, t, activeFilters, cashRegisterId, currentPage]);

  const handleApplyFilters = (filters: {
    fromDate: string | null;
    toDate: string | null;
    productId: number | null;
    operatorUserId: number | null;
    cashRegisterId: number | null;
  }) => {
    setActiveFilters(filters);
    setCurrentPage(0);
    setIsFilterOpen(false);
  };

  const columns = useMemo(() => getIronSaleColumns(), []);

  const totalPages = useMemo(
    () => Math.max(Math.ceil((sales?.totalItems || 0) / PAGE_SIZE), 1),
    [sales?.totalItems],
  );
  const rows = sales?.results ?? [];
  const activeFilterCount = Object.values(activeFilters).filter(
    (value) => value != null && value !== "",
  ).length;

  return (
    <div className={styles.reportWrapper}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.titleIcon} aria-hidden="true"><Boxes size={19} /></span>
          <div>
            <span className={styles.eyebrow}>{t("reports.navigationGroups.iron")}</span>
            <h1>{t("reports.navigation.ironSale")}</h1>
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
          <span>{t("reports.navigation.ironSale")}</span>
          <span className={styles.rowCount}>{sales?.totalItems ?? 0}</span>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <DataTable
          columns={columns}
          data={rows}
          pageSize={PAGE_SIZE}
          manualPagination
          pageCount={totalPages}
          pageIndex={currentPage}
          isLoading={isLoading}
          loadingText={t("common.loading")}
          getRowClassName={(row) =>
            checkIsToday(row.purchasedAt) ? styles.todayRow : ""
          }
          onPaginationChange={setCurrentPage}
        />
      </div>
    </div>
  );
};
