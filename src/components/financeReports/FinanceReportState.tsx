import { BarChart3, LoaderCircle } from "lucide-react";
import styles from "./FinanceReports.module.css";

interface FinanceReportStateProps {
  loading: boolean;
  label: string;
}

export const FinanceReportState = ({
  loading,
  label,
}: FinanceReportStateProps) => {
  const StateIcon = loading ? LoaderCircle : BarChart3;

  return (
    <div
      className={`${styles.reportState} ${loading ? styles.reportStateLoading : ""}`}
      role={loading ? "status" : undefined}
      aria-live={loading ? "polite" : undefined}
      aria-busy={loading}
    >
      <StateIcon size={20} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
};