import { IconButton } from "@/ui-kit";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { Pencil } from "lucide-react";
import type { TranslationHistoryItem } from ".";

const columnHelper = createColumnHelper<TranslationHistoryItem>();

export const getTranslationColumns = (): ColumnDef<
  TranslationHistoryItem,
  any
>[] => [
  columnHelper.accessor("entityName", {
    header: "Entity name",
  }),
  columnHelper.accessor("entityId", {
    header: "Entity ID",
  }),
  columnHelper.accessor("fieldName", {
    header: "Field name",
  }),
  columnHelper.accessor("languageCode", {
    header: "Language code",
  }),
  columnHelper.accessor("value", {
    header: "Value",
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    cell: () => (
      <IconButton
        variant="secondary"
        size="small"
        icon={<Pencil size={14} color="#ffffff" />}
        ariaLabel="Edit"
        onClick={() => {}}
      />
    ),
  }),
];
