import { useMemo, type FC } from "react";
import { useTranslation } from "react-i18next";
import { Button, IconButton } from "@/ui-kit";
import { CheckCircle2, Languages, Pencil, Plus, Star, XCircle } from "lucide-react";
import type { Language } from "@/types/settings";
import styles from "./ProjectLanguages.module.css";

interface LanguagesContentProps {
  languages: Language[];
  isLoading: boolean;
  onAddNewClick: () => void;
  activeLanguageId?: number | null;
  onEditClick?: (languageId: number, anchorEl: HTMLElement | null) => void;
}

export const LanguagesContent: FC<LanguagesContentProps> = ({
  languages,
  isLoading,
  onAddNewClick,
  activeLanguageId,
  onEditClick,
}) => {
  const { t } = useTranslation();
  const enabledLanguageCount = useMemo(
    () => languages.filter((language) => language.isEnabled !== false).length,
    [languages],
  );

  return (
    <>
      <div className={styles.languagesHeader}>
        <div className={styles.languageOverview}>
          <div className={styles.languageCountSummary}>
            <span className={styles.overviewIcon}>
              <Languages size={18} aria-hidden="true" />
            </span>
            <div>
              <strong>{t("languages.summary.total", { count: languages.length })}</strong>
              <span>{t("languages.summary.enabled", { count: enabledLanguageCount })}</span>
            </div>
          </div>
        </div>
        <div className={styles.addButtonWrapper}>
          <Button
            className={styles.addButton}
            variant="primary"
            size="medium"
            onClick={onAddNewClick}
          >
            <Plus size={16} aria-hidden="true" />
            {t("languages.addLanguage")}
          </Button>
        </div>
      </div>

      <div className={styles.languagesList}>
        {isLoading ? (
          <div className={styles.languageState} role="status" aria-live="polite">
            <span className={styles.stateIcon}>
              <Languages size={22} aria-hidden="true" />
            </span>
            <span>{t("languages.loading")}</span>
          </div>
        ) : languages.length === 0 ? (
          <div className={styles.languageState}>
            <span className={styles.stateIcon}>
              <Languages size={22} aria-hidden="true" />
            </span>
            <strong>{t("languages.empty.title")}</strong>
            <span>{t("languages.empty.description")}</span>
          </div>
        ) : (
          <div className={styles.languageGrid}>
            {languages.map((language) => {
              const isDefault = language.isDefault ?? false;
              const isEnabled = language.isEnabled !== false;

              return (
                <article
                  key={language.id}
                  className={styles.languageCard}
                  data-default={isDefault}
                  data-enabled={isEnabled}
                  data-disabled={!isEnabled}
                >
                  <div className={styles.languageCardHeader}>
                    <div className={styles.languageIdentity}>
                      <span className={styles.languageIcon}>
                        {language.flag ? (
                          <img
                            src={language.flag}
                            alt=""
                            className={styles.flagImage}
                          />
                        ) : (
                          <Languages size={18} aria-hidden="true" />
                        )}
                      </span>
                      <div className={styles.languageNameBlock}>
                        <strong>{language.name}</strong>
                        <span>{language.code.toLocaleUpperCase()}</span>
                      </div>
                    </div>
                    <IconButton
                      size="small"
                      variant="secondary"
                      icon={<Pencil size={15} />}
                      ariaLabel={t("languages.editLanguage", {
                        name: language.name,
                      })}
                      title={t("languages.editLanguage", {
                        name: language.name,
                      })}
                      onClick={(event) =>
                        onEditClick?.(language.id, event.currentTarget)
                      }
                      aria-expanded={activeLanguageId === language.id}
                    />
                  </div>

                  <div className={styles.languageMeta}>
                    <span
                      className={`${styles.languageStatus} ${
                        isEnabled ? styles.statusEnabled : styles.statusDisabled
                      }`}
                    >
                      {isEnabled ? (
                        <CheckCircle2 size={13} aria-hidden="true" />
                      ) : (
                        <XCircle size={13} aria-hidden="true" />
                      )}
                      {isEnabled
                        ? t("languages.form.enabled")
                        : t("languages.disabled")}
                    </span>
                    {isDefault && (
                      <span
                        className={`${styles.languageStatus} ${styles.statusDefault}`}
                      >
                        <Star size={13} aria-hidden="true" />
                        {t("languages.form.defaultLanguage")}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};