import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import i18next from "i18next";
import { ChevronDown, ChevronRight } from "lucide-react";

// types
import type { PowderSaleAdjustments } from "@/types/warehouses/salesLots";
import { IconButton } from "@/ui-kit";
import { AdjustmentHelpHeader } from "./AdjustmentHelpHeader";

// styles
import styles from "./AdjustedSales.module.css";

const columnHelper = createColumnHelper<PowderSaleAdjustments>();

const getNumberClass = (value: number) => {
  if (value < 0) return styles.negative;
  if (value > 0) return styles.positive;
  return "";
};

const formatAmount = (amount: number, currencyCode: string) =>
  `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currencyCode}`;

const formatDifference = (amount: number, currencyCode: string) =>
  `${amount > 0 ? "+" : ""}${formatAmount(amount, currencyCode)}`;

export const getAdjustmentsColumns = (): ColumnDef<
  PowderSaleAdjustments,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
>[] => [
  columnHelper.display({
    id: "details",
    header: () => null,
    size: 42,
    cell: ({ row }) => (
      <IconButton
        type="button"
        variant="secondary"
        size="small"
        icon={row.getIsExpanded() ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        ariaLabel={i18next.t("common.details")}
        title={i18next.t("common.details")}
        className={styles.detailsButton}
        onClick={row.getToggleExpandedHandler()}
      />
    ),
  }),
  columnHelper.accessor("powderSaleId", {
    header: i18next.t("powderSales.adjustments.columns.powderSaleId"),
  }),
  columnHelper.group({
    id: "transactionCurrency",
    header: () => (
      <AdjustmentHelpHeader
        titleKey="powderSales.adjustments.groups.transactionCurrency"
        descriptionKey="powderSales.adjustments.helper.transactionCurrency"
      />
    ),
    columns: [
      columnHelper.accessor("oldAmount", {
        header: i18next.t("powderSales.adjustments.columns.originalAmount"),
        cell: ({ row, getValue }) => formatAmount(getValue(), row.original.currencyCode),
      }),
      columnHelper.accessor("newAmount", {
        header: i18next.t("powderSales.adjustments.columns.adjustedAmount"),
        cell: ({ row, getValue }) => formatAmount(getValue(), row.original.currencyCode),
      }),
      columnHelper.accessor("difference", {
        header: i18next.t("powderSales.adjustments.columns.difference"),
        cell: ({ row, getValue }) => (
          <span className={getNumberClass(getValue())}>
            {formatDifference(getValue(), row.original.currencyCode)}
          </span>
        ),
      }),
    ],
  }),
  columnHelper.group({
    id: "amdEquivalent",
    header: () => (
      <AdjustmentHelpHeader
        titleKey="powderSales.adjustments.groups.amdEquivalent"
        descriptionKey="powderSales.adjustments.helper.amdEquivalent"
      />
    ),
    columns: [
      columnHelper.accessor("oldAmountAmd", {
        header: i18next.t("powderSales.adjustments.columns.originalAmountAmd"),
        cell: (info) => `${info.getValue().toLocaleString()} AMD`,
      }),
      columnHelper.accessor("newAmountAmd", {
        header: i18next.t("powderSales.adjustments.columns.adjustedAmountAmd"),
        cell: (info) => `${info.getValue().toLocaleString()} AMD`,
      }),
      columnHelper.accessor("differenceAmd", {
        header: i18next.t("powderSales.adjustments.columns.differenceAmd"),
        cell: (info) => (
          <span className={getNumberClass(info.getValue())}>
            {`${info.getValue() > 0 ? "+" : ""}${info.getValue().toLocaleString()} AMD`}
          </span>
        ),
      }),
    ],
  }),
];
