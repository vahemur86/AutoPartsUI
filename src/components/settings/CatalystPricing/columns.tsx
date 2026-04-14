import type { CatalystPricing } from "@/types/settings";
import { Button } from "@/ui-kit";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import i18next from "i18next";
import styles from "./CatalystPricing.module.css";

const columnHelper = createColumnHelper<CatalystPricing>();

export const getCatalystPricingColumns = (
  {
    onEdit,
  }: {
    onEdit: (rate: CatalystPricing, e: React.MouseEvent<HTMLElement>) => void;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ColumnDef<CatalystPricing, any>[] => [
  columnHelper.accessor("id", {
    header: i18next.t("catalystPricing.columns.id"),
  }),
  columnHelper.accessor("pdReducePercent", {
    header: i18next.t("catalystPricing.columns.pdReducePercent"),
    cell: (info) => `${info.getValue()?.toFixed(2)}%`,
  }),
  columnHelper.accessor("ptReducePercent", {
    header: i18next.t("catalystPricing.columns.ptReducePercent"),
    cell: (info) => `${info.getValue()?.toFixed(2)}%`,
  }),
  columnHelper.accessor("rhReducePercent", {
    header: i18next.t("catalystPricing.columns.rhReducePercent"),
    cell: (info) => `${info.getValue()?.toFixed(2)}%`,
  }),
  columnHelper.accessor("transportCost1UsdPerKg", {
    header: i18next.t("catalystPricing.columns.transportCost1UsdPerKg"),
    cell: (info) => `$${info.getValue()?.toFixed(2)}`,
  }),
  columnHelper.accessor("transportCost2UsdPerKg", {
    header: i18next.t("catalystPricing.columns.transportCost2UsdPerKg"),
    cell: (info) => `$${info.getValue()?.toFixed(2)}`,
  }),
  columnHelper.accessor("commissionPercent", {
    header: i18next.t("catalystPricing.columns.commissionPercent"),
    cell: (info) => `${info.getValue()?.toFixed(2)}%`,
  }),
  columnHelper.accessor("profitMargin", {
    header: i18next.t("catalystPricing.columns.profitMargin"),
    cell: (info) => `${info.getValue()?.toFixed(2)}%`,
  }),
  columnHelper.accessor("updatedAt", {
    header: i18next.t("catalystPricing.columns.updatedAt"),
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
  }),

  columnHelper.display({
    id: "actions",
    header: i18next.t("common.actions"),
    cell: ({ row }) => (
      <div className={styles.actionButtonsCell}>
        <Button
          variant="primary"
          size="small"
          onClick={(e) => onEdit(row.original, e)}
        >
          {i18next.t("common.edit")}
        </Button>
      </div>
    ),
  }),
];
