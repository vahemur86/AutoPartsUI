import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
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

// styles
import styles from "./Login.module.css";

export const Login = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

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
      toast.success("Welcome back!");

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
      <div className={styles.gridBackground} />
      <div className={styles.overlay} />

      <div className={styles.content}>
        <div className={styles.logoContainer}>
          <div className={styles.logo}>
            <img src={logoImage} alt="Logo" className={styles.logoImage} />
          </div>
        </div>

        <h1 className={styles.heading}>Login to PRP</h1>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.fieldWrapper}>
            <div className={styles.fieldWithLeftIcon}>
              <div className={styles.leftIcon}>
                <User size={20} />
              </div>
              <TextField
                label="Username"
                placeholder="Username"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials({ ...credentials, username: e.target.value })
                }
                error={hasTriedSubmit && !isUsernameValid}
                helperText={
                  hasTriedSubmit && !isUsernameValid
                    ? "Username is required"
                    : ""
                }
                className={styles.textField}
                style={{ padding: "40px" }}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className={styles.fieldWrapper}>
            <div className={styles.fieldWithLeftIcon}>
              <div className={styles.leftIcon}>
                <Lock size={20} />
              </div>
              <TextField
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
                error={hasTriedSubmit && !isPasswordValid}
                helperText={
                  hasTriedSubmit && !isPasswordValid
                    ? "Password is required"
                    : ""
                }
                style={{ padding: "40px" }}
                disabled={isLoading}
                icon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.passwordToggle}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
            {isLoading ? "Logging in..." : "Log In"}
          </Button>
        </form>
      </div>
    </div>
  );
};
