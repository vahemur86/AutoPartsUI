import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Search, User, Check, LogOut } from "lucide-react";
import { TextField, Button } from "@/ui-kit";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchIntake,
  acceptIntake as acceptIntakeThunk,
} from "@/store/slices/operatorSlice";
import styles from "../OperatorPage.module.css";

interface CustomerDetailsProps {
  customerPhone?: string;
  onPhoneChange?: (val: string) => void;
  onCloseSession: () => void;
  phoneError?: boolean;
}

export const CustomerDetails = ({
  customerPhone,
  onPhoneChange,
  onCloseSession,
  phoneError,
}: CustomerDetailsProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { intake, isLoading } = useAppSelector((state) => state.operator);
  const [isAccepting, setIsAccepting] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!customerPhone?.trim()) {
      toast.error(t("customerDetails.validation.entercustomerPhone"));
      return;
    }

    const userDataRaw = localStorage.getItem("user_data");
    if (!userDataRaw) return;

    try {
      const parsed = JSON.parse(userDataRaw);
      const shopId = Number(parsed.shopId);

      if (!shopId) throw new Error();

      await dispatch(fetchIntake(shopId)).unwrap();
      toast.success(t("customerDetails.success.customerFound"));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      toast.error(t("customerDetails.error.failedToSearch"));
    }
  }, [dispatch, customerPhone, t]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    },
    [handleSearch],
  );

  const handleAccept = useCallback(async () => {
    if (!intake?.id) return;

    try {
      setIsAccepting(true);
      await dispatch(acceptIntakeThunk(intake.id)).unwrap();
      toast.success(t("customerDetails.success.customerAccepted"));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error(t("customerDetails.error.failedToSearch"));
    } finally {
      setIsAccepting(false);
    }
  }, [dispatch, intake, t]);

  return (
    <div className={styles.customerCard}>
      <div className={styles.customerHeader}>
        <h2 className={styles.cardTitle}>{t("customerDetails.title")}</h2>
      </div>

      <div className={styles.divider} />

      <div className={styles.customerContent}>
        <TextField
          label={t("customerDetails.phone")} // Added label for better UX
          placeholder={t("customerDetails.phonePlaceholder")}
          value={customerPhone}
          onChange={(e) => onPhoneChange?.(e.target.value)}
          onKeyDown={handleKeyDown}
          error={phoneError} // Passed from OperatorPage
          disabled={isLoading}
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
            disabled={isAccepting || !intake}
          >
            <Check size={20} style={{ marginRight: "8px" }} />
            {t("customerDetails.acceptAndPurchase")}
          </Button>

          <Button
            variant="secondary300"
            size="small"
            fullWidth
            onClick={onCloseSession}
          >
            <LogOut size={18} style={{ marginRight: "8px" }} />
            {t("customerDetails.closeSession")}
          </Button>
        </div>
      </div>
    </div>
  );
};
