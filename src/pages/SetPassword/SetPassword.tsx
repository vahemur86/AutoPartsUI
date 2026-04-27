import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setPassword, clearAuthError } from "@/store/slices/authSlice";

import { TextField, Button } from "@/ui-kit";
import { Lock, Eye, EyeOff } from "lucide-react";

import styles from "./SetPassword.module.css";

export const SetPassword = () => {
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
      toast.error("Invalid or expired link");
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
      toast.success("Password set successfully!");
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.gridBackground} />
      <div className={styles.overlay} />

      <div className={styles.content}>
        <h1 className={styles.heading}>Set Password</h1>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldWrapper}>
            <div className={styles.fieldWithLeftIcon}>
              <div className={styles.leftIcon}>
                <Lock size={20} />
              </div>

              <TextField
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPasswordState(e.target.value)}
                error={hasTriedSubmit && !isPasswordValid}
                helperText={
                  hasTriedSubmit && !isPasswordValid
                    ? "Password must be at least 4 characters"
                    : ""
                }
                className={styles.textField}
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
              />
            </div>
          </div>

          <div className={styles.fieldWrapper}>
            <div className={styles.fieldWithLeftIcon}>
              <div className={styles.leftIcon}>
                <Lock size={20} />
              </div>

              <TextField
                label="Repeat Password"
                type={showRepeatPassword ? "text" : "password"}
                placeholder="Repeat password"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                error={hasTriedSubmit && (!isRepeatValid || !isMatch)}
                helperText={
                  hasTriedSubmit && !isMatch ? "Passwords do not match" : ""
                }
                className={styles.textField}
                style={{ padding: "40px" }}
                disabled={isLoading}
                icon={
                  <button
                    type="button"
                    onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                    className={styles.passwordToggle}
                  >
                    {showRepeatPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
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
            {isLoading ? "Saving..." : "Set Password"}
          </Button>
        </form>
      </div>
    </div>
  );
};
