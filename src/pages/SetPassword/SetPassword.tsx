import { useState, useEffect, useRef, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setPassword, clearAuthError } from "@/store/slices/authSlice";

import { TextField, Button } from "@/ui-kit";
import {
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  KeyRound,
  Languages,
  Lock,
} from "lucide-react";

import platformScene from "@/assets/images/catalyst-platform-scene.svg";
import i18n from "@/i18n/config";
import styles from "../Login/Login.module.css";
import { Dropdown } from "@/ui-kit/components/Dropdown";
import { getLanguages } from "@/services/settings/languages";
import type { Language } from "@/types/settings";
import { mapApiCodeToI18nCode } from "@/utils/languageMapping";

const FALLBACK_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "ru", name: "Русский" },
  { code: "am", name: "Հայերեն" },
];

export const SetPassword = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [password, setPasswordState] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [languageOptions, setLanguageOptions] = useState(FALLBACK_LANGUAGES);
  const [selectedLanguageCode, setSelectedLanguageCode] = useState(() =>
    mapApiCodeToI18nCode(i18n.resolvedLanguage || i18n.language),
  );
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const languageControlRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isCancelled = false;

    const initializeLanguage = async () => {
      let projectLanguages: Language[] = [];
      try {
        projectLanguages = await getLanguages();
      } catch {
        // Keep the set-password page available when public language settings fail.
      }

      if (isCancelled) return;

      const enabledLanguages = projectLanguages
        .filter((language) => language.isEnabled)
        .map((language) => ({
          code: mapApiCodeToI18nCode(language.code),
          name: language.name,
          isDefault: language.isDefault,
        }))
        .filter((language) => i18n.hasResourceBundle(language.code, "translation"));
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

    void initializeLanguage();
    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearAuthError());
    }
  }, [error, dispatch]);

  const isPasswordValid = password.length >= 4;
  const isRepeatValid = repeatPassword.length >= 4;
  const isMatch = password === repeatPassword;

  const isFormValid = !!token && isPasswordValid && isRepeatValid && isMatch;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setHasTriedSubmit(true);

    if (!token) {
      toast.error(t("auth.setPassword.invalidLink"));
      return;
    }

    if (!isFormValid) return;

    const result = await dispatch(
      setPassword({
        token,
        password,
      }),
    );

    if (setPassword.fulfilled.match(result)) {
      toast.success(t("auth.setPassword.success"));
      navigate("/login", { replace: true });
    }
  };

  const handleLanguageChange = async (languageCode: string) => {
    if (!i18n.hasResourceBundle(languageCode, "translation")) return;
    await i18n.changeLanguage(languageCode);
    localStorage.setItem("i18nextLng", languageCode);
    setSelectedLanguageCode(languageCode);
    setIsLanguageMenuOpen(false);
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

      <main className={styles.content}>
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
                  <span className={styles.languageCode}>{language.code.toUpperCase()}</span>
                  <span className={styles.languageOptionName}>{language.name}</span>
                  {isSelected && <Check size={17} aria-hidden="true" />}
                </button>
              );
            })}
          </Dropdown>
        </div>

        <section className={styles.brandPanel}>
          <div className={styles.logoContainer}>
            <div className={styles.logo}>
              <span className={styles.logoBrand} aria-hidden="true">
                <span className={styles.logoPrp}>PRP</span>
                <span className={styles.logoService}>Service</span>
              </span>
            </div>
          </div>
          <div className={styles.brandCopy}>
            <span className={styles.brandEyebrow}>{t("auth.setPassword.brandEyebrow")}</span>
            <h1 className={styles.heading}>{t("auth.setPassword.pageTitle")}</h1>
          </div>
        </section>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.formHeader}>
            <span className={styles.formBadge}>{t("auth.setPassword.badge")}</span>
            <h2>{t("auth.setPassword.welcome")}</h2>
            <p className={styles.formDescription}>
              {t("auth.setPassword.description")}
            </p>
          </div>

          <div className={styles.fieldWrapper}>
            <div className={styles.fieldWithLeftIcon}>
              <div className={styles.leftIcon}>
                <Lock size={18} />
              </div>
              <TextField
                label={t("auth.setPassword.password")}
                type={showPassword ? "text" : "password"}
                placeholder={t("auth.setPassword.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPasswordState(e.target.value)}
                error={hasTriedSubmit && !isPasswordValid}
                helperText={
                  hasTriedSubmit && !isPasswordValid
                    ? t("auth.setPassword.passwordMinimum")
                    : ""
                }
                className={styles.textField}
                disabled={isLoading}
                icon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.passwordToggle}
                    aria-label={t(showPassword ? "common.hide" : "common.show")}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />
            </div>
          </div>

          <div className={styles.fieldWrapper}>
            <div className={styles.fieldWithLeftIcon}>
              <div className={styles.leftIcon}>
                <Lock size={18} />
              </div>
              <TextField
                label={t("auth.setPassword.repeatPassword")}
                type={showRepeatPassword ? "text" : "password"}
                placeholder={t("auth.setPassword.repeatPasswordPlaceholder")}
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                error={hasTriedSubmit && (!isRepeatValid || !isMatch)}
                helperText={
                  hasTriedSubmit && !isMatch
                    ? t("auth.setPassword.passwordMismatch")
                    : ""
                }
                className={styles.textField}
                disabled={isLoading}
                icon={
                  <button
                    type="button"
                    onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                    className={styles.passwordToggle}
                    aria-label={t(showRepeatPassword ? "common.hide" : "common.show")}
                  >
                    {showRepeatPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                }
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
              t("auth.setPassword.submitting")
            ) : (
              <>
                <KeyRound size={17} aria-hidden="true" />
                {t("auth.setPassword.submit")}
              </>
            )}
          </Button>
        </form>
      </main>
    </div>
  );
};
