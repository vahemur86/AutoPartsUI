import { LoaderCircle, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/ui-kit";
import styles from "./FinanceReports.module.css";

interface FinanceReportLoadButtonProps {
  loading: boolean;
  label: string;
  onClick: () => void;
}

export const FinanceReportLoadButton = ({
  loading,
  label,
  onClick,
}: FinanceReportLoadButtonProps) => {
  const { t } = useTranslation();

  return (
    <Button
      variant="primary"
      size="medium"
      onClick={onClick}
      disabled={loading}
    >
      {loading ? (
        <LoaderCircle className={styles.loadSpinner} size={15} aria-hidden="true" />
      ) : (
        <Play size={14} aria-hidden="true" />
      )}
      {loading ? t("common.loading") : label}
    </Button>
  );
};