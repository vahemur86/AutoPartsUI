import { useEffect, useMemo, useState, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Button, Checkbox, Switch, TextField, Dropdown } from "@/ui-kit";
import type { Language } from "@/types/settings";
import styles from "./LanguageDropdown.module.css";

export interface EditLanguageDropdownProps {
  open: boolean;
  language: Language;
  anchorRef?: RefObject<HTMLElement | null>;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Language) => void;
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
  const { t } = useTranslation();
  const [displayNameValue, setDisplayNameValue] = useState(language.name);
  const [isDefaultValue, setIsDefaultValue] = useState(
    language.isDefault ?? false
  );
  const [enabledValue, setEnabledValue] = useState(language.isEnabled ?? true);
  const [hasTriedSave, setHasTriedSave] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDisplayNameValue(language.name);
    setIsDefaultValue(language.isDefault ?? false);
    setEnabledValue(language.isEnabled ?? true);
    setHasTriedSave(false);
  }, [open, language]);

  const isValid = useMemo(() => !!displayNameValue.trim(), [displayNameValue]);

  const handleSaveClick = () => {
    setHasTriedSave(true);
    if (!isValid) return;

    onSave({
      id: language.id,
      code: language.code,
      name: displayNameValue.trim(),
      isDefault: isDefaultValue,
      isEnabled: enabledValue,
    });
  };

  const handleClose = () => onOpenChange(false);

  return (
    <Dropdown
      open={open}
      onOpenChange={onOpenChange}
      anchorRef={anchorRef}
      align="start"
      side="left"
      title={t("languages.editLanguageTitle")}
    >
      <div className={styles.header}>
        <span className={styles.title}>{t("languages.editLanguageTitle")}</span>
      </div>

      <div className={styles.content}>
        <div className={styles.fields}>
          <TextField
            label={t("languages.form.languageKey")}
            value={language.code}
            disabled
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
          disabled={language.isDefault}
        />

        <div className={styles.actions}>
          {onDelete && (
            <Button
              variant="secondary"
              size="medium"
              onClick={() => onDelete(language.id)}
              className={styles.deleteButton}
              disabled={language.isDefault}
            >
              {t("languages.deleteLanguage")}
            </Button>
          )}

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
