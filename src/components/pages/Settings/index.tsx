import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { Tab, Stepper } from "@/ui-kit";
import type { StepperStep } from "@/ui-kit";
import {
  Globe,
  Languages,
  Warehouse,
  ShoppingBag,
  Settings as SettingsIcon,
  Truck,
} from "lucide-react";
import styles from "./Settings.module.css";
import SectionHeader from "@/components/common/SectionHeader";

export const Settings = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    const currentPath = location.pathname;

    if (currentPath === `/settings${path}`) {
      return true;
    }

    // Handle /settings redirect to product-settings
    if (currentPath === "/settings" && path === "/product-settings") {
      return true;
    }

    // Handle /settings/ (with trailing slash)
    if (currentPath === "/settings/" && path === "/product-settings") {
      return true;
    }

    return false;
  };

  const handleTabClick = (path: string) => {
    navigate(`/settings${path}`);
  };

  const navigationItems = [
    {
      path: "/project-languages",
      label: "Project Languages",
      icon: Globe,
      showCheckmark: true,
    },
    {
      path: "/translation",
      label: "Translation",
      icon: Languages,
      showCheckmark: true,
    },
    {
      path: "/warehouse",
      label: "Warehouse",
      icon: Warehouse,
      showCheckmark: true,
    },
    { path: "/shops", label: "Shops", icon: ShoppingBag, showCheckmark: true },
    {
      path: "/product-settings",
      label: "Product Settings",
      icon: SettingsIcon,
      showCheckmark: true,
    },
    {
      path: "/vehicle-management",
      label: "Vehicle Management",
      icon: Truck,
      showCheckmark: true,
    },
  ];

  // Find active step index for stepper
  const activeStepIndex = navigationItems.findIndex((item) =>
    isActive(item.path)
  );
  const activeIndex = activeStepIndex >= 0 ? activeStepIndex : 0;

  // Convert navigation items to stepper steps
  const stepperSteps: StepperStep[] = navigationItems.map((item, index) => ({
    id: item.path,
    label: item.label,
    completed: index < activeIndex,
  }));

  const handleStepperStepClick = (stepIndex: number) => {
    if (stepIndex < navigationItems.length) {
      handleTabClick(navigationItems[stepIndex].path);
    }
  };

  const activeSectionTitle =
    navigationItems.find((item) => isActive(item.path))?.label ?? "Settings";

  return (
    <>
      <SectionHeader title={activeSectionTitle} />

      <div className={styles.settingsContainer}>
        <div className={styles.mainCard}>
          {/* Desktop Sidebar */}
          <div className={styles.sidebar}>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Tab
                  key={item.path}
                  variant="vertical"
                  active={isActive(item.path)}
                  text={item.label}
                  icon={<Icon size={20} color="#ffffff" />}
                  showCheckmark={item.showCheckmark}
                  onClick={() => handleTabClick(item.path)}
                />
              );
            })}
          </div>

          <div className={styles.content}>
            {/* Mobile Stepper - inside content area */}
            <div className={styles.mobileStepper}>
              <Stepper
                steps={stepperSteps}
                activeStepIndex={activeIndex}
                onStepClick={handleStepperStepClick}
              />
            </div>
            <div className={styles.contentWrapper}>
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
