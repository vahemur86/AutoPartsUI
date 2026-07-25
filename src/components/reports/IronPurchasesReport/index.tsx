import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { DataTable, IconButton, Select } from "@/ui-kit";
import { FilterIronPurchasesReportDropdown } from "./FilterIronPurchasesReportDropdown";
import { getIronPurchasesReportColumns } from "./columns";
import { getApiErrorMessage, getCashRegisterId } from "@/utils";
import { getIronPurchasesReport } from "@/services/ironCarShop";
import type {
  GetIronPurchasesReportParams,
  IronPurchasesReportItem,
  IronPurchasesReportResponse,
} from "@/types/ironCarShop";

import { Filter } from "lucide-react";
import styles from "./IronPurchasesReport.module.css";

const DEFAULT_PAGE_SIZE = 20;

export const IronPurchasesReport = () => {
  const { t } = useTranslation();
  const filterAnchorRef = useRef<HTMLDivElement>(null);
  const cashRegisterId = useMemo(() => getCashRegisterId(), []);

  const [items, setItems] = useState<IronPurchasesReportItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Partial<
    Omit<GetIronPurchasesReportParams, "page" | "pageSize">
  >>({
    from: undefined,
    to: undefined,
    dictBrandId: undefined,
    ironTypeId: undefined,
    operatorUserId: undefined,
    sessionId: undefined,
    customerPhone: undefined,
  });

  const fetchReport = useCallback(async () => {
    if (!cashRegisterId) {
      return;
    }

    setIsLoading(true);

    try {
      const response: IronPurchasesReportResponse = await getIronPurchasesReport(
        {
          from: activeFilters.from,
          to: activeFilters.to,
          dictBrandId: activeFilters.dictBrandId,
          ironTypeId: activeFilters.ironTypeId,
          operatorUserId: activeFilters.operatorUserId,
          sessionId: activeFilters.sessionId,
          customerPhone: activeFilters.customerPhone,
          page: currentPage + 1,
          pageSize,
        },
        cashRegisterId,
      );

      setItems(response.items || []);
      setTotalItems(response.totalItems ?? response.items?.length ?? 0);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("reports.errors.failedToFetch")));
    } finally {
      setIsLoading(false);
    }
  }, [activeFilters, cashRegisterId, currentPage, pageSize, t]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  const handleApplyFilters = (filters: {
    from: string | null;
    to: string | null;
    dictBrandId: number | null;
    ironTypeId: number | null;
    operatorUserId: number | null;
    sessionId: number | null;
    customerPhone: string | null;
  }) => {
    setActiveFilters({
      from: filters.from || undefined,
      to: filters.to || undefined,
      dictBrandId: filters.dictBrandId || undefined,
      ironTypeId: filters.ironTypeId || undefined,
      operatorUserId: filters.operatorUserId || undefined,
      sessionId: filters.sessionId || undefined,
      customerPhone: filters.customerPhone || undefined,
    });
    setCurrentPage(0);
    setIsFilterOpen(false);
  };

  const columns = useMemo(() => getIronPurchasesReportColumns(), []);
  const pageCount = useMemo(
    () => Math.max(Math.ceil(totalItems / pageSize), 1),
    [pageSize, totalItems],
  );

  return (
    <div className={styles.reportWrapper}>
      <header className={styles.header}>
        <h1>{t("reports.navigation.ironPurchases")}</h1>
        <div className={styles.headerActions}>
          <div className={styles.pageSizeWrapper}>
            <span className={styles.pageSizeLabel}>
              {t("reports.ironPurchases.filters.pageSize")}
            </span>
            <Select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(0);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </Select>
          </div>

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

      <FilterIronPurchasesReportDropdown
        open={isFilterOpen}
        anchorRef={filterAnchorRef}
        onOpenChange={setIsFilterOpen}
        onSave={handleApplyFilters}
      />

      <div className={styles.tableContainer}>
        <DataTable
          columns={columns}
          data={items}
          pageSize={pageSize}
          manualPagination
          pageCount={pageCount}
          pageIndex={currentPage}
          onPaginationChange={setCurrentPage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
