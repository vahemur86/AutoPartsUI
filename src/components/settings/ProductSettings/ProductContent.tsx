import { useState, type Dispatch, type FC, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import type { LucideIcon } from "lucide-react";
import type { ExistingItem } from "@/types/settings";

import { IconButton, InteractiveField, TextField } from "@/ui-kit";
import { Check, Pencil, Plus, Tags, Trash2, X } from "lucide-react";
import styles from "./ProductSettings.module.css";

interface ProductContentProps {
  newFieldValue: string;
  setNewFieldValue: Dispatch<SetStateAction<string>>;
  handleEdit: (id: string, newName: string) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
  existingItems: ExistingItem[];
  itemLabel: string;
  itemIcon: LucideIcon;
  isLoading?: boolean;
}

export const ProductContent: FC<ProductContentProps> = ({
  newFieldValue,
  setNewFieldValue,
  handleEdit,
  handleDelete,
  existingItems,
  itemLabel,
  itemIcon: ItemIcon,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (item: ExistingItem) => {
    setEditingId(item.id);
    setEditValue(item.name);
  };

  const saveEdit = async (id: string) => {
    const trimmedValue = editValue.trim();

    if (!trimmedValue) {
      cancelEdit();
      return;
    }
    const originalItem = existingItems.find((item) => item.id === id);
    if (originalItem && originalItem.name === trimmedValue) {
      cancelEdit();
      return;
    }

    try {
      await handleEdit(id, trimmedValue);
      setEditingId(null);
      setEditValue("");
    } catch (error) {
      console.error("Failed to save edit:", error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await handleDelete(id);
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  return (
    <div className={styles.scrollableContent}>
      {/* Create new section */}
      <section className={styles.createNewSection} aria-labelledby="product-setting-create-title">
        <div className={styles.createNewHeader}>
          <div className={styles.settingSectionTitle}>
            <span className={styles.settingSectionIcon} aria-hidden="true">
              <Plus size={16} />
            </span>
            <div>
              <h3 id="product-setting-create-title" className={styles.createNewTitle}>
                {t("productSettings.createNew")}
              </h3>
              <span className={styles.createNewHint}>{itemLabel}</span>
            </div>
          </div>
        </div>

        <div className={styles.interactiveFieldsContainer}>
          <InteractiveField
            variant="editable"
            size="medium"
            textInput={{
              value: newFieldValue,
              onChange: setNewFieldValue,
              placeholder: t("productSettings.keyHere"),
            }}
          />
        </div>
      </section>

      {/* Existing section */}
      <div className={styles.existingSection}>
        <header className={styles.existingHeader}>
          <div className={styles.settingSectionTitle}>
            <span className={styles.settingSectionIcon} aria-hidden="true">
              <Tags size={16} />
            </span>
            <h3 className={styles.existingTitle}>{t("productSettings.existing")}</h3>
          </div>
          <span className={styles.existingCount}>{existingItems.length}</span>
        </header>

        {isLoading && existingItems.length === 0 ? (
          <div className={styles.entityCardGrid} aria-busy="true" aria-live="polite">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className={styles.entityCardSkeleton}>
                <div className={styles.entityCardIdentity}>
                  <div className={styles.entityCardIconSkeleton} />
                  <div className={styles.entityCardTextSkeleton} />
                </div>
                <div className={styles.entityCardFooterSkeleton} />
              </div>
            ))}
          </div>
        ) : existingItems.length === 0 ? (
          <div className={styles.emptyState}>
            <ItemIcon size={22} aria-hidden="true" />
            {t("productSettings.noItems")}
          </div>
        ) : (
          <div className={styles.entityCardGrid}>
            {existingItems.map((item) => (
              <article key={item.id} className={styles.entityCard}>
                <div className={styles.entityCardIdentity}>
                  <span className={styles.entityCardIcon} aria-hidden="true">
                    <ItemIcon size={18} />
                  </span>
                  <div className={styles.entityCardCopy}>
                    <span className={styles.entityCardEyebrow}>{itemLabel}</span>
                    {editingId === item.id ? (
                      <TextField
                        label={t("productSettings.keyHere")}
                        value={editValue}
                        onChange={(event) => setEditValue(event.target.value)}
                        autoFocus
                      />
                    ) : (
                      <h4>{item.name}</h4>
                    )}
                  </div>
                </div>

                <footer className={styles.entityCardFooter}>
                  <span className={styles.entityIdBadge}>
                    {t("columns.id")} #{item.id}
                  </span>
                  <div className={styles.entityCardActions}>
                    {editingId === item.id ? (
                      <>
                        <IconButton
                          variant="primary"
                          size="small"
                          icon={<Check size={14} />}
                          ariaLabel={t("common.save")}
                          title={t("common.save")}
                          onClick={() => void saveEdit(item.id)}
                          disabled={!editValue.trim()}
                        />
                        <IconButton
                          variant="secondary"
                          size="small"
                          icon={<X size={14} />}
                          ariaLabel={t("common.cancel")}
                          title={t("common.cancel")}
                          onClick={cancelEdit}
                        />
                      </>
                    ) : (
                      <>
                        <IconButton
                          variant="secondary"
                          size="small"
                          icon={<Pencil size={14} />}
                          ariaLabel={`${t("common.edit")} ${item.name}`}
                          title={t("common.edit")}
                          onClick={() => startEdit(item)}
                        />
                        <IconButton
                          variant="secondary"
                          size="small"
                          className={styles.entityDeleteAction}
                          icon={<Trash2 size={14} />}
                          ariaLabel={`${t("common.delete")} ${item.name}`}
                          title={t("common.delete")}
                          onClick={() => void handleDeleteItem(item.id)}
                        />
                      </>
                    )}
                  </div>
                </footer>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
