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
import styles from "./VehicleManagement.module.css";
import type { FC, Dispatch, SetStateAction } from "react";

export interface ExistingVehicleItem {
  id: string;
  name: string;
  enabled: boolean;
  photoUrl?: string;
}

interface VehicleContentProps {
  handleAddNew: () => void;
  newFieldValue: string;
  setNewFieldValue: Dispatch<SetStateAction<string>>;
  newPhotoUrl: string | null;
  setNewPhotoUrl: Dispatch<SetStateAction<string | null>>;
  handlePhotoUpload: (file: File) => void;
  setIsExistingExpanded: Dispatch<SetStateAction<boolean>>;
  isExistingExpanded: boolean;
  handleToggleEnabled: (id: string) => void;
  handleEdit: (id: string) => void;
  handleDelete: (id: string) => void;
  existingItems: ExistingVehicleItem[];
}

export const VehicleContent: FC<VehicleContentProps> = ({
  handleAddNew,
  newFieldValue,
  setNewFieldValue,
  newPhotoUrl,
  setNewPhotoUrl,
  handlePhotoUpload,
  setIsExistingExpanded,
  isExistingExpanded,
  handleToggleEnabled,
  handleEdit,
  handleDelete,
  existingItems,
}) => {
  const handlePhotoChange = (file: File) => {
    handlePhotoUpload(file);
    // Create a preview URL for the uploaded image
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewPhotoUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearPhoto = () => {
    setNewPhotoUrl(null);
  };

  return (
    <>
      {/* Create new one section */}
      <div className={styles.createNewSection}>
        <div className={styles.createNewHeader}>
          <h3 className={styles.createNewTitle}>Create new brand</h3>
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
            photoUpload={{
              onUpload: handlePhotoChange,
              imageUrl: newPhotoUrl || undefined,
            }}
            textInput={{
              value: newFieldValue,
              onChange: setNewFieldValue,
              placeholder: "Name here",
            }}
            actions={{
              cancel: {
                icon: <X size={14} color="#ffffff" />,
                onClick: () => {
                  setNewFieldValue("");
                  handleClearPhoto();
                },
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
                  displayIcon={
                    item.photoUrl ? (
                      <img
                        src={item.photoUrl}
                        alt={item.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "50%",
                        }}
                      />
                    ) : undefined
                  }
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
