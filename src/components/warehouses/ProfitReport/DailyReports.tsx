import { useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { DataTable, IconButton } from "@/ui-kit";

// icons
import { Filter } from "lucide-react";

// components
import { getDailyProfitColumns } from "./column";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchWarehouses } from "@/store/slices/warehousesSlice";
import { fetchDailyProfitReport } from "@/store/slices/warehouses/reportsSlice";

// utils
import { getCashRegisterId } from "@/utils";

// styles
import styles from "./DailyReports.module.css";
import { FilterDailyProfitDropdown } from "./FilterDailyProfitDropdown";

const PAGE_SIZE = 10;

export const DailyProfit = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { dailyProfitData, isLoading, error } = useAppSelector(
    (state) => state.warehousesReports,
  );
  const { warehouses } = useAppSelector((state) => state.warehouses);

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(
    null,
  );
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<{
    fromUtc: string | null;
    toUtc: string | null;
  }>({
    fromUtc: null,
    toUtc: null,
  });

  const filterRef = useRef<HTMLDivElement | null>(null);

  const cashRegisterId = useMemo(() => getCashRegisterId(), []);

  useEffect(() => {
    dispatch(fetchWarehouses());
  }, [dispatch]);

  useEffect(() => {
    if (warehouses.length > 0 && selectedWarehouseId === null) {
      setSelectedWarehouseId(warehouses[0].id);
    }
  }, [warehouses, selectedWarehouseId]);

  useEffect(() => {
    if (selectedWarehouseId) {
      dispatch(
        fetchDailyProfitReport({
          warehouseId: selectedWarehouseId,
          fromUtc: filters.fromUtc ?? undefined,
          toUtc: filters.toUtc ?? undefined,
          cashRegisterId,
        }),
      );
    }
  }, [
    selectedWarehouseId,
    cashRegisterId,
    currentPageIndex,
    filters,
    dispatch,
  ]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const columns = useMemo(() => getDailyProfitColumns(), []);

  const handlePaginationChange = (pageIndex: number) => {
    setCurrentPageIndex(pageIndex);
  };

  return (
    <div className={styles.batchesToSaleWrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {t("warehouse.navigation.dailyProfit")}
        </h2>

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

      <FilterDailyProfitDropdown
        open={isFilterOpen}
        anchorRef={filterRef}
        onOpenChange={setIsFilterOpen}
        onSave={(values: { fromUtc: string | null; toUtc: string | null }) => {
          setFilters(values);
          setCurrentPageIndex(0);
        }}
      />

      <div className={styles.tableSection}>
        {!selectedWarehouseId ? (
          <div className={styles.emptyState}>
            {t("warehouse.form.selectWarehouse")}
          </div>
        ) : isLoading ? (
          <div className={styles.loading}>{t("warehouse.form.loading")}</div>
        ) : !dailyProfitData || dailyProfitData.length === 0 ? (
          <div className={styles.emptyState}>
            {t("warehouse.form.emptyState")}
          </div>
        ) : (
          <DataTable
            data={dailyProfitData}
            columns={columns}
            pageSize={PAGE_SIZE}
            manualPagination={false}
            pageIndex={currentPageIndex}
            onPaginationChange={handlePaginationChange}
          />
        )}
      </div>
    </div>
  );
};
