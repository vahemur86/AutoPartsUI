import { useEffect, useState } from "react";
import styles from "./LanguageDropdown.module.css";
import { Button, Checkbox, Switch, TextField, Dropdown } from "@/ui-kit";
import type { Language } from "@/types.ts/settings";

export interface EditLanguageDropdownProps {
  open: boolean;
  language: Language;
  anchorRef?: React.RefObject<HTMLElement>;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    id: number;
    languageKey: string;
    displayName: string;
    isDefault: boolean;
    isEnabled: boolean;
  }) => void;
  onDelete?: (id: number) => void;
}

export const EditLanguageDropdown = ({
  open,
  language,
  anchorRef,
  onOpenChange,
  onSave,
  onDelete,
}: EditLanguageDropdownProps) => {
  const [displayNameValue, setDisplayNameValue] = useState(language.name);
  const [isDefaultValue, setIsDefaultValue] = useState(
    language.isDefault ?? false
  );
  const [enabledValue, setEnabledValue] = useState(language.isEnabled ?? true);

  useEffect(() => {
    if (open) {
      setDisplayNameValue(language.name);
      setIsDefaultValue(language.isDefault ?? false);
      setEnabledValue(language.isEnabled ?? true);
    }
  }, [open, language]);

  const handleSaveClick = () => {
    if (!displayNameValue.trim()) {
      // TODO: Add validation/error handling
      return;
    }

    onSave({
      id: language.id,
      languageKey: language.code,
      displayName: displayNameValue.trim(),
      isDefault: isDefaultValue,
      isEnabled: enabledValue,
    });
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dropdown
      open={open}
      onOpenChange={onOpenChange}
      anchorRef={anchorRef}
      align="start"
      side="left"
      title="Edit Language"
    >
      {/* Desktop header */}
      <div className={styles.header}>
        <span className={styles.title}>Edit Language</span>
      </div>

      <div className={styles.content}>
        <div className={styles.fields}>
          <TextField label="Language key" value={language.code} disabled />
          <TextField
            label="Display name"
            value={displayNameValue}
            onChange={(e) => setDisplayNameValue(e.target.value)}
          />
        </div>

        <div className={styles.toggles}>
          <span className={styles.sectionTitle}>Default Language</span>
          <Checkbox
            checked={isDefaultValue}
            onCheckedChange={setIsDefaultValue}
            label="Use as Default language"
          />
        </div>

        <Switch
          checked={enabledValue}
          onCheckedChange={setEnabledValue}
          label="Enabled"
          disabled={language.isDefault}
        />

        <div className={styles.actions}>
          {onDelete && (
            <Button
              variant="secondary"
              size="medium"
              onClick={() => {
                onDelete(language.id);
              }}
              className={styles.deleteButton}
              disabled={language.isDefault}
            >
              Delete language
            </Button>
          )}

          <div className={styles.primaryActions}>
            <Button variant="secondary" size="medium" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" size="medium" onClick={handleSaveClick}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </Dropdown>
  );
};
