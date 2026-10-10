import { useTranslation } from "react-i18next";

// icons
import {
  FileCheck,
  BarChart3,
  Clock,
  FlaskRound,
  Wallet,
  ClipboardList,
  Database,
  ShoppingCart,
  Boxes,
  Wrench,
} from "lucide-react";

import { ReportsWorkspace, type ReportNavSection } from "./ReportsWorkspace";

export const Reports = () => {
  const { t } = useTranslation();

  const navigationSections: ReportNavSection[] = [
    {
      key: "cashbox",
      title: t("reports.navigationGroups.cashbox"),
      items: [
        { path: "/z-reports", label: t("reports.navigation.zReports"), icon: FileCheck },
        { path: "/open-sessions", label: t("reports.navigation.openSessions"), icon: Clock },
        { path: "/cashbox-sessions-reports", label: t("reports.navigation.cashboxSessionsReports"), icon: Wallet },
      ],
    },
    {
      key: "inventory",
      title: t("reports.navigationGroups.inventory"),
      items: [
        { path: "/batch-reports", label: t("reports.navigation.batchReports"), icon: BarChart3 },
        { path: "/powder-batches", label: t("reports.navigation.powderBatches"), icon: FlaskRound },
        { path: "/special-lots", label: t("reports.navigation.specialLots"), icon: Boxes },
      ],
    },
    {
      key: "iron",
      title: t("reports.navigationGroups.iron"),
      items: [
        { path: "/iron-products-reports", label: t("reports.navigation.ironProducts"), icon: Database },
        { path: "/iron-sale", label: t("reports.navigation.ironSale"), icon: ShoppingCart },
        { path: "/iron-purchases", label: t("reports.navigation.ironPurchases"), icon: ShoppingCart },
      ],
    },
    {
      key: "service",
      title: t("reports.navigationGroups.service"),
      items: [
        { path: "/workshop-orders", label: t("reports.navigation.workshopOrders"), icon: ClipboardList },
        { path: "/service-task-reports", label: t("reports.navigation.serviceTasks"), icon: Wrench },
      ],
    },
  ];

  return <ReportsWorkspace sections={navigationSections} />;
};
