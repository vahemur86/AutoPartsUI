import type { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";

// icons
import { LogOut } from "lucide-react";

// ui-kit
import { Button, Select } from "@/ui-kit";

// styles
import styles from "../OperatorPage.module.css";

interface OperatorHeaderProps {
  hasOpenSession: boolean;
  onToggleSession: (action: "open" | "close") => void;
  onOpenCloseModal: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  languages: any[];
  selectedApiCode: string;
  onLanguageChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  onLogout: () => void;
  isLangLoading: boolean;
}

export const OperatorHeader = ({
  hasOpenSession,
  onToggleSession,
  onOpenCloseModal,
  languages,
  selectedApiCode,
  onLanguageChange,
  onLogout,
  isLangLoading,
}: OperatorHeaderProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.headerSection}>
      <h1 className={styles.pageTitle}>{t("operatorPage.title")}</h1>
      <div className={styles.headerActions}>
        <div className={styles.sessionGroup}>
          <Button
            onClick={() => onToggleSession("open")}
            className={
              hasOpenSession
                ? styles.sessionBtnActive
                : styles.sessionBtnInactive
            }
            disabled={hasOpenSession}
          >
            {t("operatorPage.openSession")}
          </Button>
          <Button
            onClick={onOpenCloseModal}
            className={
              !hasOpenSession
                ? styles.sessionBtnActiveClose
                : styles.sessionBtnInactiveClose
            }
            disabled={!hasOpenSession}
          >
            {t("operatorPage.closeSession")}
          </Button>
        </div>
        <div className={styles.languageSelectWrapper}>
          <Select
            placeholder={t("common.select")}
            onChange={onLanguageChange}
            value={selectedApiCode}
            disabled={isLangLoading || languages.length === 0}
            containerClassName={styles.languageSelectContainer}
          >
            {languages.map((lang) => (
              <option key={lang.id} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </Select>
        </div>
        <Button
          variant="secondary"
          size="medium"
          onClick={onLogout}
          className={styles.logoutBtn}
        >
          <LogOut size={16} />
          {t("header.logout")}
        </Button>
      </div>
    </div>
  );
};
