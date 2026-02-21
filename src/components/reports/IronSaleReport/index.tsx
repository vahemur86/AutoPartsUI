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
  fetchIronSales,
  resetIronSaleReportsState,
} from "@/store/slices/ironSaleReportsSlice";

// components
import { FilterIronSalesDropdown } from "./FilterIronSalesDropdown";

// columns & utils
import { getIronSaleColumns } from "./columns";
import { getApiErrorMessage, getCashRegisterId } from "@/utils";
import { checkIsToday } from "@/utils/checkIsToday.utils";

// styles
import styles from "./IronSaleReport.module.css";

export const IronSaleReport: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { sales, isLoading } = useAppSelector((state) => state.ironSaleReports);

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [activeFilters, setActiveFilters] = useState<{
    customerId: number | null;
  }>({
    customerId: null,
  });

  const filterAnchorRef = useRef<HTMLDivElement>(null);

  const cashRegisterId = useMemo(() => getCashRegisterId(), []);

  useEffect(() => {
    dispatch(
      fetchIronSales({
        cashRegisterId,
        params: {
          customerId: activeFilters.customerId || undefined,
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
  }, [dispatch, t, activeFilters, cashRegisterId]);

  const handleApplyFilters = (filters: typeof activeFilters) => {
    setActiveFilters(filters);
    setIsFilterOpen(false);
  };

  const columns = useMemo(() => getIronSaleColumns(), []);

  return (
    <div className={styles.reportWrapper}>
      <header className={styles.header}>
        <h1>{t("reports.navigation.ironSale")}</h1>
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

      <FilterIronSalesDropdown
        open={isFilterOpen}
        anchorRef={filterAnchorRef}
        onOpenChange={setIsFilterOpen}
        onSave={handleApplyFilters}
      />

      <div className={styles.tableContainer}>
        {isLoading ? (
          <div className={styles.loading}>
            {t("reports.ironSale.loading")}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={sales || []}
            pageSize={sales.length || 10}
            getRowClassName={(row) =>
              checkIsToday(row.purchasedAt) ? styles.todayRow : ""
            }
          />
        )}
      </div>
    </div>
  );
};

