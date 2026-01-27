import { useState, useEffect, type RefObject } from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Button, Dropdown, TextField } from "@/ui-kit";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchBalance,
  clearActiveBalance,
} from "@/store/slices/cash/registersSlice";

// types
import type { CashRegister, TopUpRequest } from "@/types/cash/registers";

// styles
import styles from "./TopUpDropdown.module.css";

interface TopUpDropdownProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  cashRegister: CashRegister;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onTopUp: (data: TopUpRequest) => void;
}

export const TopUpDropdown = ({
  open,
  anchorRef,
  cashRegister,
  isLoading = false,
  onOpenChange,
  onTopUp,
}: TopUpDropdownProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  // Get balance and loading state from the Redux store
  const { activeBalance, isLoading: isStoreLoading } = useAppSelector(
    (state) => state.cashRegisters,
  );

  const [amount, setAmount] = useState("");
  const [currencyCode, setCurrencyCode] = useState("AMD");
  const [comment, setComment] = useState("");
  const [hasTriedSave, setHasTriedSave] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount("");
      setCurrencyCode("AMD");
      setComment("");
      setHasTriedSave(false);

      dispatch(clearActiveBalance());
      dispatch(fetchBalance(cashRegister.id));
    }
  }, [open, cashRegister.id, dispatch]);

  const numAmount = parseFloat(amount);
  const isAmountValid = !isNaN(numAmount) && numAmount > 0;
  const isCurrencyValid = currencyCode.trim().length > 0;
  const isValid = isAmountValid && isCurrencyValid;

  const handleTopUpClick = () => {
    setHasTriedSave(true);
    if (!isValid) return;

    onTopUp({
      amount: numAmount,
      currencyCode: currencyCode.trim(),
      comment: comment.trim(),
    });
  };

  const titleText = t("cashRegisters.topUp.title");

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
        {/* Using isStoreLoading from Redux instead of local state */}
        {isStoreLoading ? (
          <div className={styles.loadingState}>
            {t("cashRegisters.topUp.loadingBalance")}
          </div>
        ) : activeBalance ? (
          <div className={styles.balanceInfo}>
            <div className={styles.balanceLabel}>
              {t("cashRegisters.topUp.currentBalance")}:
            </div>
            <div className={styles.balanceValue}>
              {activeBalance.balance.toLocaleString()}{" "}
              {activeBalance.openSessionId
                ? `(${t("cashRegisters.topUp.sessionOpen")})`
                : ""}
            </div>
          </div>
        ) : null}

        <div className={styles.grid}>
          <TextField
            label={t("cashRegisters.topUp.amount")}
            placeholder={t("cashRegisters.topUp.enterAmount")}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={hasTriedSave && !isAmountValid}
            disabled={isLoading}
            suffix={t("cashRegisters.topUp.currencyCode")}
          />

          <TextField
            label={t("cashRegisters.topUp.comment")}
            placeholder={t("cashRegisters.topUp.enterComment")}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isLoading}
            className={styles.commentField}
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
              onClick={handleTopUpClick}
              disabled={isLoading}
            >
              {t("cashRegisters.topUp.submit")}
            </Button>
          </div>
        </div>
      </div>
    </Dropdown>
  );
};
