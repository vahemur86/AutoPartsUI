import { useEffect, useState } from "react";
import styles from "./LanguageDropdown.module.css";
import { Button, Checkbox, Switch, TextField, Dropdown } from "@/ui-kit";
import type { Language } from "@/types.ts/settings";

export interface AddLanguageDropdownProps {
  open: boolean;
  anchorRef?: React.RefObject<HTMLElement>;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<Language, "id">) => void;
}

export const AddLanguageDropdown = ({
  open,
  anchorRef,
  onOpenChange,
  onSave,
}: AddLanguageDropdownProps) => {
  const [languageKeyValue, setLanguageKeyValue] = useState("");
  const [displayNameValue, setDisplayNameValue] = useState("");
  const [isDefaultValue, setIsDefaultValue] = useState(false);
  const [enabledValue, setEnabledValue] = useState(true);

  useEffect(() => {
    if (open) {
      setLanguageKeyValue("");
      setDisplayNameValue("");
      setIsDefaultValue(false);
      setEnabledValue(true);
    }
  }, [open]);

  const handleSaveClick = () => {
    if (!languageKeyValue.trim() || !displayNameValue.trim()) {
      return;
    }
    onSave({
      code: languageKeyValue.trim(),
      name: displayNameValue.trim(),
      isDefault: isDefaultValue,
      isEnabled: enabledValue,
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
      title="Add Language"
    >
      {/* Desktop header */}
      <div className={styles.header}>
        <span className={styles.title}>Add Language</span>
      </div>

      <div className={styles.content}>
        <div className={styles.fields}>
          <TextField
            label="Language key"
            value={languageKeyValue}
            onChange={(e) => setLanguageKeyValue(e.target.value)}
          />
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

        <div className={styles.actionswithoutDelete}>
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
