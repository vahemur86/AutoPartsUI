import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

// icons
import {
  Globe,
  Languages,
  Warehouse,
  ShoppingBag,
  Settings2 as SettingsIcon,
  Users,
  Currency,
  CreditCard,
  Percent,
  Tag,
  Wrench,
  Layout,
  DollarSign,
  Building2,
  Boxes,
  WalletCards,
  ArrowRight,
} from "lucide-react";

// components
import { ModuleLayout, type NavItem } from "@/components/common";
import { SectionHeader } from "@/components/common";
import styles from "./Settings.module.css";

interface SettingsSection {
  key: string;
  title: string;
  description: string;
  icon: typeof SettingsIcon;
  items: NavItem[];
}

const useSettingsNavigation = () => {
  const { t } = useTranslation();
  const groups = {
    system: t("settings.groups.system"),
    organization: t("settings.groups.organization"),
    productsAndCatalysts: t("settings.groups.productsAndCatalysts"),
    customersAndSales: t("settings.groups.customersAndSales"),
    financialSettings: t("settings.groups.financialSettings"),
  };

  const navigationItems: NavItem[] = [
    {
      path: "/project-languages",
      label: t("settings.navigation.projectLanguages"),
      icon: Globe,
      group: groups.system,
      groupIcon: SettingsIcon,
    },
    {
      path: "/page-control",
      label: t("settings.navigation.pageControl"),
      icon: Layout,
      group: groups.system,
      groupIcon: SettingsIcon,
    },
    {
      path: "/translation",
      label: t("settings.navigation.translation"),
      icon: Languages,
      group: groups.system,
      groupIcon: SettingsIcon,
    },
    {
      path: "/shops",
      label: t("settings.navigation.shops"),
      icon: ShoppingBag,
      group: groups.organization,
      groupIcon: Building2,
    },
    {
      path: "/warehouse",
      label: t("settings.navigation.warehouse"),
      icon: Warehouse,
      group: groups.organization,
      groupIcon: Building2,
    },
    {
      path: "/cash-registers",
      label: t("settings.navigation.cashRegisters"),
      icon: CreditCard,
      group: groups.organization,
      groupIcon: Building2,
    },
    {
      path: "/product-settings",
      label: t("settings.navigation.productSettings"),
      icon: SettingsIcon,
      group: groups.productsAndCatalysts,
      groupIcon: Boxes,
    },
    {
      path: "/tags",
      label: t("settings.navigation.tags"),
      icon: Tag,
      group: groups.productsAndCatalysts,
      groupIcon: Boxes,
    },
    {
      path: "/catalyst-pricing",
      label: t("settings.navigation.catalystPricing"),
      icon: DollarSign,
      group: groups.productsAndCatalysts,
      groupIcon: Boxes,
    },
    {
      path: "/iron-management",
      label: t("settings.navigation.ironManagement"),
      icon: Wrench,
      group: groups.productsAndCatalysts,
      groupIcon: Boxes,
    },
    {
      path: "/customer-types",
      label: t("settings.navigation.customerTypes"),
      icon: Users,
      group: groups.customersAndSales,
      groupIcon: Users,
    },
    {
      path: "/sale-percentages",
      label: t("settings.navigation.salePercentages"),
      icon: Tag,
      group: groups.customersAndSales,
      groupIcon: Users,
    },
    {
      path: "/offer-increase-options",
      label: t("settings.navigation.offerIncreaseOptions"),
      icon: Percent,
      group: groups.customersAndSales,
      groupIcon: Users,
    },
    {
      path: "/exchange-rates",
      label: t("settings.navigation.exchangeRates"),
      icon: Currency,
      group: groups.financialSettings,
      groupIcon: WalletCards,
    },
    {
      path: "/repayment-rules",
      label: t("settings.navigation.repaymentRules"),
      icon: Percent,
      group: groups.financialSettings,
      groupIcon: WalletCards,
    },
  ];

  const sectionDefinitions = [
    { key: "system", icon: SettingsIcon },
    { key: "organization", icon: Building2 },
    { key: "productsAndCatalysts", icon: Boxes },
    { key: "customersAndSales", icon: Users },
    { key: "financialSettings", icon: WalletCards },
  ] as const;

  const sections: SettingsSection[] = sectionDefinitions.map(
    ({ key, icon }) => ({
      key,
      title: t(`settings.groups.${key}`),
      description: t(`settings.groupDescriptions.${key}`),
      icon,
      items: navigationItems.filter((item) => item.group === groups[key]),
    }),
  );

  return { navigationItems, sections };
};

export const SettingsHome = () => {
  const { t } = useTranslation();
  const { sections } = useSettingsNavigation();

  return (
    <div className={styles.settingsHome}>
      <SectionHeader
        title={t("header.settings")}
        icon={<SettingsIcon size={20} />}
      />
      <div className={styles.sectionGrid}>
        {sections.map((section) => {
          const GroupIcon = section.icon;
          return (
            <section
              className={styles.sectionCard}
              data-section={section.key}
              key={section.key}
            >
              <header className={styles.sectionCardHeader}>
                <span className={styles.sectionIcon} aria-hidden="true">
                  <GroupIcon size={19} />
                </span>
                <div className={styles.sectionCopy}>
                  <h2>{section.title}</h2>
                  <p>{section.description}</p>
                </div>
              </header>
              <nav className={styles.sectionLinks} aria-label={section.title}>
                {section.items.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <Link
                      className={styles.sectionLink}
                      key={item.path}
                      to={`/settings${item.path}`}
                    >
                      <ItemIcon size={16} aria-hidden="true" />
                      <span>{item.label}</span>
                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  );
                })}
              </nav>
            </section>
          );
        })}
      </div>
    </div>
  );
};

export const Settings = () => {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { navigationItems } = useSettingsNavigation();

  useEffect(() => {
    document.body.classList.add("settings-theme");
    return () => document.body.classList.remove("settings-theme");
  }, []);

  if (pathname === "/settings" || pathname === "/settings/") {
    return <Outlet />;
  }

  return (
    <ModuleLayout
      basePath="/settings"
      navigationItems={navigationItems}
      defaultTitle={t("header.settings")}
      defaultIcon={SettingsIcon}
      appearance="settings"
    />
  );
};
