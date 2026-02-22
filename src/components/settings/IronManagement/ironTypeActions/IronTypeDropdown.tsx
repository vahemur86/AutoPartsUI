import { useState, useEffect, type RefObject } from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Button, Dropdown, TextField } from "@/ui-kit";

// stores
import { useAppSelector } from "@/store/hooks";

// styles
import styles from "./IronTypeDropdown.module.css";

export type IronTypeForm = {
  code: string;
  pricePerKg: number;
  translations: Record<string, string>;
};

interface IronTypeDropdownProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: IronTypeForm) => void;
}

export const IronTypeDropdown = ({
  open,
  anchorRef,
  isLoading = false,
  onOpenChange,
  onSave,
}: IronTypeDropdownProps) => {
  const { t } = useTranslation();
  const { languages } = useAppSelector((state) => state.languages);

  const [code, setCode] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [hasTriedSave, setHasTriedSave] = useState(false);

  useEffect(() => {
    if (open) {
      setCode("");
      setPricePerKg("");
      setTranslations({});
      setHasTriedSave(false);
    }
  }, [open]);

  useEffect(() => {
    if (open && languages.length > 0) {
      const initialTranslations: Record<string, string> = {};
      languages.forEach((lang) => {
        initialTranslations[lang.code] = "";
      });
      setTranslations(initialTranslations);
    }
  }, [open, languages]);

  const numPricePerKg = parseFloat(pricePerKg);

  const isCodeValid = code.trim().length > 0;
  const isPriceValid = !isNaN(numPricePerKg) && numPricePerKg >= 0;
  const areTranslationsValid =
    Object.values(translations).some((val) => val.trim().length > 0);
  const isValid = isCodeValid && isPriceValid && areTranslationsValid;

  const handleTranslationChange = (langCode: string, value: string) => {
    setTranslations((prev) => ({
      ...prev,
      [langCode]: value,
    }));
  };

  const handleSaveClick = () => {
    setHasTriedSave(true);
    if (!isValid) return;

    onSave({
      code: code.trim(),
      pricePerKg: numPricePerKg,
      translations: Object.fromEntries(
        Object.entries(translations).filter(([_, val]) => val.trim().length > 0),
      ),
    });
  };

  const titleText = t("ironManagement.addIronType");

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
            label={t("ironManagement.form.code")}
            placeholder={t("ironManagement.form.enterCode")}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            error={hasTriedSave && !isCodeValid}
            disabled={isLoading}
          />

          <TextField
            label={t("ironManagement.form.pricePerKg")}
            placeholder="0"
            type="number"
            value={pricePerKg}
            onChange={(e) => setPricePerKg(e.target.value)}
            error={hasTriedSave && !isPriceValid}
            disabled={isLoading}
          />

          {languages.map((lang) => (
            <TextField
              key={lang.code}
              label={`${t("ironManagement.form.name")} (${lang.name})`}
              placeholder={t("ironManagement.form.enterName")}
              value={translations[lang.code] || ""}
              onChange={(e) =>
                handleTranslationChange(lang.code, e.target.value)
              }
              error={
                hasTriedSave &&
                !areTranslationsValid &&
                !translations[lang.code]?.trim()
              }
              disabled={isLoading}
            />
          ))}
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
              disabled={isLoading || !isValid}
            >
              {t("common.save")}
            </Button>
          </div>
        </div>
      </div>
    </Dropdown>
  );
};

