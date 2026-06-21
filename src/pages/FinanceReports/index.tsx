import { useTranslation } from "react-i18next";

// icons
import {
  ChartColumnBig,
  ListChecks,
  BadgeDollarSign,
  Warehouse,
  Store,
} from "lucide-react";

// components
import { ModuleLayout, type NavItem } from "@/components/common";

export const FinanceReports = () => {
  const { t } = useTranslation();

  const navigationItems: NavItem[] = [
    {
      path: "/profit-summary",
      label: t("financeReports.navigation.profitSummary"),
      icon: ChartColumnBig,
      showCheckmark: true,
    },
    {
      path: "/profit-detailed",
      label: t("financeReports.navigation.profitDetailed"),
      icon: ListChecks,
      showCheckmark: true,
    },
    {
      path: "/sale-profit",
      label: t("financeReports.navigation.saleProfit"),
      icon: BadgeDollarSign,
      showCheckmark: true,
    },
    {
      path: "/warehouse-inventory",
      label: t("financeReports.navigation.warehouseInventory"),
      icon: Warehouse,
      showCheckmark: true,
    },
    {
      path: "/shop-inventory",
      label: t("financeReports.navigation.shopInventory"),
      icon: Store,
      showCheckmark: true,
    },
  ];

  return (
    <ModuleLayout
      basePath="/finance-reports"
      navigationItems={navigationItems}
      defaultTitle={t("header.financeReports")}
      defaultIcon={ChartColumnBig}
    />
  );
};
