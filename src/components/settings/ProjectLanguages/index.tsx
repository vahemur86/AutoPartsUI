import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
// ui-kit
import { Button } from "@/ui-kit";
// components
import { LanguagesContent } from "./LanguagesContent";
import { EditLanguageDropdown } from "./languagesActions/EditLanguageDropdown";
import { AddLanguageDropdown } from "./languagesActions/AddLanguageDropdown";
// services
import {
  getLanguages,
  createLanguage,
  deleteLanguage,
  updateLanguage,
} from "@/services/settings/languages";
// types
import type { Language } from "@/types/settings";
// utils
import { getErrorMessage } from "@/utils";
import { updateI18nLanguage } from "@/utils/updateI18nLanguage";
// styles
import styles from "./ProjectLanguages.module.css";

export const ProjectLanguages = () => {
  const { t } = useTranslation();
  const [editingLanguageId, setEditingLanguageId] = useState<number | null>(
    null,
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

      const defaultLanguage = response.find((lang: Language) => lang.isDefault);
      if (defaultLanguage) {
        updateI18nLanguage(defaultLanguage.code);
      }
    } catch (error: unknown) {
      console.error(error);
      toast.error(getErrorMessage(error, t("languages.error.failedToLoad")));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

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
    [],
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
        (lang) => lang.isDefault && lang.id !== excludeId,
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
              lang.isEnabled ?? true,
            ),
          ),
        );
      } catch (error: unknown) {
        toast.error(
          getErrorMessage(error, t("languages.error.failedToUpdateDefault")),
        );
        throw error;
      }
    },
    [languages, t],
  );

  const handleAddLanguage = useCallback(
    async (data: Omit<Language, "id">) => {
      try {
        let updatedLanguages = [...languages];
        if (data.isDefault) {
          updatedLanguages = updatedLanguages.map((lang) =>
            lang.isDefault ? { ...lang, isDefault: false } : lang,
          );

          await unsetOtherDefaultLanguages();
        }

        const newLanguage = await createLanguage(
          data.code,
          data.name,
          data.isDefault,
          data.isEnabled,
        );

        setLanguages([...updatedLanguages, newLanguage]);

        if (data.isDefault) {
          updateI18nLanguage(data.code);
        }

        toast.success(t("languages.success.languageCreated"));
        handleCloseAddDropdown();
      } catch (error: unknown) {
        console.error(error);
        toast.error(
          getErrorMessage(error, t("languages.error.failedToCreate")),
        );
        // Revert on error by refetching
        await fetchLanguages();
      }
    },
    [
      languages,
      t,
      handleCloseAddDropdown,
      unsetOtherDefaultLanguages,
      fetchLanguages,
    ],
  );

  const handleUpdateLanguage = useCallback(
    async (data: Language) => {
      if (!editingLanguageId) return;

      try {
        const previousLanguage = languages.find((lang) => lang.id === data.id);
        const isBeingSetAsDefault =
          !previousLanguage?.isDefault && data.isDefault;

        let updatedLanguages = [...languages];
        if (data.isDefault) {
          updatedLanguages = updatedLanguages.map((lang) =>
            lang.id !== data.id && lang.isDefault
              ? { ...lang, isDefault: false }
              : lang,
          );

          await unsetOtherDefaultLanguages(data.id);
        }

        const updatedLanguage = await updateLanguage(
          data.id,
          data.code,
          data.name,
          data.isDefault,
          data.isEnabled,
        );

        updatedLanguages = updatedLanguages.map((lang) =>
          lang.id === data.id ? updatedLanguage : lang,
        );
        setLanguages(updatedLanguages);

        if (isBeingSetAsDefault) {
          updateI18nLanguage(data.code);
        }

        toast.success(t("languages.success.languageUpdated"));
        handleCloseEditDropdown();
      } catch (error: unknown) {
        console.error(error);
        toast.error(
          getErrorMessage(error, t("languages.error.failedToUpdate")),
        );
        // Revert on error by refetching
        await fetchLanguages();
      }
    },
    [
      editingLanguageId,
      languages,
      t,
      handleCloseEditDropdown,
      unsetOtherDefaultLanguages,
      fetchLanguages,
    ],
  );

  const handleDeleteLanguage = useCallback(
    async (id: number) => {
      try {
        await deleteLanguage(id);

        setLanguages(languages.filter((lang) => lang.id !== id));

        toast.success(t("languages.success.languageDeleted"));
        handleCloseEditDropdown();
      } catch (error: unknown) {
        console.error(error);
        toast.error(
          getErrorMessage(error, t("languages.error.failedToDelete")),
        );
        await fetchLanguages();
      }
    },
    [languages, t, handleCloseEditDropdown, fetchLanguages],
  );

  const editingLanguage = editingLanguageId
    ? (languages.find((lang) => lang.id === editingLanguageId) ?? null)
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
          {t("common.cancel")}
        </Button>

        <Button variant="primary" size="medium" onClick={() => {}}>
          {t("common.save")}
        </Button>
      </div>
    </div>
  );
};
