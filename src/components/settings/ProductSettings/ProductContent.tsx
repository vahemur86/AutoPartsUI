import { InteractiveField, IconButton } from "@/ui-kit";
import {
  Plus,
  X,
  Check,
  ChevronRight,
  ChevronDown,
  Pencil,
  Trash2,
} from "lucide-react";
import styles from "./ProductSettings.module.css";
import type { FC, Dispatch, SetStateAction } from "react";

export interface ExistingItem {
  id: string;
  name: string;
  enabled: boolean;
}

interface ProductSettingsProps {
  handleAddNew: () => void;
  newFieldValue: string;
  setNewFieldValue: Dispatch<SetStateAction<string>>;
  setIsExistingExpanded: Dispatch<SetStateAction<boolean>>;
  isExistingExpanded: boolean;
  handleToggleEnabled: (id: string) => void;
  handleEdit: (id: string) => void;
  handleDelete: (id: string) => void;
  existingItems: ExistingItem[];
}

export const ProductContent: FC<ProductSettingsProps> = ({
  handleAddNew,
  newFieldValue,
  setNewFieldValue,
  setIsExistingExpanded,
  isExistingExpanded,
  handleToggleEnabled,
  handleEdit,
  handleDelete,
  existingItems,
}) => {
  return (
    <>
      {/* Create new one section */}
      <div className={styles.createNewSection}>
        <div className={styles.createNewHeader}>
          <h3 className={styles.createNewTitle}>Create new one</h3>
          <div className={styles.addButtonWrapper}>
            <IconButton
              variant="primary"
              size="small"
              icon={<Plus size={12} color="#0e0f11" />}
              ariaLabel="Add New"
              onClick={handleAddNew}
            />
            <span className={styles.addButtonText}>Add New</span>
          </div>
        </div>

        <div className={styles.interactiveFieldsContainer}>
          <InteractiveField
            variant="editable"
            size="medium"
            textInput={{
              value: newFieldValue,
              onChange: setNewFieldValue,
              placeholder: "Name here",
            }}
            actions={{
              cancel: {
                icon: <X size={14} color="#ffffff" />,
                onClick: () => setNewFieldValue(""),
                ariaLabel: "Cancel",
              },
              save: {
                icon: <Check size={14} color="#ffffff" />,
                onClick: handleAddNew,
                ariaLabel: "Save",
              },
            }}
          />
        </div>
      </div>

      {/* Existing section */}
      <div className={styles.existingSection}>
        <button
          className={styles.existingHeader}
          onClick={() => setIsExistingExpanded(!isExistingExpanded)}
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
            {existingItems.map((item) => (
              <div key={item.id} className={styles.existingItem}>
                <InteractiveField
                  variant="display"
                  size="medium"
                  displayText={item.name}
                  toggle={{
                    checked: item.enabled,
                    onCheckedChange: () => handleToggleEnabled(item.id),
                    label: "Enabled",
                  }}
                  actions={{
                    edit: {
                      icon: <Pencil size={14} color="#ffffff" />,
                      onClick: () => handleEdit(item.id),
                      ariaLabel: "Edit",
                    },
                    delete: {
                      icon: <Trash2 size={14} color="#ffffff" />,
                      onClick: () => handleDelete(item.id),
                      ariaLabel: "Delete",
                    },
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
