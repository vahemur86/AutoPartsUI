import { useEffect, useMemo, useState, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Button, Checkbox, Switch, TextField, Dropdown } from "@/ui-kit";
import type { Language } from "@/types/settings";
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
  const { t } = useTranslation();
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
      title={t("languages.addLanguage")}
    >
      <div className={styles.header}>
        <span className={styles.title}>{t("languages.addLanguage")}</span>
      </div>

      <div className={styles.content}>
        <div className={styles.fields}>
          <TextField
            label={t("languages.form.languageKey")}
            value={languageKeyValue}
            onChange={(e) => setLanguageKeyValue(e.target.value)}
            error={hasTriedSave && !languageKeyValue.trim()}
          />
          <TextField
            label={t("languages.form.displayName")}
            value={displayNameValue}
            onChange={(e) => setDisplayNameValue(e.target.value)}
            error={hasTriedSave && !displayNameValue.trim()}
          />
        </div>

        <div className={styles.toggles}>
          <span className={styles.sectionTitle}>
            {t("languages.form.defaultLanguage")}
          </span>
          <Checkbox
            checked={isDefaultValue}
            onCheckedChange={setIsDefaultValue}
            label={t("languages.form.useAsDefault")}
          />
        </div>

        <Switch
          checked={enabledValue}
          onCheckedChange={setEnabledValue}
          label={t("languages.form.enabled")}
        />

        <div className={styles.actionswithoutDelete}>
          <div className={styles.primaryActions}>
            <Button variant="secondary" size="medium" onClick={handleClose}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" size="medium" onClick={handleSaveClick}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      </div>
    </Dropdown>
  );
};
