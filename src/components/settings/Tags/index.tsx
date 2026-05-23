import { useState, useEffect, useRef, useMemo, useCallback, type FC } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { ConfirmationModal, DataTable, IconButton } from "@/ui-kit";

// icons
import { Plus } from "lucide-react";

// components
import { TagDropdown, type TagForm } from "./tagActions/TagDropdown";

// columns
import { getTagColumns } from "./columns";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addTag, editTag, fetchTags, removeTag } from "@/store/slices/tagsSlice";

// types
import type { Tag } from "@/types/settings";

// utils
import { getApiErrorMessage } from "@/utils";

// styles
import styles from "./Tags.module.css";

export const Tags: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { tags } = useAppSelector((state) => state.tags);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTag, setActiveTag] = useState<Tag | null>(null);
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const anchorRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    dispatch(fetchTags());
  }, [dispatch]);

  const handleOpenAdd = useCallback((e: React.MouseEvent<HTMLElement>) => {
    anchorRef.current = e.currentTarget;
    setActiveTag(null);
    setIsDropdownOpen(true);
  }, []);

  const handleOpenEdit = useCallback(
    (tag: Tag, e: React.MouseEvent<HTMLElement>) => {
      anchorRef.current = e.currentTarget;
      setActiveTag(tag);
      setIsDropdownOpen(true);
    },
    [],
  );

  const handleCloseDropdown = useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  const handleSaveTag = useCallback(
    async (data: TagForm) => {
      try {
        setIsMutating(true);
        if (activeTag) {
          await dispatch(editTag({ id: activeTag.id, ...data })).unwrap();
          toast.success(t("tags.success.updated"));
        } else {
          await dispatch(addTag(data)).unwrap();
          toast.success(t("tags.success.created"));
        }
        await dispatch(fetchTags()).unwrap();
        handleCloseDropdown();
      } catch (error: unknown) {
        console.error("Failed to save tag:", error);
        const errorMessage = getApiErrorMessage(
          error,
          activeTag ? t("tags.error.failedToUpdate") : t("tags.error.failedToCreate"),
        );
        toast.error(errorMessage);
      } finally {
        setIsMutating(false);
      }
    },
    [activeTag, dispatch, handleCloseDropdown, t],
  );

  const handleDeleteTag = useCallback(
    async (tag: Tag) => {
      try {
        setIsMutating(true);
        await dispatch(removeTag(tag.id)).unwrap();
        await dispatch(fetchTags()).unwrap();
        setDeletingTag(null);
        toast.success(t("tags.success.deleted"));
      } catch (error: unknown) {
        console.error("Failed to delete tag:", error);
        toast.error(getApiErrorMessage(error, t("tags.error.failedToDelete")));
      } finally {
        setIsMutating(false);
      }
    },
    [dispatch, t],
  );

  const columns = useMemo(
    () =>
      getTagColumns({
        onEdit: handleOpenEdit,
        onDelete: (tag) => setDeletingTag(tag),
      }),
    [handleOpenEdit],
  );

  return (
    <div className={styles.tagsWrapper}>
      <div className={styles.tagsHeader}>
        <div className={styles.addButtonWrapper}>
          <IconButton
            size="small"
            variant="primary"
            icon={<Plus size={12} color="#0e0f11" />}
            ariaLabel={t("tags.addTag")}
            className={styles.plusButton}
            onClick={handleOpenAdd}
          />
          <span className={styles.addButtonText}>{t("tags.addTag")}</span>
        </div>
      </div>

      <div className={styles.addButtonMobile}>
        <div className={styles.addButtonWrapperMobile}>
          <IconButton
            size="small"
            variant="primary"
            icon={<Plus size={12} />}
            ariaLabel={t("tags.addTag")}
            onClick={handleOpenAdd}
          />
          <span className={styles.addButtonText}>{t("tags.addTag")}</span>
        </div>
      </div>

      <TagDropdown
        open={isDropdownOpen}
        anchorRef={anchorRef}
        initialData={activeTag}
        isLoading={isMutating}
        onOpenChange={(open) => {
          if (!open) handleCloseDropdown();
        }}
        onSave={handleSaveTag}
      />

      {!!deletingTag && (
        <ConfirmationModal
          open={!!deletingTag}
          onOpenChange={(open) => !open && setDeletingTag(null)}
          title={t("tags.confirmation.deleteTitle")}
          description={t("tags.confirmation.deleteDescription", {
            name: deletingTag?.name,
          })}
          confirmText={
            isMutating ? t("tags.confirmation.deleting") : t("tags.confirmation.delete")
          }
          cancelText={t("common.cancel")}
          onConfirm={() => deletingTag && handleDeleteTag(deletingTag)}
          onCancel={() => setDeletingTag(null)}
        />
      )}

      <div className={styles.tableWrapper}>
        <DataTable data={tags} columns={columns} pageSize={10} />
      </div>
    </div>
  );
};
