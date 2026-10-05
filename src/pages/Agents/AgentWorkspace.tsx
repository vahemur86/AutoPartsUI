import {
  Archive,
  FileSignature,
  FileText,
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
    to: "/agents/cash-powder/contracts",
    label: "agentWorkspace.cashPowder",
    icon: Wallet,
  },
  {
    to: "/agents/product-credit/contracts",
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
    to: "/agents/cash-powder/contracts",
    label: "agentContracts.title",
    icon: FileSignature,
    end: true,
  },
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
  {
    to: "/agents/cash-powder/rules",
    label: "header.repaymentRules",
    icon: FileText,
  },
] as const;

const productCreditTabs = [
  {
    to: "/agents/product-credit/contracts",
    label: "agentWorkspace.contracts",
    icon: FileSignature,
    end: true,
  },
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

export const AgentWorkspace = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const activeTabs = pathname.includes("/product-credit/")
    ? productCreditTabs
    : pathname.includes("/cash-powder/")
      ? cashPowderTabs
      : generalTabs;
  const activeSection = pathname.includes("/product-credit/")
    ? "productCredit"
    : pathname.includes("/cash-powder/")
      ? "cashPowder"
      : "general";

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

      <nav className={`${styles.tabRail} ${styles.sectionRail}`} aria-label={t("agentWorkspace.title")}>
        {sections.map(({ to, label, icon: Icon, ...navProps }) => (
          <NavLink
            key={to}
            to={to}
            end={"end" in navProps ? navProps.end : false}
            className={({ isActive }) =>
              `${styles.tab} ${((to === "/agents" && activeSection === "general") || (to !== "/agents" && isActive)) ? styles.tabActive : ""}`
            }
          >
            <Icon size={16} strokeWidth={1.8} />
            <span>{t(label)}</span>
          </NavLink>
        ))}
      </nav>

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

      <section className={styles.content}>
        <Outlet />
      </section>
    </main>
  );
};

export default AgentWorkspace;
