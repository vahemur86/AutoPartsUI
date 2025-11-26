import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { Button } from "@/ui-kit";
import styles from "./ProjectLanguages.module.css";
import { LanguagesContent } from "./LanguagesContent";
import { EditLanguageDropdown } from "./languagesActions/EditLanguageDropdown";
import { AddLanguageDropdown } from "./languagesActions/AddLanguageDropdown";
import {
  getLanguages,
  createLanguage,
  deleteLanguage,
  updateLanguage,
} from "@/services/settings/languages";
import type { Language } from "@/types.ts/settings";

const ProjectLanguages = () => {
  const [editingLanguageId, setEditingLanguageId] = useState<number | null>(
    null
  );
  const [addLanguageCode, setAddLanguageCode] = useState<string | null>(null);
  const [editButtonRef, setEditButtonRef] =
    useState<React.RefObject<HTMLElement> | null>(null);
  const [addButtonRef, setAddButtonRef] =
    useState<React.RefObject<HTMLElement> | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchInitiatedRef = useRef(false);

  const fetchLanguages = async () => {
    try {
      setIsLoading(true);
      const response = await getLanguages();
      setLanguages(response);
    } catch (error: any) {
      console.error("Failed to load languages:", error);
      toast.error(error.message || "Failed to load languages");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (fetchInitiatedRef.current) {
      return;
    }
    fetchInitiatedRef.current = true;

    fetchLanguages();
  }, []);

  const handleAddNewClick = (buttonRef: React.RefObject<HTMLElement>) => {
    if (buttonRef.current) {
      setAddButtonRef(buttonRef);
      setAddLanguageCode("new");
    }
  };

  const handleEditClick = (
    languageId: number,
    buttonRef: React.RefObject<HTMLElement>
  ) => {
    setEditButtonRef(buttonRef);
    setEditingLanguageId(languageId);
  };

  const handleCloseEditDropdown = () => {
    setEditingLanguageId(null);
    setEditButtonRef(null);
  };

  const handleCloseAddDropdown = () => {
    setAddLanguageCode(null);
    setAddButtonRef(null);
  };

  const handleAddLanguage = async (data: {
    languageKey: string;
    displayName: string;
    isDefault: boolean;
    isEnabled: boolean;
  }) => {
    try {
      // If setting this language as default, unset all other default languages
      if (data.isDefault) {
        const defaultLanguages = languages.filter((lang) => lang.isDefault);
        // Unset other default languages
        for (const lang of defaultLanguages) {
          try {
            await updateLanguage(
              lang.id,
              lang.code,
              lang.name,
              false,
              lang.isEnabled ?? true
            );
          } catch (error: any) {
            toast.error(error.message || "Failed to update default language");
            return;
          }
        }
      }
      await createLanguage(
        data.languageKey,
        data.displayName,
        data.isDefault,
        data.isEnabled
      );
      toast.success("Language created successfully");
      await fetchLanguages(); // Refresh the languages list
      handleCloseAddDropdown();
    } catch (error: any) {
      console.error("Failed to create language:", error);
      toast.error(error.message || "Failed to create language");
    }
  };

  const handleUpdateLanguage = async (data: {
    id: number;
    languageKey: string;
    displayName: string;
    isDefault: boolean;
    isEnabled: boolean;
  }) => {
    if (!editingLanguageId) return;

    try {
      // If setting this language as default, unset all other default languages
      if (data.isDefault) {
        const otherDefaultLanguages = languages.filter(
          (lang) => lang.id !== data.id && lang.isDefault
        );
        // Unset other default languages
        for (const lang of otherDefaultLanguages) {
          try {
            await updateLanguage(
              lang.id,
              lang.code,
              lang.name,
              false,
              lang.isEnabled ?? true
            );
          } catch (error: any) {
            toast.error(error.message || "Failed to update default language");
            return;
          }
        }
      }
      await updateLanguage(
        data.id,
        data.languageKey,
        data.displayName,
        data.isDefault,
        data.isEnabled
      );
      toast.success("Language updated successfully");
      await fetchLanguages(); // Refresh the languages list
      handleCloseEditDropdown();
    } catch (error: any) {
      console.error("Failed to update language:", error);
      toast.error(error.message || "Failed to update language");
    }
  };

  const handleDeleteLanguage = async (id: number) => {
    try {
      await deleteLanguage(id);
      toast.success("Language deleted successfully");
      await fetchLanguages(); // Refresh the languages list
      handleCloseEditDropdown();
    } catch (error: any) {
      console.error("Failed to delete language:", error);
      toast.error(error.message || "Failed to delete language");
    }
  };

  const editingLanguage = editingLanguageId
    ? languages.find((lang) => lang.id === editingLanguageId)
    : null;

  return (
    <div className={styles.projectLanguages}>
      <div className={styles.languagesSettings}>
        <LanguagesContent
          languages={languages}
          isLoading={isLoading}
          handleAddNewClick={handleAddNewClick}
          activeLanguageId={editingLanguageId}
          handleEditClick={handleEditClick}
        />
      </div>
      {!!editingLanguage && (
        <EditLanguageDropdown
          open={editingLanguageId !== null}
          language={editingLanguage}
          anchorRef={editButtonRef || undefined}
          onOpenChange={(open) => {
            if (!open) handleCloseEditDropdown();
          }}
          onSave={handleUpdateLanguage}
          onDelete={handleDeleteLanguage}
        />
      )}
      <AddLanguageDropdown
        open={addLanguageCode !== null}
        anchorRef={addButtonRef || undefined}
        onOpenChange={(open) => {
          if (!open) handleCloseAddDropdown();
        }}
        onSave={handleAddLanguage}
      />
      {/* Action buttons */}
      <div className={styles.actionButtons}>
        <Button variant="secondary" size="medium" onClick={() => {}}>
          Cancel
        </Button>
        <Button variant="primary" size="medium" onClick={() => {}}>
          Save
        </Button>
      </div>
    </div>
  );
};

export default ProjectLanguages;
