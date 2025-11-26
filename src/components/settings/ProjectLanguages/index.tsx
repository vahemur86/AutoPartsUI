import { useEffect, useState, useRef } from "react";
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
    } catch (error) {
      console.error("Failed to load languages:", error);
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
    enabled: boolean;
  }) => {
    try {
      await createLanguage(data.languageKey, data.displayName);
      await fetchLanguages(); // Refresh the languages list
      handleCloseAddDropdown();
    } catch (error) {
      console.error("Failed to create language:", error);
      // TODO: Add error notification
    }
  };

  const handleUpdateLanguage = async (data: {
    id: number;
    languageKey: string;
    displayName: string;
  }) => {
    if (!editingLanguageId) return;

    try {
      await updateLanguage(data.id, data.languageKey, data.displayName);
      await fetchLanguages(); // Refresh the languages list
      handleCloseEditDropdown();
    } catch (error) {
      console.error("Failed to update language:", error);
      // TODO: Add error notification
    }
  };

  const handleDeleteLanguage = async (id: number) => {
    try {
      await deleteLanguage(id);
      await fetchLanguages(); // Refresh the languages list
      handleCloseEditDropdown();
    } catch (error) {
      console.error("Failed to delete language:", error);
      // TODO: Add error notification
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
