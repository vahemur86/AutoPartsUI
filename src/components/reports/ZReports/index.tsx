import { type FC, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { DataTable } from "@/ui-kit";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchZReports } from "@/store/slices/cash/cashboxSessionsSlice";

// columns
import { getZReportColumns } from "./columns";

// utils
import { getApiErrorMessage } from "@/utils";

// styles
import styles from "./ZReports.module.css";

const PAGE_SIZE = 10;

export const ZReports: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { zReports } = useAppSelector((state) => state.cashboxSessions);

  useEffect(() => {
    dispatch(
      fetchZReports({
        page: 1,
        pageSize: PAGE_SIZE,
      }),
    )
      .unwrap()
      .catch((error) => {
        toast.error(
          getApiErrorMessage(error, t("cashbox.errors.failedToFetchZReports")),
        );
      });
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

  const data = zReports?.results || [];

  const totalPages = useMemo(() => {
    const itemsCount = zReports?.totalItems || 0;
    return Math.ceil(itemsCount / PAGE_SIZE);
  }, [zReports?.totalItems]);

  const currentPageIndex = zReports?.page ? zReports.page - 1 : 0;

  const handlePageChange = (pageIndex: number) => {
    dispatch(
      fetchZReports({
        page: pageIndex + 1,
        pageSize: PAGE_SIZE,
      }),
    )
      .unwrap()
      .catch((error) => {
        toast.error(getApiErrorMessage(error, t("common.error.fetchFailed")));
      });
  };

  return (
    <div className={styles.zReportsWrapper}>
      <header className={styles.header}>
        <h1>{t("cashbox.zReports.title")}</h1>
      </header>

      <div className={styles.tableContainer}>
        <DataTable
          columns={columns}
          data={data}
          pageSize={PAGE_SIZE}
          manualPagination
          pageCount={totalPages}
          pageIndex={currentPageIndex}
          getRowClassName={(row) =>
            checkIsToday(row.openedAt) ? styles.todayRow : ""
          }
          onPaginationChange={handlePageChange}
        />
      </div>
    </div>
  );
};
