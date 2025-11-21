import { useEffect, useState } from "react";
import styles from "./EditLanguageDropdown.module.css";
import { Button, Checkbox, Switch, TextField, Dropdown } from "@/ui-kit";

export interface EditLanguageDropdownProps {
  open: boolean;
  languageKey: string;
  displayName: string;
  isDefault: boolean;
  enabled: boolean;
  anchorRef?: React.RefObject<HTMLElement>;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    languageKey: string;
    displayName: string;
    isDefault: boolean;
    enabled: boolean;
  }) => void;
  onDelete?: () => void;
}

export const EditLanguageDropdown = ({
  open,
  languageKey,
  displayName,
  isDefault,
  enabled,
  anchorRef,
  onOpenChange,
  onSave,
  onDelete,
}: EditLanguageDropdownProps) => {
  const [displayNameValue, setDisplayNameValue] = useState(displayName);
  const [isDefaultValue, setIsDefaultValue] = useState(isDefault);
  const [enabledValue, setEnabledValue] = useState(enabled);

  useEffect(() => {
    if (open) {
      setDisplayNameValue(displayName);
      setIsDefaultValue(isDefault);
      setEnabledValue(enabled);
    }
  }, [open, displayName, isDefault, enabled]);

  const handleSaveClick = () => {
    onSave({
      languageKey,
      displayName: displayNameValue,
      isDefault: isDefaultValue,
      enabled: enabledValue,
    });
    onOpenChange(false);
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
          <TextField label="Language key" value={languageKey} disabled />
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
        />

        <div className={styles.actions}>
          {onDelete && (
            <Button
              variant="secondary"
              size="medium"
              onClick={() => {
                onDelete();
                handleClose();
              }}
              className={styles.deleteButton}
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
