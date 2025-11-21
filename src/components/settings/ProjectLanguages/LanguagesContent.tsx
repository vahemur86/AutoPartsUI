import { useRef, createRef, type FC } from "react";
import styles from "./ProjectLanguages.module.css";
import { IconButton, InteractiveField } from "@/ui-kit";
import { Plus, Edit } from "lucide-react";
import { LANGUAGES } from "@/constants/settings";

interface LanguagesContentProps {
  handleAddNewClick: () => void;
  activeLanguageCode?: string | null;
  handleEditClick?: (
    languageCode: string,
    buttonRef: React.RefObject<HTMLElement>
  ) => void;
}

export const LanguagesContent: FC<LanguagesContentProps> = ({
  handleAddNewClick,
  activeLanguageCode,
  handleEditClick,
}) => {
  const languageItemRefs = useRef<
    Map<string, React.RefObject<HTMLDivElement | null>>
  >(new Map());

  const getOrCreateRef = (
    languageCode: string
  ): React.RefObject<HTMLDivElement | null> => {
    if (!languageItemRefs.current.has(languageCode)) {
      languageItemRefs.current.set(languageCode, createRef<HTMLDivElement>());
    }
    return languageItemRefs.current.get(languageCode)!;
  };

  const handleEditButtonClick = (languageCode: string) => {
    const itemRef = getOrCreateRef(languageCode);
    // Find the edit button within the language item
    if (itemRef.current) {
      const editButton = itemRef.current.querySelector(
        'button[aria-label*="Edit"]'
      ) as HTMLElement;
      if (editButton) {
        const buttonRef: React.RefObject<HTMLElement> = { current: editButton };
        handleEditClick?.(languageCode, buttonRef);
      }
    }
  };

  return (
    <>
      {/* Header with Add New Button - Desktop only */}
      <div className={styles.languagesHeader}>
        <div className={styles.addButtonWrapper}>
          <IconButton
            variant="primary"
            size="small"
            icon={<Plus size={12} color="#0e0f11" />}
            ariaLabel="Add New"
            onClick={handleAddNewClick}
          />
          <span className={styles.addButtonText}>Add language</span>
        </div>
      </div>

      {/* Languages List */}
      <div className={styles.languagesList}>
        {LANGUAGES.map((language) => {
          const itemRef = getOrCreateRef(language.code);
          return (
            <div
              key={language.code}
              ref={itemRef}
              className={`${styles.languageItem} ${
                language.isDefault ? styles.defaultLanguage : ""
              } ${activeLanguageCode === language.code ? styles.active : ""}`}
            >
              <InteractiveField
                variant="display"
                size="medium"
                displayIcon={
                  <img
                    src={language.flag}
                    alt={`${language.name} flag`}
                    className={styles.flagImage}
                  />
                }
                displayText={`${language.name}`}
                actions={{
                  edit: {
                    // Color is controlled via CSS so that active state can be yellow
                    icon: <Edit size={16} />,
                    onClick: () => handleEditButtonClick(language.code),
                    ariaLabel: `Edit ${language.name}`,
                  },
                }}
                className={styles.languageField}
                style={{ padding: "12px 26px" }}
              />
            </div>
          );
        })}
      </div>

      {/* Add New Button - Mobile only */}
      <div className={styles.addButtonMobile}>
        <div className={styles.addButtonWrapper}>
          <IconButton
            variant="primary"
            size="small"
            icon={<Plus size={12} />}
            ariaLabel="Add New"
            onClick={handleAddNewClick}
          />
          <span className={styles.addButtonText}>Add language</span>
        </div>
      </div>
    </>
  );
};
