import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import i18next from "i18next";
import {
  Banknote,
  ChartColumnIncreasing,
  CircleDollarSign,
  Layers3,
  PackageOpen,
  TrendingDown,
  TrendingUp,
  UserRound,
  Wallet,
  Weight,
  type LucideIcon,
} from "lucide-react";

// types
import type { SpecialCustomerBreakdown } from "@/types/warehouses/reports";
import styles from "./SpecialLotsReport.module.css";

const columnHelper = createColumnHelper<SpecialCustomerBreakdown>();

const formatKg = (value: number) =>
  `${(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })} kg`;

const formatAmd = (value: number) => `${(value ?? 0).toLocaleString()} AMD`;
const columnHeader = (Icon: LucideIcon, key: string) => (
  <span className={styles.columnHeader}>
    <Icon size={13} aria-hidden="true" />
    {i18next.t(key)}
  </span>
);

export const getSpecialLotsColumns = (): ColumnDef<
  SpecialCustomerBreakdown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
>[] => [
  columnHelper.accessor("specialCustomerName", {
    header: () => columnHeader(UserRound, "reports.specialLots.columns.customerName"),
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("totalLotsCount", {
    header: () => columnHeader(Layers3, "reports.specialLots.columns.totalLots"),
  }),
  columnHelper.accessor("totalPowderKg", {
    header: () => columnHeader(Weight, "reports.specialLots.columns.totalPowderKg"),
    cell: (info) => formatKg(info.getValue()),
  }),
  columnHelper.accessor("totalCostAmd", {
    header: () => columnHeader(Wallet, "reports.specialLots.columns.totalCostAmd"),
    cell: (info) => formatAmd(info.getValue()),
  }),
  columnHelper.accessor("remainingPowderKg", {
    header: () => columnHeader(PackageOpen, "reports.specialLots.columns.remainingPowderKg"),
    cell: (info) => formatKg(info.getValue()),
  }),
  columnHelper.accessor("remainingCostAmd", {
    header: () => columnHeader(CircleDollarSign, "reports.specialLots.columns.remainingCostAmd"),
    cell: (info) => formatAmd(info.getValue()),
  }),
  columnHelper.display({
    id: "soldPercent",
    header: () => columnHeader(ChartColumnIncreasing, "reports.specialLots.columns.soldPercent"),
    cell: ({ row }) => {
      const { totalPowderKg, remainingPowderKg } = row.original;
      if (!totalPowderKg) return "-";
      const percent =
        ((totalPowderKg - remainingPowderKg) / totalPowderKg) * 100;
      const progress = Math.max(0, Math.min(100, percent));
      return (
        <div className={styles.soldPercentCell} aria-label={`${percent.toFixed(1)}%`}>
          <span className={styles.soldPercentTrack} aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </span>
          <strong>{percent.toFixed(1)}%</strong>
        </div>
      );
    },
  }),
  columnHelper.accessor("revenueAmd", {
    header: () => columnHeader(Banknote, "reports.specialLots.columns.revenueAmd"),
    cell: (info) => formatAmd(info.getValue()),
  }),
  columnHelper.accessor("profitAmd", {
    header: () => columnHeader(TrendingUp, "reports.specialLots.columns.profitAmd"),
    cell: (info) => {
      const value = info.getValue() ?? 0;
      const ProfitIcon = value >= 0 ? TrendingUp : TrendingDown;
      return (
        <span className={`${styles.profitValue} ${value >= 0 ? styles.profitPositive : styles.profitNegative}`}>
          <ProfitIcon size={14} aria-hidden="true" />
          {formatAmd(value)}
        </span>
      );
    },
  }),
];
