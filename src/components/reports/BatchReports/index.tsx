import { type FC, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { DataTable } from "@/ui-kit";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchBatches,
  fetchBatchDetails,
  clearSelection,
} from "@/store/slices/cash/cashboxSessionsSlice";

// columns
import { getBatchReportColumns } from "./columns";

// utils
import { getApiErrorMessage } from "@/utils";
import { checkIsToday } from "@/utils/checkIsToday.utils";

// styles
import styles from "./BatchReports.module.css";

const PAGE_SIZE = 10;

const BatchDetailView: FC<{ sessionId: number }> = ({ sessionId }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { batchDetails, isLoading } = useAppSelector(
    (state) => state.cashboxSessions,
  );

  useEffect(() => {
    if (!isLoading && batchDetails?.sessionId !== sessionId) {
      dispatch(fetchBatchDetails({ sessionId, cashRegisterId: 1 }))
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
          Individual Intakes ({batchDetails.items.length})
        </h5>
        <div className={styles.itemsGrid}>
          {batchDetails.items.map((item) => (
            <div key={item.id} className={styles.itemCard}>
              <div className={styles.itemCardHeader}>
                <span>
                  {t("cashbox.batches.details.intakeId")} #{item.intakeId}
                </span>
                <strong>{item.powderKg} kg</strong>
              </div>
              <div className={styles.itemCardStats}>
                <div className={styles.statLine}>
                  <span>Pt</span> <strong>{item.ptTotal_g} g</strong>
                </div>
                <div className={styles.statLine}>
                  <span>Pd</span> <strong>{item.pdTotal_g} g</strong>
                </div>
                <div className={styles.statLine}>
                  <span>Rh</span> <strong>{item.rhTotal_g} g</strong>
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

  useEffect(() => {
    dispatch(fetchBatches({ page: 1, pageSize: PAGE_SIZE }))
      .unwrap()
      .catch((error) => {
        toast.error(getApiErrorMessage(error, "Failed to fetch batches"));
      });

    return () => {
      dispatch(clearSelection());
    };
  }, [dispatch]);

  const columns = useMemo(() => getBatchReportColumns(), []);

  const totalPages = Math.ceil((batches?.totalItems || 0) / PAGE_SIZE);

  return (
    <div className={styles.batchReportsWrapper}>
      <header className={styles.header}>
        <h1>{t("cashbox.batches.title")}</h1>
      </header>

      <div className={styles.tableContainer}>
        <DataTable
          columns={columns}
          data={batches?.results || []}
          pageSize={PAGE_SIZE}
          manualPagination
          pageCount={totalPages}
          pageIndex={batches?.page ? batches.page - 1 : 0}
          getRowClassName={(row) =>
            checkIsToday(row.createdAt) ? styles.todayRow : ""
          }
          onPaginationChange={(pageIndex) => {
            dispatch(
              fetchBatches({
                cashRegisterId: 1,
                page: pageIndex + 1,
                pageSize: PAGE_SIZE,
              }),
            );
          }}
          renderSubComponent={({ row }) => (
            <BatchDetailView sessionId={row.original.sessionId} />
          )}
        />
      </div>
    </div>
  );
};
