import { useState, useEffect, type RefObject } from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Button, Dropdown, TextField } from "@/ui-kit";

// types
import type { Tag } from "@/types/settings";

// styles
import styles from "./TagDropdown.module.css";

export interface TagForm {
  name: string;
}

interface TagDropdownProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  initialData?: (Tag & { id?: number }) | null;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: TagForm) => void;
}

export const TagDropdown = ({
  open,
  anchorRef,
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

  const isNameValid = name.trim().length > 0;

  const handleSaveClick = () => {
    setHasTriedSave(true);
    if (!isNameValid) return;

    onSave({ name: name.trim() });
  };

  const titleText = isEditMode ? t("tags.editTag") : t("tags.addTag");

  return (
    <Dropdown
      open={open}
      onOpenChange={onOpenChange}
      anchorRef={anchorRef}
      align="start"
      side="left"
      title={titleText}
    >
      <div className={styles.header}>
        <span className={styles.title}>{titleText}</span>
      </div>

      <div className={styles.content}>
        <div className={styles.grid}>
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

        <div className={styles.actionswithoutDelete}>
          <div className={styles.primaryActions}>
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
          </div>
        </div>
      </div>
    </Dropdown>
  );
};
