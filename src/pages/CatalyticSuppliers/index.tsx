import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  Button,
  ConfirmationModal,
  DataTable,
  IconButton,
  TextField,
} from "@/ui-kit";
import { SectionHeader } from "@/components/common";
import {
  createCatalyticConverterSupplier,
  deleteCatalyticConverterSupplier,
  searchCatalyticConverterSuppliers,
  updateCatalyticConverterSupplier,
} from "@/services/settings/catalyticConverters";
import { getApiErrorMessage } from "@/utils";
import type {
  CatalyticConverterSupplier,
  CatalyticConverterSupplierLookup,
  CreateCatalyticConverterSupplierRequest,
} from "@/types/catalyticConverters";

import { SupplierModal } from "./components/SupplierModal";
import styles from "./CatalyticSuppliers.module.css";

const columnHelper = createColumnHelper<CatalyticConverterSupplierLookup>();

export const CatalyticSuppliers = () => {
  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const [items, setItems] = useState<CatalyticConverterSupplierLookup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] =
    useState<CatalyticConverterSupplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] =
    useState<CatalyticConverterSupplierLookup | null>(null);

  const loadSuppliers = useCallback(
    async (query: string) => {
      setIsLoading(true);
      try {
        const response = await searchCatalyticConverterSuppliers(
          query.trim() || undefined,
        );
        setItems(response);
      } catch (error) {
        toast.error(
          getApiErrorMessage(
            error,
            t("catalyticSuppliers.errors.failedToLoad"),
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadSuppliers(search);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [loadSuppliers, search]);

  const handleCreateClick = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (supplier: CatalyticConverterSupplierLookup) => {
    setEditingSupplier({
      id: supplier.id,
      fullName: supplier.fullName,
      phone: supplier.phone,
      notes: supplier.notes ?? null,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (
    payload: CreateCatalyticConverterSupplierRequest,
  ) => {
    setIsSubmitting(true);
    try {
      if (editingSupplier) {
        await updateCatalyticConverterSupplier(editingSupplier.id, payload);
        toast.success(t("catalyticSuppliers.success.updated"));
      } else {
        await createCatalyticConverterSupplier(payload);
        toast.success(t("catalyticSuppliers.success.created"));
      }

      setIsModalOpen(false);
      setEditingSupplier(null);
      await loadSuppliers(search);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, t("catalyticSuppliers.errors.failedToSave")),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSupplier) return;

    setIsSubmitting(true);
    try {
      await deleteCatalyticConverterSupplier(deletingSupplier.id);
      toast.success(t("catalyticSuppliers.success.deleted"));
      setDeletingSupplier(null);
      await loadSuppliers(search);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          t("catalyticSuppliers.errors.failedToDelete"),
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = useMemo<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ColumnDef<CatalyticConverterSupplierLookup, any>[]
  >(
    () => [
      columnHelper.accessor("id", {
        header: t("catalyticSuppliers.columns.id"),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("fullName", {
        header: t("catalyticSuppliers.columns.fullName"),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("phone", {
        header: t("catalyticSuppliers.columns.phone"),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("displayName", {
        header: t("catalyticSuppliers.columns.displayName"),
        cell: (info) => info.getValue(),
      }),
      columnHelper.display({
        id: "actions",
        header: t("common.actions"),
        cell: ({ row }) => (
          <div className={styles.rowActions}>
            <IconButton
              ariaLabel={t("common.edit")}
              variant="secondary"
              size="small"
              icon={<Pencil size={14} />}
              onClick={() => handleEditClick(row.original)}
            />
            <IconButton
              ariaLabel={t("common.delete")}
              variant="secondary"
              size="small"
              icon={<Trash2 size={14} />}
              onClick={() => setDeletingSupplier(row.original)}
            />
          </div>
        ),
      }),
    ],
    [t],
  );

  return (
    <>
      <SectionHeader
        title={t("catalyticSuppliers.title")}
        actions={
          <Button size="small" onClick={handleCreateClick}>
            <Plus size={16} />
            {t("catalyticSuppliers.actions.create")}
          </Button>
        }
      />

      <div className={styles.container}>
        <div className={styles.toolbar}>
          <TextField
            className={styles.searchField}
            label={t("catalyticSuppliers.searchLabel")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("catalyticSuppliers.searchPlaceholder")}
          />
        </div>

        <div className={styles.tableSection}>
          <h3 className={styles.tableTitle}>{t("catalyticSuppliers.list")}</h3>
          <div className={styles.helperRow}>
            <span>{t("catalyticSuppliers.helperText")}</span>
            {!isLoading && items.length === 0 && (
              <span className={styles.emptyText}>
                {t("catalyticSuppliers.emptyState")}
              </span>
            )}
          </div>

          <DataTable
            data={items}
            columns={columns}
            isLoading={isLoading}
            noResultsText={t("catalyticSuppliers.emptyState")}
          />
        </div>
      </div>

      <SupplierModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setEditingSupplier(null);
        }}
        onSave={handleSave}
        supplier={editingSupplier}
        isSubmitting={isSubmitting}
      />

      <ConfirmationModal
        open={!!deletingSupplier}
        onOpenChange={(open) => !open && setDeletingSupplier(null)}
        title={t("catalyticSuppliers.confirmation.deleteTitle")}
        description={t("catalyticSuppliers.confirmation.deleteDescription", {
          name: deletingSupplier?.fullName || deletingSupplier?.phone || "",
        })}
        confirmText={
          isSubmitting ? t("common.loading") : t("common.delete")
        }
        cancelText={t("common.cancel")}
        onConfirm={handleDelete}
        onCancel={() => setDeletingSupplier(null)}
      />
    </>
  );
};
