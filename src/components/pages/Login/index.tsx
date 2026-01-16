import { useState, type FormEvent } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { TextField } from "@/ui-kit/components/TextField";
import { Button } from "@/ui-kit/components/Button";
import styles from "./Login.module.css";
import logoImage from "@/assets/icons/Subtract.svg";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("Login:", { email, password });
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

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.fieldWrapper}>
            <div className={styles.fieldWithLeftIcon}>
              <div className={styles.leftIcon}>
                <Mail size={20} />
              </div>
              <TextField
                label="Email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.textField}
                style={{ padding: "40px" }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className={styles.fieldWrapper}>
            <div className={styles.fieldWithLeftIcon}>
              <div className={styles.leftIcon}>
                <Lock size={20} />
              </div>
              <TextField
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ padding: "40px" }}
                icon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.passwordToggle}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                }
                className={styles.textField}
              />
            </div>
          </div>

          {/* Login Button */}
          <Button
            type="submit"
            variant="primary"
            size="large"
            fullWidth
            className={styles.loginButton}
          >
            Log In
          </Button>
        </form>
      </div>
    </div>
  );
};
