import React from "react";
// import { useLocation } from "react-router-dom";
import styles from "./SectionHeader.module.css";
import { ChevronLeft } from "lucide-react";

interface SectionHeaderProps {
  title?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  goBack?: any;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon,
  actions,
  goBack,
}) => {
  return (
    <div className={styles.sectionHeader}>
      <div className={styles.titleContainer}>
        {goBack && (
          <div className={styles.goBack}>
            <ChevronLeft />
          </div>
        )}
        {icon && <span className={styles.icon}>{icon}</span>}
        <h2 className={styles.title}>{title}</h2>
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
};

export default SectionHeader;
