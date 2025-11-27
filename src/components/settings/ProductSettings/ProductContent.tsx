import { useState, type Dispatch, type FC, type SetStateAction } from "react";
import type { ExistingItem } from "@/types.ts/settings";

import { InteractiveField } from "@/ui-kit";
import { ChevronRight, ChevronDown, Pencil, Trash2 } from "lucide-react";
import styles from "./ProductSettings.module.css";

interface ProductContentProps {
  newFieldValue: string;
  setNewFieldValue: Dispatch<SetStateAction<string>>;
  setIsExistingExpanded: Dispatch<SetStateAction<boolean>>;
  isExistingExpanded: boolean;
  handleEdit: (id: string, newName: string) => void;
  handleDelete: (id: string) => void;
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = (item: ExistingItem) => {
    setEditingId(item.id);
    setEditValue(item.name);
  };

  const saveEdit = (id: string) => {
    if (editValue.trim()) {
      handleEdit(id, editValue.trim());
    }
    setEditingId(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  return (
    <div className={styles.scrollableContent}>
      {/* Create new section */}
      <div className={styles.createNewSection}>
        <div className={styles.createNewHeader}>
          <h3 className={styles.createNewTitle}>Create new one</h3>
        </div>

        <div className={styles.interactiveFieldsContainer}>
          <InteractiveField
            variant="editable"
            size="medium"
            textInput={{
              value: newFieldValue,
              onChange: setNewFieldValue,
              placeholder: "Key here",
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
            Existing{" "}
            <span className={styles.existingCount}>
              ({existingItems.length})
            </span>
          </span>
        </button>

        {isExistingExpanded && (
          <div className={styles.existingItems}>
            {isLoading && existingItems.length === 0 ? (
              <div className={styles.loadingState}>Loading...</div>
            ) : existingItems.length === 0 ? (
              <div className={styles.emptyState}>No items yet</div>
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
                        placeholder: "Key here",
                      }}
                      actions={{
                        edit: {
                          icon: <span>✓</span>,
                          onClick: () => saveEdit(item.id),
                          ariaLabel: "Save",
                        },
                        delete: {
                          icon: <span>✕</span>,
                          onClick: cancelEdit,
                          ariaLabel: "Cancel",
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
                          ariaLabel: "Edit",
                        },
                        delete: {
                          icon: <Trash2 size={14} color="#ffffff" />,
                          onClick: () => handleDelete(item.id),
                          ariaLabel: "Delete",
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
