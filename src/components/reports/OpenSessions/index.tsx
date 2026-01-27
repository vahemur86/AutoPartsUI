import { type FC, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { DataTable } from "@/ui-kit";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchOpenSessionsSummary } from "@/store/slices/cash/dashboardSlice";

// columns
import { getOpenSessionsColumns } from "./columns";

// utils
import { getApiErrorMessage } from "@/utils";

// styles
import styles from "./OpenSessions.module.css";

const PAGE_SIZE = 10;

export const OpenSessions: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { openSessionsSummary } = useAppSelector(
    (state) => state.cashDashboard,
  );

  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    dispatch(
      fetchOpenSessionsSummary({
        cashRegisterId: 1,
      }),
    )
      .unwrap()
      .catch((error) => {
        toast.error(
          getApiErrorMessage(
            error,
            t("cashbox.errors.failedToFetchOpenSessionsSummary"),
          ),
        );
      });
  }, [dispatch, t]);

  const columns = useMemo(() => getOpenSessionsColumns(), []);

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

  // Client-side pagination
  const paginatedData = useMemo(() => {
    const startIndex = currentPage * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return openSessionsSummary.slice(startIndex, endIndex);
  }, [openSessionsSummary, currentPage]);

  const totalPages = useMemo(
    () => Math.ceil(openSessionsSummary.length / PAGE_SIZE),
    [openSessionsSummary.length],
  );

  return (
    <div className={styles.openSessionsWrapper}>
      <header className={styles.header}>
        <h1>{t("cashbox.openSessions.title")}</h1>
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
            checkIsToday(row.openedAt) ? styles.todayRow : ""
          }
          onPaginationChange={(pageIndex) => {
            setCurrentPage(pageIndex);
          }}
        />
      </div>
    </div>
  );
};
