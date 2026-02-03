import { useTranslation } from "react-i18next";

// icons
import {
  FileCheck,
  BarChart3,
  Clock,
  FlaskRound,
  Wallet,
  ClipboardList,
} from "lucide-react";

// components
import { ModuleLayout, type NavItem } from "@/components/common/ModuleLayout";

export const Reports = () => {
  const { t } = useTranslation();

  const navigationItems: NavItem[] = [
    {
      path: "/z-reports",
      label: t("reports.navigation.zReports"),
      icon: FileCheck,
      showCheckmark: true,
    },
    {
      path: "/batch-reports",
      label: t("reports.navigation.batchReports"),
      icon: BarChart3,
      showCheckmark: true,
    },
    {
      path: "/open-sessions",
      label: t("reports.navigation.openSessions"),
      icon: Clock,
      showCheckmark: true,
    },
    {
      path: "/powder-batches",
      label: t("reports.navigation.powderBatches"),
      icon: FlaskRound,
      showCheckmark: true,
    },
    {
      path: "/cashbox-sessions-reports",
      label: t("reports.navigation.cashboxSessionsReports"),
      icon: Wallet,
      showCheckmark: true,
    },
  ];

  return (
    <ModuleLayout
      basePath="/reports"
      navigationItems={navigationItems}
      defaultTitle={t("header.reports")}
      defaultIcon={ClipboardList}
    />
  );
};
