import {
  Boxes,
  ChartColumnBig,
  ChartColumnIncreasing,
  ClipboardList,
  Factory,
  FlaskConical,
  FolderOpen,
  HandCoins,
  Hammer,
  LayoutDashboard,
  MoveUp,
  PackageOpen,
  WalletCards,
  Wrench,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

import styles from "./ReportsWorkspace.module.css";
import type { LucideIcon } from "lucide-react";

interface ReportNavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

export interface ReportNavSection {
  key: string;
  title: string;
  icon?: LucideIcon;
  items: ReportNavItem[];
}

interface ReportsWorkspaceProps {
  sections: ReportNavSection[];
  basePath?: string;
  title?: string;
  eyebrow?: string;
  icon?: LucideIcon;
}

const sectionIcons: Record<string, LucideIcon> = {
  cashbox: WalletCards,
  expenses: HandCoins,
  operations: Factory,
  overview: LayoutDashboard,
  profitability: ChartColumnBig,
  inventory: Boxes,
  iron: Hammer,
  service: Wrench,
  powderLots: FlaskConical,
  productsAndStock: PackageOpen,
  financial: ChartColumnIncreasing,
};

export const ReportsWorkspace = ({
  sections,
  basePath = "/reports",
  title,
  eyebrow,
  icon: WorkspaceIcon = ClipboardList,
}: ReportsWorkspaceProps) => {
  const { t } = useTranslation();
  const pageTitle = title ?? t("header.reports");
  const pageEyebrow = eyebrow ?? t("header.analytics");
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const updateScrollState = () => setShowBackToTop(window.scrollY > 280);

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  const handleBackToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  return (
    <main className={styles.workspace}>
      <header className={styles.masthead}>
        <span className={styles.mastheadIcon} aria-hidden="true">
          <WorkspaceIcon size={20} />
        </span>
        <div>
          <span className={styles.eyebrow}>{pageEyebrow}</span>
          <h1>{pageTitle}</h1>
        </div>
      </header>

      <div className={styles.reportLayout}>
        <nav className={styles.navigation} aria-label={pageTitle}>
          {sections.map((section) => {
            const SectionIcon = section.icon ?? sectionIcons[section.key] ?? FolderOpen;

            return (
              <div className={styles.navigationSection} key={section.key}>
                <h2 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon} aria-hidden="true">
                    <SectionIcon size={14} strokeWidth={1.9} />
                  </span>
                  <span className={styles.sectionName}>{section.title}</span>
                  <span className={styles.sectionCount}>{section.items.length}</span>
                </h2>
                <div className={styles.sectionItems}>
                  {section.items.map(({ path, label, icon: Icon }) => (
                    <NavLink
                      key={path}
                      to={`${basePath}${path}`}
                      className={({ isActive }) =>
                        `${styles.navigationItem} ${isActive ? styles.active : ""}`
                      }
                    >
                      <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
                      <span>{label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
          {showBackToTop && (
            <button
              type="button"
              className={styles.backToTopButton}
              onClick={handleBackToTop}
              aria-label={t("common.backToTop")}
              title={t("common.backToTop")}
            >
              <MoveUp size={17} aria-hidden="true" />
            </button>
          )}
        </nav>

        <section className={styles.content}>
          <Outlet />
        </section>
      </div>
    </main>
  );
};