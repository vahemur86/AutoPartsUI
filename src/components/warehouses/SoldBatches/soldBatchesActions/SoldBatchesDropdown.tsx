import { useState, useEffect, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Banknote, Check, CircleDollarSign, FileText, X } from "lucide-react";

// ui-kit
import { Button, Dropdown, TextField } from "@/ui-kit";

// styles
import styles from "./SoldBatchesDropdown.module.css";
import type { PowderSale } from "@/types/warehouses/salesLots";

export type SoldBatchesForm = Pick<
  PowderSale,
  "revenueTotal" | "revenueTotalAmd"
> & {
  comment: string;
};

interface SoldBatchesDropdownProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  initialData?: (SoldBatchesForm & { id?: number }) | null;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: SoldBatchesForm) => void;
}

export const SoldBatchesDropdown = ({
  open,
  anchorRef,
  initialData,
  isLoading = false,
  onOpenChange,
  onSave,
}: SoldBatchesDropdownProps) => {
  const { t } = useTranslation();

  const [revenueTotal, setRevenueTotal] = useState("");
  const [revenueTotalAmd, setRevenueTotalAmd] = useState("");
  const [comment, setComment] = useState("");
  const [hasTriedSave, setHasTriedSave] = useState(false);

  const isEditMode = !!initialData;

  useEffect(() => {
    if (open) {
      setRevenueTotal(initialData ? String(initialData.revenueTotal) : "");
      setRevenueTotalAmd(initialData ? String(initialData.revenueTotalAmd) : "");
      setComment(""); // Reset comment on open for reconciliation
      setHasTriedSave(false);
    }
  }, [open, initialData]);

  const numRevenueTotal = parseFloat(revenueTotal);
  const numRevenueTotalAmd = parseFloat(revenueTotalAmd);

  const isRevenueTotalValid = !isNaN(numRevenueTotal) && numRevenueTotal >= 0;
  const isRevenueTotalAmdValid = !isNaN(numRevenueTotalAmd) && numRevenueTotalAmd >= 0;
  // Reconciliation usually requires a reason
  const isCommentValid = comment.trim().length > 0;

  const isValid = isRevenueTotalValid && isRevenueTotalAmdValid && isCommentValid;

  const handleSaveClick = () => {
    setHasTriedSave(true);
    if (!isValid) return;

    onSave({
      revenueTotal: numRevenueTotal,
      revenueTotalAmd: numRevenueTotalAmd,
      comment: comment.trim(),
    });
  };

  const titleText = isEditMode
    ? t("warehouses.soldBatches.editSoldBatch")
    : t("warehouses.soldBatches.addSoldBatch");

  return (
    <Dropdown
      open={open}
      onOpenChange={onOpenChange}
      anchorRef={anchorRef}
      align="start"
      side="left"
      title={titleText}
    >
      <div className={styles.content}>
        <div className={styles.adjustmentIntro}>
          <span className={styles.adjustmentIntroIcon} aria-hidden="true">
            <Banknote size={19} />
          </span>
          <span className={styles.adjustmentIntroText}>
            <strong>{titleText}</strong>
            <span>{t("warehouses.soldBatches.adjustmentHelp")}</span>
          </span>
        </div>

        <section className={styles.adjustmentFieldGroup}>
          <h4 className={styles.adjustmentFieldHeading}>
            <CircleDollarSign size={16} aria-hidden="true" />
            {t("warehouses.soldBatches.form.finalAmount")}
          </h4>
          <TextField
            label={t("warehouses.soldBatches.form.finalAmount")}
            placeholder="0"
            icon={<CircleDollarSign size={15} />}
            type="number"
            value={revenueTotal}
            onChange={(e) => setRevenueTotal(e.target.value)}
            error={hasTriedSave && !isRevenueTotalValid}
            disabled={isLoading}
          />
        </section>

        <section className={styles.adjustmentFieldGroup}>
          <h4 className={styles.adjustmentFieldHeading}>
            <FileText size={16} aria-hidden="true" />
            {t("warehouses.soldBatches.form.comment")}
          </h4>
          <TextField
            label={t("warehouses.soldBatches.form.comment")}
            placeholder={t("warehouses.soldBatches.form.enterComment")}
            icon={<FileText size={15} />}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            error={hasTriedSave && !isCommentValid}
            disabled={isLoading}
          />
        </section>

        <div className={styles.actionswithoutDelete}>
          <div className={styles.primaryActions}>
            <Button
              variant="secondary"
              size="medium"
              className={styles.cancelButton}
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              <X size={16} aria-hidden="true" />
              {t("common.cancel")}
            </Button>

            <Button
              variant="primary"
              size="medium"
              className={styles.confirmButton}
              onClick={handleSaveClick}
              disabled={isLoading}
            >
              <Check size={16} aria-hidden="true" />
              {isEditMode ? t("common.update") : t("common.save")}
            </Button>
          </div>
        </div>
      </div>
    </Dropdown>
  );
};