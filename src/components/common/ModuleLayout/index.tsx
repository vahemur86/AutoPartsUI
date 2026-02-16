import type { FC, ReactNode } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";

// icons
import type { LucideIcon } from "lucide-react";

// ui-kit
import { Tab, Stepper, type StepperStep } from "@/ui-kit";

// components
import { SectionHeader } from "../SectionHeader";

// styles
import styles from "./ModuleLayout.module.css";

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  showCheckmark?: boolean;
}

interface ModuleLayoutProps {
  basePath: string;
  navigationItems: NavItem[];
  defaultTitle: string;
  defaultIcon: LucideIcon;
  actions?: ReactNode;
}

export const ModuleLayout: FC<ModuleLayoutProps> = ({
  basePath,
  navigationItems,
  defaultTitle,
  defaultIcon: DefaultIcon,
  actions,
}) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const getIsActive = (itemPath: string) => {
    const fullPath = `${basePath}${itemPath}`;

    if (pathname === fullPath) return true;

    if (pathname === basePath || pathname === `${basePath}/`) {
      return itemPath === navigationItems[0].path;
    }

    return false;
  };

  const activeItem = navigationItems.find((item) => getIsActive(item.path));
  const activeIndex = navigationItems.findIndex((item) =>
    getIsActive(item.path),
  );
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;

  const ActiveIcon = activeItem?.icon ?? DefaultIcon;
  const activeTitle = activeItem?.label ?? defaultTitle;

  const stepperSteps: StepperStep[] = navigationItems.map((item, index) => ({
    id: item.path,
    label: item.label,
    completed: index < safeIndex,
  }));

  const handleNavigate = (path: string) => navigate(`${basePath}${path}`);

  return (
    <>
      <SectionHeader
        icon={<ActiveIcon size={24} />}
        title={activeTitle}
        actions={actions}
      />

      <div className={styles.container}>
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            {navigationItems.map((item) => (
              <Tab
                key={item.path}
                variant="vertical"
                active={getIsActive(item.path)}
                text={item.label}
                icon={<item.icon size={20} color="#ffffff" />}
                showCheckmark={item.showCheckmark}
                onClick={() => handleNavigate(item.path)}
              />
            ))}
          </aside>

          <div className={styles.content}>
            <div className={styles.mobileStepper}>
              <Stepper
                steps={stepperSteps}
                activeStepIndex={safeIndex}
                onStepClick={(idx) => handleNavigate(navigationItems[idx].path)}
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
