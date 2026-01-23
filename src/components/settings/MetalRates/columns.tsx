import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import i18next from "i18next";

// ui-kit
import { Button } from "@/ui-kit";

// types
import type { MetalRate } from "@/types/settings";

// styles
import styles from "./MetalRates.module.css";

const columnHelper = createColumnHelper<MetalRate>();

export const getMetalRateColumns = (
  {
    onEdit,
  }: { onEdit: (rate: MetalRate, e: React.MouseEvent<HTMLElement>) => void },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ColumnDef<MetalRate, any>[] => [
  columnHelper.accessor("currencyCode", {
    header: i18next.t("metals.columns.currency"),
  }),
  columnHelper.accessor("ptPricePerGram", {
    header: i18next.t("metals.columns.platinum"),
    cell: (info) => `$${info.getValue()?.toFixed(2)}`,
  }),
  columnHelper.accessor("pdPricePerGram", {
    header: i18next.t("metals.columns.palladium"),
    cell: (info) => `$${info.getValue()?.toFixed(2)}`,
  }),
  columnHelper.accessor("rhPricePerGram", {
    header: i18next.t("metals.columns.rhodium"),
    cell: (info) => `$${info.getValue()?.toFixed(2)}`,
  }),
  columnHelper.accessor("effectiveFrom", {
    header: i18next.t("metals.columns.effectiveFrom"),
    cell: (info) => new Date(info.getValue()).toLocaleDateString(),
  }),
  columnHelper.accessor("isActive", {
    header: i18next.t("metals.columns.status"),
    cell: (info) =>
      info.getValue()
        ? i18next.t("common.active")
        : i18next.t("common.inactive"),
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
