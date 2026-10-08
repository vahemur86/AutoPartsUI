import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { login, clearAuthError } from "@/store/slices/authSlice";

// utils
import { applyUserLanguagePreference } from "@/utils";

// ui-kit
import { TextField, Button } from "@/ui-kit";

// icons
import { Lock, Eye, EyeOff, User } from "lucide-react";

// images
import logoImage from "@/assets/icons/Subtract.svg";
import platformScene from "@/assets/images/catalyst-platform-scene.svg";

// styles
import styles from "./Login.module.css";

export const Login = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { isLoading, error, isAuthenticated, user } = useAppSelector(
    (state) => state.auth,
  );

  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      const userRole = user.role.toLowerCase();
      const targetPath =
        userRole === "operator"
          ? "/operator"
          : userRole === "cashier"
            ? "/shop-operator"
            : userRole === "programmer"
              ? "/programmer"
              : "/finance-reports/dashboard";
      navigate(targetPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearAuthError());
    }
  }, [error, dispatch]);

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

    if (!isFormValid) return;

    const resultAction = await dispatch(login(credentials));

    if (login.fulfilled.match(resultAction)) {
      // Use the same casing as the API returns
      const userRole = resultAction.payload.role.toLowerCase();

      await initializeDefaultLanguage();
      toast.success(t("auth.login.welcomeBack"));

      if (userRole === "cashier") {
        navigate("/shop-operator", { replace: true });
      } else if (userRole === "operator") {
        navigate("/operator", { replace: true });
      } else if (userRole === "programmer") {
        navigate("/programmer", { replace: true });
      } else {
        navigate("/finance-reports/dashboard", { replace: true });
      }
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

      <div className={styles.content}>
        <div className={styles.brandPanel}>
          <div className={styles.logoContainer}>
            <div className={styles.logo}>
              <img src={logoImage} alt="PRP" className={styles.logoImage} />
            </div>
          </div>
          <div className={styles.brandCopy}>
            <span className={styles.brandEyebrow}>Precision Resource Platform</span>
            <h1 className={styles.heading}>{t("auth.login.title")}</h1>
          </div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.formHeader}>
            <span className={styles.formBadge}>Secure access</span>
            <h2>{t("auth.login.welcome")}</h2>
          </div>

          <div className={styles.fieldWrapper}>
            <div className={styles.fieldWithLeftIcon}>
              <div className={styles.leftIcon}>
                <User size={18} />
              </div>
              <TextField
                label={t("auth.login.username")}
                placeholder={t("auth.login.username")}
                value={credentials.username}
                onChange={(e) =>
                  setCredentials({ ...credentials, username: e.target.value })
                }
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
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
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
            {isLoading ? t("auth.login.loggingIn") : t("auth.login.submit")}
          </Button>
        </form>
      </div>
    </div>
  );
};
