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
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Languages,
  LogOut,
  DoorOpen,
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
  PackageSearch,
  Truck,
  PiggyBank,
  Workflow,
} from "lucide-react";

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
  mapI18nCodeToApiCode,
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
    "operations" | "locations" | "analytics" | "management" | "language" | null
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
  const accountRef = useRef<HTMLDivElement>(null);
  const operationsRef = useRef<HTMLDivElement>(null);
  const locationsRef = useRef<HTMLDivElement>(null);
  const analyticsRef = useRef<HTMLDivElement>(null);
  const managementRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { isActive } = useActiveRoute();
  const isDashboardActive = isActive("/finance-reports/dashboard");
  const isOperationsActive =
    isActive("/referral-persons") ||
    isActive("/commissions") ||
    isActive("/service-tasks") ||
    isActive("/car-catalyst") ||
    isActive("/agents") ||
    isActive("/agent-types") ||
    isActive("/agent-classification-rules") ||
    isActive("/agents/repayment-rules");
  const isLocationsActive =
    isActive("/warehouses") || isActive("/shops") || isActive("/service-templates");
  const isAnalyticsActive =
    isActive("/reports") ||
    (isActive("/finance-reports") && !isDashboardActive) ||
    isActive("/capital-sources");
  const isManagementActive =
    isActive("/products") ||
    isActive("/customers") ||
    isActive("/users") ||
    isActive("/settings/iron-catalyst-powder-flow") ||
    isActive("/settings");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        accountRef.current &&
        !accountRef.current.contains(event.target as Node)
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
      if (!accountRef.current) return;

      const rect = accountRef.current.getBoundingClientRect();
      const dropdownWidth =
        window.innerWidth <= 480 ? 190 : window.innerWidth <= 768 ? 200 : 220;
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

  const builtinLanguages = [
    { id: -1, code: "en", name: "English", isDefault: true, isEnabled: true },
    { id: -2, code: "ru", name: "Русский", isDefault: false, isEnabled: true },
    { id: -3, code: "am", name: "Հայերեն", isDefault: false, isEnabled: true },
  ];

  const enabledLanguages = (() => {
    const backendLanguages = languages.filter((lang) => lang.isEnabled);
    const map = new Map<string, (typeof builtinLanguages)[number]>();

    backendLanguages.forEach((lang) => {
      const code = mapApiCodeToI18nCode(lang.code);
      if (!map.has(code)) {
        map.set(code, { ...lang, code, isEnabled: true });
      }
    });

    builtinLanguages.forEach((lang) => {
      if (!map.has(lang.code)) {
        map.set(lang.code, lang);
      }
    });

    return Array.from(map.values());
  })();

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
    if (openDropdown !== "language") return;

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
  }, [dispatch, i18n.language, i18n.resolvedLanguage, openDropdown, languages.length]);

  const handleSetLanguage = async (languageCode: string) => {
    try {
      setIsLanguageLoading(true);

      const apiLanguageCode = mapI18nCodeToApiCode(languageCode);
      const response = await setUserLanguagePreference(apiLanguageCode);
      const i18nCode = mapApiCodeToI18nCode(response.language || apiLanguageCode);

      if (i18n.hasResourceBundle(i18nCode, "translation")) {
        await i18n.changeLanguage(i18nCode);
        localStorage.setItem("i18nextLng", i18nCode);
        setSelectedLanguageCode(i18nCode);
      }
    } catch (error) {
      console.error(getApiErrorMessage(error, "Failed to set language"));
    } finally {
      setIsLanguageLoading(false);
      setOpenDropdown(null);
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

  const dateLocale =
    selectedLanguageCode === "am"
      ? "hy-AM"
      : selectedLanguageCode === "ru"
        ? "ru-RU"
        : "en-US";

  return (
    <div className={styles.headerContainer}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.logoContainer}
          onClick={() => navigate("/finance-reports/dashboard")}
          aria-label={t("header.dashboard")}
        >
          <span className={styles.logoMark} aria-hidden="true">
            <span className={styles.logoBrand}>
              <span className={styles.logoPrp}>PRP</span>
              <span className={styles.logoService}>Service</span>
            </span>
          </span>
        </button>

        <div className={styles.rightContent}>
          <nav className={styles.nav}>
            <div
              onMouseEnter={(e) => handleShowTooltip(e.currentTarget, t("header.dashboard"))}
              onMouseLeave={handleHideTooltip}
              style={{ display: "flex" }}
            >
              <Tab
                variant="underline"
                active={isDashboardActive}
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
                className={`${styles.menuItem} ${isActive("/referral-persons") || isActive("/commissions") ? styles.menuItemActive : ""}`}
                onClick={() => {
                  navigate("/referral-persons");
                  setOpenDropdown(null);
                }}
              >
                <Users className={styles.menuItemIcon} size={16} />
                {t("header.referrals")}
              </button>
              <button
                type="button"
                className={`${styles.menuItem} ${isActive("/catalytic-suppliers") ? styles.menuItemActive : ""}`}
                onClick={() => {
                  navigate("/catalytic-suppliers");
                  setOpenDropdown(null);
                }}
              >
                <Truck className={styles.menuItemIcon} size={16} />
                {t("catalyticSuppliers.title")}
              </button>
              <button
                type="button"
                className={`${styles.menuItem} ${isActive("/agents") || isActive("/agent-types") || isActive("/agent-classification-rules") || isActive("/agent-contracts") || isActive("/agent-advances") || isActive("/powder-deliveries") || isActive("/repayments") ? styles.menuItemActive : ""}`}
                onClick={() => {
                  navigate("/agents");
                  setOpenDropdown(null);
                }}
              >
                <Users className={styles.menuItemIcon} size={16} />
                {t("header.agents")}
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
                className={`${styles.menuItem} ${isActive("/catalytic-converters") ? styles.menuItemActive : ""}`}
                onClick={() => {
                  navigate("/catalytic-converters");
                  setOpenDropdown(null);
                }}
              >
                <PackageSearch className={styles.menuItemIcon} size={16} />
                {t("catalyticConverters.title")}
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
              <button
                type="button"
                className={`${styles.menuItem} ${isActive("/capital-sources") ? styles.menuItemActive : ""}`}
                onClick={() => {
                  navigate("/capital-sources");
                  setOpenDropdown(null);
                }}
              >
                <PiggyBank className={styles.menuItemIcon} size={16} />
                {t("header.capitalSources")}
              </button>
            </Dropdown>
            <div
              ref={managementRef}
              onMouseEnter={(e) => handleShowTooltip(e.currentTarget, t("header.administration"))}
              onMouseLeave={handleHideTooltip}
              style={{ display: "flex" }}
            >
              <Tab
                variant="underline"
                active={isManagementActive}
                icon={<Settings2 size={16} />}
                text={t("header.administration")}
                onClick={() =>
                  setOpenDropdown((current) =>
                    current === "management" ? null : "management",
                  )
                }
              />
            </div>
            <Dropdown
              open={openDropdown === "management"}
              onOpenChange={(open) => setOpenDropdown(open ? "management" : null)}
              anchorRef={managementRef}
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
                {t("header.productCatalog")}
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
                className={`${styles.menuItem} ${isActive("/settings/iron-catalyst-powder-flow") ? styles.menuItemActive : ""}`}
                onClick={() => {
                  navigate("/settings/iron-catalyst-powder-flow");
                  setOpenDropdown(null);
                }}
              >
                <Workflow className={styles.menuItemIcon} size={16} />
                {t("ironCatalystFlow.title")}
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
            </Dropdown>
            <div
              onMouseEnter={(e) => handleShowTooltip(e.currentTarget, t("header.calculator"))}
              onMouseLeave={handleHideTooltip}
              style={{ display: "flex" }}
            >
              <Tab
                variant="underline"
                active={isActive("/calculator")}
                icon={<Calculator size={16} />}
                text={t("header.calculator")}
                onClick={() => {
                  navigate("/calculator");
                  setOpenDropdown(null);
                }}
              />
            </div>
          </nav>

          <div className={styles.actions}>
            {exchangeRate != null ? (
              <div className={styles.exchangeRateInfo}>
                <CircleDollarSign
                  className={styles.exchangeRateIcon}
                  size={16}
                  aria-hidden="true"
                />
                <div className={styles.exchangeRateText}>
                  <span className={styles.exchangeRateLabel}>{t("header.exchangeRate")}</span>
                  <span className={styles.exchangeRateValue}>
                    $ 1 / {exchangeRate.toLocaleString()} AMD
                  </span>
                </div>
              </div>
            ) : null}

            <div className={styles.timeInfo}>
              <CalendarDays size={15} aria-hidden="true" />
              <span className={styles.timeLabel}>{t("header.today")}</span>
              <span className={styles.timeValue}>
                {new Intl.DateTimeFormat(dateLocale, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                }).format(currentTime)}
              </span>
            </div>

            <div className={styles.languageControl} ref={languageRef}>
              <button
                type="button"
                className={styles.languageButton}
                onClick={() => {
                  setIsDropdownOpen(false);
                  setOpenDropdown((current) =>
                    current === "language" ? null : "language",
                  );
                }}
                aria-label={t("header.language")}
                aria-haspopup="menu"
                aria-expanded={openDropdown === "language"}
                title={t("header.language")}
              >
                <Languages size={15} aria-hidden="true" />
                <span>{selectedLanguageCode.toUpperCase()}</span>
                <ChevronDown size={13} aria-hidden="true" />
              </button>
            </div>
            <Dropdown
              open={openDropdown === "language"}
              onOpenChange={(open) => setOpenDropdown(open ? "language" : null)}
              anchorRef={languageRef}
              align="end"
              side="bottom"
              title={t("header.language")}
              contentWidth={260}
              contentClassName={styles.languageDropdown}
            >
              {isLanguageLoading ? (
                <div className={styles.languageLoadingText}>
                  {t("header.languageLoading")}
                </div>
              ) : (
                enabledLanguages.map((lang) => {
                  const langI18nCode = mapApiCodeToI18nCode(lang.code);
                  const isSelected = selectedLanguageCode === langI18nCode;

                  return (
                    <button
                      key={lang.id}
                      type="button"
                      className={`${styles.languageOption} ${isSelected ? styles.languageOptionSelected : ""}`}
                      onClick={() => void handleSetLanguage(lang.code)}
                      aria-pressed={isSelected}
                    >
                      <span className={styles.languageCode}>
                        {langI18nCode.toUpperCase()}
                      </span>
                      <span className={styles.languageOptionName}>{lang.name}</span>
                      {isSelected && <Check size={17} aria-hidden="true" />}
                    </button>
                  );
                })
              )}
            </Dropdown>

            <div className={styles.accountControl} ref={accountRef}>
              <button
                type="button"
                className={styles.accountButton}
                onClick={() => {
                  setOpenDropdown(null);
                  setIsDropdownOpen((current) => !current);
                }}
                aria-label={t("header.userMenu")}
                aria-haspopup="menu"
                aria-expanded={isDropdownOpen}
                title={user?.username || t("header.userMenu")}
              >
                <LogOut size={16} aria-hidden="true" />
                <ChevronDown size={13} aria-hidden="true" />
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
              {user?.username ? (
                <div className={styles.profileSummary}>{user.username}</div>
              ) : null}

              <div className={styles.dropdownFooter}>
                <button
                  type="button"
                  className={styles.dropdownItem}
                  onClick={handleLogout}
                >
                  <DoorOpen className={styles.dropdownIcon} size={16} aria-hidden="true" />
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
