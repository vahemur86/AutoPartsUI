import { useTranslation } from "react-i18next";
import { Link, Outlet, useLocation } from "react-router-dom";

// icons
import {
  ClipboardList,
  ArrowRight,
  FileCheck,
  BarChart3,
  Clock,
  FlaskRound,
  Wallet,
  Database,
  ShoppingCart,
  Boxes,
  Hammer,
  WalletCards,
  Wrench,
} from "lucide-react";

import { SectionHeader } from "@/components/common";
import { ReportsWorkspace, type ReportNavSection } from "./ReportsWorkspace";
import styles from "./ReportsHome.module.css";

const useReportSections = () => {
  const { t } = useTranslation();

  const navigationSections: ReportNavSection[] = [
    {
      key: "cashbox",
      title: t("reports.navigationGroups.cashbox"),
      icon: WalletCards,
      items: [
        { path: "/z-reports", label: t("reports.navigation.zReports"), icon: FileCheck },
        { path: "/open-sessions", label: t("reports.navigation.openSessions"), icon: Clock },
        { path: "/cashbox-sessions-reports", label: t("reports.navigation.cashboxSessionsReports"), icon: Wallet },
      ],
    },
    {
      key: "inventory",
      title: t("reports.navigationGroups.inventory"),
      icon: Boxes,
      items: [
        { path: "/batch-reports", label: t("reports.navigation.batchReports"), icon: BarChart3 },
        { path: "/powder-batches", label: t("reports.navigation.powderBatches"), icon: FlaskRound },
        { path: "/special-lots", label: t("reports.navigation.specialLots"), icon: Boxes },
      ],
    },
    {
      key: "iron",
      title: t("reports.navigationGroups.iron"),
      icon: Hammer,
      items: [
        { path: "/iron-products-reports", label: t("reports.navigation.ironProducts"), icon: Database },
        { path: "/iron-sale", label: t("reports.navigation.ironSale"), icon: ShoppingCart },
        { path: "/iron-purchases", label: t("reports.navigation.ironPurchases"), icon: ShoppingCart },
      ],
    },
    {
      key: "service",
      title: t("reports.navigationGroups.service"),
      icon: Wrench,
      items: [
        { path: "/workshop-orders", label: t("reports.navigation.workshopOrders"), icon: ClipboardList },
        { path: "/service-task-reports", label: t("reports.navigation.serviceTasks"), icon: Wrench },
      ],
    },
  ];

  return navigationSections;
};

export const Reports = () => {
  const { pathname } = useLocation();
  const sections = useReportSections();

  if (pathname === "/reports" || pathname === "/reports/") {
    return <Outlet />;
  }

  return <ReportsWorkspace sections={sections} />;
};

export const ReportsHome = () => {
  const { t } = useTranslation();
  const sections = useReportSections();

  return (
    <div className={styles.reportsHome}>
      <SectionHeader
        title={t("header.reports")}
        icon={<ClipboardList size={20} />}
      />
      <p className={styles.description}>
        {t("reports.overview.description")}
      </p>
      <div className={styles.groupGrid}>
        {sections.map((section) => {
          const GroupIcon = section.icon ?? ClipboardList;
          return (
            <section
              className={styles.groupCard}
              data-group={section.key}
              key={section.key}
              aria-labelledby={`report-group-${section.key}`}
            >
              <header className={styles.groupHeader}>
                <span className={styles.groupIcon} aria-hidden="true">
                  <GroupIcon size={18} />
                </span>
                <h2 id={`report-group-${section.key}`}>{section.title}</h2>
                <span className={styles.groupCount}>
                  {section.items.length}
                </span>
              </header>
              <nav className={styles.reportLinks} aria-label={section.title}>
                {section.items.map(({ path, label, icon: ReportIcon }) => (
                  <Link
                    className={styles.reportLink}
                    key={path}
                    to={`/reports${path}`}
                  >
                    <ReportIcon size={16} aria-hidden="true" />
                    <span>{label}</span>
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                ))}
              </nav>
            </section>
          );
        })}
      </div>
    </div>
  );
};
