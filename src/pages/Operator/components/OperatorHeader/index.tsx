import type { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";

// icons
import {
  LogOut,
  Banknote,
  Eye,
  EyeOff,
  User,
  Store,
  Monitor,
} from "lucide-react";

// ui-kit
import { Button, Select } from "@/ui-kit";

// styles
import styles from "../../OperatorPage.module.css";

interface OperatorHeaderProps {
  hasOpenSession: boolean;
  onToggleSession: (action: "open" | "close") => void;
  onOpenCloseModal: () => void;
  onOpenLogoutModal: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  languages: any[];
  selectedApiCode: string;
  onLanguageChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  isLangLoading: boolean;
  displayBalance?: string;
  showCashAmount: boolean;
  onToggleVisibility: () => void;
  hasError: boolean;
  userData: Record<string, string>;
}

export const OperatorHeader = ({
  hasOpenSession,
  onToggleSession,
  onOpenCloseModal,
  onOpenLogoutModal,
  languages,
  selectedApiCode,
  onLanguageChange,
  isLangLoading,
  displayBalance,
  showCashAmount,
  onToggleVisibility,
  hasError,
  userData,
}: OperatorHeaderProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.headerSection}>
      <h1 className={styles.pageTitle}>{t("operatorPage.title")}</h1>

      <div className={styles.headerActions}>
        {/* Compact User/Shop Info Component */}
        <div className={styles.userInfoContainer}>
          <div
            className={styles.userInfoItem}
            title={t("powderExtraction.shopId")}
          >
            <Store size={14} />
            <span>{userData?.shopId || "—"}</span>
          </div>
          <div
            className={styles.userInfoItem}
            title={t("powderExtraction.username")}
          >
            <User size={14} />
            <span>{userData?.username || "—"}</span>
          </div>
          <div
            className={styles.userInfoItem}
            title={t("powderExtraction.cashRegisterName")}
          >
            <Monitor size={14} />
            <span>{userData?.cashRegisterName || "—"}</span>
          </div>
        </div>

        <div
          className={`${styles.headerBalanceContainer} ${hasError ? styles.balanceError : ""}`}
        >
          <div className={styles.balanceIcon}>
            <Banknote size={18} />
          </div>
          <div className={styles.balanceInfo}>
            <span className={styles.balanceLabel}>
              {t("operatorPage.cashAmount")}
            </span>
            <span className={styles.balanceValue}>{displayBalance}</span>
          </div>
          <button
            type="button"
            onClick={onToggleVisibility}
            className={styles.balanceToggle}
            title={showCashAmount ? t("common.hide") : t("common.show")}
          >
            {showCashAmount ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

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
          onClick={onOpenLogoutModal}
          className={styles.logoutBtn}
        >
          <LogOut size={16} />
          {t("header.logout")}
        </Button>
      </div>
    </div>
  );
};
