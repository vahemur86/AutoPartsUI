import {
  Archive,
  BookOpenCheck,
  FileSignature,
  Layers,
  PackageOpen,
  RotateCcw,
  ShoppingBag,
  Tag,
  Users,
  Wallet,
} from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import styles from "./AgentWorkspace.module.css";

const sections = [
  { to: "/agents", label: "agentWorkspace.general", icon: Users, end: true },
  {
    to: "/agents/profitability",
    label: "reports.navigation.agentProfitability",
    icon: Wallet,
  },
  {
    to: "/agents/contracts",
    label: "agentWorkspace.contractsSection",
    icon: FileSignature,
  },
  {
    to: "/agents/rules",
    label: "agentWorkspace.rulesSection",
    icon: BookOpenCheck,
  },
  {
    to: "/agents/cash-powder/advances",
    label: "agentWorkspace.cashPowder",
    icon: Wallet,
  },
  {
    to: "/agents/product-credit/advances",
    label: "agentWorkspace.productCredit",
    icon: ShoppingBag,
  },
] as const;

const generalTabs = [
  { to: "/agents", label: "agents.list", icon: Users, end: true },
  { to: "/agents/types", label: "agentTypes.title", icon: Tag },
  {
    to: "/agents/classification-rules",
    label: "classificationRules.title",
    icon: Layers,
  },
] as const;

const cashPowderTabs = [
  {
    to: "/agents/cash-powder/advances",
    label: "agentAdvances.title",
    icon: Wallet,
  },
  {
    to: "/agents/cash-powder/deliveries",
    label: "powderDeliveries.title",
    icon: Archive,
  },
  {
    to: "/agents/cash-powder/repayments",
    label: "header.repayments",
    icon: RotateCcw,
  },
] as const;

const productCreditTabs = [
  {
    to: "/agents/product-credit/advances",
    label: "agentWorkspace.advances",
    icon: PackageOpen,
  },
  {
    to: "/agents/product-credit/sales",
    label: "agentWorkspace.sales",
    icon: ShoppingBag,
  },
  {
    to: "/agents/product-credit/debt",
    label: "agentWorkspace.debt",
    icon: Wallet,
  },
  {
    to: "/agents/product-credit/payments",
    label: "agentWorkspace.payments",
    icon: RotateCcw,
  },
] as const;

const sectionDescriptions: Record<string, string> = {
  general: "agentWorkspace.generalDescription",
  profitability: "agentWorkspace.profitabilityDescription",
  contracts: "agentWorkspace.contractsDescription",
  rules: "agentWorkspace.rulesDescription",
  cashPowder: "agentWorkspace.cashPowderDescription",
  productCredit: "agentWorkspace.productCreditDescription",
};

export const AgentWorkspace = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const activeSection = getActiveSection(pathname);
  const activeTabs = activeSection === "productCredit"
    ? productCreditTabs
    : activeSection === "cashPowder"
      ? cashPowderTabs
      : activeSection === "general"
        ? generalTabs
        : [];

  return (
    <main className={styles.workspace}>
      <header className={styles.masthead}>
        <div className={styles.mastheadCopy}>
          <span className={styles.eyebrow}>{t("agentWorkspace.eyebrow")}</span>
          <h1>{t("agentWorkspace.title")}</h1>
        </div>
        <span className={styles.mastheadSeal} aria-hidden="true">
          <Users size={20} />
        </span>
      </header>

      <nav className={styles.sectionGrid} aria-label={t("agentWorkspace.title")}>
        {sections.map(({ to, label, icon: Icon, ...navProps }) => (
          <NavLink
            key={to}
            to={to}
            end={"end" in navProps ? navProps.end : false}
            className={() =>
              `${styles.sectionCard} ${activeSectionFor(to) === activeSection ? styles.sectionCardActive : ""}`
            }
          >
            <span className={styles.sectionIcon}><Icon size={18} strokeWidth={1.8} /></span>
            <span className={styles.sectionCardCopy}>
              <strong>{t(label)}</strong>
              <small>{t(sectionDescriptions[activeSectionFor(to)])}</small>
            </span>
          </NavLink>
        ))}
      </nav>

      {activeTabs.length > 0 && (
        <nav className={styles.tabRail} aria-label={t("agentWorkspace.sectionNavigation")}>
          {activeTabs.map(({ to, label, icon: Icon, ...navProps }) => (
            <NavLink
              key={to}
              to={to}
              end={"end" in navProps ? navProps.end : false}
              className={({ isActive }) =>
                `${styles.tab} ${isActive ? styles.tabActive : ""}`
              }
            >
              <Icon size={15} strokeWidth={1.8} />
              <span>{t(label)}</span>
            </NavLink>
          ))}
        </nav>
      )}

      <section className={styles.content}>
        <Outlet />
      </section>
    </main>
  );
};

const getActiveSection = (pathname: string) =>
  pathname === "/agents" || pathname.startsWith("/agents/types") || pathname.startsWith("/agents/classification-rules")
    ? "general"
    : pathname.startsWith("/agents/profitability")
      ? "profitability"
      : pathname.startsWith("/agents/contracts")
        ? "contracts"
        : pathname.includes("/rules")
          ? "rules"
          : pathname.includes("/product-credit/")
            ? "productCredit"
            : "cashPowder";

const activeSectionFor = (path: string) =>
  path === "/agents" ? "general" : getActiveSection(path);

export default AgentWorkspace;
