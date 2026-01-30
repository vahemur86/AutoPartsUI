import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

// ui-kit
import { Tab, Stepper, type StepperStep } from "@/ui-kit";

// icons
import {
  Globe,
  Languages,
  Warehouse,
  ShoppingBag,
  Settings as SettingsIcon,
  Truck,
  Container,
  FlaskConical,
  Users,
  Currency,
  CreditCard,
  Percent,
} from "lucide-react";

// components
import { SectionHeader } from "@/components/common/SectionHeader";

// styles
import styles from "./Settings.module.css";

export const Settings = () => {
  const { t } = useTranslation();
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
      label: t("settings.navigation.projectLanguages"),
      icon: Globe,
      showCheckmark: true,
    },
    {
      path: "/translation",
      label: t("settings.navigation.translation"),
      icon: Languages,
      showCheckmark: true,
    },
    {
      path: "/warehouse",
      label: t("settings.navigation.warehouse"),
      icon: Warehouse,
      showCheckmark: true,
    },
    {
      path: "/shops",
      label: t("settings.navigation.shops"),
      icon: ShoppingBag,
      showCheckmark: true,
    },
    {
      path: "/product-settings",
      label: t("settings.navigation.productSettings"),
      icon: SettingsIcon,
      showCheckmark: true,
    },
    {
      path: "/vehicle-management",
      label: t("settings.navigation.vehicleManagement"),
      icon: Truck,
      showCheckmark: true,
    },
    {
      path: "/metal-rates",
      label: t("settings.navigation.metalRates"),
      icon: Container,
      showCheckmark: true,
    },
    {
      path: "/catalyst-buckets",
      label: t("settings.navigation.catalystBuckets"),
      icon: FlaskConical,
      showCheckmark: true,
    },
    {
      path: "/customer-types",
      label: t("settings.navigation.customerTypes"),
      icon: Users,
      showCheckmark: true,
    },
    {
      path: "/exchange-rates",
      label: t("settings.navigation.exchangeRates"),
      icon: Currency,
      showCheckmark: true,
    },
    {
      path: "/cash-registers",
      label: t("settings.navigation.cashRegisters"),
      icon: CreditCard,
      showCheckmark: true,
    },
    {
      path: "/offer-increase-options",
      label: t("settings.navigation.offerIncreaseOptions"),
      icon: Percent,
      showCheckmark: true,
    },
  ];

  const activeItem = navigationItems.find((item) => isActive(item.path));
  const activeSectionTitle = activeItem?.label ?? t("header.settings");
  const ActiveIcon = activeItem?.icon ?? SettingsIcon;

  const activeStepIndex = navigationItems.findIndex((item) =>
    isActive(item.path),
  );
  const activeIndex = activeStepIndex >= 0 ? activeStepIndex : 0;

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

  return (
    <>
      <SectionHeader
        icon={<ActiveIcon size={24} />}
        title={activeSectionTitle}
      />

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
