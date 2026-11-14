import { Banknote, CreditCard, ReceiptText } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { OtherExpensePaymentItem } from "@/types/otherExpenses";
import type { CashRegister } from "@/types/cash";
import styles from "./ServiceTasks.module.css";

interface PaymentRecordsProps {
  payments: OtherExpensePaymentItem[];
  registers: CashRegister[];
}

const money = (value: number): string =>
  `${value.toLocaleString()} AMD`;

export const PaymentRecords = ({ payments, registers }: PaymentRecordsProps) => {
  const { t } = useTranslation();
  const registerNames = new Map(registers.map((register) => [register.id, register.code]));

  if (payments.length === 0) {
    return <p className={styles.emptyPayments}>{t("settings.otherExpenses.payment.noPayments")}</p>;
  }

  return (
    <div className={styles.paymentRecords}>
      {payments.map((payment) => (
        <article className={styles.paymentRecord} key={payment.id}>
          <div className={styles.paymentRecordIcon} aria-hidden="true">
            <ReceiptText size={17} />
          </div>
          <div className={styles.paymentRecordMain}>
            <div className={styles.paymentRecordTop}>
              <strong>{payment.serviceName}</strong>
              <time dateTime={payment.paidAt}>
                {new Date(payment.paidAt).toLocaleString()}
              </time>
            </div>
            <div className={styles.paymentRecordAmounts}>
              {payment.cashAmount > 0 && (
                <span>
                  <Banknote size={13} aria-hidden="true" />
                  {t("settings.otherExpenses.payment.cashPart")}: {money(payment.cashAmount)}
                  {payment.cashRegisterId
                    ? ` · ${registerNames.get(payment.cashRegisterId) ?? `#${payment.cashRegisterId}`}`
                    : ""}
                </span>
              )}
              {payment.nonCashAmount > 0 && (
                <span>
                  <CreditCard size={13} aria-hidden="true" />
                  {t("settings.otherExpenses.payment.nonCashPart")}: {money(payment.nonCashAmount)}
                </span>
              )}
            </div>
            {payment.comment && <p className={styles.paymentComment}>{payment.comment}</p>}
          </div>
          <strong className={styles.paymentRecordTotal}>{money(payment.totalAmount)}</strong>
        </article>
      ))}
    </div>
  );
};
