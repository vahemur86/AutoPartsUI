import { useState, useEffect, useCallback, type FC } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { Button, ConfirmationModal, IconButton } from "@/ui-kit";

// icons
import { Hash, Pencil, Plus, Tag as TagIcon, Trash2 } from "lucide-react";

// components
import { TagDropdown, type TagForm } from "./tagActions/TagDropdown";
import { useMinimumLoadingDuration } from "@/hooks/useMinimumLoadingDuration";

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
  const { tags, isLoading, error } = useAppSelector((state) => state.tags);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTag, setActiveTag] = useState<Tag | null>(null);
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const showSkeleton = useMinimumLoadingDuration(isLoading && tags.length === 0);

  useEffect(() => {
    dispatch(fetchTags());
  }, [dispatch]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleOpenAdd = useCallback(() => {
    setActiveTag(null);
    setIsDropdownOpen(true);
  }, []);

  const handleOpenEdit = useCallback(
    (tag: Tag) => {
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

  return (
    <div className={styles.tagsWrapper}>
      <div className={styles.tagsHeader}>
        <div className={styles.headerMeta}>
          <h2>{t("tags.listTitle")}</h2>
          <span className={styles.countBadge}>{tags.length}</span>
        </div>
        <Button className={styles.createButton} onClick={handleOpenAdd}>
          <Plus size={16} />
          {t("tags.addTag")}
        </Button>
      </div>

      <TagDropdown
        open={isDropdownOpen}
        initialData={activeTag}
        isLoading={isMutating}
        onOpenChange={(open) => !open && handleCloseDropdown()}
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

      {showSkeleton ? (
        <div
          className={styles.cardGrid}
          aria-busy="true"
          aria-live="polite"
          aria-label={t("tags.loading")}
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className={styles.cardSkeleton}>
              <div className={styles.skeletonIcon} />
              <div className={styles.skeletonLines}>
                <span />
                <span />
              </div>
            </div>
          ))}
        </div>
      ) : tags.length === 0 ? (
        <div className={styles.emptyState}>
          <TagIcon size={24} aria-hidden="true" />
          <span>{t("tags.emptyState")}</span>
        </div>
      ) : (
        <div className={styles.cardGrid}>
          {tags.map((tag) => (
            <article className={styles.tagCard} key={tag.id}>
              <div className={styles.cardIdentity}>
                <span className={styles.tagIcon} aria-hidden="true">
                  <TagIcon size={18} />
                </span>
                <div className={styles.tagCopy}>
                  <span className={styles.cardEyebrow}>
                    {t("tags.columns.name")}
                  </span>
                  <h3>{tag.name}</h3>
                </div>
              </div>
              <footer className={styles.cardFooter}>
                <span className={styles.idBadge}>
                  <Hash size={12} aria-hidden="true" />
                  {tag.id}
                </span>
                <div className={styles.cardActions}>
                  <IconButton
                    variant="secondary"
                    size="medium"
                    icon={<Pencil size={15} />}
                    ariaLabel={`${t("common.edit")} ${tag.name}`}
                    title={`${t("common.edit")} ${tag.name}`}
                    onClick={() => handleOpenEdit(tag)}
                  />
                  <IconButton
                    variant="secondary"
                    size="medium"
                    className={styles.deleteAction}
                    icon={<Trash2 size={15} />}
                    ariaLabel={`${t("common.delete")} ${tag.name}`}
                    title={`${t("common.delete")} ${tag.name}`}
                    onClick={() => setDeletingTag(tag)}
                  />
                </div>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
