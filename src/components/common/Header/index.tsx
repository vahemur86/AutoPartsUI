import { useTranslation } from "react-i18next";
import { Bell } from "lucide-react";
import { Tab } from "@/ui-kit";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./Header.module.css";
import logoImage from "@/assets/icons/Subtract.svg";

export const Header = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    // For settings, check if pathname starts with /settings (to include nested routes)
    if (path === "/settings") {
      return (
        location.pathname === path || location.pathname.startsWith("/settings/")
      );
    }
    // For other paths, use exact match
    return location.pathname === path;
  };

  return (
    <div className={styles.headerContainer}>
      <header className={styles.header}>
        <div className={styles.logoContainer}>
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
          </nav>

          {/* Right: Actions */}
          <div className={styles.actions}>
            <button className={styles.bellButton}>
              <Bell className={styles.bellIcon} />
            </button>

            <div className={styles.avatar}>
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
                alt="User"
                className={styles.avatarImage}
              />
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};
