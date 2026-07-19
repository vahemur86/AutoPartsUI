import { useState, useRef, useEffect, type FC } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

// ui-kit
import { Dropdown } from "@/ui-kit/components/Dropdown";
import { Tab } from "@/ui-kit";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { fetchLanguages } from "@/store/slices/languagesSlice";

// icons
import {
  Bell,
  Check,
  Languages,
  LogOut,
  Home,
  Layers,
  MapPin,
  BarChart3,
  Users,
  User,
  Settings2,
  Calculator,
  Box,
  Archive,
  Store,
  Hammer,
  FileText,
  PieChart,
  Wrench,
  FlaskConical,
} from "lucide-react";
import logoImage from "@/assets/icons/prp-logo.svg";
import adminAvatarImage from "@/assets/icons/userVector.svg";

// hooks
import { useActiveRoute } from "@/hooks/useIsActive";

// services
import {
  getUserLanguagePreference,
  setUserLanguagePreference,
} from "@/services/userLanguage";
import { getCurrentUsdAmdExchangeRate } from "@/services/settings/exchangeRates";

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
  const [openDropdown, setOpenDropdown] = useState<
    "operations" | "locations" | "analytics" | null
  >(null);
  const [isLanguageLoading, setIsLanguageLoading] = useState(false);
  const [selectedLanguageCode, setSelectedLanguageCode] = useState(
    i18n.resolvedLanguage || i18n.language,
  );
  const [currentTime, setCurrentTime] = useState(new Date());
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [tooltip, setTooltip] = useState<{ label: string; top: number; left: number; visible: boolean }>({
    label: "",
    top: 0,
    left: 0,
    visible: false,
  });
  const avatarRef = useRef<HTMLDivElement>(null);
  const operationsRef = useRef<HTMLDivElement>(null);
  const locationsRef = useRef<HTMLDivElement>(null);
  const analyticsRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { isActive } = useActiveRoute();
  const isOperationsActive =
    isActive("/products") ||
    isActive("/customers") ||
    isActive("/service-templates") ||
    isActive("/users") ||
    isActive("/service-tasks") ||
    isActive("/car-catalyst") ||
    isActive("/settings") ||
    isActive("/calculator");
  const isLocationsActive =
    isActive("/warehouses") || isActive("/shops") || isActive("/service-templates");
  const isAnalyticsActive =
    isActive("/reports") || isActive("/finance-reports");

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

  const handleLogout = async () => {
    await dispatch(logout());
    navigate("/login");
    setIsDropdownOpen(false);
  };

  const enabledLanguages = languages.filter((lang) => lang.isEnabled);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadExchangeRate = async () => {
      try {
        const response = await getCurrentUsdAmdExchangeRate(
          Number(user?.cashRegisterId) || undefined,
        );
        if (!isCancelled) {
          setExchangeRate(Number(response?.rate));
        }
      } catch (error) {
        console.error("Failed to fetch current USD/AMD exchange rate", error);
        if (!isCancelled) {
          setExchangeRate(null);
        }
      }
    };

    void loadExchangeRate();

    return () => {
      isCancelled = true;
    };
  }, [user?.cashRegisterId]);

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
              onMouseEnter={(e) => handleShowTooltip(e.currentTarget, t("header.dashboard"))}
              onMouseLeave={handleHideTooltip}
              style={{ display: "flex" }}
            >
              <Tab
                variant="underline"
                active={isActive("/finance-reports/dashboard")}
                icon={<Home size={16} />}
                text={t("header.dashboard")}
                onClick={() => navigate("/finance-reports/dashboard")}
              />
            </div>
            <div
              ref={operationsRef}
              onMouseEnter={(e) => handleShowTooltip(e.currentTarget, t("header.operations"))}
              onMouseLeave={handleHideTooltip}
              style={{ display: "flex" }}
            >
              <Tab
                variant="underline"
                active={isOperationsActive}
                icon={<Layers size={16} />}
                text={t("header.operations")}
                onClick={() =>
                  setOpenDropdown((current) =>
                    current === "operations" ? null : "operations",
                  )
                }
              />
            </div>
            <Dropdown
              open={openDropdown === "operations"}
              onOpenChange={(open) => setOpenDropdown(open ? "operations" : null)}
              anchorRef={operationsRef}
              align="start"
              side="bottom"
              contentClassName={styles.menuDropdown}
            >
              <button
                type="button"
                className={`${styles.menuItem} ${isActive("/products") ? styles.menuItemActive : ""}`}
                onClick={() => {
                  navigate("/products");
                  setOpenDropdown(null);
                }}
              >
                <Box className={styles.menuItemIcon} size={16} />
                {t("header.products")}
              </button>
              <button
                type="button"
                className={`${styles.menuItem} ${isActive("/customers") ? styles.menuItemActive : ""}`}
                onClick={() => {
                  navigate("/customers");
                  setOpenDropdown(null);
                }}
              >
                <Users className={styles.menuItemIcon} size={16} />
                {t("header.customers")}
              </button>
              <button
                type="button"
                className={`${styles.menuItem} ${isActive("/users") ? styles.menuItemActive : ""}`}
                onClick={() => {
                  navigate("/users");
                  setOpenDropdown(null);
                }}
              >
                <User className={styles.menuItemIcon} size={16} />
                {t("header.users")}
              </button>
              <button
                type="button"
                className={`${styles.menuItem} ${isActive("/service-tasks") ? styles.menuItemActive : ""}`}
                onClick={() => {
                  navigate("/service-tasks");
                  setOpenDropdown(null);
                }}
              >
                <Wrench className={styles.menuItemIcon} size={16} />
                {t("settings.navigation.serviceTasks")}
              </button>
              <button
                type="button"
                className={`${styles.menuItem} ${isActive("/car-catalyst") ? styles.menuItemActive : ""}`}
                onClick={() => {
                  navigate("/car-catalyst");
                  setOpenDropdown(null);
                }}
              >
                <FlaskConical className={styles.menuItemIcon} size={16} />
                {t("settings.navigation.carCatalyst")}
              </button>
              <button
                type="button"
                className={`${styles.menuItem} ${isActive("/settings") ? styles.menuItemActive : ""}`}
                onClick={() => {
                  navigate("/settings");
                  setOpenDropdown(null);
                }}
              >
                <Settings2 className={styles.menuItemIcon} size={16} />
                {t("header.settings")}
              </button>
              <button
                type="button"
                className={`${styles.menuItem} ${isActive("/calculator") ? styles.menuItemActive : ""}`}
                onClick={() => {
                  navigate("/calculator");
                  setOpenDropdown(null);
                }}
              >
                <Calculator className={styles.menuItemIcon} size={16} />
                {t("header.calculator")}
              </button>
            </Dropdown>
            <div
              ref={locationsRef}
              onMouseEnter={(e) => handleShowTooltip(e.currentTarget, t("header.locations"))}
              onMouseLeave={handleHideTooltip}
              style={{ display: "flex" }}
            >
              <Tab
                variant="underline"
                active={isLocationsActive}
                icon={<MapPin size={16} />}
                text={t("header.locations")}
                onClick={() =>
                  setOpenDropdown((current) =>
                    current === "locations" ? null : "locations",
                  )
                }
              />
            </div>
            <Dropdown
              open={openDropdown === "locations"}
              onOpenChange={(open) => setOpenDropdown(open ? "locations" : null)}
              anchorRef={locationsRef}
              align="start"
              side="bottom"
              contentClassName={styles.menuDropdown}
            >
              <button
                type="button"
                className={`${styles.menuItem} ${isActive("/warehouses") ? styles.menuItemActive : ""}`}
                onClick={() => {
                  navigate("/warehouses");
                  setOpenDropdown(null);
                }}
              >
                <Archive className={styles.menuItemIcon} size={16} />
                {t("header.warehouses")}
              </button>
              <button
                type="button"
                className={`${styles.menuItem} ${isActive("/shops") ? styles.menuItemActive : ""}`}
                onClick={() => {
                  navigate("/shops");
                  setOpenDropdown(null);
                }}
              >
                <Store className={styles.menuItemIcon} size={16} />
                {t("header.shops")}
              </button>
              <button
                type="button"
                className={`${styles.menuItem} ${isActive("/service-templates") ? styles.menuItemActive : ""}`}
                onClick={() => {
                  navigate("/service-templates");
                  setOpenDropdown(null);
                }}
              >
                <Hammer className={styles.menuItemIcon} size={16} />
                {t("header.workshop")}
              </button>
            </Dropdown>
            <div
              ref={analyticsRef}
              onMouseEnter={(e) => handleShowTooltip(e.currentTarget, t("header.analytics"))}
              onMouseLeave={handleHideTooltip}
              style={{ display: "flex" }}
            >
              <Tab
                variant="underline"
                active={isAnalyticsActive}
                icon={<BarChart3 size={16} />}
                text={t("header.analytics")}
                onClick={() =>
                  setOpenDropdown((current) =>
                    current === "analytics" ? null : "analytics",
                  )
                }
              />
            </div>
            <Dropdown
              open={openDropdown === "analytics"}
              onOpenChange={(open) => setOpenDropdown(open ? "analytics" : null)}
              anchorRef={analyticsRef}
              align="start"
              side="bottom"
              contentClassName={styles.menuDropdown}
            >
              <button
                type="button"
                className={`${styles.menuItem} ${isActive("/reports") ? styles.menuItemActive : ""}`}
                onClick={() => {
                  navigate("/reports");
                  setOpenDropdown(null);
                }}
              >
                <FileText className={styles.menuItemIcon} size={16} />
                {t("header.reports")}
              </button>
              <button
                type="button"
                className={`${styles.menuItem} ${isActive("/finance-reports") ? styles.menuItemActive : ""}`}
                onClick={() => {
                  navigate("/finance-reports");
                  setOpenDropdown(null);
                }}
              >
                <PieChart className={styles.menuItemIcon} size={16} />
                {t("header.financeReports")}
              </button>
            </Dropdown>
          </nav>

          <div className={styles.actions}>
            {exchangeRate != null ? (
              <div className={styles.exchangeRateInfo}>
                <span className={styles.timeLabel}>{t("header.exchangeRate")}</span>
                <span className={styles.exchangeRateValue}>$ 1 / {exchangeRate.toLocaleString()} AMD</span>
              </div>
            ) : null}

            <div className={styles.timeInfo}>
              <span className={styles.timeLabel}>{t("header.today")}</span>
              <span className={styles.timeValue}>
                {new Intl.DateTimeFormat("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                }).format(currentTime)}
              </span>
            </div>

            <button className={styles.bellButton}>
              <Bell className={styles.bellIcon} />
            </button>

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
                    src={user?.avatarUrl || adminAvatarImage}
                    alt={user?.username ? `${user.username} avatar` : "User"}
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
