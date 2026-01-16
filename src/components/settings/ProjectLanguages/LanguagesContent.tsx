import { useRef, createRef, type FC, type RefObject } from "react";
import { IconButton, InteractiveField } from "@/ui-kit";
import { Plus, Edit } from "lucide-react";
import type { Language } from "@/types/settings";
import styles from "./ProjectLanguages.module.css";

interface LanguagesContentProps {
  languages: Language[];
  isLoading: boolean;
  onAddNewClick: (anchorEl: HTMLElement | null) => void;
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
  const languageItemRefs = useRef<
    Map<number, RefObject<HTMLDivElement | null>>
  >(new Map());

  const getOrCreateItemRef = (languageId: number) => {
    if (!languageItemRefs.current.has(languageId)) {
      languageItemRefs.current.set(languageId, createRef<HTMLDivElement>());
    }
    return languageItemRefs.current.get(languageId)!;
  };

  const addButtonDesktopWrapperRef = useRef<HTMLDivElement>(null);
  const addButtonMobileWrapperRef = useRef<HTMLDivElement>(null);

  const handleAddClick = (isMobile: boolean) => {
    const wrapper = isMobile
      ? addButtonMobileWrapperRef.current
      : addButtonDesktopWrapperRef.current;

    onAddNewClick(wrapper);
  };

  const handleEditButtonClick = (languageId: number) => {
    const itemRef = getOrCreateItemRef(languageId);
    const root = itemRef.current;
    if (!root) return;

    const editButton = root.querySelector(
      'button[aria-label^="Edit "]'
    ) as HTMLElement | null;

    onEditClick?.(languageId, editButton);
  };

  return (
    <>
      {/* Desktop header */}
      <div className={styles.languagesHeader}>
        <div
          ref={addButtonDesktopWrapperRef}
          className={styles.addButtonWrapper}
        >
          <IconButton
            variant="primary"
            size="small"
            icon={<Plus size={12} color="#0e0f11" />}
            ariaLabel="Add New"
            onClick={() => handleAddClick(false)}
          />
          <span className={styles.addButtonText}>Add language</span>
        </div>
      </div>

      {/* List */}
      <div className={styles.languagesList}>
        {isLoading ? (
          <div className={styles.loading}>Loading languages...</div>
        ) : languages.length === 0 ? (
          <div className={styles.emptyState}>
            No languages found. Add your first language.
          </div>
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
                          <span className={styles.disabledLabel}>Disabled</span>
                        )}
                      </div>
                      <div className={styles.languageCode}>{language.code}</div>
                    </div>
                  }
                  actions={{
                    edit: {
                      icon: <Edit size={16} />,
                      onClick: () => handleEditButtonClick(language.id),
                      ariaLabel: `Edit ${language.name}`,
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

      {/* Mobile add button */}
      <div className={styles.addButtonMobile}>
        <div
          ref={addButtonMobileWrapperRef}
          className={styles.addButtonWrapper}
        >
          <IconButton
            variant="primary"
            size="small"
            icon={<Plus size={12} />}
            ariaLabel="Add New"
            onClick={() => handleAddClick(true)}
          />
          <span className={styles.addButtonText}>Add language</span>
        </div>
      </div>
    </>
  );
};
