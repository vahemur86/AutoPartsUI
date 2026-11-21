import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { validateProductImage } from "@/services/productImages";
import styles from "./ProductImageFileField.module.css";

interface ProductImageFileFieldProps {
  id: string;
  file: File | null;
  disabled?: boolean;
  label: string;
  onChange: (file: File | null) => void;
}

export const ProductImageFileField = ({
  id,
  file,
  disabled = false,
  label,
  onChange,
}: ProductImageFileFieldProps) => {
  const { t } = useTranslation();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleChange = (selectedFile: File | null) => {
    if (!selectedFile) {
      setErrorKey(null);
      onChange(null);
      return;
    }
    const validationError = validateProductImage(selectedFile);
    if (validationError) {
      setErrorKey(validationError === "unsupported-type"
        ? "productImages.errors.unsupported"
        : "productImages.errors.tooLarge");
      onChange(null);
      return;
    }
    setErrorKey(null);
    onChange(selectedFile);
  };

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      {previewUrl && <img className={styles.preview} src={previewUrl} alt={t("productImages.previewAlt")} />}
      <input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled}
        onChange={(event) => {
          handleChange(event.target.files?.[0] ?? null);
          event.currentTarget.value = "";
        }}
        aria-invalid={Boolean(errorKey)}
        aria-describedby={errorKey ? `${id}-error` : `${id}-requirements`}
      />
      <small id={`${id}-requirements`}>{t("productImages.requirements")}</small>
      {errorKey && <p id={`${id}-error`} role="alert">{t(errorKey)}</p>}
    </div>
  );
};
