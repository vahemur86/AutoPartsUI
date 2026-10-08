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
  Play,
  Square,
  Globe,
  WalletCards,
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
  userData: Record<string, unknown>;
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
      <div className={styles.headerBrand}>
        <div className={styles.brandMark}>
          <WalletCards size={22} />
        </div>
        <div>
          <span className={styles.brandEyebrow}>Operator terminal</span>
          <h1 className={styles.pageTitle}>{t("operatorPage.title")}</h1>
        </div>
      </div>

      <div className={styles.headerActions}>
        <div className={styles.userInfoContainer}>
          <div className={styles.userInfoItem} title={t("powderExtraction.shopId")}>
            <div className={styles.userInfoIcon}>
              <Store size={13} />
            </div>
            <div className={styles.userInfoContent}>
              <span className={styles.userInfoLabel}>{t("powderExtraction.shopId")}</span>
              <span className={styles.userInfoValue}>{String(userData?.shopId ?? "") || "—"}</span>
            </div>
          </div>
          <div className={styles.userInfoItem} title={t("powderExtraction.username")}>
            <div className={styles.userInfoIcon}>
              <User size={13} />
            </div>
            <div className={styles.userInfoContent}>
              <span className={styles.userInfoLabel}>{t("powderExtraction.username")}</span>
              <span className={styles.userInfoValue}>{String(userData?.username ?? "") || "—"}</span>
            </div>
          </div>
          <div className={styles.userInfoItem} title={t("powderExtraction.cashRegisterName")}>
            <div className={styles.userInfoIcon}>
              <Monitor size={13} />
            </div>
            <div className={styles.userInfoContent}>
              <span className={styles.userInfoLabel}>{t("powderExtraction.cashRegisterName")}</span>
              <span className={styles.userInfoValue}>{String(userData?.cashRegisterName ?? "") || "—"}</span>
            </div>
          </div>
        </div>

        <div className={`${styles.headerBalanceContainer} ${hasError ? styles.balanceError : ""}`}>
          <div className={styles.balanceIcon}>
            <Banknote size={18} />
          </div>
          <div className={styles.balanceInfo}>
            <span className={styles.balanceLabel}>{t("operatorPage.cashAmount")}</span>
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
            className={hasOpenSession ? styles.sessionBtnActive : styles.sessionBtnInactive}
            disabled={hasOpenSession}
          >
            <Play size={15} />
            <span>{t("operatorPage.openSession")}</span>
          </Button>
          <Button
            onClick={onOpenCloseModal}
            className={!hasOpenSession ? styles.sessionBtnActiveClose : styles.sessionBtnInactiveClose}
            disabled={!hasOpenSession}
          >
            <Square size={15} />
            <span>{t("operatorPage.closeSession")}</span>
          </Button>
        </div>

        <div className={styles.languageSelectWrapper}>
          <div className={styles.languageSelectIcon}>
            <Globe size={14} />
          </div>
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

        <Button variant="secondary" size="medium" onClick={onOpenLogoutModal} className={styles.logoutBtn}>
          <LogOut size={16} />
          <span>{t("header.logout")}</span>
        </Button>
      </div>
    </div>
  );
};
