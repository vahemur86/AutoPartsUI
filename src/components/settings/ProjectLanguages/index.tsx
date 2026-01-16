import { useEffect, useState, useRef, useCallback } from "react";
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

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as unknown as Error).message);
  }
  return fallback;
};

export const ProjectLanguages = () => {
  const [editingLanguageId, setEditingLanguageId] = useState<number | null>(
    null
  );
  const [isAddingLanguage, setIsAddingLanguage] = useState(false);

  const editAnchorRef = useRef<HTMLElement>(null);
  const addAnchorRef = useRef<HTMLElement>(null);

  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInitiatedRef = useRef(false);

  const fetchLanguages = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getLanguages();
      setLanguages(response);
    } catch (error: unknown) {
      console.error(error);
      toast.error(getErrorMessage(error, "Failed to load languages"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchInitiatedRef.current) return;
    fetchInitiatedRef.current = true;
    fetchLanguages();
  }, [fetchLanguages]);

  const handleAddNewClick = useCallback((anchorEl: HTMLElement | null) => {
    if (!anchorEl) return;
    addAnchorRef.current = anchorEl;
    setIsAddingLanguage(true);
  }, []);

  const handleEditClick = useCallback(
    (languageId: number, anchorEl: HTMLElement | null) => {
      if (!anchorEl) return;
      editAnchorRef.current = anchorEl;
      setEditingLanguageId(languageId);
    },
    []
  );

  const handleCloseEditDropdown = useCallback(() => {
    setEditingLanguageId(null);
    editAnchorRef.current = null;
  }, []);

  const handleCloseAddDropdown = useCallback(() => {
    setIsAddingLanguage(false);
    addAnchorRef.current = null;
  }, []);

  const unsetOtherDefaultLanguages = useCallback(
    async (excludeId?: number) => {
      const toUnset = languages.filter(
        (lang) => lang.isDefault && lang.id !== excludeId
      );

      if (toUnset.length === 0) return;

      try {
        await Promise.all(
          toUnset.map((lang) =>
            updateLanguage(
              lang.id,
              lang.code,
              lang.name,
              false,
              lang.isEnabled ?? true
            )
          )
        );
      } catch (error: unknown) {
        toast.error(
          getErrorMessage(error, "Failed to update default language")
        );
        throw error;
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
      } catch (error: unknown) {
        console.error(error);
        toast.error(getErrorMessage(error, "Failed to create language"));
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
      } catch (error: unknown) {
        console.error(error);
        toast.error(getErrorMessage(error, "Failed to update language"));
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
      } catch (error: unknown) {
        console.error(error);
        toast.error(getErrorMessage(error, "Failed to delete language"));
      }
    },
    [fetchLanguages, handleCloseEditDropdown]
  );

  const editingLanguage = editingLanguageId
    ? languages.find((lang) => lang.id === editingLanguageId) ?? null
    : null;

  return (
    <div className={styles.projectLanguages}>
      <div className={styles.languagesSettings}>
        <LanguagesContent
          languages={languages}
          isLoading={isLoading}
          onAddNewClick={handleAddNewClick}
          activeLanguageId={editingLanguageId}
          onEditClick={handleEditClick}
        />
      </div>

      {editingLanguage && (
        <EditLanguageDropdown
          open={editingLanguageId !== null}
          language={editingLanguage}
          anchorRef={editAnchorRef}
          onOpenChange={(open) => {
            if (!open) handleCloseEditDropdown();
          }}
          onSave={handleUpdateLanguage}
          onDelete={handleDeleteLanguage}
        />
      )}

      <AddLanguageDropdown
        open={isAddingLanguage}
        anchorRef={addAnchorRef}
        onOpenChange={(open) => {
          if (!open) handleCloseAddDropdown();
        }}
        onSave={handleAddLanguage}
      />

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
