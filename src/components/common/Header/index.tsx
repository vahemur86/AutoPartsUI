import { useState, useRef, useEffect, type FC } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

// ui-kit
import { Tab } from "@/ui-kit";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { fetchLanguages } from "@/store/slices/languagesSlice";

// icons
import { Bell, Check, Languages, LogOut } from "lucide-react";
import logoImage from "@/assets/icons/Subtract.svg";

// hooks
import { useActiveRoute } from "@/hooks/useIsActive";

// services
import {
  getUserLanguagePreference,
  setUserLanguagePreference,
} from "@/services/userLanguage";

// utils
import {
  getApiErrorMessage,
  mapApiCodeToI18nCode,
} from "@/utils";

// styles
import styles from "./Header.module.css";

export const Header: FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { languages } = useAppSelector((state) => state.languages);
  const user = useAppSelector((state) => state.auth.user);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLanguageLoading, setIsLanguageLoading] = useState(false);
  const [selectedLanguageCode, setSelectedLanguageCode] = useState(
    i18n.resolvedLanguage || i18n.language,
  );
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [tooltip, setTooltip] = useState<{ label: string; top: number; left: number; visible: boolean }>({
    label: "",
    top: 0,
    left: 0,
    visible: false,
  });
  const avatarRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { isActive } = useActiveRoute();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        avatarRef.current &&
        !avatarRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDropdownOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isDropdownOpen]);

  useEffect(() => {
    if (!isDropdownOpen) return;

    const updateDropdownPosition = () => {
      if (!avatarRef.current) return;

      const rect = avatarRef.current.getBoundingClientRect();
      const dropdownWidth =
        window.innerWidth <= 480 ? 200 : window.innerWidth <= 768 ? 220 : 250;
      const horizontalPadding = 8;

      const nextTop = rect.bottom + 8;
      const maxLeft = window.innerWidth - dropdownWidth - horizontalPadding;
      const preferredLeft = rect.right - dropdownWidth;
      const nextLeft = Math.max(horizontalPadding, Math.min(preferredLeft, maxLeft));

      setDropdownPosition({ top: nextTop, left: nextLeft });
    };

    updateDropdownPosition();

    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);

    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [isDropdownOpen]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
    setIsDropdownOpen(false);
  };

  const enabledLanguages = languages.filter((lang) => lang.isEnabled);

  useEffect(() => {
    if (!isDropdownOpen) return;

    const loadLanguageData = async () => {
      setIsLanguageLoading(true);

      try {
        if (languages.length === 0) {
          await dispatch(fetchLanguages());
        }

        const preference = await getUserLanguagePreference();
        const languageCodeFromPreference = preference.language
          ? mapApiCodeToI18nCode(preference.language)
          : i18n.resolvedLanguage || i18n.language;

        setSelectedLanguageCode(languageCodeFromPreference);
      } catch (error) {
        console.error("Failed to load user language preference", error);
      } finally {
        setIsLanguageLoading(false);
      }
    };

    loadLanguageData();
  }, [dispatch, i18n.language, i18n.resolvedLanguage, isDropdownOpen, languages.length]);

  const handleSetLanguage = async (languageCode: string) => {
    try {
      setIsLanguageLoading(true);

      const response = await setUserLanguagePreference(languageCode);
      const i18nCode = mapApiCodeToI18nCode(response.language || languageCode);

      if (i18n.hasResourceBundle(i18nCode, "translation")) {
        await i18n.changeLanguage(i18nCode);
        localStorage.setItem("i18nextLng", i18nCode);
        setSelectedLanguageCode(i18nCode);
      }
    } catch (error) {
      console.error(getApiErrorMessage(error, "Failed to set language"));
    } finally {
      setIsLanguageLoading(false);
    }
  };

  const handleShowTooltip = (target: HTMLElement, label: string) => {
    const rect = target.getBoundingClientRect();
    const nextTop = rect.top + rect.height / 2;
    const nextLeft = rect.left - 8;

    setTooltip({
      label,
      top: nextTop,
      left: nextLeft,
      visible: true,
    });
  };

  const handleHideTooltip = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  return (
    <div className={styles.headerContainer}>
      <header className={styles.header}>
        <div
          className={styles.logoContainer}
          onClick={() => navigate("/finance-reports/dashboard")}
          style={{ cursor: "pointer" }}
        >
          <img src={logoImage} alt="Logo" className={styles.logoImage} />
        </div>

        <div className={styles.rightContent}>
          <nav className={styles.nav}>
            <div
              onMouseEnter={(e) => handleShowTooltip(e.currentTarget, t("header.settings"))}
              onMouseLeave={handleHideTooltip}
              style={{ display: "flex" }}
            >
              <Tab
                variant="underline"
                active={isActive("/settings")}
                text={t("header.settings")}
                onClick={() => navigate("/settings")}
              />
            </div>
            <div
              onMouseEnter={(e) => handleShowTooltip(e.currentTarget, t("header.products"))}
              onMouseLeave={handleHideTooltip}
              style={{ display: "flex" }}
            >
              <Tab
                variant="underline"
                active={isActive("/products")}
                text={t("header.products")}
                onClick={() => navigate("/products")}
              />
            </div>
            <div
              onMouseEnter={(e) => handleShowTooltip(e.currentTarget, t("header.warehouses"))}
              onMouseLeave={handleHideTooltip}
              style={{ display: "flex" }}
            >
              <Tab
                variant="underline"
                active={isActive("/warehouses")}
                text={t("header.warehouses")}
                onClick={() => navigate("/warehouses")}
              />
            </div>
            <div
              onMouseEnter={(e) => handleShowTooltip(e.currentTarget, t("header.shops"))}
              onMouseLeave={handleHideTooltip}
              style={{ display: "flex" }}
            >
              <Tab
                variant="underline"
                active={isActive("/shops")}
                text={t("header.shops")}
                onClick={() => navigate("/shops")}
              />
            </div>
            <div
              onMouseEnter={(e) => handleShowTooltip(e.currentTarget, t("header.users"))}
              onMouseLeave={handleHideTooltip}
              style={{ display: "flex" }}
            >
              <Tab
                variant="underline"
                active={isActive("/users")}
                text={t("header.users")}
                onClick={() => navigate("/users")}
              />
            </div>
            <div
              onMouseEnter={(e) => handleShowTooltip(e.currentTarget, t("header.workshop"))}
              onMouseLeave={handleHideTooltip}
              style={{ display: "flex" }}
            >
              <Tab
                variant="underline"
                active={isActive("/service-templates")}
                text={t("header.workshop")}
                onClick={() => navigate("/service-templates")}
              />
            </div>
            <div
              onMouseEnter={(e) => handleShowTooltip(e.currentTarget, t("header.customers"))}
              onMouseLeave={handleHideTooltip}
              style={{ display: "flex" }}
            >
              <Tab
                variant="underline"
                active={isActive("/customers")}
                text={t("header.customers")}
                onClick={() => navigate("/customers")}
              />
            </div>
            <div
              onMouseEnter={(e) => handleShowTooltip(e.currentTarget, t("header.reports"))}
              onMouseLeave={handleHideTooltip}
              style={{ display: "flex" }}
            >
              <Tab
                variant="underline"
                active={isActive("/reports")}
                text={t("header.reports")}
                onClick={() => navigate("/reports")}
              />
            </div>
            <div
              onMouseEnter={(e) => handleShowTooltip(e.currentTarget, t("header.financeReports"))}
              onMouseLeave={handleHideTooltip}
              style={{ display: "flex" }}
            >
              <Tab
                variant="underline"
                active={isActive("/finance-reports")}
                text={t("header.financeReports")}
                onClick={() => navigate("/finance-reports")}
              />
            </div>
            <div
              onMouseEnter={(e) => handleShowTooltip(e.currentTarget, t("header.calculator"))}
              onMouseLeave={handleHideTooltip}
              style={{ display: "flex" }}
            >
              <Tab
                variant="underline"
                active={isActive("/calculator")}
                text={t("header.calculator")}
                onClick={() => navigate("/calculator")}
              />
            </div>
          </nav>

          <div className={styles.actions}>
            <div
              onMouseEnter={(e) => handleShowTooltip(e.currentTarget, t("header.notifications"))}
              onMouseLeave={handleHideTooltip}
            >
              <button
                className={styles.bellButton}
                aria-label={t("header.notifications")}
              >
                <Bell className={styles.bellIcon} />
              </button>
            </div>

            {user?.username ? (
              <span className={styles.usernameLabel}>{user.username}</span>
            ) : null}

            <div className={styles.avatarContainer} ref={avatarRef}>
              <button
                className={styles.avatarButton}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-label={t("header.userMenu")}
                aria-expanded={isDropdownOpen}
              >
                <div className={styles.avatar}>
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
                    alt="User"
                    className={styles.avatarImage}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {isDropdownOpen
        ? createPortal(
            <div
              className={styles.dropdown}
              ref={dropdownRef}
              style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
            >
              <div className={styles.dropdownBody}>
                <div className={styles.dropdownSectionTitle}>
                  <Languages size={14} />
                  <span>{t("header.language")}</span>
                </div>

                {isLanguageLoading ? (
                  <div className={styles.languageLoadingText}>
                    {t("header.languageLoading")}
                  </div>
                ) : (
                  <div className={styles.languageList}>
                    {enabledLanguages.map((lang) => {
                      const langI18nCode = mapApiCodeToI18nCode(lang.code);
                      const isSelected = selectedLanguageCode === langI18nCode;

                      return (
                        <button
                          key={lang.id}
                          className={styles.dropdownItem}
                          onClick={() => handleSetLanguage(lang.code)}
                        >
                          <span>{lang.name}</span>
                          {isSelected && (
                            <Check className={styles.dropdownIcon} size={16} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className={styles.dropdownFooter}>
                <button className={styles.dropdownItem} onClick={handleLogout}>
                  <LogOut className={styles.dropdownIcon} size={16} />
                  <span>{t("header.logout")}</span>
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}

      {tooltip.visible
        ? createPortal(
            <div
              className={styles.headerTooltip}
              style={{
                top: `${tooltip.top}px`,
                left: `${tooltip.left}px`,
              }}
              role="tooltip"
            >
              {tooltip.label}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
};
