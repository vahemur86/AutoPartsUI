import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { Tag as TagIcon, X } from "lucide-react";

// ui-kit
import { Button, TextField } from "@/ui-kit";

// types
import type { Tag } from "@/types/settings";

// styles
import styles from "./TagDropdown.module.css";

export interface TagForm {
  name: string;
}

interface TagDropdownProps {
  open: boolean;
  initialData?: (Tag & { id?: number }) | null;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: TagForm) => void;
}

export const TagDropdown = ({
  open,
  initialData,
  isLoading = false,
  onOpenChange,
  onSave,
}: TagDropdownProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [hasTriedSave, setHasTriedSave] = useState(false);

  const isEditMode = !!initialData;

  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? "");
      setHasTriedSave(false);
    }
  }, [open, initialData]);

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

  const isNameValid = name.trim().length > 0;

  const handleSaveClick = () => {
    setHasTriedSave(true);
    if (!isNameValid) return;

    onSave({ name: name.trim() });
  };

  const titleText = isEditMode ? t("tags.editTag") : t("tags.addTag");

  if (!open) return null;

  return createPortal(
    <div
      className={styles.drawerBackdrop}
      onMouseDown={() => onOpenChange(false)}
    >
      <aside
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tag-drawer-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.drawerHeader}>
          <span className={styles.drawerIcon} aria-hidden="true">
            <TagIcon size={20} />
          </span>
          <div className={styles.drawerHeading}>
            <span>{t("tags.columns.name")}</span>
            <h2 id="tag-drawer-title">{titleText}</h2>
          </div>
          <button
            type="button"
            className={styles.drawerClose}
            onClick={() => onOpenChange(false)}
            aria-label={t("common.close")}
            title={t("common.close")}
          >
            <X size={18} />
          </button>
        </header>

        <div className={styles.drawerBody}>
          <div className={styles.sectionTitle}>{t("tags.columns.name")}</div>
          <TextField
            label={t("tags.form.name")}
            placeholder={t("tags.form.enterTagName")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={hasTriedSave && !isNameValid}
            helperText={
              hasTriedSave && !isNameValid ? t("tags.form.nameRequired") : ""
            }
            disabled={isLoading}
          />
        </div>

        <footer className={styles.drawerFooter}>
          <Button
            variant="secondary"
            size="medium"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            size="medium"
            onClick={handleSaveClick}
            disabled={isLoading}
          >
            {isEditMode ? t("common.update") : t("common.save")}
          </Button>
        </footer>
      </aside>
    </div>,
    document.body,
  );
};
