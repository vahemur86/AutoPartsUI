import { useState, useEffect, type RefObject } from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Button, Dropdown, TextField } from "@/ui-kit";

// services
import {
  getCashRegisterBalance,
  type CashRegisterBalance,
  type TopUpRequest,
} from "@/services/settings/cashRegisters";

// types
import type { CashRegister } from "@/types/settings";

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

  const [balance, setBalance] = useState<CashRegisterBalance | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
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
      setBalance(null);
      fetchBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cashRegister.id]);

  const fetchBalance = async () => {
    try {
      setIsLoadingBalance(true);
      const balanceData = await getCashRegisterBalance(cashRegister.id);
      setBalance(balanceData);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

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
        {isLoadingBalance ? (
          <div className={styles.loadingState}>
            {t("cashRegisters.topUp.loadingBalance")}
          </div>
        ) : balance ? (
          <div className={styles.balanceInfo}>
            <div className={styles.balanceLabel}>
              {t("cashRegisters.topUp.currentBalance")}:
            </div>
            <div className={styles.balanceValue}>
              {balance.balance.toLocaleString()}{" "}
              {balance.openSessionId
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
