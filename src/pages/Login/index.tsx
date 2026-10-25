import { useState, useEffect, useRef, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { PrpServiceLoader } from "@/components/common/PrpServiceLoader";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { login, clearAuthError } from "@/store/slices/authSlice";

// utils
import { applyUserLanguagePreference } from "@/utils";

// ui-kit
import { TextField, Button } from "@/ui-kit";
import { Dropdown } from "@/ui-kit/components/Dropdown";

// icons
import {
  Check,
  ChevronDown,
  CircleAlert,
  Languages,
  Lock,
  Eye,
  EyeOff,
  User,
  LogIn,
} from "lucide-react";

// i18n and languages
import i18n from "@/i18n/config";
import { getLanguages } from "@/services/settings/languages";
import type { Language } from "@/types/settings";
import { mapApiCodeToI18nCode } from "@/utils/languageMapping";
import { useIsMobile } from "@/hooks/isMobile";

// images
import platformScene from "@/assets/images/catalyst-platform-scene.svg";

// styles
import styles from "./Login.module.css";

const FALLBACK_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "ru", name: "Русский" },
  { code: "am", name: "Հայերեն" },
];

const getLoginRedirectPath = (role: string, isMobile: boolean) => {
  const userRole = role.toLowerCase();
  if (userRole === "operator") return "/operator";
  if (userRole === "cashier") return "/shop-operator";
  if (userRole === "programmer") return "/programmer";
  return isMobile ? "/calculator" : "/finance-reports/dashboard";
};

export const Login = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isMobile } = useIsMobile();

  const { isLoading, error, isAuthenticated, user } = useAppSelector(
    (state) => state.auth,
  );

  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [languageOptions, setLanguageOptions] = useState(FALLBACK_LANGUAGES);
  const [selectedLanguageCode, setSelectedLanguageCode] = useState(() =>
    mapApiCodeToI18nCode(i18n.resolvedLanguage || i18n.language),
  );
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const loginRedirectPending = useRef(false);
  const languageControlRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) return;

    let isCancelled = false;

    const initializeLoginLanguage = async () => {
      let projectLanguages: Language[] = [];

      try {
        projectLanguages = await getLanguages();
      } catch {
        // Login stays available if public language settings cannot be loaded.
      }

      if (isCancelled) return;

      const enabledLanguages = projectLanguages
        .filter((language) => language.isEnabled)
        .map((language) => ({
          code: mapApiCodeToI18nCode(language.code),
          name: language.name,
          isDefault: language.isDefault,
        }))
        .filter((language) =>
          i18n.hasResourceBundle(language.code, "translation"),
        );
      const uniqueLanguages = Array.from(
        new Map(enabledLanguages.map((language) => [language.code, language])).values(),
      );
      const options = uniqueLanguages.length
        ? uniqueLanguages.map(({ code, name }) => ({ code, name }))
        : FALLBACK_LANGUAGES;
      const adminDefault = enabledLanguages.find((language) => language.isDefault);
      const savedLanguage = mapApiCodeToI18nCode(
        localStorage.getItem("i18nextLng") || i18n.resolvedLanguage || i18n.language,
      );
      const initialLanguage =
        adminDefault?.code ||
        (options.some((language) => language.code === savedLanguage)
          ? savedLanguage
          : options[0].code);

      setLanguageOptions(options);
      setSelectedLanguageCode(initialLanguage);
      await i18n.changeLanguage(initialLanguage);
      localStorage.setItem("i18nextLng", initialLanguage);
    };

    void initializeLoginLanguage();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated]);

  const handleLanguageChange = async (languageCode: string) => {
    if (!i18n.hasResourceBundle(languageCode, "translation")) return;

    await i18n.changeLanguage(languageCode);
    localStorage.setItem("i18nextLng", languageCode);
    setSelectedLanguageCode(languageCode);
    setIsLanguageMenuOpen(false);
    setLoginError(null);
  };

  useEffect(() => {
    if (isAuthenticated && user && !loginRedirectPending.current) {
      navigate(getLoginRedirectPath(user.role, isMobile), { replace: true });
    }
  }, [isAuthenticated, user, isMobile, navigate]);

  useEffect(() => {
    if (error) {
      const normalizedError = error
        .trim()
        .replace(/[.!?]+$/, "")
        .toLocaleLowerCase();
      const isCredentialError =
        /\b401\b|unauthorized|invalid login|login failed|authentication failed|user not found|account not found/.test(normalizedError) ||
        /(?:invalid|incorrect|wrong|bad).{0,24}(?:credential|username|email|password)/.test(normalizedError) ||
        /(?:credential|username|email|password).{0,24}(?:invalid|incorrect|wrong)/.test(normalizedError);

      setLoginError(
        normalizedError === "user account is inactive"
          ? t("auth.login.accountInactive")
          : isCredentialError
            ? t("auth.login.invalidCredentials")
          : error,
      );
      dispatch(clearAuthError());
    }
  }, [error, dispatch, t]);

  const isUsernameValid = credentials.username.trim().length > 0;
  const isPasswordValid = credentials.password.length >= 4;
  const isFormValid = isUsernameValid && isPasswordValid;

  const initializeDefaultLanguage = async () => {
    try {
      await applyUserLanguagePreference();
    } catch (error) {
      console.error("Failed to initialize default language:", error);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setHasTriedSubmit(true);
    setLoginError(null);

    if (!isFormValid) return;

    loginRedirectPending.current = true;
    const resultAction = await dispatch(login(credentials));

    if (login.fulfilled.match(resultAction)) {
      setIsRedirecting(true);
      await initializeDefaultLanguage();
      toast.success(t("auth.login.welcomeBack"));
      await new Promise<void>((resolve) => window.setTimeout(resolve, 2500));
      navigate(
        getLoginRedirectPath(resultAction.payload.role, isMobile),
        { replace: true },
      );
    } else {
      loginRedirectPending.current = false;
    }
  };

  return (
    <div className={styles.container}>
      <img
        src={platformScene}
        alt=""
        aria-hidden="true"
        className={styles.platformScene}
      />
      <div className={styles.gridBackground} />
      <div className={styles.overlay} />

      {isRedirecting ? (
        <main className={styles.redirectStage} role="status" aria-live="polite">
          <section className={styles.redirectCard}>
            <span className={styles.redirectEyebrow}>
              {t("auth.login.redirectEyebrow")}
            </span>
            <PrpServiceLoader ariaLabel={t("auth.login.redirectTitle")} />
            <h2 className={styles.redirectTitle}>
              {t("auth.login.redirectTitle")}
            </h2>
            <p className={styles.redirectMessage}>
              {t("auth.login.redirectMessage")}
            </p>
            <div className={styles.redirectTrack} aria-hidden="true">
              <span />
            </div>
          </section>
        </main>
      ) : (
      <div className={styles.content}>
        <div className={styles.languageRow}>
          <div className={styles.languageControl} ref={languageControlRef}>
            <button
              type="button"
              className={styles.languageButton}
              onClick={() => setIsLanguageMenuOpen((open) => !open)}
              aria-label={t("header.language")}
              aria-haspopup="menu"
              aria-expanded={isLanguageMenuOpen}
            >
              <span className={styles.languageIcon} aria-hidden="true">
                <Languages size={16} />
              </span>
              <span className={styles.languageCopy}>
                <span className={styles.languageLabel}>{t("header.language")}</span>
                <span className={styles.languageValue}>
                  {languageOptions.find((language) => language.code === selectedLanguageCode)?.name || selectedLanguageCode.toUpperCase()}
                </span>
              </span>
              <ChevronDown size={15} aria-hidden="true" />
            </button>
          </div>
          <Dropdown
            open={isLanguageMenuOpen}
            onOpenChange={setIsLanguageMenuOpen}
            anchorRef={languageControlRef}
            align="start"
            side="bottom"
            sideOffset={8}
            title={t("header.language")}
            contentWidth={260}
            contentClassName={styles.languageDropdown}
          >
            {languageOptions.map((language) => {
              const isSelected = language.code === selectedLanguageCode;
              return (
                <button
                  key={language.code}
                  type="button"
                  className={`${styles.languageOption} ${isSelected ? styles.languageOptionSelected : ""}`}
                  onClick={() => void handleLanguageChange(language.code)}
                  aria-pressed={isSelected}
                >
                  <span className={styles.languageCode}>
                    {language.code.toUpperCase()}
                  </span>
                  <span className={styles.languageOptionName}>{language.name}</span>
                  {isSelected && <Check size={17} aria-hidden="true" />}
                </button>
              );
            })}
          </Dropdown>
        </div>

        <div className={styles.brandPanel}>
          <div className={styles.logoContainer}>
            <div className={styles.logo}>
              <span className={styles.logoBrand} aria-hidden="true">
                <span className={styles.logoPrp}>PRP</span>
                <span className={styles.logoService}>Service</span>
              </span>
            </div>
          </div>
          <div className={styles.brandCopy}>
            <h1 className={styles.heading}>{t("auth.login.title")}</h1>
          </div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.formHeader}>
            <span className={styles.formBadge}>Secure access</span>
            <h2>{t("auth.login.welcome")}</h2>
          </div>

          {loginError && (
            <div className={styles.loginError} role="alert" aria-live="assertive">
              <CircleAlert size={19} aria-hidden="true" />
              <span>{loginError}</span>
            </div>
          )}

          <div className={styles.fieldWrapper}>
            <div className={styles.fieldWithLeftIcon}>
              <div className={styles.leftIcon}>
                <User size={18} />
              </div>
              <TextField
                label={t("auth.login.username")}
                placeholder={t("auth.login.username")}
                value={credentials.username}
                onChange={(e) => {
                  setCredentials({ ...credentials, username: e.target.value });
                  setLoginError(null);
                }}
                error={hasTriedSubmit && !isUsernameValid}
                helperText={
                  hasTriedSubmit && !isUsernameValid
                    ? t("auth.login.usernameRequired")
                    : ""
                }
                className={styles.textField}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className={styles.fieldWrapper}>
            <div className={styles.fieldWithLeftIcon}>
              <div className={styles.leftIcon}>
                <Lock size={18} />
              </div>
              <TextField
                label={t("auth.login.password")}
                type={showPassword ? "text" : "password"}
                placeholder={t("auth.login.password")}
                value={credentials.password}
                onChange={(e) => {
                  setCredentials({ ...credentials, password: e.target.value });
                  setLoginError(null);
                }}
                error={hasTriedSubmit && !isPasswordValid}
                helperText={
                  hasTriedSubmit && !isPasswordValid
                    ? t("auth.login.passwordRequired")
                    : ""
                }
                disabled={isLoading}
                icon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.passwordToggle}
                    aria-label={showPassword ? t("common.hide") : t("common.show")}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                className={styles.textField}
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="large"
            fullWidth
            className={styles.loginButton}
            disabled={isLoading}
          >
            {isLoading ? (
              t("auth.login.loggingIn")
            ) : (
              <>
                <LogIn size={17} aria-hidden="true" />
                {t("auth.login.submit")}
              </>
            )}
          </Button>
        </form>
      </div>
      )}
    </div>
  );
};
