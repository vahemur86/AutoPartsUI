import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import i18next from "i18next";

// types
import type { ZReport } from "@/types/cash";

const columnHelper = createColumnHelper<ZReport>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getZReportColumns = (): ColumnDef<ZReport, any>[] => [
  columnHelper.accessor("id", {
    header: "ID",
    cell: (info) => `#${info.getValue()}`,
  }),
  columnHelper.accessor("openedAt", {
    header: i18next.t("cashbox.zReports.columns.openedAt"),
    cell: (info) => new Date(info.getValue()).toLocaleString(),
  }),
  columnHelper.accessor("closedAt", {
    header: i18next.t("cashbox.zReports.columns.closedAt"),
    cell: (info) => new Date(info.getValue()).toLocaleString(),
  }),
  columnHelper.accessor("intakeCount", {
    header: i18next.t("cashbox.zReports.columns.intakeCount"),
  }),
  columnHelper.accessor("totalPurchasesAmd", {
    header: i18next.t("cashbox.zReports.columns.totalPurchases"),
    cell: (info) => `${info.getValue().toLocaleString()} AMD`,
  }),
  columnHelper.accessor("totalCashInAmd", {
    header: i18next.t("cashbox.zReports.columns.cashIn"),
    cell: (info) => `${info.getValue().toLocaleString()} AMD`,
  }),
  columnHelper.accessor("totalCashOutAmd", {
    header: i18next.t("cashbox.zReports.columns.cashOut"),
    cell: (info) => `${info.getValue().toLocaleString()} AMD`,
  }),
  columnHelper.accessor("diffPurchasesVsCashOutAmd", {
    header: i18next.t("cashbox.zReports.columns.difference"),
    cell: (info) => {
      const val = info.getValue();
      const color = val < 0 ? "#ef4444" : val > 0 ? "#22c55e" : "inherit";
      return (
        <span style={{ color, fontWeight: 600 }}>
          {val.toLocaleString()} AMD
        </span>
      );
    },
  }),
];
