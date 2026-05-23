import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import i18next from "i18next";

// ui-kit
import { Button } from "@/ui-kit";

// types
import type { Tag } from "@/types/settings";

// styles
import styles from "./Tags.module.css";

const columnHelper = createColumnHelper<Tag>();

export const getTagColumns = (
  {
    onEdit,
    onDelete,
  }: {
    onEdit: (tag: Tag, e: React.MouseEvent<HTMLElement>) => void;
    onDelete: (tag: Tag) => void;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ColumnDef<Tag, any>[] => [
  columnHelper.accessor("name", {
    header: i18next.t("tags.columns.name"),
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
        <Button
          variant="danger"
          size="small"
          onClick={() => onDelete(row.original)}
        >
          {i18next.t("common.delete")}
        </Button>
      </div>
    ),
  }),
];
