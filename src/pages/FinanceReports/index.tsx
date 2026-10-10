import { useTranslation } from "react-i18next";

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
} from "lucide-react";

// components
import { ReportsWorkspace, type ReportNavSection } from "@/pages/Reports/ReportsWorkspace";

export const FinanceReports = () => {
  const { t } = useTranslation();

  const navigationSections: ReportNavSection[] = [
    {
      key: "operations",
      title: t("financeReports.navigationGroups.operations"),
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
      items: [
        {
          path: "/profit-summary",
          label: t("financeReports.navigation.profitSummary"),
          icon: ChartColumnBig,
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
      items: [
        {
          path: "/other-expenses",
          label: t("financeReports.navigation.otherExpenses"),
          icon: HandCoins,
        },
      ],
    },
  ];

  return (
    <ReportsWorkspace
      sections={navigationSections}
      basePath="/finance-reports"
      title={t("header.financeReports")}
    />
  );
};
