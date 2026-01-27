import { type FC, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { DataTable } from "@/ui-kit";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchCashboxReport,
  clearSelection,
} from "@/store/slices/cash/cashboxSessionsSlice";

// columns
import { getCashboxReportColumns } from "./columns";

// utils
import { getApiErrorMessage } from "@/utils";
import { checkIsToday } from "@/utils/checkIsToday.utils";

// styles
import styles from "./CashboxReport.module.css";

export const CashboxSessionsReports: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { cashboxReport } = useAppSelector((state) => state.cashboxSessions);

  useEffect(() => {
    dispatch(
      fetchCashboxReport({
        cashRegisterId: 1,
      }),
    )
      .unwrap()
      .catch((error) => {
        toast.error(
          getApiErrorMessage(
            error,
            t("cashbox.errors.failedToFetchCashboxReport"),
          ),
        );
      });

    return () => {
      dispatch(clearSelection());
    };
  }, [dispatch, t]);

  const columns = useMemo(() => getCashboxReportColumns(), []);

  const tableData = useMemo(() => {
    return cashboxReport ? [cashboxReport] : [];
  }, [cashboxReport]);

  return (
    <div className={styles.cashboxReportWrapper}>
      <header className={styles.header}>
        <h1>{t("cashbox.cashboxReport.title")}</h1>
      </header>

      <div className={styles.tableContainer}>
        <DataTable
          columns={columns}
          data={tableData}
          pageSize={1}
          manualPagination={false}
          getRowClassName={(row) =>
            checkIsToday(row.date) ? styles.todayRow : ""
          }
        />
      </div>
    </div>
  );
};
