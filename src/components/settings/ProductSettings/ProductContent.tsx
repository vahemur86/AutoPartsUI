import { useState, type Dispatch, type FC, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import type { ExistingItem } from "@/types/settings";

import { InteractiveField } from "@/ui-kit";
import { ChevronRight, ChevronDown, Pencil, Trash2 } from "lucide-react";
import styles from "./ProductSettings.module.css";

interface ProductContentProps {
  newFieldValue: string;
  setNewFieldValue: Dispatch<SetStateAction<string>>;
  setIsExistingExpanded: Dispatch<SetStateAction<boolean>>;
  isExistingExpanded: boolean;
  handleEdit: (id: string, newName: string) => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
  existingItems: ExistingItem[];
  isLoading?: boolean;
}

export const ProductContent: FC<ProductContentProps> = ({
  newFieldValue,
  setNewFieldValue,
  setIsExistingExpanded,
  isExistingExpanded,
  handleEdit,
  handleDelete,
  existingItems,
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
      <div className={styles.createNewSection}>
        <div className={styles.createNewHeader}>
          <h3 className={styles.createNewTitle}>
            {t("productSettings.createNew")}
          </h3>
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
      </div>

      {/* Existing section */}
      <div className={styles.existingSection}>
        <button
          className={styles.existingHeader}
          onClick={() => setIsExistingExpanded(!isExistingExpanded)}
          disabled={isLoading}
        >
          {isExistingExpanded ? (
            <ChevronDown size={16} color="#ffffff" />
          ) : (
            <ChevronRight size={16} color="#ffffff" />
          )}
          <span className={styles.existingTitle}>
            {t("productSettings.existing")}{" "}
            <span className={styles.existingCount}>
              ({existingItems.length})
            </span>
          </span>
        </button>

        {isExistingExpanded && (
          <div className={styles.existingItems}>
            {isLoading && existingItems.length === 0 ? (
              <div className={styles.loadingState}>
                {t("productSettings.loading")}
              </div>
            ) : existingItems.length === 0 ? (
              <div className={styles.emptyState}>
                {t("productSettings.noItems")}
              </div>
            ) : (
              existingItems.map((item) => (
                <div key={item.id} className={styles.existingItem}>
                  {editingId === item.id ? (
                    <InteractiveField
                      variant="editable"
                      size="medium"
                      textInput={{
                        value: editValue,
                        onChange: setEditValue,
                        placeholder: t("productSettings.keyHere"),
                      }}
                      actions={{
                        edit: {
                          icon: <span>✓</span>,
                          onClick: () => saveEdit(item.id),
                          ariaLabel: t("common.save"),
                        },
                        delete: {
                          icon: <span>✕</span>,
                          onClick: cancelEdit,
                          ariaLabel: t("common.cancel"),
                        },
                      }}
                    />
                  ) : (
                    <InteractiveField
                      variant="display"
                      size="medium"
                      displayText={item.name}
                      actions={{
                        edit: {
                          icon: <Pencil size={14} color="#ffffff" />,
                          onClick: () => startEdit(item),
                          ariaLabel: t("common.edit"),
                        },
                        delete: {
                          icon: <Trash2 size={14} color="#ffffff" />,
                          onClick: () => handleDeleteItem(item.id),
                          ariaLabel: t("common.delete"),
                        },
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
