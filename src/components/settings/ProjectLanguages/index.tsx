import { useState } from "react";
import { Button } from "@/ui-kit";
import styles from "./ProjectLanguages.module.css";
import { LanguagesContent } from "./LanguagesContent";
import { EditLanguageDropdown } from "./languagesActions/EditLanguageDropdown";
import { LANGUAGES } from "@/constants/settings";

const ProjectLanguages = () => {
  const [editingLanguageCode, setEditingLanguageCode] = useState<string | null>(
    null
  );
  const [editButtonRef, setEditButtonRef] =
    useState<React.RefObject<HTMLElement> | null>(null);

  const handleAddNewClick = () => {
    // TODO: Open modal for adding new language
    console.log("Add new language");
  };

  const handleEditClick = (
    languageCode: string,
    buttonRef: React.RefObject<HTMLElement>
  ) => {
    setEditButtonRef(buttonRef);
    setEditingLanguageCode(languageCode);
  };

  const handleCloseDropdown = () => {
    setEditingLanguageCode(null);
    setEditButtonRef(null);
  };

  const editingLanguage = editingLanguageCode
    ? LANGUAGES.find((lang) => lang.code === editingLanguageCode)
    : null;

  return (
    <div className={styles.projectLanguages}>
      <div className={styles.languagesSettings}>
        <LanguagesContent
          handleAddNewClick={handleAddNewClick}
          activeLanguageCode={editingLanguageCode}
          handleEditClick={handleEditClick}
        />
      </div>
      <EditLanguageDropdown
        open={editingLanguageCode !== null}
        languageKey={editingLanguage?.shortCode || ""}
        displayName={editingLanguage?.name || ""}
        isDefault={editingLanguage?.isDefault || false}
        enabled={true}
        anchorRef={editButtonRef || undefined}
        onOpenChange={(open) => {
          if (!open) handleCloseDropdown();
        }}
        onSave={() => {
          handleCloseDropdown();
        }}
        onDelete={() => {
          handleCloseDropdown();
        }}
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
