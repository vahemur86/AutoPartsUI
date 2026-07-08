import { useState, type FC, type ReactNode } from "react";
import { createPortal } from "react-dom";
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

  const [tooltip, setTooltip] = useState<{
    label: string;
    top: number;
    left: number;
    visible: boolean;
  }>({
    label: "",
    top: 0,
    left: 0,
    visible: false,
  });

  const handleNavigate = (path: string) => navigate(`${basePath}${path}`);

  const handleShowTooltip = (
    target: HTMLDivElement,
    label: string,
  ) => {
    const rect = target.getBoundingClientRect();
    const tooltipWidth = 320;
    const viewportPadding = 8;
    const preferredLeft = rect.right + 12;
    const maxLeft = window.innerWidth - tooltipWidth - viewportPadding;
    const left = Math.max(viewportPadding, Math.min(preferredLeft, maxLeft));

    setTooltip({
      label,
      top: rect.top + rect.height / 2,
      left,
      visible: true,
    });
  };

  const handleHideTooltip = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

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
              <div
                key={item.path}
                className={styles.sidebarNavItem}
                onMouseEnter={(event) =>
                  handleShowTooltip(event.currentTarget, item.label)
                }
                onFocus={(event) =>
                  handleShowTooltip(event.currentTarget, item.label)
                }
                onMouseLeave={handleHideTooltip}
                onBlur={handleHideTooltip}
              >
                <Tab
                  variant="vertical"
                  active={getIsActive(item.path)}
                  text={item.label}
                  icon={<item.icon size={20} color="#ffffff" />}
                  showCheckmark={item.showCheckmark}
                  onClick={() => handleNavigate(item.path)}
                />
              </div>
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

      {tooltip.visible
        ? createPortal(
            <div
              className={styles.sidebarTooltip}
              style={{ top: tooltip.top, left: tooltip.left }}
              role="tooltip"
            >
              {tooltip.label}
            </div>,
            document.body,
          )
        : null}
    </>
  );
};
