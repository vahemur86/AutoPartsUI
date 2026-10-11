import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { Languages, X } from "lucide-react";
import { Button, Checkbox, Switch, TextField } from "@/ui-kit";
import type { Language } from "@/types/settings";
import styles from "./LanguageDropdown.module.css";

export interface AddLanguageDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<Language, "id">) => void;
}

export const AddLanguageDropdown = ({
  open,
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

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onOpenChange]);

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

  if (!open) return null;

  return createPortal(
    <div className={styles.drawerBackdrop} onMouseDown={handleClose}>
      <aside
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-language-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.drawerHeader}>
          <span className={styles.drawerIcon} aria-hidden="true">
            <Languages size={20} />
          </span>
          <h2 id="add-language-title">{t("languages.addLanguage")}</h2>
          <button
            type="button"
            className={styles.drawerClose}
            onClick={handleClose}
            aria-label={t("common.close")}
            title={t("common.close")}
          >
            <X size={18} />
          </button>
        </header>

        <div className={styles.drawerBody}>
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
        </div>

        <footer className={styles.drawerFooter}>
          <Button variant="secondary" size="medium" onClick={handleClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" size="medium" onClick={handleSaveClick}>
            {t("common.save")}
          </Button>
        </footer>
      </aside>
    </div>,
    document.body,
  );
};
