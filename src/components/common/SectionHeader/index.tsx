import type { FC, ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
}) => {
  const navigate = useNavigate();

  return (
    <div className={styles.sectionHeader}>
      <div className={styles.titleContainer}>
        {goBack && (
          <button
            type="button"
            className={styles.goBack}
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ChevronLeft />
          </button>
        )}
        {icon && <span className={styles.icon}>{icon}</span>}
        <h2 className={styles.title}>{title}</h2>
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
};
