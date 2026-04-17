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
  fetchPowderSales,
  reconcilePowderSale,
} from "@/store/slices/warehouses/powderSalesSlice";

// components
import { FilterSoldBatchesDropdown } from "./FilterSoldBatchesDropdown";
import {
  SoldBatchesDropdown,
  type SoldBatchesForm,
} from "./soldBatchesActions/SoldBatchesDropdown";

// columns
import { getSoldBatchesColumns } from "./columns";

// utils
import { getApiErrorMessage, getCashRegisterId, checkIsToday } from "@/utils";

// styles
import styles from "./SoldBatches.module.css";
import type { PowderSale } from "@/types/warehouses/salesLots";

const PAGE_SIZE = 50;

export const SoldBatches: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { data, isLoading, error } = useAppSelector(
    (state) => state.powderSales,
  );

  const [currentPage, setCurrentPage] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
    fromUtc: string | null;
    toUtc: string | null;
  }>({
    fromUtc: null,
    toUtc: null,
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<PowderSale | null>(null);
  const [editAnchorEl, setEditAnchorEl] = useState<HTMLElement | null>(null);

  const filterAnchorRef = useRef<HTMLDivElement>(null);
  const cashRegisterId = useMemo(() => getCashRegisterId(), []);

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
      .catch((err) => {
        toast.error(
          getApiErrorMessage(
            err,
            t("warehouses.soldBatches.errors.failedToFetch"),
          ),
        );
      });
  }, [dispatch, activeFilters, currentPage, cashRegisterId, t]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleApplyFilters = (filters: {
    fromUtc: string | null;
    toUtc: string | null;
  }) => {
    setActiveFilters(filters);
    setCurrentPage(0);
    setIsFilterOpen(false);
  };

  const handleEdit = (row: PowderSale, e: React.MouseEvent<HTMLElement>) => {
    setEditingRow(row);
    setEditAnchorEl(e.currentTarget);
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (formData: SoldBatchesForm) => {
    if (!editingRow) return;

    try {
      await dispatch(
        reconcilePowderSale({
          id: editingRow.salesLotId,
          cashRegisterId,
          body: {
            finalAmount: formData.revenueTotal,
            reason: formData.comment,
          },
        }),
      ).unwrap();

      toast.success(t("warehouses.soldBatches.success.updated"));

      setIsEditOpen(false);
      setEditingRow(null);
      setEditAnchorEl(null);

      dispatch(
        fetchPowderSales({
          cashRegisterId,
          fromUtc: activeFilters.fromUtc || undefined,
          toUtc: activeFilters.toUtc || undefined,
          page: currentPage + 1,
          pageSize: PAGE_SIZE,
        }),
      );
    } catch (err) {
      toast.error(getApiErrorMessage(err, t("common.error")));
    }
  };

  const columns = useMemo(
    () =>
      getSoldBatchesColumns({
        onEdit: handleEdit,
      }),
    [],
  );

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
        {isLoading && !data ? (
          <div className={styles.loading}>
            {t("warehouses.soldBatches.loading")}
          </div>
        ) : data?.results.length === 0 ? (
          <div className={styles.emptyState}>
            {t("warehouses.soldBatches.emptyState")}
          </div>
        ) : (
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
        )}
      </div>

      <SoldBatchesDropdown
        open={isEditOpen}
        anchorRef={{ current: editAnchorEl } as any}
        initialData={
          editingRow
            ? {
                revenueTotal: editingRow.revenueTotal,
                revenueTotalAmd: editingRow.revenueTotalAmd,
                comment: "",
              }
            : null
        }
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setEditingRow(null);
            setEditAnchorEl(null);
          }
        }}
        onSave={handleSaveEdit}
        isLoading={isLoading}
      />
    </div>
  );
};
