import { type FC, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { DataTable } from "@/ui-kit";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchPowderBatches,
  clearPowderBatchSelection,
} from "@/store/slices/cash/dashboardSlice";

// columns
import { getPowderBatchColumns } from "./columns";

// utils
import { getApiErrorMessage } from "@/utils";
import { checkIsToday } from "@/utils/checkIsToday.utils";

// styles
import styles from "./PowderBatches.module.css";

const PAGE_SIZE = 10;

export const PowderBatches: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { powderBatches } = useAppSelector((state) => state.cashDashboard);

  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    dispatch(
      fetchPowderBatches({
        cashRegisterId: 1,
      }),
    )
      .unwrap()
      .catch((error) => {
        toast.error(
          getApiErrorMessage(
            error,
            t("cashbox.errors.failedToFetchPowderBatches"),
          ),
        );
      });

    return () => {
      dispatch(clearPowderBatchSelection());
    };
  }, [dispatch, t]);

  const columns = useMemo(() => getPowderBatchColumns(), []);

  // Client-side pagination since we fetch all data
  const paginatedData = useMemo(() => {
    const allResults = powderBatches?.results || [];
    const startIndex = currentPage * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return allResults.slice(startIndex, endIndex);
  }, [powderBatches?.results, currentPage]);

  const totalPages = useMemo(
    () => Math.ceil((powderBatches?.results?.length || 0) / PAGE_SIZE),
    [powderBatches?.results?.length],
  );

  return (
    <div className={styles.powderBatchesWrapper}>
      <header className={styles.header}>
        <h1>{t("cashbox.powderBatches.title")}</h1>
      </header>

      <div className={styles.tableContainer}>
        <DataTable
          columns={columns}
          data={paginatedData}
          pageSize={PAGE_SIZE}
          manualPagination
          pageCount={totalPages}
          pageIndex={currentPage}
          getRowClassName={(row) =>
            checkIsToday(row.createdAt) ? styles.todayRow : ""
          }
          onPaginationChange={(pageIndex) => {
            setCurrentPage(pageIndex);
          }}
        />
      </div>
    </div>
  );
};
