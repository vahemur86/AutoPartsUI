import { useRef, createRef, type FC } from "react";
import styles from "./ProjectLanguages.module.css";
import { IconButton, InteractiveField } from "@/ui-kit";
import { Plus, Edit } from "lucide-react";
import type { Language } from "@/types.ts/settings";

interface LanguagesContentProps {
  languages: Language[];
  isLoading: boolean;
  handleAddNewClick: (buttonRef: React.RefObject<HTMLElement>) => void;
  activeLanguageId?: number | null;
  handleEditClick?: (
    languageId: number,
    buttonRef: React.RefObject<HTMLElement>
  ) => void;
}

export const LanguagesContent: FC<LanguagesContentProps> = ({
  languages,
  isLoading,
  handleAddNewClick,
  activeLanguageId,
  handleEditClick,
}) => {
  const languageItemRefs = useRef<
    Map<number, React.RefObject<HTMLDivElement | null>>
  >(new Map());

  const getOrCreateRef = (
    languageId: number
  ): React.RefObject<HTMLDivElement | null> => {
    if (!languageItemRefs.current.has(languageId)) {
      languageItemRefs.current.set(languageId, createRef<HTMLDivElement>());
    }
    return languageItemRefs.current.get(languageId)!;
  };

  // Separate refs for desktop and mobile buttons
  const addButtonDesktopRef = useRef<HTMLButtonElement>(null);
  const addButtonDesktopWrapperRef = useRef<HTMLDivElement>(null);
  const addButtonMobileRef = useRef<HTMLButtonElement>(null);
  const addButtonMobileWrapperRef = useRef<HTMLDivElement>(null);
  const addButtonAnchorRef = useRef<HTMLElement | null>(null);

  const handleAddButtonClick = (isMobile: boolean = false) => {
    // Use the appropriate wrapper div as anchor based on device type
    const wrapperRef = isMobile
      ? addButtonMobileWrapperRef
      : addButtonDesktopWrapperRef;
    const buttonRef = isMobile ? addButtonMobileRef : addButtonDesktopRef;
    const anchorElement = wrapperRef.current || buttonRef.current;

    if (anchorElement) {
      addButtonAnchorRef.current = anchorElement;
      // Create a stable ref object that won't change
      const buttonRefObj: React.RefObject<HTMLElement> =
        addButtonAnchorRef as React.RefObject<HTMLElement>;
      handleAddNewClick(buttonRefObj);
    }
  };

  const handleEditButtonClick = (languageId: number) => {
    const itemRef = getOrCreateRef(languageId);
    // Find the edit button within the language item
    if (itemRef.current) {
      const editButton = itemRef.current.querySelector(
        'button[aria-label*="Edit"]'
      ) as HTMLElement;
      if (editButton) {
        const buttonRef: React.RefObject<HTMLElement> = { current: editButton };
        handleEditClick?.(languageId, buttonRef);
      }
    }
  };

  return (
    <>
      {/* Header with Add New Button - Desktop only */}
      <div className={styles.languagesHeader}>
        <div
          ref={addButtonDesktopWrapperRef}
          className={styles.addButtonWrapper}
        >
          <IconButton
            ref={addButtonDesktopRef}
            variant="primary"
            size="small"
            icon={<Plus size={12} color="#0e0f11" />}
            ariaLabel="Add New"
            onClick={() => handleAddButtonClick(false)}
          />
          <span className={styles.addButtonText}>Add language</span>
        </div>
      </div>

      {/* Languages List */}
      <div className={styles.languagesList}>
        {isLoading ? (
          <div className={styles.loading}>Loading languages...</div>
        ) : languages.length === 0 ? (
          <div className={styles.emptyState}>
            No languages found. Add your first language.
          </div>
        ) : (
          languages.map((language) => {
            const itemRef = getOrCreateRef(language.id);
            const isDefault = language.isDefault ?? false;
            const isDisabled = language.isEnabled === false;
            return (
              <div
                key={language.id}
                ref={itemRef}
                className={`${styles.languageItem} ${
                  activeLanguageId === language.id ? styles.active : ""
                } ${isDefault ? styles.defaultLanguage : ""} ${
                  isDisabled ? styles.disabledLanguage : ""
                }`}
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

      {/* Add New Button - Mobile only */}
      <div className={styles.addButtonMobile}>
        <div
          ref={addButtonMobileWrapperRef}
          className={styles.addButtonWrapper}
        >
          <IconButton
            ref={addButtonMobileRef}
            variant="primary"
            size="small"
            icon={<Plus size={12} />}
            ariaLabel="Add New"
            onClick={() => handleAddButtonClick(true)}
          />
          <span className={styles.addButtonText}>Add language</span>
        </div>
      </div>
    </>
  );
};
