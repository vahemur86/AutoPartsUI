import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
// ui-kit
import { Button } from "@/ui-kit";
// components
import { LanguagesContent } from "./LanguagesContent";
import { EditLanguageDropdown } from "./languagesActions/EditLanguageDropdown";
import { AddLanguageDropdown } from "./languagesActions/AddLanguageDropdown";
// Redux
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchLanguages,
  addLanguage,
  updateLanguageInStore,
  removeLanguage,
} from "@/store/slices/languagesSlice";
// services
import { updateLanguage } from "@/services/settings/languages";
// types
import type { Language } from "@/types/settings";
// utils
import { getErrorMessage } from "@/utils";
import { updateI18nLanguage } from "@/utils/updateI18nLanguage";
// styles
import styles from "./ProjectLanguages.module.css";

export const ProjectLanguages = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { languages, isLoading } = useAppSelector((state) => state.languages);
  const [editingLanguageId, setEditingLanguageId] = useState<number | null>(
    null,
  );
  const [isAddingLanguage, setIsAddingLanguage] = useState(false);

  const editAnchorRef = useRef<HTMLElement>(null);
  const addAnchorRef = useRef<HTMLElement>(null);

  const fetchInitiatedRef = useRef(false);

  useEffect(() => {
    if (fetchInitiatedRef.current) return;
    fetchInitiatedRef.current = true;
    dispatch(fetchLanguages()).then((result) => {
      if (fetchLanguages.fulfilled.match(result)) {
        const defaultLanguage = result.payload.find(
          (lang: Language) => lang.isDefault,
        );
        if (defaultLanguage) {
          updateI18nLanguage(defaultLanguage.code);
        }
      } else if (fetchLanguages.rejected.match(result)) {
        toast.error(
          getErrorMessage(result.payload, t("languages.error.failedToLoad")),
        );
      }
    });
  }, [dispatch, t]);

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
        if (data.isDefault) {
          await unsetOtherDefaultLanguages();
        }

        const result = await dispatch(
          addLanguage({
            code: data.code,
            name: data.name,
            isDefault: data.isDefault,
            isEnabled: data.isEnabled,
          }),
        );

        if (addLanguage.fulfilled.match(result)) {
          if (data.isDefault) {
            updateI18nLanguage(data.code);
          }
          toast.success(t("languages.success.languageCreated"));
          handleCloseAddDropdown();
        } else {
          toast.error(
            getErrorMessage(
              result.payload,
              t("languages.error.failedToCreate"),
            ),
          );
        }
      } catch (error: unknown) {
        console.error(error);
        toast.error(
          getErrorMessage(error, t("languages.error.failedToCreate")),
        );
        // Revert on error by refetching
        dispatch(fetchLanguages());
      }
    },
    [dispatch, t, handleCloseAddDropdown, unsetOtherDefaultLanguages],
  );

  const handleUpdateLanguage = useCallback(
    async (data: Language) => {
      if (!editingLanguageId) return;

      try {
        const previousLanguage = languages.find((lang) => lang.id === data.id);
        const isBeingSetAsDefault =
          !previousLanguage?.isDefault && data.isDefault;

        if (data.isDefault) {
          await unsetOtherDefaultLanguages(data.id);
        }

        const result = await dispatch(
          updateLanguageInStore({
            id: data.id,
            code: data.code,
            name: data.name,
            isDefault: data.isDefault,
            isEnabled: data.isEnabled,
          }),
        );

        if (updateLanguageInStore.fulfilled.match(result)) {
          if (isBeingSetAsDefault) {
            updateI18nLanguage(data.code);
          }
          toast.success(t("languages.success.languageUpdated"));
          handleCloseEditDropdown();
        } else {
          toast.error(
            getErrorMessage(
              result.payload,
              t("languages.error.failedToUpdate"),
            ),
          );
        }
      } catch (error: unknown) {
        console.error(error);
        toast.error(
          getErrorMessage(error, t("languages.error.failedToUpdate")),
        );
        // Revert on error by refetching
        dispatch(fetchLanguages());
      }
    },
    [
      dispatch,
      editingLanguageId,
      languages,
      t,
      handleCloseEditDropdown,
      unsetOtherDefaultLanguages,
    ],
  );

  const handleDeleteLanguage = useCallback(
    async (id: number) => {
      try {
        const result = await dispatch(removeLanguage(id));

        if (removeLanguage.fulfilled.match(result)) {
          toast.success(t("languages.success.languageDeleted"));
          handleCloseEditDropdown();
        } else {
          toast.error(
            getErrorMessage(
              result.payload,
              t("languages.error.failedToDelete"),
            ),
          );
        }
      } catch (error: unknown) {
        console.error(error);
        toast.error(
          getErrorMessage(error, t("languages.error.failedToDelete")),
        );
        dispatch(fetchLanguages());
      }
    },
    [dispatch, t, handleCloseEditDropdown],
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
