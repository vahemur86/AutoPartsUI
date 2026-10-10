import { type FC, useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useMinimumLoadingDuration } from "@/hooks/useMinimumLoadingDuration";

// icons
import {
  ArrowUpRight,
  ArrowLeftRight,
  BadgeDollarSign,
  BarChart3,
  ChartColumnIncreasing,
  ChartColumnBig,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock3,
  CircleDollarSign,
  Eye,
  EyeOff,
  ExternalLink,
  Filter,
  Gauge,
  Hash,
  Info,
  ListOrdered,
  Phone,
  Percent,
  Star,
  Target,
  TrendingUp,
  User,
  Wallet,
  Weight,
} from "lucide-react";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchBatches,
  clearSelection,
  fetchBatchDetails,
} from "@/store/slices/cash/cashboxSessionsSlice";
import { fetchCustomerTypes } from "@/store/slices/customerTypesSlice";

// components
import {
  FilterBatchesDropdown,
  type BatchReportFilters,
} from "./FilterBatchesDropdown";

// types
import type { Batch, BatchDetails } from "@/types/cash";

// utils
import { getApiErrorMessage } from "@/utils";

// styles
import styles from "./BatchReports.module.css";
import { fetchBatchDetailsForFilter } from "@/store/slices/cash/dashboardSlice";
import { FilteredBatchCard } from "./FilteredBatchCard";
import { FilteredBatchSummaryCard } from "./FilteredBatchSummaryCard";

const PAGE_SIZE = 10;
const batchStatusKeys: Record<number, string> = {
  1: "open",
  2: "partiallySold",
  3: "sold",
  4: "cancelled",
};

interface BatchSummaryCardProps {
  batch: Batch;
  expanded: boolean;
  onToggle: () => void;
}

const BatchSummaryCard: FC<BatchSummaryCardProps> = ({
  batch,
  expanded,
  onToggle,
}) => {
  const { t } = useTranslation();
  const statusKey = batchStatusKeys[batch.status] ?? "unknown";
  const statusClass = batch.status === 1
    ? styles.statusOpen
    : batch.status === 2
      ? styles.statusPartiallySold
      : batch.status === 3
        ? styles.statusSold
        : batch.status === 4
          ? styles.statusCancelled
          : styles.statusUnknown;

  return (
    <article className={`${styles.batchCard} ${batch.hasPreventMergeItems ? styles.specialBatchCard : ""}`}>
      <header className={styles.batchCardHeader}>
        <div className={styles.batchIdentity}>
          <span className={styles.batchIcon} aria-hidden="true">
            <TrendingUp size={18} />
          </span>
          <div className={styles.batchIdentityCopy}>
            <div className={styles.batchTitleLine}>
              <h2>{t("cashbox.batches.card.batchNumber", { id: batch.id })}</h2>
              {batch.status !== 1 && (
                <span className={`${styles.batchStatus} ${statusClass}`}>
                  {t(`cashbox.batches.statuses.${statusKey}`)}
                </span>
              )}
              {batch.hasPreventMergeItems && (
                <span className={styles.specialBadge}>
                  <Star size={11} aria-hidden="true" />
                  {t("cashbox.batches.special.badge")}
                </span>
              )}
            </div>
            <div className={styles.batchMeta}>
              <span>{t("cashbox.batches.card.cashbox")} #{batch.cashBoxId}</span>
              <span>{t("cashbox.batches.card.session")} #{batch.sessionId}</span>
              <span>
                <Clock3 size={12} aria-hidden="true" />
                {new Date(batch.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          className={styles.detailsButton}
          onClick={onToggle}
          aria-expanded={expanded}
        >
          {expanded ? <EyeOff size={15} /> : <Eye size={15} />}
          {expanded
            ? t("cashbox.batches.card.hideDetails")
            : t("cashbox.batches.card.showIntakes", { count: batch.intakeCount })}
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </header>

      <div className={styles.batchMetricGrid}>
        <div className={styles.batchMetric}>
          <span>{t("cashbox.batches.columns.intakes")}</span>
          <strong>{batch.intakeCount.toLocaleString()}</strong>
        </div>
        <div className={styles.batchMetric}>
          <span>{t("cashbox.batches.columns.weight")}</span>
          <strong>{batch.totalPowderKg.toLocaleString()} kg</strong>
        </div>
      </div>

      <div className={styles.metalSummary}>
        <div><span>Pt</span><strong>{(batch.ptTotal_g ?? 0).toLocaleString()} g</strong><small>{batch.ptPerKg_g ?? 0} g/kg</small></div>
        <div><span>Pd</span><strong>{(batch.pdTotal_g ?? 0).toLocaleString()} g</strong><small>{batch.pdPerKg_g ?? 0} g/kg</small></div>
        <div><span>Rh</span><strong>{(batch.rhTotal_g ?? 0).toLocaleString()} g</strong><small>{batch.rhPerKg_g ?? 0} g/kg</small></div>
      </div>
    </article>
  );
};

interface BatchDetailViewProps {
  sessionId: number;
  batchId: number;
  supplierClientId?: number | null;
}

const BatchDetailView: FC<BatchDetailViewProps> = ({
  sessionId,
  batchId,
  supplierClientId,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { batchDetails, isLoading } = useAppSelector(
    (state) => state.cashboxSessions,
  );

  const loadedSessionId = batchDetails?.[0]?.sessionId;

  useEffect(() => {
    if (!isLoading && loadedSessionId !== sessionId) {
      dispatch(
        fetchBatchDetails({
          sessionId,
          supplierClientId: supplierClientId ?? undefined,
        }),
      )
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
  }, [sessionId, dispatch, loadedSessionId, isLoading, supplierClientId, t]);

  if (isLoading && loadedSessionId !== sessionId) {
    return (
      <div className={styles.detailSkeleton} aria-busy="true" aria-live="polite">
        <div className={styles.detailSkeletonHeader}>
          <div className={`${styles.skeletonLine} ${styles.skeletonLineWide}`} />
        </div>
        <div className={styles.detailSkeletonGrid}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className={styles.detailSkeletonCard}>
              <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
              <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!batchDetails?.length || loadedSessionId !== sessionId) {
    return <div className={styles.detailError}>{t("common.noData")}</div>;
  }

  const visibleBatches = batchDetails.filter((batch) => batch.id === batchId);
  const batchesToRender = visibleBatches.length ? visibleBatches : batchDetails;

  return (
    <div className={styles.batchDetailsList}>
      {batchesToRender.map((batch, index) => (
        <SingleBatchDetail
          key={batch.id}
          batch={batch}
          batchIndex={index}
          batchCount={batchesToRender.length}
          supplierClientId={supplierClientId}
        />
      ))}
    </div>
  );
};

interface SingleBatchDetailProps {
  batch: BatchDetails;
  batchIndex: number;
  batchCount: number;
  supplierClientId?: number | null;
}

const SingleBatchDetail: FC<SingleBatchDetailProps> = ({
  batch: batchDetails,
  batchIndex,
  batchCount,
  supplierClientId,
}) => {
  const { t } = useTranslation();

  const isSpecialBatch =
    supplierClientId != null ||
    batchDetails.hasPreventMergeItems === true ||
    batchDetails.items.some((item) => item.customerTypeHasPreventMergeFlag);

  const getNumberClass = (value: number) => {
    if (value < 0) return styles.negative;
    if (value > 0) return styles.positive;
    return "";
  };

  return (
    <div
      className={`${styles.detailContainer} ${
        isSpecialBatch ? styles.specialDetailContainer : ""
      }`}
    >
      <div className={styles.analysisSummary}>
        <div className={styles.analysisHeader}>
          <div className={styles.analysisTitleLine}>
            <h4 className={styles.sectionTitle}>
              {t("cashbox.batches.details.analysis")}
              {batchCount > 1 && (
                <span className={styles.batchIndexLabel}>
                  #{batchDetails.id} ({batchIndex + 1}/{batchCount})
                </span>
              )}
            </h4>
            {isSpecialBatch && (
              <span
                className={styles.specialBadge}
                title={t("cashbox.batches.filters.specialCustomerTooltip")}
              >
                <Star size={11} />
                {t("cashbox.batches.special.badge")}
              </span>
            )}
          </div>
          <div className={styles.analysisMeta}>
            <span>
              {t("cashbox.batches.columns.createdAt")}: {new Date(batchDetails.createdAt).toLocaleString()}
            </span>
            <span>
              {t("cashbox.batches.card.session")} #{batchDetails.sessionId}
            </span>
          </div>
        </div>

        <div className={styles.analysisMetrics}>
          <div className={styles.analysisMetric}>
            <span><CircleDollarSign size={14} aria-hidden="true" />{t("cashbox.batches.details.cost")}</span>
            <strong>{batchDetails.totalCostAmd.toLocaleString()} AMD</strong>
          </div>
          <div className={styles.analysisMetric}>
            <span><ChartColumnBig size={14} aria-hidden="true" />{t("cashbox.batches.details.sales")}</span>
            <strong>{batchDetails.totalEstimatedSalesAmd.toLocaleString()} AMD</strong>
          </div>
          <div className={styles.analysisMetric}>
            <span><BadgeDollarSign size={14} aria-hidden="true" />{t("cashbox.batches.details.purchaseProfitAmd")}</span>
            <strong>{batchDetails.totalPurchaseProfitAmd.toLocaleString()} AMD</strong>
          </div>
          <div className={`${styles.analysisMetric} ${getNumberClass(batchDetails.totalProfitDiffAmd)}`}>
            <span><ArrowUpRight size={14} aria-hidden="true" />{t("cashbox.batches.details.profitDiffAmd")}</span>
            <strong>
              {batchDetails.totalProfitDiffAmd > 0 ? "+" : ""}
              {batchDetails.totalProfitDiffAmd.toLocaleString()} AMD
            </strong>
          </div>
          <div className={styles.analysisMetric}>
            <span><TrendingUp size={14} aria-hidden="true" />{t("cashbox.batches.details.expectedProfitAmd")}</span>
            <strong>{batchDetails.totalLiveProfitAmd.toLocaleString()} AMD</strong>
          </div>
          <div className={`${styles.analysisMetric} ${getNumberClass(batchDetails.totalLiveProfitPercent)}`}>
            <span><Percent size={14} aria-hidden="true" />{t("cashbox.batches.details.liveProfitPercent")}</span>
            <strong>
              {batchDetails.totalLiveProfitPercent > 0 ? "+" : ""}
              {batchDetails.totalLiveProfitPercent.toFixed(2)}%
            </strong>
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
            <div
              key={item.id}
              className={`${styles.itemCard} ${
                item.customerTypeHasPreventMergeFlag
                  ? styles.specialItemCard
                  : ""
              }`}
            >
              <div className={styles.itemCardHeader}>
                <div className={styles.intakeMain}>
                  <span className={styles.intakeId}><Hash size={13} aria-hidden="true" />{item.intakeId}</span>
                  <strong><Weight size={14} aria-hidden="true" />{item.powderKg} kg</strong>
                  {item.customerTypeHasPreventMergeFlag && (
                    <span
                      className={styles.specialBadge}
                      title={t(
                        "cashbox.batches.filters.specialCustomerTooltip",
                      )}
                    >
                      <Star size={10} />
                      {t("cashbox.batches.special.badge")}
                    </span>
                  )}
                </div>
                <div className={styles.supplierTag}>
                  <User size={10} />
                  <span className={styles.clientIdentity}>
                    <span className={styles.clientName}>{item.supplierClientName}</span>
                    <span className={styles.clientType}>{item.supplierClientType}</span>
                  </span>
                </div>
              </div>

              <div className={styles.itemCardContent}>
                <div className={styles.contactInfo}>
                  <div className={styles.infoRow}>
                    <Phone size={10} />
                    <span className={styles.infoLabel}>{item.supplierClientPhone}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <Percent size={13} aria-hidden="true" />
                    <span className={styles.infoLabel}>{t("cashbox.batches.details.percent")}</span>
                    <strong>{((item.supplierClientTypePercent ?? 0) * 100).toFixed(2)}%</strong>
                  </div>

                  <div className={styles.infoRow}>
                    <ListOrdered size={13} aria-hidden="true" />
                    <span className={styles.infoLabel}>{t("cashbox.batches.details.offerIncreaseStepOrder")}</span>
                    <strong>{item?.offerIncreaseStepOrder ?? 0}</strong>
                  </div>
                  <div className={styles.infoRow}>
                    <TrendingUp size={13} aria-hidden="true" />
                    <span className={styles.infoLabel}>{t("cashbox.batches.details.offerIncreasePercent")}</span>
                    <strong>{item?.offerIncreasePercent ?? 0}%</strong>
                  </div>
                  <div className={styles.infoRow}>
                    <Target size={13} aria-hidden="true" />
                    <span className={styles.infoLabel}>{t("cashbox.batches.details.customerRealPercent")}</span>
                    <strong>{item?.customerRealPercent ?? 0}%</strong>
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
                    <span className={styles.statLabel}><Wallet size={14} aria-hidden="true" />{t("cashbox.batches.details.cost")}</span>
                    <strong>{item.costAmd.toLocaleString()} AMD</strong>
                  </div>
                  <div className={styles.statLine2}>
                    <span className={styles.statLabel}><ChartColumnIncreasing size={14} aria-hidden="true" />{t("cashbox.batches.details.sales")}</span>
                    <strong>
                      {item.estimatedSalesAmd.toLocaleString()} AMD
                    </strong>
                  </div>
                  <div className={styles.statLine}>
                    <span className={styles.statLabel}><BadgeDollarSign size={14} aria-hidden="true" />{t("cashbox.batches.details.purchaseProfitAmd")}</span>
                    <strong>
                      {item.purchaseProfitAmd.toLocaleString()} AMD
                    </strong>
                  </div>
                  <div className={styles.statLine}>
                    <span className={styles.statLabel}><ArrowLeftRight size={14} aria-hidden="true" />{t("cashbox.batches.details.profitDiffAmd")}</span>
                    <strong className={getNumberClass(item.profitDiffAmd)}>
                      {item.profitDiffAmd > 0 ? "+" : ""}
                      {item.profitDiffAmd.toLocaleString()} AMD
                    </strong>
                  </div>
                  <div className={styles.statLine2}>
                    <span className={styles.statLabel}><CircleDollarSign size={14} aria-hidden="true" />{t("cashbox.batches.details.expectedProfitAmd")}</span>
                    <strong>
                      {item.expectedProfitAmd.toLocaleString()} AMD
                    </strong>
                  </div>

                  <div className={styles.statLine}>
                    <span className={styles.statLabel}><Gauge size={14} aria-hidden="true" />{t("cashbox.batches.details.liveProfitPercent")}</span>
                    <strong className={getNumberClass(item.liveProfitPercent)}>
                      {item.liveProfitPercent > 0 ? "+" : ""}
                      {item.liveProfitPercent.toFixed(2)}%
                    </strong>
                  </div>
                  <div
                    className={`${styles.statLine} ${styles.profitLine}`}
                  ></div>

                  <div className={styles.fxRate}>
                    <span className={styles.fxRateLabel}>
                      <ArrowLeftRight size={13} aria-hidden="true" />
                      USD / AMD
                    </span>
                    <strong className={styles.fxRateValue}>
                      <span>1 USD</span>
                      <span className={styles.fxRateEquals}>=</span>
                      <b>{item.fxRateToAmd.toLocaleString()} AMD</b>
                    </strong>
                    <a
                      className={styles.fxRateSource}
                      href="https://rate.am"
                      target="_blank"
                      rel="noreferrer"
                    >
                      rate.am <ExternalLink size={11} aria-hidden="true" />
                    </a>
                  </div>

                  {/* Metal Prices displayed under the Rate */}
                  <div className={styles.metalPricesFooter}>
                    <div className={styles.metalPricesHeading}>USD / kg</div>
                    <div className={styles.metalPricesGrid}>
                      <div className={styles.metalPriceItem}>
                        <span className={styles.metalPriceSymbol}>Pt</span>
                        <strong>${item.ptPricePerKg.toLocaleString()}</strong>
                      </div>
                      <div className={styles.metalPriceItem}>
                        <span className={styles.metalPriceSymbol}>Pd</span>
                        <strong>${item.pdPricePerKg.toLocaleString()}</strong>
                      </div>
                      <div className={styles.metalPriceItem}>
                        <span className={styles.metalPriceSymbol}>Rh</span>
                        <strong>${item.rhPricePerKg.toLocaleString()}</strong>
                      </div>
                    </div>
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
  const { batches, isLoading } = useAppSelector(
    (state) => state.cashboxSessions,
  );
  const showTableSkeleton = useMinimumLoadingDuration(
    isLoading && !batches?.results?.length,
  );
  const { customerTypes } = useAppSelector((state) => state.customerTypes);
  const { batchDetailsForFilter } = useAppSelector(
    (state) => state.cashDashboard,
  );

  const [currentPage, setCurrentPage] = useState(0);
  const [expandedBatchId, setExpandedBatchId] = useState<number | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<BatchReportFilters>({
    fromDate: null,
    toDate: null,
    superClientId: null,
    clientPhone: null,
    clientTypeId: null,
    supplierClientId: null,
  });
  const filterAnchorRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    dispatch(fetchCustomerTypes());
  }, [dispatch]);

  const hasClientFilter =
    activeFilters.superClientId != null ||
    !!activeFilters.clientPhone ||
    activeFilters.clientTypeId != null;

  const isSpecialMode = activeFilters.supplierClientId != null;
  const activeFilterCount = [
    activeFilters.fromDate,
    activeFilters.toDate,
    activeFilters.superClientId,
    activeFilters.clientPhone,
    activeFilters.clientTypeId,
    activeFilters.supplierClientId,
  ].filter((value) => value != null && value !== "").length;

  useEffect(() => {
    if (!hasClientFilter || isSpecialMode) {
      dispatch(
        fetchBatches({
          page: currentPage + 1,
          pageSize: PAGE_SIZE,
          fromDate: activeFilters.fromDate ?? undefined,
          toDate: activeFilters.toDate ?? undefined,
          supplierClientId: activeFilters.supplierClientId ?? undefined,
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
    }

    return () => {
      dispatch(clearSelection());
    };
  }, [dispatch, activeFilters, currentPage, hasClientFilter, isSpecialMode, t]);

  useEffect(() => {
    if (hasClientFilter && !isSpecialMode) {
      dispatch(
        fetchBatchDetailsForFilter({
          page: currentPage + 1,
          pageSize: PAGE_SIZE,
          fromDate: activeFilters.fromDate ?? undefined,
          toDate: activeFilters.toDate ?? undefined,

          supplierClientId:
            activeFilters.supplierClientId ??
            activeFilters.superClientId ??
            undefined,

          clientPhone: activeFilters.clientPhone ?? undefined,
          clientTypeId: activeFilters.clientTypeId ?? undefined,
          cashRegisterId: 1,
        }),
      )
        .unwrap()
        .catch((error) => {
          toast.error(
            getApiErrorMessage(error, t("cashbox.errors.failedToFetchBatches")),
          );
        });
    }
  }, [dispatch, activeFilters, currentPage, hasClientFilter, isSpecialMode, t]);

  const handleApplyFilters = (filters: BatchReportFilters) => {
    setActiveFilters(filters);
    setCurrentPage(0);
    setIsFilterOpen(false);
  };

  const totalPages = Math.ceil((batches?.totalItems || 0) / PAGE_SIZE);

  return (
    <div className={styles.batchReportsWrapper}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.titleIcon} aria-hidden="true">
            <BarChart3 size={19} />
          </span>
          <div>
            <span className={styles.eyebrow}>{t("reports.navigationGroups.inventory")}</span>
            <h1>{t("cashbox.batches.title")}</h1>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            ref={filterAnchorRef}
            className={`${styles.filterButton} ${isFilterOpen ? styles.filterButtonOpen : ""} ${activeFilterCount ? styles.filterButtonActive : ""}`}
            onClick={() => setIsFilterOpen(true)}
            aria-expanded={isFilterOpen}
          >
            <Filter size={15} aria-hidden="true" />
            <span className={styles.filterButtonText}>
              {t("common.filters")}
            </span>
            {activeFilterCount > 0 && (
              <span className={styles.filterCount} aria-hidden="true">
                {activeFilterCount}
              </span>
            )}
          </button>
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

      {(!hasClientFilter || isSpecialMode) && (
        <div className={styles.tableContainer}>
          {isSpecialMode && (
            <div
              className={styles.specialBanner}
              title={t("cashbox.batches.filters.specialCustomerTooltip")}
            >
              <Star size={14} />
              <span>
                {t("cashbox.batches.special.totalsLabel", {
                  id: activeFilters.supplierClientId,
                })}
              </span>
              <Info size={13} className={styles.specialBannerInfo} />
            </div>
          )}

          {isSpecialMode && batches && (
            <FilteredBatchSummaryCard
              data={{
                totalPowderKg: batches.totalPowderKg,
                totalCostAmd: batches.totalCostAmd,
                avgPtPerKg_g: batches.avgPtPerKg_g,
                avgPdPerKg_g: batches.avgPdPerKg_g,
                avgRhPerKg_g: batches.avgRhPerKg_g,
              }}
              t={t}
              styles={styles}
            />
          )}

          {showTableSkeleton ? (
            <div className={styles.tableSkeleton} aria-busy="true" aria-live="polite">
              <div className={styles.tableSkeletonHeader}>
                <div className={`${styles.skeletonLine} ${styles.skeletonLineWide}`} />
                <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
              </div>
              <div className={styles.tableSkeletonRows}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className={styles.tableSkeletonRow}>
                    <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
                    <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
                    <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                  </div>
                ))}
              </div>
            </div>
          ) : !batches?.results?.length ? (
            <div className={styles.emptyState}>
              <p>{isSpecialMode ? t("cashbox.batches.special.emptyState") : t("common.noData")}</p>
              {isSpecialMode && <small>{t("cashbox.batches.special.emptyStateHint")}</small>}
            </div>
          ) : (
            <div className={styles.batchList}>
              {batches.results.map((batch) => {
                const isExpanded = expandedBatchId === batch.id;
                return (
                  <div className={styles.batchEntry} key={batch.id}>
                    <BatchSummaryCard
                      batch={batch}
                      expanded={isExpanded}
                      onToggle={() => setExpandedBatchId(isExpanded ? null : batch.id)}
                    />
                    {isExpanded && (
                      <BatchDetailView
                        sessionId={batch.sessionId}
                        batchId={batch.id}
                        supplierClientId={activeFilters.supplierClientId}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {totalPages > 1 && (
            <nav className={styles.batchPagination} aria-label={t("common.page")}>
              <button type="button" onClick={() => setCurrentPage((page) => Math.max(0, page - 1))} disabled={isLoading || currentPage === 0}>
                <ChevronLeft size={16} />{t("common.previous")}
              </button>
              <span>{t("common.page")} {currentPage + 1} {t("common.of")} {totalPages}</span>
              <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages - 1, page + 1))} disabled={isLoading || currentPage >= totalPages - 1}>
                {t("common.next")}<ChevronRight size={16} />
              </button>
            </nav>
          )}
        </div>
      )}
      {hasClientFilter && !isSpecialMode && (
        <div className={styles.tableContainer}>
          <div className={styles.detailContainer}>
            <div className={styles.itemsSection}>
              <h5 className={styles.subTitle}>
                {t("cashbox.batches.title")} (
                {batchDetailsForFilter?.totalItems || 0})
              </h5>

              {batchDetailsForFilter && (
                <FilteredBatchSummaryCard
                  data={batchDetailsForFilter}
                  t={t}
                  styles={styles}
                />
              )}

              {isLoading && !batchDetailsForFilter?.items?.length ? (
                <div className={styles.filterSkeletonGrid}>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className={styles.filterSkeletonCard}>
                      <div className={`${styles.skeletonLine} ${styles.skeletonLineWide}`} />
                      <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
                      <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.itemsGrid}>
                  {batchDetailsForFilter?.items?.map((batch) => (
                    <FilteredBatchCard
                      key={batch.id}
                      batch={batch}
                      t={t}
                      styles={styles}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
