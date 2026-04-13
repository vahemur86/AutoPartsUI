import { type FC, useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { DataTable, IconButton } from "@/ui-kit";

// icons
import { Filter, User, Phone } from "lucide-react";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchBatches,
  fetchBatchDetails,
  clearSelection,
} from "@/store/slices/cash/cashboxSessionsSlice";
import { fetchCustomerTypes } from "@/store/slices/customerTypesSlice";

// components
import {
  FilterBatchesDropdown,
  type BatchReportFilters,
} from "./FilterBatchesDropdown";

// columns & utils
import { getBatchReportColumns } from "./columns";
import { getApiErrorMessage } from "@/utils";
import { checkIsToday } from "@/utils/checkIsToday.utils";

// styles
import styles from "./BatchReports.module.css";

const PAGE_SIZE = 10;

interface BatchDetailViewProps {
  sessionId: number;
}

const BatchDetailView: FC<BatchDetailViewProps> = ({ sessionId }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { batchDetails, isLoading } = useAppSelector(
    (state) => state.cashboxSessions,
  );

  useEffect(() => {
    if (!isLoading && batchDetails?.sessionId !== sessionId) {
      dispatch(fetchBatchDetails({ sessionId }))
        .unwrap()
        .catch((error) => {
          toast.error(
            getApiErrorMessage(
              error,
              t("cashbox.errors.failedToFetchBatchDetails"),
            ),
          );
        });
    }
  }, [sessionId, dispatch, batchDetails?.sessionId, isLoading, t]);

  if (isLoading && batchDetails?.sessionId !== sessionId) {
    return <div className={styles.detailLoading}>{t("common.loading")}</div>;
  }

  if (!batchDetails || batchDetails.sessionId !== sessionId) {
    return <div className={styles.detailError}>{t("common.noData")}</div>;
  }

  return (
    <div className={styles.detailContainer}>
      <div className={styles.detailHeaderSection}>
        <div className={styles.infoGroup}>
          <h4 className={styles.sectionTitle}>
            {t("cashbox.batches.details.analysis")}
          </h4>
          <div className={styles.metaInfo}>
            <span>
              {t("cashbox.batches.columns.createdAt")}:{" "}
              <strong>
                {new Date(batchDetails.createdAt).toLocaleString()}
              </strong>
            </span>
            <span>
              Session ID: <strong>#{batchDetails.sessionId}</strong>
            </span>
            <span>
              {t("cashbox.batches.details.totalCost")}:{" "}
              <strong>{batchDetails.costTotalAmd.toLocaleString()} AMD</strong>
            </span>
          </div>
        </div>
        <div className={styles.totalsGrid}>
          <div className={styles.totalCard}>
            <span>{t("cashbox.batches.columns.weight")}</span>
            <strong>{batchDetails.totalPowderKg} kg</strong>
          </div>
          <div className={styles.totalCard}>
            <span>{t("cashbox.batches.details.pt")}</span>
            <strong>{batchDetails.ptTotal_g} g</strong>
            <small>{batchDetails.ptPerKg_g} g/kg</small>
          </div>
          <div className={styles.totalCard}>
            <span>{t("cashbox.batches.details.pd")}</span>
            <strong>{batchDetails.pdTotal_g} g</strong>
            <small>{batchDetails.pdPerKg_g} g/kg</small>
          </div>
          <div className={styles.totalCard}>
            <span>{t("cashbox.batches.details.rh")}</span>
            <strong>{batchDetails.rhTotal_g} g</strong>
            <small>{batchDetails.rhPerKg_g} g/kg</small>
          </div>
        </div>
      </div>

      <div className={styles.itemsSection}>
        <h5 className={styles.subTitle}>
          {t("cashbox.batches.details.individualIntakes")} (
          {batchDetails.items.length})
        </h5>
        <div className={styles.itemsGrid}>
          {batchDetails.items.map((item) => (
            <div key={item.id} className={styles.itemCard}>
              <div className={styles.itemCardHeader}>
                <div className={styles.intakeMain}>
                  <span>#{item.intakeId}</span>
                  <strong>{item.powderKg} kg</strong>
                </div>
                <div className={styles.supplierTag}>
                  <User size={10} />
                  <span>
                    {item.supplierClientName} ({item.supplierClientType})
                  </span>
                </div>
              </div>

              <div className={styles.itemCardContent}>
                <div className={styles.contactInfo}>
                  <div className={styles.infoRow}>
                    <Phone size={10} />
                    <span>{item.supplierClientPhone}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span>{t("cashbox.batches.details.percent")}:</span>
                    <strong>{item.supplierClientTypePercent * 100}%</strong>
                  </div>
                  <div className={styles.infoRow}>
                    <span>
                      {t("cashbox.batches.details.offerIncreaseStepOrder")}:
                    </span>
                    <strong>{item.offerIncreaseStepOrder}</strong>
                  </div>
                  <div className={styles.infoRow}>
                    <span>
                      {t("cashbox.batches.details.offerIncreasePercent")}:
                    </span>
                    <strong>{item.offerIncreasePercent}%</strong>
                  </div>
                </div>

                <div className={styles.metalConcentrationGrid}>
                  <div className={styles.metalItem}>
                    <span>Pt</span>
                    <strong>
                      {item.ptPerKg_g} <small>g/kg</small>
                    </strong>
                  </div>
                  <div className={styles.metalItem}>
                    <span>Pd</span>
                    <strong>
                      {item.pdPerKg_g} <small>g/kg</small>
                    </strong>
                  </div>
                  <div className={styles.metalItem}>
                    <span>Rh</span>
                    <strong>
                      {item.rhPerKg_g} <small>g/kg</small>
                    </strong>
                  </div>
                </div>

                <div className={styles.financialStats}>
                  <div className={styles.statLine}>
                    <span>{t("cashbox.batches.details.cost")}</span>
                    <strong>{item.costAmd.toLocaleString()} AMD</strong>
                  </div>
                  <div className={styles.statLine}>
                    <span>{t("cashbox.batches.details.sales")}</span>
                    <span>{item.estimatedSalesAmd.toLocaleString()} AMD</span>
                  </div>
                  <div className={styles.statLine}>
                    <span>
                      {t("cashbox.batches.details.estimatedSalesAmdAtPurchase")}
                    </span>
                    <strong>
                      {item.estimatedSalesAmdAtPurchase.toLocaleString()} AMD
                    </strong>
                  </div>
                  <div className={styles.statLine}>
                    <span>
                      {t("cashbox.batches.details.estimatedSalesDiffPercent")}
                    </span>
                    <strong>
                      {item.estimatedSalesDiffPercent.toLocaleString()}%
                    </strong>
                  </div>
                  <div className={`${styles.statLine} ${styles.profitLine}`}>
                    <span>{t("cashbox.batches.details.profit")}</span>
                    <strong>
                      {item.expectedProfitAmd.toLocaleString()} AMD
                    </strong>
                  </div>

                  <div className={styles.fxRate}>
                    Rate: {item.fxRateToAmd} AMD
                  </div>

                  {/* Metal Prices displayed under the Rate */}
                  <div className={styles.metalPricesFooter}>
                    <span>Pt: {item.ptPricePerKg.toLocaleString()} $</span>
                    <span>Pd: {item.pdPricePerKg.toLocaleString()} $</span>
                    <span>Rh: {item.rhPricePerKg.toLocaleString()} $</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const BatchReports: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { batches } = useAppSelector((state) => state.cashboxSessions);
  const { customerTypes } = useAppSelector((state) => state.customerTypes);

  const [currentPage, setCurrentPage] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<BatchReportFilters>({
    fromDate: null,
    toDate: null,
    clientName: null,
    clientPhone: null,
    clientTypeId: null,
  });
  const filterAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchCustomerTypes());
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchBatches({
        page: currentPage + 1,
        pageSize: PAGE_SIZE,
        fromDate: activeFilters.fromDate ?? undefined,
        toDate: activeFilters.toDate ?? undefined,
        clientName: activeFilters.clientName ?? undefined,
        clientPhone: activeFilters.clientPhone ?? undefined,
        clientTypeId: activeFilters.clientTypeId ?? undefined,
      }),
    )
      .unwrap()
      .catch((error) => {
        toast.error(
          getApiErrorMessage(error, t("cashbox.errors.failedToFetchBatches")),
        );
      });

    return () => {
      dispatch(clearSelection());
    };
  }, [dispatch, activeFilters, currentPage, t]);

  const handleApplyFilters = (filters: BatchReportFilters) => {
    setActiveFilters(filters);
    setCurrentPage(0);
    setIsFilterOpen(false);
  };

  const columns = useMemo(() => getBatchReportColumns(), []);
  const totalPages = Math.ceil((batches?.totalItems || 0) / PAGE_SIZE);

  const hasClientFilter =
    !!activeFilters.clientName ||
    !!activeFilters.clientPhone ||
    activeFilters.clientTypeId != null;

  return (
    <div className={styles.batchReportsWrapper}>
      <header className={styles.header}>
        <h1>{t("cashbox.batches.title")}</h1>
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

      <FilterBatchesDropdown
        open={isFilterOpen}
        anchorRef={filterAnchorRef}
        onOpenChange={setIsFilterOpen}
        onSave={handleApplyFilters}
        initialFilters={activeFilters}
        customerTypes={customerTypes}
      />

      {!hasClientFilter && (
        <div className={styles.tableContainer}>
          <DataTable
            columns={columns}
            data={batches?.results || []}
            pageSize={PAGE_SIZE}
            manualPagination
            pageCount={totalPages}
            pageIndex={currentPage}
            getRowClassName={(row) =>
              checkIsToday(row.createdAt) ? styles.todayRow : ""
            }
            onPaginationChange={setCurrentPage}
            renderSubComponent={({ row }) => (
              <BatchDetailView sessionId={row.original.sessionId} />
            )}
          />
        </div>
      )}

      {hasClientFilter && (
        <div className={styles.tableContainer}>
          <div className={styles.detailContainer}>
            <div className={styles.itemsSection}>
              <h5 className={styles.subTitle}>
                {t("cashbox.batches.title")} ({batches?.results.length || 0})
              </h5>
              <div className={styles.itemsGrid}>
                {batches?.results?.map((batch) => (
                  <div key={batch.sessionId} className={styles.itemCard}>
                    <div className={styles.itemCardHeader}>
                      <div className={styles.intakeMain}>
                        <span>#{batch.sessionId}</span>
                        <strong>{batch.totalPowderKg} kg</strong>
                      </div>
                    </div>
                    <div className={styles.itemCardContent}>
                      <div className={styles.contactInfo}>
                        <div className={styles.infoRow}>
                          <span>{t("cashbox.batches.columns.createdAt")}:</span>
                          <strong>
                            {new Date(batch.createdAt).toLocaleString()}
                          </strong>
                        </div>
                        <div className={styles.infoRow}>
                          <span>{t("cashbox.batches.details.totalCost")}:</span>
                          <strong>
                            {batch.costTotalAmd != null
                              ? batch.costTotalAmd.toLocaleString()
                              : "-"}{" "}
                            AMD
                          </strong>
                        </div>
                        {batch.avgCustomerPercent != null && (
                          <div className={styles.infoRow}>
                            <span>
                              {t(
                                "cashbox.powderBatches.columns.avgCustomerPercent",
                              )}
                              :
                            </span>
                            <strong>
                              {(batch.avgCustomerPercent * 100).toFixed(2)}%
                            </strong>
                          </div>
                        )}
                      </div>

                      <div className={styles.metalConcentrationGrid}>
                        <div className={styles.metalItem}>
                          <span>Pt</span>
                          <strong>
                            {batch.ptPerKg_g} <small>g/kg</small>
                          </strong>
                        </div>
                        <div className={styles.metalItem}>
                          <span>Pd</span>
                          <strong>
                            {batch.pdPerKg_g} <small>g/kg</small>
                          </strong>
                        </div>
                        <div className={styles.metalItem}>
                          <span>Rh</span>
                          <strong>
                            {batch.rhPerKg_g} <small>g/kg</small>
                          </strong>
                        </div>
                      </div>

                      {batch.avgFxRateToAmd != null && (
                        <div className={styles.financialStats}>
                          <div className={styles.fxRate}>
                            Rate: {batch.avgFxRateToAmd} AMD
                          </div>
                          <div className={styles.metalPricesFooter}>
                            {batch.avgPtPricePerKg != null && (
                              <span>
                                Pt: {batch.avgPtPricePerKg.toLocaleString()} $
                              </span>
                            )}
                            {batch.avgPdPricePerKg != null && (
                              <span>
                                Pd: {batch.avgPdPricePerKg.toLocaleString()} $
                              </span>
                            )}
                            {batch.avgRhPricePerKg != null && (
                              <span>
                                Rh: {batch.avgRhPricePerKg.toLocaleString()} $
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
