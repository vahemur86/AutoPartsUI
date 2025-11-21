import React from "react";
// import { useLocation } from "react-router-dom";
import styles from "./SectionHeader.module.css";

interface SectionHeaderProps {
  title?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon,
  actions,
}) => {
  return (
    <div className={styles.sectionHeader}>
      <div className={styles.titleContainer}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <h2 className={styles.title}>{title}</h2>
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
};

export default SectionHeader;
