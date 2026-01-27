import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import i18next from "i18next";

// types
import type { CashboxReport } from "@/types/cash";

const columnHelper = createColumnHelper<CashboxReport>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getCashboxReportColumns = (): ColumnDef<CashboxReport, any>[] => [
  columnHelper.accessor("cashBoxId", {
    header: i18next.t("cashbox.cashboxReport.columns.cashBoxId"),
    cell: (info) => `#${info.getValue()}`,
  }),
  columnHelper.accessor("date", {
    header: i18next.t("cashbox.cashboxReport.columns.date"),
    cell: (info) => {
      const dateValue = info.getValue();
      if (dateValue === "0001-01-01" || !dateValue) {
        return "-";
      }
      return new Date(dateValue).toLocaleDateString();
    },
  }),
  columnHelper.accessor("openingBalanceAmd", {
    header: i18next.t("cashbox.cashboxReport.columns.openingBalance"),
    cell: (info) => {
      const value = info.getValue();
      return `${value.toLocaleString()} AMD`;
    },
  }),
  columnHelper.accessor("cashInAmd", {
    header: i18next.t("cashbox.cashboxReport.columns.cashIn"),
    cell: (info) => {
      const value = info.getValue();
      return `${value.toLocaleString()} AMD`;
    },
  }),
  columnHelper.accessor("cashOutAmd", {
    header: i18next.t("cashbox.cashboxReport.columns.cashOut"),
    cell: (info) => {
      const value = info.getValue();
      return `${value.toLocaleString()} AMD`;
    },
  }),
  columnHelper.accessor("expectedClosingBalanceAmd", {
    header: i18next.t("cashbox.cashboxReport.columns.expectedClosingBalance"),
    cell: (info) => {
      const value = info.getValue();
      return `${value.toLocaleString()} AMD`;
    },
  }),
];
