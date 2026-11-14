import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeftRight, Banknote, CreditCard, LoaderCircle, Wallet, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Shop } from "@/types/settings";
import {
  type OtherExpenseItem,
  type OtherExpensePaymentPayload,
} from "@/types/otherExpenses";
import type { CashRegister, CashRegisterBalance } from "@/types/cash";
import {
  createOtherExpensePayment,
} from "@/services/otherExpenses";
import {
  getCashRegisterBalance,
} from "@/services/settings/cash/registers";
import {
  getExpenseRegisterShopIds,
  loadActiveCashRegisters,
} from "./registerOptions";
import styles from "./ServiceTasks.module.css";

interface PaymentDrawerProps {
  expense: OtherExpenseItem;
  shops: Shop[];
  onClose: () => void;
  onSuccess: (balancesRefreshed: boolean) => void;
}

type PaymentMode = "cash" | "nonCash" | "split";

const money = (value: number): string =>
  `${value.toLocaleString()} AMD`;

export const PaymentDrawer = ({
  expense,
  shops,
  onClose,
  onSuccess,
}: PaymentDrawerProps) => {
  const { t } = useTranslation();
  const shopIds = useMemo(
    () => getExpenseRegisterShopIds(expense.locationType, expense.locationId, shops),
    [expense.locationId, expense.locationType, shops],
  );
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [balances, setBalances] = useState<Record<number, CashRegisterBalance>>({});
  const [loadingBalances, setLoadingBalances] = useState<Record<number, boolean>>({});
  const [balanceErrors, setBalanceErrors] = useState<Record<number, string>>({});
  const [isLoadingRegisters, setIsLoadingRegisters] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");
  const [cashAmount, setCashAmount] = useState("");
  const [nonCashAmount, setNonCashAmount] = useState("");
  const [cashRegisterId, setCashRegisterId] = useState("");
  const [comment, setComment] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasCashPortion = Number(cashAmount) > 0;
  const needsCashRegister = paymentMode !== "nonCash";

  useEffect(() => {
    let active = true;
    setRegisterError("");

    if (!needsCashRegister) {
      setIsLoadingRegisters(false);
      return () => {
        active = false;
      };
    }

    setIsLoadingRegisters(true);
    setRegisters([]);
    if (shopIds.length === 0) {
      setRegisters([]);
      setRegisterError(t("settings.otherExpenses.payment.noLinkedShops"));
      setIsLoadingRegisters(false);
      return () => {
        active = false;
      };
    }

    void loadActiveCashRegisters(shopIds)
      .then((items) => {
        if (active) setRegisters(items);
      })
      .catch((error: unknown) => {
        if (active) {
          setRegisterError(
            error instanceof Error
              ? error.message
              : t("settings.otherExpenses.payment.registersLoadFailed"),
          );
        }
      })
      .finally(() => {
        if (active) setIsLoadingRegisters(false);
      });

    return () => {
      active = false;
    };
  }, [needsCashRegister, shopIds, t]);

  const refreshBalances = useCallback(async (ids: number[]): Promise<string[]> => {
    const errors: string[] = [];
    await Promise.all(
      ids.map(async (id) => {
        setLoadingBalances((current) => ({ ...current, [id]: true }));
        try {
          const balance = await getCashRegisterBalance(id);
          setBalances((current) => ({ ...current, [id]: balance }));
          setBalanceErrors((current) => {
            const next = { ...current };
            delete next[id];
            return next;
          });
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : t("settings.otherExpenses.payment.balanceLoadFailed");
          errors.push(message);
          setBalanceErrors((current) => ({
            ...current,
            [id]: message,
          }));
        } finally {
          setLoadingBalances((current) => {
            const next = { ...current };
            delete next[id];
            return next;
          });
        }
      }),
    );
    return errors;
  }, [t]);

  useEffect(() => {
    const ids = hasCashPortion && Number(cashRegisterId) > 0
      ? [Number(cashRegisterId)]
      : [];
    if (ids.length > 0) void refreshBalances(ids);
  }, [hasCashPortion, cashRegisterId, refreshBalances]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isSubmitting, onClose]);

  const handleSubmit = async () => {
    setFormError("");
    const cash = cashAmount.trim() === "" ? 0 : Number(cashAmount);
    const nonCash = nonCashAmount.trim() === "" ? 0 : Number(nonCashAmount);
    const cashId = cash > 0 ? Number(cashRegisterId) : null;

    if (
      !Number.isFinite(cash) ||
      !Number.isFinite(nonCash) ||
      cash < 0 ||
      nonCash < 0
    ) {
      setFormError(t("settings.otherExpenses.payment.invalidAmounts"));
      return;
    }
    if (cash + nonCash <= 0) {
      setFormError(t("settings.otherExpenses.payment.amountRequired"));
      return;
    }
    if (cash > 0 && !cashId) {
      setFormError(t("settings.otherExpenses.payment.cashRegisterRequired"));
      return;
    }
    if (cashId && !balances[cashId]?.openSessionId) {
      setFormError(t("settings.otherExpenses.payment.openSessionRequired"));
      return;
    }

    const payload: OtherExpensePaymentPayload = {
      cashAmount: cash,
      cashRegisterId: cashId,
      nonCashAmount: nonCash,
      ...(comment.trim() ? { comment: comment.trim() } : {}),
    };
    setIsSubmitting(true);
    try {
      await createOtherExpensePayment(expense.id, payload);
      const balanceErrors = cashId ? await refreshBalances([cashId]) : [];
      onSuccess(balanceErrors.length === 0);
      onClose();
    } catch (error) {
      const selectedRegisterIds = cashId ? [cashId] : [];
      await refreshBalances(selectedRegisterIds);
      setFormError(
        error instanceof Error
          ? error.message
          : t("settings.otherExpenses.payment.saveFailed"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRegisterBalance = (id: string) => {
    if (!id) return null;
    const numericId = Number(id);
    const balance = balances[numericId];
    if (loadingBalances[numericId]) {
      return (
        <p className={styles.registerBalance} aria-live="polite">
          <LoaderCircle size={13} className={styles.spinner} aria-hidden="true" />
          {t("settings.otherExpenses.payment.loadingBalance")}
        </p>
      );
    }
    if (balanceErrors[numericId]) {
      return <p className={styles.registerBalanceError}>{balanceErrors[numericId]}</p>;
    }
    if (!balance) {
      return (
        <p className={styles.registerBalance} aria-live="polite">
          <LoaderCircle size={13} className={styles.spinner} aria-hidden="true" />
          {t("settings.otherExpenses.payment.loadingBalance")}
        </p>
      );
    }
    return (
      <p className={styles.registerBalance}>
        {t("settings.otherExpenses.payment.balance")}: <strong>{money(balance.balance)}</strong>
        <span className={balance.openSessionId ? styles.sessionOpen : styles.sessionClosed}>
          {balance.openSessionId
            ? t("settings.otherExpenses.payment.sessionOpen")
            : t("settings.otherExpenses.payment.sessionClosed")}
        </span>
      </p>
    );
  };

  return createPortal(
    <div
      className={styles.drawerBackdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <aside
        className={`${styles.drawer} ${styles.paymentDrawer}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-payment-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.drawerHeader}>
          <div className={styles.drawerIcon} aria-hidden="true">
            <Wallet size={20} />
          </div>
          <div className={styles.drawerHeaderCopy}>
            <span className={styles.drawerEyebrow}>{t("settings.otherExpenses.payment.eyebrow")}</span>
            <h2 id="expense-payment-title">{expense.serviceName}</h2>
          </div>
          <button
            type="button"
            className={styles.drawerClose}
            onClick={onClose}
            disabled={isSubmitting}
            aria-label={t("common.close")}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.drawerBody}>
          <p className={styles.paymentInfo}>{t("settings.otherExpenses.payment.info")}</p>
          {needsCashRegister && registerError && (
            <p className={styles.formError} role="alert">{registerError}</p>
          )}

          <fieldset className={styles.paymentModeFieldset}>
            <legend>{t("settings.otherExpenses.payment.paymentType")}</legend>
            <div className={styles.paymentModes}>
              {([
                ["cash", t("settings.otherExpenses.payment.cashOnly"), <Banknote size={15} aria-hidden="true" />],
                ["nonCash", t("settings.otherExpenses.payment.nonCashOnly"), <CreditCard size={15} aria-hidden="true" />],
                ["split", t("settings.otherExpenses.payment.split"), <ArrowLeftRight size={15} aria-hidden="true" />],
              ] as const).map(([mode, label, icon]) => (
                <label
                  className={`${styles.paymentModeOption} ${paymentMode === mode ? styles.paymentModeSelected : ""}`}
                  key={mode}
                >
                  <input
                    type="radio"
                    name="expense-payment-mode"
                    value={mode}
                    checked={paymentMode === mode}
                    onChange={() => {
                      setPaymentMode(mode);
                      setFormError("");
                      if (mode === "cash") setNonCashAmount("0");
                      if (mode === "nonCash") setCashAmount("0");
                      if (mode === "split") {
                        setCashAmount((value) => value === "0" ? "" : value);
                        setNonCashAmount((value) => value === "0" ? "" : value);
                      }
                    }}
                    disabled={isSubmitting}
                  />
                  {icon}
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {(paymentMode === "cash" || paymentMode === "split") && (
            <section className={styles.paymentPart}>
              <div className={styles.drawerSectionHeading}>
                <Banknote size={16} aria-hidden="true" />
                <span>{t("settings.otherExpenses.payment.cashPart")}</span>
              </div>
              <label className={styles.fieldLabel}>
                {t("settings.otherExpenses.payment.amount")}
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={cashAmount}
                  onChange={(event) => setCashAmount(event.target.value)}
                  disabled={isSubmitting}
                />
              </label>
              <label className={styles.fieldLabel}>
                {t("settings.otherExpenses.payment.cashRegister")}
                <select
                  value={cashRegisterId}
                  onChange={(event) => setCashRegisterId(event.target.value)}
                  disabled={isLoadingRegisters || registers.length === 0 || isSubmitting}
                >
                  <option value="">{t("common.select")}</option>
                  {registers.map((register) => (
                    <option key={register.id} value={register.id}>
                      {register.code}
                    </option>
                  ))}
                </select>
              </label>
              {hasCashPortion && renderRegisterBalance(cashRegisterId)}
            </section>
          )}

          {(paymentMode === "nonCash" || paymentMode === "split") && (
            <section className={styles.paymentPart}>
              <div className={styles.drawerSectionHeading}>
                <CreditCard size={16} aria-hidden="true" />
                <span>{t("settings.otherExpenses.payment.nonCashPart")}</span>
              </div>
              <label className={styles.fieldLabel}>
                {t("settings.otherExpenses.payment.amount")}
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={nonCashAmount}
                  onChange={(event) => setNonCashAmount(event.target.value)}
                  disabled={isSubmitting}
                />
              </label>
            </section>
          )}

          <label className={styles.fieldLabel}>
            {t("settings.otherExpenses.payment.comment")}
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={3}
              disabled={isSubmitting}
            />
          </label>

          {formError && <p className={styles.formError} role="alert">{formError}</p>}
        </div>

        <footer className={styles.drawerFooter}>
          <button
            type="button"
            className={`${styles.formButton} ${styles.secondaryButton}`}
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className={`${styles.formButton} ${styles.primaryButton}`}
            onClick={() => void handleSubmit()}
            disabled={
              isSubmitting ||
              (needsCashRegister && isLoadingRegisters) ||
              (hasCashPortion && !!loadingBalances[Number(cashRegisterId)])
            }
          >
            {isSubmitting ? t("common.loading") : t("settings.otherExpenses.payment.submit")}
          </button>
        </footer>
      </aside>
    </div>,
    document.body,
  );
};
