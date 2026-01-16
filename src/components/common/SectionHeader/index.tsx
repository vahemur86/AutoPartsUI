import type { FC, ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import styles from "./SectionHeader.module.css";

interface SectionHeaderProps {
  title?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  goBack?: boolean;
}

export const SectionHeader: FC<SectionHeaderProps> = ({
  title,
  icon,
  actions,
  goBack,
}) => (
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
