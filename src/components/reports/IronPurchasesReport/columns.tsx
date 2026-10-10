import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import i18next from "i18next";
import {
  BadgeDollarSign,
  CalendarClock,
  CarFront,
  CircleDollarSign,
  Hash,
  Phone,
  Tag,
  UserRound,
  Weight,
  type LucideIcon,
} from "lucide-react";

import type { IronPurchasesReportItem } from "@/types/ironCarShop";
import styles from "./IronPurchasesReport.module.css";

const columnHelper = createColumnHelper<IronPurchasesReportItem>();
const columnHeader = (Icon: LucideIcon, key: string) => (
  <span className={styles.columnHeader}>
    <Icon size={13} aria-hidden="true" />
    {i18next.t(key)}
  </span>
);

export const getIronPurchasesReportColumns = (): ColumnDef<
  IronPurchasesReportItem,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
>[] => [
  columnHelper.display({
    id: "purchaseId",
    header: () => columnHeader(Hash, "reports.ironPurchases.columns.purchaseId"),
    cell: (info) => {
      const row = info.row.original;
      const value = row.purchaseId ?? row.id;
      return value ? `#${value}` : "-";
    },
  }),
  columnHelper.accessor("dictBrandId", {
    header: () => columnHeader(CarFront, "reports.ironPurchases.columns.dictBrandId"),
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("brandName", {
    header: () => columnHeader(Tag, "reports.ironPurchases.columns.brandName"),
    cell: (info) => info.getValue() || "-",
  }),
  columnHelper.accessor("ironTypeName", {
    header: () => columnHeader(Weight, "reports.ironPurchases.columns.ironTypeName"),
    cell: (info) => info.getValue() || "-",
  }),
  columnHelper.accessor("operatorUserId", {
    header: () => columnHeader(UserRound, "reports.ironPurchases.columns.operatorUserId"),
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("sessionId", {
    header: () => columnHeader(Hash, "reports.ironPurchases.columns.sessionId"),
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("customerPhone", {
    header: () => columnHeader(Phone, "reports.ironPurchases.columns.customerPhone"),
    cell: (info) => info.getValue() || "-",
  }),
  columnHelper.accessor("weightKg", {
    header: () => columnHeader(Weight, "reports.ironPurchases.columns.weightKg"),
    cell: (info) => {
      const value = info.getValue() as number | undefined;
      return value != null ? `${value.toLocaleString()} kg` : "-";
    },
  }),
  columnHelper.accessor("pricePerKg", {
    header: () => columnHeader(CircleDollarSign, "reports.ironPurchases.columns.pricePerKg"),
    cell: (info) => {
      const value = info.getValue() as number | undefined;
      return value != null ? `${value.toLocaleString()} AMD` : "-";
    },
  }),
  columnHelper.accessor("totalAmount", {
    header: () => columnHeader(BadgeDollarSign, "reports.ironPurchases.columns.totalAmount"),
    cell: (info) => {
      const value = info.getValue() as number | undefined;
      return value != null ? (
        <span className={styles.totalPriceCell}>{`${value.toLocaleString()} AMD`}</span>
      ) : (
        "-"
      );
    },
  }),
  columnHelper.accessor("purchasedAt", {
    header: () => columnHeader(CalendarClock, "reports.ironPurchases.columns.purchasedAt"),
    cell: (info) => {
      const value = info.getValue() as string | undefined;
      return value
        ? new Date(value).toLocaleString(undefined, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-";
    },
  }),
];
