import i18next from "i18next";
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
    header: i18next.t("translation.columns.entityName"),
  }),
  columnHelper.accessor("entityId", {
    header: i18next.t("translation.columns.entityId"),
  }),
  columnHelper.accessor("fieldName", {
    header: i18next.t("translation.columns.fieldName"),
  }),
  columnHelper.accessor("languageCode", {
    header: i18next.t("translation.columns.languageCode"),
  }),
  columnHelper.accessor("value", {
    header: i18next.t("translation.columns.value"),
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    cell: () => (
      <IconButton
        variant="secondary"
        size="small"
        icon={<Pencil size={14} color="#ffffff" />}
        ariaLabel={i18next.t("common.edit")}
        onClick={() => {}}
      />
    ),
  }),
];
