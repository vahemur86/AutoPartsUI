import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import i18next from "i18next";
// ui-kit
import { Button } from "@/ui-kit";
// types
import type { CatalystBucket } from "@/types/settings";
// styles
import styles from "./CatalystBuckets.module.css";

const columnHelper = createColumnHelper<CatalystBucket>();

export const getCatalystBucketColumns = (
  withEdit: boolean,
  onEdit: (bucket: CatalystBucket, e: React.MouseEvent<HTMLElement>) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ColumnDef<CatalystBucket, any>[] => [
  columnHelper.accessor("code", {
    header: i18next.t("catalystBuckets.columns.code"),
  }),
  columnHelper.accessor("ptWeight", {
    header: i18next.t("catalystBuckets.columns.ptWeight"),
    cell: (info) => `${info.getValue()}g`,
  }),
  columnHelper.accessor("pdWeight", {
    header: i18next.t("catalystBuckets.columns.pdWeight"),
    cell: (info) => `${info.getValue()}g`,
  }),
  columnHelper.accessor("rhWeight", {
    header: i18next.t("catalystBuckets.columns.rhWeight"),
    cell: (info) => `${info.getValue()}g`,
  }),
  columnHelper.accessor("isActive", {
    header: i18next.t("catalystBuckets.columns.status"),
    cell: (info) =>
      `${
        info.getValue() === true
          ? i18next.t("catalystBuckets.columns.active")
          : i18next.t("catalystBuckets.columns.inactive")
      }`,
  }),
  columnHelper.display({
    id: "actions",
    header: i18next.t("common.actions"),
    cell: ({ row }) => {
      const bucket = row.original;
      return (
        <div className={styles.actionButtonsCell}>
          {withEdit && (
            <Button
              variant="primary"
              size="small"
              onClick={(e) => onEdit(bucket, e)}
            >
              {i18next.t("common.edit")}
            </Button>
          )}
        </div>
      );
    },
  }),
];
