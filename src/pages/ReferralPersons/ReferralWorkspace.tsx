import { Users, Wallet } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

import styles from "@/pages/Agents/AgentWorkspace.module.css";

const sections = [
  { to: "/referral-persons", label: "header.referralPersons", icon: Users },
  { to: "/commissions", label: "header.commissions", icon: Wallet },
] as const;

export const ReferralWorkspace = () => {
  const { t } = useTranslation();

  return (
    <main className={styles.workspace}>
      <header className={styles.masthead}>
        <div className={styles.mastheadCopy}>
          <span className={styles.eyebrow}>{t("header.referralWorkspaceLabel")}</span>
          <h1>{t("header.referrals")}</h1>
        </div>
        <span className={styles.mastheadSeal} aria-hidden="true">
          <Users size={20} />
        </span>
      </header>

      <nav className={`${styles.tabRail} ${styles.sectionRail}`} aria-label={t("header.referrals")}>
        {sections.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
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