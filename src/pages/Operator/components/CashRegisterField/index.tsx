import { useTranslation } from "react-i18next";

// icons
import { Banknote, Eye, EyeOff } from "lucide-react";

// ui-kit
import { TextField } from "@/ui-kit";

// styles
import styles from "./CashRegisterField.module.css";

interface CashRegisterFieldProps {
  displayBalance: string;
  showCashAmount: boolean;
  onToggleVisibility: () => void;
  hasError: boolean;
}

export const CashRegisterField = ({
  displayBalance,
  showCashAmount,
  onToggleVisibility,
  hasError,
}: CashRegisterFieldProps) => {
  const { t } = useTranslation();

  return (
    <div className={styles.cashRegisterContainer}>
      <div className={styles.fieldWithLeftIcon}>
        <div className={styles.leftIcon}>
          <Banknote size={20} />
        </div>
        <TextField
          label={t("operatorPage.cashAmount")}
          value={hasError ? t("common.error") : displayBalance}
          error={hasError}
          readOnly
          icon={
            <button
              type="button"
              onClick={onToggleVisibility}
              className={styles.passwordToggle}
            >
              {showCashAmount ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          }
          style={{
            paddingLeft: "44px",
          }}
        />
      </div>
    </div>
  );
};
