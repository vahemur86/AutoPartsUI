import { useTranslation } from "react-i18next";

// icons
import {
  Globe,
  Languages,
  Warehouse,
  ShoppingBag,
  Settings as SettingsIcon,
  Truck,
  Container,
  FlaskConical,
  Users,
  Currency,
  CreditCard,
  Percent,
} from "lucide-react";

// components
import { ModuleLayout, type NavItem } from "@/components/common/ModuleLayout";

export const Settings = () => {
  const { t } = useTranslation();

  const navigationItems: NavItem[] = [
    {
      path: "/project-languages",
      label: t("settings.navigation.projectLanguages"),
      icon: Globe,
      showCheckmark: true,
    },
    {
      path: "/translation",
      label: t("settings.navigation.translation"),
      icon: Languages,
      showCheckmark: true,
    },
    {
      path: "/warehouse",
      label: t("settings.navigation.warehouse"),
      icon: Warehouse,
      showCheckmark: true,
    },
    {
      path: "/shops",
      label: t("settings.navigation.shops"),
      icon: ShoppingBag,
      showCheckmark: true,
    },
    {
      path: "/product-settings",
      label: t("settings.navigation.productSettings"),
      icon: SettingsIcon,
      showCheckmark: true,
    },
    {
      path: "/vehicle-management",
      label: t("settings.navigation.vehicleManagement"),
      icon: Truck,
      showCheckmark: true,
    },
    {
      path: "/metal-rates",
      label: t("settings.navigation.metalRates"),
      icon: Container,
      showCheckmark: true,
    },
    {
      path: "/catalyst-buckets",
      label: t("settings.navigation.catalystBuckets"),
      icon: FlaskConical,
      showCheckmark: true,
    },
    {
      path: "/customer-types",
      label: t("settings.navigation.customerTypes"),
      icon: Users,
      showCheckmark: true,
    },
    {
      path: "/exchange-rates",
      label: t("settings.navigation.exchangeRates"),
      icon: Currency,
      showCheckmark: true,
    },
    {
      path: "/cash-registers",
      label: t("settings.navigation.cashRegisters"),
      icon: CreditCard,
      showCheckmark: true,
    },
    {
      path: "/offer-increase-options",
      label: t("settings.navigation.offerIncreaseOptions"),
      icon: Percent,
      showCheckmark: true,
    },
  ];

  return (
    <ModuleLayout
      basePath="/settings"
      navigationItems={navigationItems}
      defaultTitle={t("header.settings")}
      defaultIcon={SettingsIcon}
    />
  );
};
