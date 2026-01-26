import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { TextField, Button } from "@/ui-kit";

// icons
import { Search, User, Check } from "lucide-react";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchIntake,
  acceptIntake as acceptIntakeThunk,
} from "@/store/slices/operatorSlice";
import { fetchCashRegisterBalance } from "@/store/slices/cashRegistersSlice";

// styles
import styles from "../OperatorPage.module.css";

interface CustomerDetailsProps {
  customerPhone?: string;
  onPhoneChange?: (val: string) => void;
  phoneError?: boolean;
  onSuccess?: () => void;
}

export const CustomerDetails = ({
  customerPhone,
  onPhoneChange,
  phoneError,
  onSuccess,
}: CustomerDetailsProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { intake, isLoading } = useAppSelector((state) => state.operator);
  const [isAccepting, setIsAccepting] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!customerPhone?.trim()) {
      toast.error(t("customerDetails.validation.enterCustomerPhone"));
      return;
    }

    const userDataRaw = localStorage.getItem("user_data");
    if (!userDataRaw) return;

    try {
      const parsed = JSON.parse(userDataRaw);
      const cashRegisterId = Number(parsed.cashRegisterId);

      if (!intake?.id || !cashRegisterId) {
        throw new Error(t("customerDetails.error.missingData"));
      }

      await dispatch(
        fetchIntake({ intakeId: intake.id, cashRegisterId }),
      ).unwrap();
      toast.success(t("customerDetails.success.customerFound"));
    } catch (error: unknown) {
      const errorMessage =
        typeof error === "string"
          ? error
          : t("customerDetails.error.failedToSearch");
      toast.error(errorMessage);
    }
  }, [customerPhone, t, intake?.id, dispatch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") handleSearch();
    },
    [handleSearch],
  );

  const handleAccept = useCallback(async () => {
    if (!intake?.id) return;

    try {
      setIsAccepting(true);
      const rawData = localStorage.getItem("user_data");
      const userData = rawData ? JSON.parse(rawData) : {};
      const cashRegisterId = userData.cashRegisterId;

      if (!cashRegisterId) {
        toast.error(t("customerDetails.error.noCashRegister"));
        return;
      }

      await dispatch(
        acceptIntakeThunk({ intakeId: intake.id, cashRegisterId }),
      ).unwrap();

      toast.success(t("customerDetails.success.customerAccepted"));

      // Refresh balance and clear the page
      dispatch(fetchCashRegisterBalance(cashRegisterId));
      onSuccess?.();
    } catch (error: unknown) {
      const errorMessage =
        typeof error === "string"
          ? error
          : t("customerDetails.error.failedToAccept");
      toast.error(errorMessage);
    } finally {
      setIsAccepting(false);
    }
  }, [dispatch, intake, t, onSuccess]);

  return (
    <div className={styles.customerCard}>
      <div className={styles.customerHeader}>
        <h2 className={styles.cardTitle}>{t("customerDetails.title")}</h2>
      </div>

      <div className={styles.divider} />

      <div className={styles.customerContent}>
        <TextField
          label={t("customerDetails.phone")}
          placeholder={t("customerDetails.phonePlaceholder")}
          value={customerPhone}
          onChange={(e) => onPhoneChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
          error={phoneError}
          disabled={isLoading || isAccepting}
          icon={
            <Search
              size={16}
              onClick={handleSearch}
              style={{ cursor: "pointer" }}
            />
          }
        />

        {intake && (
          <div className={styles.customerProfile}>
            <div className={styles.profileAvatar}>
              <User size={32} />
            </div>
            <div className={styles.profileInfo}>
              <div className={styles.profileField}>
                <span className={styles.profileLabel}>
                  {t("customerDetails.clientType.label")}:{" "}
                </span>
                <span className={styles.profileValue}>
                  {intake.customer?.customerType?.code ?? "-"}
                </span>
              </div>
              <div className={styles.profileField}>
                <span className={styles.profileLabel}>
                  {t("customerDetails.discount")}:{" "}
                </span>
                <span className={styles.profileValue}>
                  {intake.customer?.customerType?.bonusPercent != null
                    ? `${(intake.customer.customerType.bonusPercent * 100).toFixed(0)}%`
                    : "0%"}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className={styles.customerActions}>
          <Button
            variant="primary"
            size="small"
            fullWidth
            onClick={handleAccept}
            disabled={isAccepting || !intake || isLoading}
          >
            <Check size={20} style={{ marginRight: "8px" }} />
            {t("customerDetails.acceptAndPurchase")}
          </Button>
        </div>
      </div>
    </div>
  );
};
