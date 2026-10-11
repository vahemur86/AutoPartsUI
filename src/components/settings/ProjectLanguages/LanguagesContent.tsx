import { useRef, createRef, useCallback, type FC, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Button, InteractiveField } from "@/ui-kit";
import { Plus, Edit } from "lucide-react";
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
  const languageItemRefs = useRef<
    Map<number, RefObject<HTMLDivElement | null>>
  >(new Map());

  const getOrCreateItemRef = (languageId: number) => {
    if (!languageItemRefs.current.has(languageId)) {
      languageItemRefs.current.set(languageId, createRef<HTMLDivElement>());
    }
    return languageItemRefs.current.get(languageId)!;
  };

  const handleEditButtonClick = useCallback(
    (languageId: number, event?: React.MouseEvent<HTMLButtonElement>) => {
      if (event?.currentTarget) {
        onEditClick?.(languageId, event.currentTarget);
        return;
      }

      setTimeout(() => {
        const itemRef = getOrCreateItemRef(languageId);
        const root = itemRef.current;
        if (!root) return;

        const actionsWrapper = root.querySelector(
          '[class*="actionsWrapper"], [class*="actions"]'
        );
        if (actionsWrapper) {
          // Find the first button in the actions wrapper (should be the edit button)
          const editButton = actionsWrapper.querySelector(
            "button"
          ) as HTMLElement | null;
          if (editButton) {
            onEditClick?.(languageId, editButton);
          }
        } else {
          const editButton = root.querySelector("button") as HTMLElement | null;
          if (editButton) {
            onEditClick?.(languageId, editButton);
          }
        }
      }, 0);
    },
    [onEditClick]
  );

  return (
    <>
      {/* Desktop header */}
      <div className={styles.languagesHeader}>
        <Button
          className={styles.addButton}
          variant="primary"
          size="medium"
          onClick={onAddNewClick}
        >
          <Plus size={16} />
          {t("languages.addLanguage")}
        </Button>
      </div>

      {/* List */}
      <div className={styles.languagesList}>
        {isLoading ? (
          <div className={styles.loading}>{t("languages.loading")}</div>
        ) : languages.length === 0 ? (
          <div className={styles.emptyState}>{t("languages.emptyState")}</div>
        ) : (
          languages.map((language) => {
            const itemRef = getOrCreateItemRef(language.id);
            const isDefault = language.isDefault ?? false;
            const isDisabled = language.isEnabled === false;

            return (
              <div
                key={language.id}
                ref={itemRef}
                className={[
                  styles.languageItem,
                  activeLanguageId === language.id ? styles.active : "",
                  isDefault ? styles.defaultLanguage : "",
                  isDisabled ? styles.disabledLanguage : "",
                ].join(" ")}
              >
                <InteractiveField
                  variant="display"
                  size="medium"
                  displayIcon={
                    language.flag ? (
                      <img
                        src={language.flag}
                        alt={`${language.name} flag`}
                        className={styles.flagImage}
                      />
                    ) : undefined
                  }
                  displayText={
                    <div className={styles.languageText}>
                      <div className={styles.languageName}>
                        {language.name}
                        {isDisabled && (
                          <span className={styles.disabledLabel}>
                            {t("languages.disabled")}
                          </span>
                        )}
                      </div>
                      <div className={styles.languageCode}>{language.code}</div>
                    </div>
                  }
                  actions={{
                    edit: {
                      icon: <Edit size={16} />,
                      onClick: () => {
                        handleEditButtonClick(language.id);
                      },
                      ariaLabel: t("languages.editLanguage", {
                        name: language.name,
                      }),
                    },
                  }}
                  className={styles.languageField}
                  style={{ padding: "12px 26px" }}
                />
              </div>
            );
          })
        )}
      </div>

    </>
  );
};