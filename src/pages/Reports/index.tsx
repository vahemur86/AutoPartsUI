import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

// ui-kit
import { Tab, Stepper, type StepperStep } from "@/ui-kit";

// icons
import { FileText, Layers, History, Package, Banknote } from "lucide-react";

// components
import { SectionHeader } from "@/components/common/SectionHeader";

// styles
import styles from "./Reports.module.css";

export const Reports = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    return location.pathname === `/reports${path}`;
  };

  const handleTabClick = (path: string) => {
    navigate(`/reports${path}`);
  };

  const navigationItems = [
    {
      path: "/z-reports",
      label: t("reports.navigation.zReports"),
      icon: FileText,
      showCheckmark: true,
    },
    {
      path: "/batch-reports",
      label: t("reports.navigation.batchReports"),
      icon: Layers,
      showCheckmark: true,
    },
    {
      path: "/open-sessions",
      label: t("reports.navigation.openSessions"),
      icon: History,
      showCheckmark: true,
    },
    {
      path: "/powder-batches",
      label: t("reports.navigation.powderBatches"),
      icon: Package,
      showCheckmark: true,
    },
    {
      path: "/cashbox-sessions-reports",
      label: t("reports.navigation.cashboxSessionsReports"),
      icon: Banknote,
      showCheckmark: true,
    },
  ];

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

  const activeSectionTitle =
    navigationItems.find((item) => isActive(item.path))?.label ??
    t("header.reports");

  return (
    <>
      <SectionHeader title={activeSectionTitle} />

      <div className={styles.reportsContainer}>
        <div className={styles.reportsLayout}>
          <div className={styles.reportsSidebar}>
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

          <div className={styles.reportsContent}>
            <div className={styles.reportsMobileStepper}>
              <Stepper
                steps={stepperSteps}
                activeStepIndex={activeIndex}
                onStepClick={handleStepperStepClick}
              />
            </div>
            <div className={styles.reportsContentWrapper}>
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
