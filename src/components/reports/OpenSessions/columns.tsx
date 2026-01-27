import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import i18next from "i18next";

// types
import type { OpenSessionSummary } from "@/types/cash";

const columnHelper = createColumnHelper<OpenSessionSummary>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getOpenSessionsColumns = (): ColumnDef<OpenSessionSummary, any>[] => [
  columnHelper.accessor("sessionId", {
    header: i18next.t("cashbox.openSessions.columns.sessionId"),
    cell: (info) => `#${info.getValue()}`,
  }),
  columnHelper.accessor("cashBoxCode", {
    header: i18next.t("cashbox.openSessions.columns.cashBoxCode"),
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("operatorUsername", {
    header: i18next.t("cashbox.openSessions.columns.operator"),
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("openedAt", {
    header: i18next.t("cashbox.openSessions.columns.openedAt"),
    cell: (info) => new Date(info.getValue()).toLocaleString(),
  }),
  columnHelper.accessor("intakesOfferedCount", {
    header: i18next.t("cashbox.openSessions.columns.intakesOffered"),
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("intakesAcceptedCount", {
    header: i18next.t("cashbox.openSessions.columns.intakesAccepted"),
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("acceptedPowderKg", {
    header: i18next.t("cashbox.openSessions.columns.powderKg"),
    cell: (info) => `${info.getValue().toLocaleString()} kg`,
  }),
  columnHelper.accessor("purchasesAmd", {
    header: i18next.t("cashbox.openSessions.columns.purchases"),
    cell: (info) => `${info.getValue().toLocaleString()} AMD`,
  }),
  columnHelper.accessor("cashInAmd", {
    header: i18next.t("cashbox.openSessions.columns.cashIn"),
    cell: (info) => (
      <span style={{ color: "#22c55e", fontWeight: 600 }}>
        +{info.getValue().toLocaleString()} AMD
      </span>
    ),
  }),
  columnHelper.accessor("cashOutAmd", {
    header: i18next.t("cashbox.openSessions.columns.cashOut"),
    cell: (info) => (
      <span style={{ color: "#ef4444", fontWeight: 600 }}>
        -{info.getValue().toLocaleString()} AMD
      </span>
    ),
  }),
  columnHelper.accessor("diffAmd", {
    header: i18next.t("cashbox.openSessions.columns.difference"),
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
  columnHelper.accessor("lastActivityAt", {
    header: i18next.t("cashbox.openSessions.columns.lastActivity"),
    cell: (info) => new Date(info.getValue()).toLocaleString(),
  }),
];

