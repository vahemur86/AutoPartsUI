import { useEffect, useMemo, useState, type RefObject } from "react";
import { Button, Checkbox, Switch, TextField, Dropdown } from "@/ui-kit";
import type { Language } from "@/types.ts/settings";
import styles from "./LanguageDropdown.module.css";

export interface AddLanguageDropdownProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
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
  const [hasTriedSave, setHasTriedSave] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLanguageKeyValue("");
    setDisplayNameValue("");
    setIsDefaultValue(false);
    setEnabledValue(true);
    setHasTriedSave(false);
  }, [open]);

  const isValid = useMemo(() => {
    return !!languageKeyValue.trim() && !!displayNameValue.trim();
  }, [languageKeyValue, displayNameValue]);

  const handleSaveClick = () => {
    setHasTriedSave(true);
    if (!isValid) return;

    onSave({
      code: languageKeyValue.trim(),
      name: displayNameValue.trim(),
      isDefault: isDefaultValue,
      isEnabled: enabledValue,
    });
    // Parent closes dropdown on success.
  };

  const handleClose = () => onOpenChange(false);

  return (
    <Dropdown
      open={open}
      onOpenChange={onOpenChange}
      anchorRef={anchorRef}
      align="start"
      side="left"
      title="Add Language"
    >
      <div className={styles.header}>
        <span className={styles.title}>Add Language</span>
      </div>

      <div className={styles.content}>
        <div className={styles.fields}>
          <TextField
            label="Language key"
            value={languageKeyValue}
            onChange={(e) => setLanguageKeyValue(e.target.value)}
            error={hasTriedSave && !languageKeyValue.trim()}
          />
          <TextField
            label="Display name"
            value={displayNameValue}
            onChange={(e) => setDisplayNameValue(e.target.value)}
            error={hasTriedSave && !displayNameValue.trim()}
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
