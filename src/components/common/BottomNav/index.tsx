import { useLocation, useNavigate } from "react-router-dom";
import {
  Settings,
  Warehouse,
  ShoppingBag,
  PackageSearch,
  Users,
} from "lucide-react";
import styles from "./BottomNav.module.css";

export const BottomNav = () => {
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

  const navItems = [
    {
      path: "/settings",
      icon: Settings,
      label: "Settings",
    },
    {
      path: "/products",
      icon: PackageSearch,
      label: "Products",
    },
    {
      path: "/warehouses",
      icon: Warehouse,
      label: "Warehouses",
    },
    {
      path: "/shops",
      icon: ShoppingBag,
      label: "Shops",
    },
    {
      path: "/users",
      icon: Users,
      label: "User Management",
    },
  ];

  return (
    <nav className={styles.bottomNav}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        return (
          <button
            key={item.path}
            className={`${styles.navItem} ${active ? styles.active : ""}`}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
          >
            <Icon
              size={24}
              className={styles.icon}
              color={active ? "#ECF15E" : "#CCCCCC"}
            />
          </button>
        );
      })}
    </nav>
  );
};
