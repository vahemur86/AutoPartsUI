import { useState, useEffect, type RefObject } from "react";
import { useTranslation } from "react-i18next";

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
      <div className={styles.header}>
        <span className={styles.title}>{titleText}</span>
      </div>

      <div className={styles.content}>
        <div className={styles.grid}>
          <TextField
            label={t("warehouses.soldBatches.form.finalAmount")}
            placeholder="0"
            type="number"
            value={revenueTotal}
            onChange={(e) => setRevenueTotal(e.target.value)}
            error={hasTriedSave && !isRevenueTotalValid}
            disabled={isLoading}
          />

          <TextField
            label={t("warehouses.soldBatches.form.comment")}
            placeholder={t("warehouses.soldBatches.form.enterComment")}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            error={hasTriedSave && !isCommentValid}
            disabled={isLoading}
          />
        </div>

        <div className={styles.actionswithoutDelete}>
          <div className={styles.primaryActions}>
            <Button
              variant="secondary"
              size="medium"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t("common.cancel")}
            </Button>

            <Button
              variant="primary"
              size="medium"
              onClick={handleSaveClick}
              disabled={isLoading}
            >
              {isEditMode ? t("common.update") : t("common.save")}
            </Button>
          </div>
        </div>
      </div>
    </Dropdown>
  );
};