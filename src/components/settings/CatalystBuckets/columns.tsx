import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import i18next from "i18next";

// ui-kit
import { Button, Tooltip } from "@/ui-kit";

// types
import type {
  CatalystBucket,
  CatalystBucketByGroupItem,
} from "@/types/settings";

// styles
import styles from "./CatalystBuckets.module.css";

const bucketHelper = createColumnHelper<CatalystBucket>();
const groupHelper = createColumnHelper<CatalystBucketByGroupItem>();

export const getCatalystBucketColumns = ({
  withEdit,
  onEdit,
}: {
  withEdit: boolean;
  onEdit: (bucket: CatalystBucket, e: React.MouseEvent<HTMLElement>) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): ColumnDef<CatalystBucket, any>[] => [
  bucketHelper.accessor("code", {
    header: i18next.t("catalystBuckets.columns.code"),
  }),
  bucketHelper.accessor("weight", {
    header: i18next.t("catalystBuckets.columns.weight"),
    cell: (info) => `${info.getValue()}g`,
  }),
  bucketHelper.accessor("ptWeight", {
    header: i18next.t("catalystBuckets.columns.ptWeight"),
    cell: (info) => `${info.getValue()}g`,
  }),
  bucketHelper.accessor("pdWeight", {
    header: i18next.t("catalystBuckets.columns.pdWeight"),
    cell: (info) => `${info.getValue()}g`,
  }),
  bucketHelper.accessor("rhWeight", {
    header: i18next.t("catalystBuckets.columns.rhWeight"),
    cell: (info) => `${info.getValue()}g`,
  }),
  bucketHelper.accessor("isActive", {
    header: i18next.t("catalystBuckets.columns.status"),
    cell: (info) =>
      i18next.t(
        `catalystBuckets.columns.${info.getValue() ? "active" : "inactive"}`,
      ),
  }),
  bucketHelper.display({
    id: "actions",
    header: i18next.t("common.actions"),
    cell: ({ row }) => (
      <div className={styles.actionButtonsCell}>
        {withEdit && (
          <Button
            variant="primary"
            size="small"
            onClick={(e) => onEdit(row.original, e)}
          >
            {i18next.t("common.edit")}
          </Button>
        )}
      </div>
    ),
  }),
];

export const getGroupCodeColumns = (): ColumnDef<
  CatalystBucketByGroupItem,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
>[] => [
  groupHelper.accessor("code", {
    header: i18next.t("catalystBuckets.columns.code"),
  }),
  groupHelper.accessor("weight", {
    header: i18next.t("catalystBuckets.columns.weight"),
    cell: (info) => `${info.getValue()}g`,
  }),
  groupHelper.accessor("ptWeight", {
    header: i18next.t("catalystBuckets.columns.ptWeight"),
    cell: (info) => `${info.getValue()}g`,
  }),
  groupHelper.accessor("pdWeight", {
    header: i18next.t("catalystBuckets.columns.pdWeight"),
    cell: (info) => `${info.getValue()}g`,
  }),
  groupHelper.accessor("rhWeight", {
    header: i18next.t("catalystBuckets.columns.rhWeight"),
    cell: (info) => `${info.getValue()}g`,
  }),
  groupHelper.accessor("prices", {
    header: i18next.t("catalystBuckets.columns.price"),
    cell: (info) => {
      const prices = info.getValue() as Record<string, number>;
      const usdPrice = prices.USD?.toLocaleString() || "0";

      return (
        <Tooltip
          content={
            <div className={styles.currencyList}>
              {Object.entries(prices).map(([code, val]) => (
                <div key={code} className={styles.currencyItem}>
                  <span className={styles.currencyCode}>{code}:</span>
                  <span className={styles.currencyValue}>
                    {val.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          }
        >
          <span className={styles.priceTrigger}>{usdPrice} USD</span>
        </Tooltip>
      );
    },
  }),
];
