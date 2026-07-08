import { useEffect, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { DataTable } from "@/ui-kit";
import { getOtherExpensesReport } from "@/services/otherExpenses";
import {
  OtherExpenseLocationType,
  type OtherExpenseItem,
  type OtherExpenseReportItem,
} from "@/types/otherExpenses";

import styles from "./FinanceReports.module.css";

type ReportRow = OtherExpenseItem & {
  totalMonthlyExpense: number;
};

const columnHelper = createColumnHelper<ReportRow>();

const money = (value: number | null | undefined): string => {
  const resolved = Number(value || 0);
  return `${resolved.toLocaleString()} AMD`;
};

export const OtherExpensesReports = () => {
  const { t } = useTranslation();
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await getOtherExpensesReport();
        const flattened = response.flatMap((group: OtherExpenseReportItem) =>
          group.expenses
            .filter((item) => item.isActive !== false)
            .map((item) => ({
              ...item,
              totalMonthlyExpense: group.totalMonthlyExpense,
            })),
        );

        setRows(flattened);
      } catch (error) {
        const message = error instanceof Error ? error.message : t("financeReports.otherExpenses.loadFailed");
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [t]);

  const monthlyRows = useMemo(() => {
    return rows;
  }, [rows]);

  const totalAmount = useMemo(
    () => monthlyRows.reduce((sum, row) => sum + Number(row.amount || 0), 0),
    [monthlyRows],
  );

  const columns = useMemo<ColumnDef<ReportRow, unknown>[]>(
    () => [
      columnHelper.display({
        id: "locationName",
        header: t("financeReports.otherExpenses.columns.locationName"),
        cell: ({ row }) => row.original.locationName || "-",
      }),
      columnHelper.display({
        id: "serviceName",
        header: t("financeReports.otherExpenses.columns.name"),
        cell: ({ row }) => row.original.serviceName || "-",
      }),
      columnHelper.display({
        id: "entityType",
        header: t("financeReports.otherExpenses.columns.entityType"),
        cell: ({ row }) =>
          row.original.locationType === OtherExpenseLocationType.Shop
            ? t("financeReports.otherExpenses.entityTypes.shop")
            : t("financeReports.otherExpenses.entityTypes.warehouse"),
      }),
      columnHelper.display({
        id: "amount",
        header: t("financeReports.otherExpenses.columns.price"),
        cell: ({ row }) => money(row.original.amount),
      }),
      columnHelper.display({
        id: "paymentDay",
        header: t("financeReports.otherExpenses.columns.paymentDay"),
        cell: ({ row }) => String(row.original.paymentDay || "-"),
      }),
      columnHelper.display({
        id: "totalMonthlyExpense",
        header: t("financeReports.otherExpenses.columns.totalMonthlyExpense"),
        cell: ({ row }) => money(row.original.totalMonthlyExpense),
      }),
    ],
    [t],
  );

  return (
    <div className={styles.panel}>
      <div className={styles.kpiGrid}>
        <article className={styles.kpiCard}>
          <span>{t("financeReports.otherExpenses.monthlyTotal")}</span>
          <strong>{money(totalAmount)}</strong>
        </article>
        <article className={styles.kpiCard}>
          <span>{t("financeReports.otherExpenses.rowsCount")}</span>
          <strong>{monthlyRows.length.toLocaleString()}</strong>
        </article>
      </div>

      <div className={styles.result}>
        {isLoading ? (
          <div className={styles.info}>{t("common.loading")}</div>
        ) : monthlyRows.length === 0 ? (
          <div className={styles.info}>{t("financeReports.otherExpenses.empty")}</div>
        ) : (
          <DataTable data={monthlyRows} columns={columns} pageSize={10} />
        )}
      </div>
    </div>
  );
};
