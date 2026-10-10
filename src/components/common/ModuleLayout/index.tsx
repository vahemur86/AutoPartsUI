import { useEffect, useState, type FC, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

// icons
import { MoveUp, type LucideIcon } from "lucide-react";

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
  group?: string;
  groupIcon?: LucideIcon;
}

interface ModuleLayoutProps {
  basePath: string;
  navigationItems: NavItem[];
  defaultTitle: string;
  defaultIcon: LucideIcon;
  actions?: ReactNode;
  headerAppearance?: "default" | "finance" | "warehouse";
}

export const ModuleLayout: FC<ModuleLayoutProps> = ({
  basePath,
  navigationItems,
  defaultTitle,
  defaultIcon: DefaultIcon,
  actions,
  headerAppearance,
}) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isWarehouseLayout = headerAppearance === "warehouse";
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    if (!isWarehouseLayout) return;

    const updateScrollState = () => setShowBackToTop(window.scrollY > 280);
    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollState);
  }, [isWarehouseLayout]);

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
  const hasNavigationGroups = navigationItems.some((item) => item.group);

  const stepperSteps: StepperStep[] = navigationItems.map((item, index) => ({
    id: item.path,
    label: item.label,
    completed: index < safeIndex,
  }));
  const navigationGroups = navigationItems.reduce<
    { title: string; icon?: LucideIcon; items: NavItem[] }[]
  >((groups, item) => {
    const title = item.group ?? "";
    const currentGroup = groups[groups.length - 1];
    if (currentGroup?.title === title) {
      currentGroup.items.push(item);
    } else {
      groups.push({ title, icon: item.groupIcon, items: [item] });
    }
    return groups;
  }, []);

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
  const handleBackToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

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
        appearance={headerAppearance}
        eyebrow={activeItem?.group}
      />

      <div className={`${styles.container} ${isWarehouseLayout ? styles.warehouseContainer : ""}`}>
        <div className={`${styles.layout} ${isWarehouseLayout ? styles.warehouseLayout : ""}`}>
          <aside className={`${styles.sidebar} ${isWarehouseLayout ? styles.warehouseSidebar : ""}`}>
            {navigationGroups.map((group, groupIndex) => (
              <section
                className={`${styles.sidebarGroup} ${group.title ? styles.sidebarGroupTitled : ""}`}
                key={`${group.title}-${groupIndex}`}
              >
                {group.title && (
                  <h2 className={styles.sidebarGroupTitle}>
                    {group.icon && <group.icon size={13} aria-hidden="true" />}
                    <span>{group.title}</span>
                  </h2>
                )}
                {group.items.map((item) => (
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
              </section>
            ))}
            {isWarehouseLayout && showBackToTop && (
              <button
                type="button"
                className={styles.warehouseBackToTop}
                onClick={handleBackToTop}
                aria-label={t("common.backToTop")}
                title={t("common.backToTop")}
              >
                <MoveUp size={17} aria-hidden="true" />
              </button>
            )}
          </aside>

          <div className={`${styles.content} ${isWarehouseLayout ? styles.warehouseContent : ""}`}>
            <div className={styles.mobileStepper}>
              {hasNavigationGroups ? (
                <nav className={styles.mobileGroupedNav} aria-label={defaultTitle}>
                  {navigationGroups.map((group, groupIndex) => (
                    <section className={styles.mobileNavGroup} key={`${group.title}-${groupIndex}`}>
                      <span className={styles.mobileNavGroupTitle}>{group.title}</span>
                      {group.items.map(({ path, label, icon: Icon }) => {
                        const active = getIsActive(path);
                        return (
                          <button
                            key={path}
                            type="button"
                            className={`${styles.mobileNavItem} ${active ? styles.mobileNavItemActive : ""}`}
                            onClick={() => handleNavigate(path)}
                            aria-current={active ? "page" : undefined}
                          >
                            <Icon size={14} aria-hidden="true" />
                            <span>{label}</span>
                          </button>
                        );
                      })}
                    </section>
                  ))}
                  {isWarehouseLayout && showBackToTop && (
                    <button
                      type="button"
                      className={styles.warehouseBackToTop}
                      onClick={handleBackToTop}
                      aria-label={t("common.backToTop")}
                      title={t("common.backToTop")}
                    >
                      <MoveUp size={16} aria-hidden="true" />
                    </button>
                  )}
                </nav>
              ) : (
                <Stepper
                  steps={stepperSteps}
                  activeStepIndex={safeIndex}
                  onStepClick={(idx) => handleNavigate(navigationItems[idx].path)}
                />
              )}
            </div>
            <div
              className={`${styles.contentWrapper} ${isWarehouseLayout ? styles.warehouseContentWrapper : ""}`}
            >
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
