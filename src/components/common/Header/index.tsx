import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

// ui-kit
import { Tab } from "@/ui-kit";

// stores
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";

// icons
import { Bell, LogOut } from "lucide-react";
import logoImage from "@/assets/icons/Subtract.svg";

// hooks
import { useActiveRoute } from "@/hooks/useIsActive";

// styles
import styles from "./Header.module.css";

export const Header = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.headerContainer}>
      <header className={styles.header}>
        <div
          className={styles.logoContainer}
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          <img src={logoImage} alt="Logo" className={styles.logoImage} />
        </div>

        <div className={styles.rightContent}>
          <nav className={styles.nav}>
            <Tab
              variant="underline"
              active={isActive("/settings")}
              text={t("header.settings")}
              onClick={() => navigate("/settings")}
            />
            <Tab
              variant="underline"
              active={isActive("/products")}
              text={t("header.products")}
              onClick={() => navigate("/products")}
            />
            <Tab
              variant="underline"
              active={isActive("/warehouses")}
              text={t("header.warehouses")}
              onClick={() => navigate("/warehouses")}
            />
            <Tab
              variant="underline"
              active={isActive("/shops")}
              text={t("header.shops")}
              onClick={() => navigate("/shops")}
            />
            <Tab
              variant="underline"
              active={isActive("/users")}
              text={t("header.users")}
              onClick={() => navigate("/users")}
            />
            <Tab
              variant="underline"
              active={isActive("/customers")}
              text={t("header.customers")}
              onClick={() => navigate("/customers")}
            />
            <Tab
              variant="underline"
              active={isActive("/reports")}
              text={t("header.reports")}
              onClick={() => navigate("/reports")}
            />
          </nav>

          <div className={styles.actions}>
            <button
              className={styles.bellButton}
              aria-label={t("header.notifications")}
            >
              <Bell className={styles.bellIcon} />
            </button>

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

              {isDropdownOpen && (
                <div className={styles.dropdown} ref={dropdownRef}>
                  <button
                    className={styles.dropdownItem}
                    onClick={handleLogout}
                  >
                    <LogOut className={styles.dropdownIcon} size={16} />
                    <span>{t("header.logout")}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};
