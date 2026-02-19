import { useTranslation } from "react-i18next";

// ui-kit
import { Modal, Button } from "@/ui-kit";

// types
import type { PendingTransaction } from "@/types/cash";

// styles
import styles from "../OperatorPage.module.css";

interface TopUpConfirmationModalProps {
  open: boolean;
  data: PendingTransaction | null;
  onConfirm: () => void;
  isLoading: boolean;
}

export const TopUpConfirmationModal = ({
  open,
  data,
  onConfirm,
  isLoading,
}: TopUpConfirmationModalProps) => {
  const { t } = useTranslation();

  if (!data) return null;

  const footer = (
    <Button
      variant="primary"
      onClick={onConfirm}
      disabled={isLoading}
      fullWidth
    >
      {isLoading ? t("common.loading") : t("common.confirm")}
    </Button>
  );

  return (
    <Modal
      open={open}
      onOpenChange={() => {}}
      title={t("operatorPage.modals.pendingTopUpTitle")}
      footer={footer}
    >
      <div className={styles.previewContainer}>
        <div className={`${styles.summaryCard} styles.amountRow`}>
          <span className={styles.summaryCardLabel}>{t("common.amount")}</span>
          <strong
            className={`${styles.summaryCardValue} ${styles.amountHighlight}`}
          >
            {data.amount.toLocaleString()} {data.currencyCode}
          </strong>
        </div>

        <div className={styles.summaryCard}>
          <span className={styles.summaryCardLabel}>{t("common.comment")}</span>
          <p className={styles.summaryCardValue}>
            {data.comment || t("common.noComment")}
          </p>
        </div>

        <div className={styles.summaryCard}>
          <span className={styles.summaryCardLabel}>{t("common.date")}</span>
          <p className={styles.summaryCardValue}>
            {new Date(data.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </Modal>
  );
};
