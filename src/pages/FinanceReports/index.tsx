import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

// icons
import {
  ChartColumnBig,
  ListChecks,
  BadgeDollarSign,
  ChartCandlestick,
  ChartSpline,
  Wrench,
  Factory,
  Warehouse,
  Store,
  HandCoins,
  Boxes,
  ArrowLeftRight,
  ArrowRight,
} from "lucide-react";

// components
import { ReportsWorkspace, type ReportNavSection } from "@/pages/Reports/ReportsWorkspace";
import { SectionHeader } from "@/components/common";
import styles from "./FinanceReportsHome.module.css";

interface FinanceReportSection extends ReportNavSection {
  description: string;
}

const useFinanceReportSections = (): FinanceReportSection[] => {
  const { t } = useTranslation();

  return [
    {
      key: "operations",
      title: t("financeReports.navigationGroups.operations"),
      description: t("financeReports.groupDescriptions.operations"),
      icon: Factory,
      items: [
        {
          path: "/shop-reports",
          label: t("financeReports.navigation.shopReports"),
          icon: ChartCandlestick,
        },
        {
          path: "/service-reports",
          label: t("financeReports.navigation.serviceReports"),
          icon: Wrench,
        },
        {
          path: "/warehouse-reports",
          label: t("financeReports.navigation.warehouseReports"),
          icon: Factory,
        },
        {
          path: "/sales-reports",
          label: t("financeReports.navigation.salesReports"),
          icon: ChartSpline,
        },
      ],
    },
    {
      key: "profitability",
      title: t("financeReports.navigationGroups.profitability"),
      description: t("financeReports.groupDescriptions.profitability"),
      icon: ChartColumnBig,
      items: [
        {
          path: "/profit-summary",
          label: t("financeReports.navigation.shopProfitSummary"),
          icon: ChartColumnBig,
        },
        {
          path: "/warehouse-profit",
          label: t("financeReports.navigation.warehouseProfit"),
          icon: ArrowLeftRight,
        },
        {
          path: "/profit-detailed",
          label: t("financeReports.navigation.profitDetailed"),
          icon: ListChecks,
        },
        {
          path: "/sale-profit",
          label: t("financeReports.navigation.saleProfit"),
          icon: BadgeDollarSign,
        },
      ],
    },
    {
      key: "inventory",
      title: t("financeReports.navigationGroups.inventory"),
      description: t("financeReports.groupDescriptions.inventory"),
      icon: Boxes,
      items: [
        {
          path: "/warehouse-inventory",
          label: t("financeReports.navigation.warehouseInventory"),
          icon: Warehouse,
        },
        {
          path: "/shop-inventory",
          label: t("financeReports.navigation.shopInventory"),
          icon: Store,
        },
      ],
    },
    {
      key: "expenses",
      title: t("financeReports.navigationGroups.expenses"),
      description: t("financeReports.groupDescriptions.expenses"),
      icon: HandCoins,
      items: [
        {
          path: "/other-expenses",
          label: t("financeReports.navigation.otherExpenses"),
          icon: HandCoins,
        },
      ],
    },
  ];
};

export const FinanceReports = () => {
  const { t } = useTranslation();
  const sections = useFinanceReportSections();

  return (
    <ReportsWorkspace
      sections={sections}
      basePath="/finance-reports"
      title={t("header.financeReports")}
    />
  );
};

export const FinanceReportsHome = () => {
  const { t } = useTranslation();
  const sections = useFinanceReportSections();

  return (
    <div className={styles.financeReportsHome}>
      <SectionHeader
        title={t("header.financeReports")}
        icon={<ChartColumnBig size={20} />}
      />
      <p className={styles.description}>
        {t("financeReports.overview.description")}
      </p>
      <div className={styles.groupGrid}>
        {sections.map((section) => {
          const GroupIcon = section.icon ?? ChartColumnBig;
          return (
            <section
              className={styles.groupCard}
              data-group={section.key}
              key={section.key}
              aria-labelledby={`finance-report-group-${section.key}`}
            >
              <header className={styles.groupHeader}>
                <span className={styles.groupIcon} aria-hidden="true">
                  <GroupIcon size={18} />
                </span>
                <div className={styles.groupCopy}>
                  <h2 id={`finance-report-group-${section.key}`}>
                    {section.title}
                  </h2>
                  <p>{section.description}</p>
                </div>
                <span className={styles.groupCount}>
                  {section.items.length}
                </span>
              </header>
              <nav className={styles.reportLinks} aria-label={section.title}>
                {section.items.map(({ path, label, icon: ReportIcon }) => (
                  <Link
                    className={styles.reportLink}
                    key={path}
                    to={`/finance-reports${path}`}
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
