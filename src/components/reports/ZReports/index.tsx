import { type FC, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { DataTable } from "@/ui-kit";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchZReports,
  fetchZReport,
  clearSelection,
} from "@/store/slices/cash/cashboxSessionsSlice";

// columns
import { getZReportColumns } from "./columns";

// utils
import { getApiErrorMessage } from "@/utils";

// styles
import styles from "./ZReports.module.css";

const PAGE_SIZE = 10;

const ZReportDetailView: FC<{ sessionId: number }> = ({ sessionId }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { selectedZReport, isLoading } = useAppSelector(
    (state) => state.cashboxSessions,
  );

  useEffect(() => {
    if (!isLoading && selectedZReport?.sessionId !== sessionId) {
      dispatch(fetchZReport({ sessionId, cashRegisterId: 1 }))
        .unwrap()
        .catch((error) => {
          toast.error(
            getApiErrorMessage(error, t("cashbox.errors.failedToFetchZReport")),
          );
        });
    }
  }, [sessionId, dispatch, t, selectedZReport?.sessionId, isLoading]);

  const getDuration = (start: string, end: string) => {
    const durationMs = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (isLoading && selectedZReport?.sessionId !== sessionId) {
    return <div className={styles.detailLoading}>{t("common.loading")}</div>;
  }

  if (!selectedZReport || selectedZReport.sessionId !== sessionId) {
    return <div className={styles.detailError}>{t("common.noData")}</div>;
  }

  return (
    <div className={styles.detailContainer}>
      <div className={styles.detailSection}>
        <h4 className={styles.sectionTitle}>Session Timeline</h4>
        <div className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <span>Opened At</span>
            <strong>
              {new Date(selectedZReport.openedAt).toLocaleString()}
            </strong>
          </div>
          <div className={styles.detailItem}>
            <span>Closed At</span>
            <strong>
              {new Date(selectedZReport.closedAt).toLocaleString()}
            </strong>
          </div>
          <div className={styles.detailItem}>
            <span>Duration</span>
            <strong>
              {getDuration(selectedZReport.openedAt, selectedZReport.closedAt)}
            </strong>
          </div>
          <div className={styles.detailItem}>
            <span>Operator ID</span>
            <strong>#{selectedZReport.operatorUserId}</strong>
          </div>
        </div>
      </div>

      <div className={styles.detailSection}>
        <h4 className={styles.sectionTitle}>Financial Overview</h4>
        <div className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <span>Total Purchases</span>
            <strong>
              {selectedZReport.totalPurchasesAmd.toLocaleString()} AMD
            </strong>
          </div>
          <div className={styles.detailItem}>
            <span>Cash In</span>
            <strong className={styles.positiveText}>
              +{selectedZReport.totalCashInAmd.toLocaleString()} AMD
            </strong>
          </div>
          <div className={styles.detailItem}>
            <span>Cash Out</span>
            <strong className={styles.negativeText}>
              -{selectedZReport.totalCashOutAmd.toLocaleString()} AMD
            </strong>
          </div>
          <div className={styles.detailItem}>
            <span>Final Difference</span>
            <strong
              className={
                selectedZReport.diffPurchasesVsCashOutAmd < 0
                  ? styles.negativeText
                  : styles.positiveText
              }
            >
              {selectedZReport.diffPurchasesVsCashOutAmd.toLocaleString()} AMD
            </strong>
          </div>
        </div>
      </div>

      <div className={styles.detailSection}>
        <h4 className={styles.sectionTitle}>Operations</h4>
        <div className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <span>Intake Count</span>
            <strong>{selectedZReport.intakeCount} operations</strong>
          </div>
          <div className={styles.detailItem}>
            <span>Cashbox ID</span>
            <strong>Register #{selectedZReport.cashBoxId}</strong>
          </div>
          <div className={styles.detailItem}>
            <span>Session ID</span>
            <strong>#{selectedZReport.sessionId}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ZReports: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { zReports } = useAppSelector((state) => state.cashboxSessions);

  useEffect(() => {
    dispatch(fetchZReports({ cashRegisterId: 1, page: 1, pageSize: PAGE_SIZE }))
      .unwrap()
      .catch((error) => {
        toast.error(
          getApiErrorMessage(error, t("cashbox.errors.failedToFetchZReports")),
        );
      });

    return () => {
      dispatch(clearSelection());
    };
  }, [dispatch, t]);

  const columns = useMemo(() => getZReportColumns(), []);

  const checkIsToday = (dateString: string) => {
    if (!dateString) return false;
    const today = new Date();
    const date = new Date(dateString);
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const totalPages = useMemo(
    () => Math.ceil((zReports?.totalItems || 0) / PAGE_SIZE),
    [zReports?.totalItems],
  );
  const currentPageIndex = zReports?.page ? zReports.page - 1 : 0;

  return (
    <div className={styles.zReportsWrapper}>
      <header className={styles.header}>
        <h1>{t("cashbox.zReports.title")}</h1>
      </header>
      <div className={styles.tableContainer}>
        <DataTable
          columns={columns}
          data={zReports?.results || []}
          pageSize={PAGE_SIZE}
          manualPagination
          pageCount={totalPages}
          pageIndex={currentPageIndex}
          getRowClassName={(row) =>
            checkIsToday(row.openedAt) ? styles.todayRow : ""
          }
          onPaginationChange={(pageIndex) => {
            dispatch(
              fetchZReports({
                cashRegisterId: 1,
                page: pageIndex + 1,
                pageSize: PAGE_SIZE,
              }),
            );
          }}
          renderSubComponent={({ row }) => (
            <ZReportDetailView sessionId={row.original.sessionId} />
          )}
        />
      </div>
    </div>
  );
};
