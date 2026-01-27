import { useNavigate } from "react-router-dom";

// icons
import {
  Settings,
  Warehouse,
  ShoppingBag,
  PackageSearch,
  Users,
  UserCircle,
  FileText,
} from "lucide-react";

// hooks
import { useActiveRoute } from "@/hooks/useIsActive";

// styles
import styles from "./BottomNav.module.css";

export const BottomNav = () => {
  const navigate = useNavigate();

  const { isActive } = useActiveRoute();

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
    {
      path: "/customers",
      icon: UserCircle,
      label: "Customers",
    },
    {
      path: "/reports",
      icon: FileText,
      label: "Reports",
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
