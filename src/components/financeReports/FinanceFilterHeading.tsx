import { SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import styles from "./FinanceReports.module.css";

export const FinanceFilterHeading = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.filterHeading}>
      <SlidersHorizontal size={14} aria-hidden="true" />
      <span>{t("common.filters")}</span>
    </div>
  );
};