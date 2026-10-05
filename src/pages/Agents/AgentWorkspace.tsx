import {
  Archive,
  FileSignature,
  FileText,
  Layers,
  RotateCcw,
  Tag,
  Users,
  Wallet,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

import styles from "./AgentWorkspace.module.css";

const tabs = [
  { to: "/agents", label: "agents.list", icon: Users, end: true },
  { to: "/agents/types", label: "agentTypes.title", icon: Tag },
  {
    to: "/agents/classification-rules",
    label: "classificationRules.title",
    icon: Layers,
  },
  {
    to: "/agents/repayment-rules",
    label: "header.repaymentRules",
    icon: FileText,
  },
  {
    to: "/agents/contracts",
    label: "agentContracts.title",
    icon: FileSignature,
  },
  {
    to: "/agents/advances",
    label: "agentAdvances.title",
    icon: Wallet,
  },
  {
    to: "/agents/powder-deliveries",
    label: "powderDeliveries.title",
    icon: Archive,
  },
  {
    to: "/agents/repayments",
    label: "header.repayments",
    icon: RotateCcw,
  },
] as const;

export const AgentWorkspace = () => {
  const { t } = useTranslation();

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

      <nav className={styles.tabRail} aria-label={t("agentWorkspace.title")}>
        {tabs.map(({ to, label, icon: Icon, ...navProps }) => (
          <NavLink
            key={to}
            to={to}
            end={"end" in navProps ? navProps.end : false}
            className={({ isActive }) =>
              `${styles.tab} ${isActive ? styles.tabActive : ""}`
            }
          >
            <Icon size={16} strokeWidth={1.8} />
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
