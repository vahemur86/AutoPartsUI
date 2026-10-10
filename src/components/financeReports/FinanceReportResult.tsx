import { FinanceDataTable as DataTable } from "./FinanceDataTable";
import {
  formatFinanceValue,
  getFinanceColumnIcon,
  isFinanceMoneyKey,
  isFinanceProfitKey,
  toFinanceHeader,
  type DynamicRow,
} from "./tableUtils";
import type { ColumnDef } from "@tanstack/react-table";
import { FinanceReportState } from "./FinanceReportState";
import styles from "./FinanceReports.module.css";

interface FinanceReportResultProps {
  rows: DynamicRow[];
  columns: ColumnDef<DynamicRow, unknown>[];
  loading: boolean;
  loadingLabel: string;
  hasData: boolean;
  emptyLabel: string;
  noRowsLabel: string;
}

export const FinanceReportResult = ({
  rows,
  columns,
  loading,
  loadingLabel,
  hasData,
  emptyLabel,
  noRowsLabel,
}: FinanceReportResultProps) => {
  if (loading) {
    return <FinanceReportState loading label={loadingLabel} />;
  }

  if (!hasData) {
    return <FinanceReportState loading={false} label={emptyLabel} />;
  }

  if (rows.length === 0) {
    return <FinanceReportState loading={false} label={noRowsLabel} />;
  }

  if (rows.length === 1) {
    const row = rows[0];

    return (
      <div className={styles.financeRecordGrid}>
        {Object.entries(row).map(([key, value]) => {
          const Icon = getFinanceColumnIcon(key);
          const valueClass = typeof value === "number" && isFinanceProfitKey(key)
            ? value >= 0
              ? styles.positiveValue
              : styles.negativeValue
            : isFinanceMoneyKey(key)
              ? styles.moneyValue
              : "";
          const formattedValue = key === "id"
            ? `#${String(value ?? "-")}`
            : formatFinanceValue(key, value);

          return (
            <article className={styles.financeRecordItem} key={key}>
              <span className={styles.financeRecordLabel}>
                <Icon size={13} aria-hidden="true" />
                {toFinanceHeader(key)}
              </span>
              <strong className={valueClass}>{formattedValue}</strong>
            </article>
          );
        })}
      </div>
    );
  }

  return <DataTable data={rows} columns={columns} pageSize={10} />;
};