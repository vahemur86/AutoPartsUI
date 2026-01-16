import {
  useEffect,
  useState,
  useRef,
  useCallback,
  type RefObject,
} from "react";
import { toast } from "react-toastify";
import { Button } from "@/ui-kit";
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
import styles from "./ProjectLanguages.module.css";

export const ProjectLanguages = () => {
  const [editingLanguageId, setEditingLanguageId] = useState<number | null>(
    null
  );
  const [isAddingLanguage, setIsAddingLanguage] = useState(false);
  const [editButtonRef, setEditButtonRef] =
    useState<RefObject<HTMLElement> | null>(null);
  const [addButtonRef, setAddButtonRef] =
    useState<RefObject<HTMLElement> | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchInitiatedRef = useRef(false);

  const fetchLanguages = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getLanguages();
      setLanguages(response);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to load languages");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchInitiatedRef.current) return;
    fetchInitiatedRef.current = true;
    fetchLanguages();
  }, [fetchLanguages]);

  const handleAddNewClick = useCallback((buttonRef: RefObject<HTMLElement>) => {
    if (buttonRef.current) {
      setAddButtonRef(buttonRef);
      setIsAddingLanguage(true);
    }
  }, []);

  const handleEditClick = useCallback(
    (languageId: number, buttonRef: RefObject<HTMLElement>) => {
      setEditButtonRef(buttonRef);
      setEditingLanguageId(languageId);
    },
    []
  );

  const handleCloseEditDropdown = useCallback(() => {
    setEditingLanguageId(null);
    setEditButtonRef(null);
  }, []);

  const handleCloseAddDropdown = useCallback(() => {
    setIsAddingLanguage(false);
    setAddButtonRef(null);
  }, []);

  // Helper function to unset other default languages
  const unsetOtherDefaultLanguages = useCallback(
    async (excludeId?: number) => {
      const defaultLanguages = languages.filter(
        (lang) => lang.isDefault && lang.id !== excludeId
      );

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
          throw error;
        }
      }
    },
    [languages]
  );

  const handleAddLanguage = useCallback(
    async (data: Omit<Language, "id">) => {
      try {
        if (data.isDefault) {
          await unsetOtherDefaultLanguages();
        }

        await createLanguage(
          data.code,
          data.name,
          data.isDefault,
          data.isEnabled
        );

        toast.success("Language created successfully");
        await fetchLanguages();
        handleCloseAddDropdown();
      } catch (error: any) {
        console.error(error);
        toast.error(error.message || "Failed to create language");
      }
    },
    [unsetOtherDefaultLanguages, fetchLanguages, handleCloseAddDropdown]
  );

  const handleUpdateLanguage = useCallback(
    async (data: Language) => {
      if (!editingLanguageId) return;

      try {
        if (data.isDefault) {
          await unsetOtherDefaultLanguages(data.id);
        }

        await updateLanguage(
          data.id,
          data.code,
          data.name,
          data.isDefault,
          data.isEnabled
        );

        toast.success("Language updated successfully");
        await fetchLanguages();
        handleCloseEditDropdown();
      } catch (error: any) {
        console.error(error);
        toast.error(error.message || "Failed to update language");
      }
    },
    [
      editingLanguageId,
      unsetOtherDefaultLanguages,
      fetchLanguages,
      handleCloseEditDropdown,
    ]
  );

  const handleDeleteLanguage = useCallback(
    async (id: number) => {
      try {
        await deleteLanguage(id);
        toast.success("Language deleted successfully");
        await fetchLanguages();
        handleCloseEditDropdown();
      } catch (error: any) {
        console.error(error);
        toast.error(error.message || "Failed to delete language");
      }
    },
    [fetchLanguages, handleCloseEditDropdown]
  );

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

      {editingLanguage && (
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
        open={isAddingLanguage}
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
