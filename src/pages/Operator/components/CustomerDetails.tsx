import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Search, User, Check, LogOut } from "lucide-react";
import { TextField, Button } from "@/ui-kit";
import { toast } from "react-toastify";
import type { Intake } from "@/types/operator";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchIntake,
  acceptIntake as acceptIntakeThunk,
} from "@/store/slices/operatorSlice";
import styles from "../OperatorPage.module.css";

interface CustomerDetailsProps {
  onCloseSession: () => void;
}

export const CustomerDetails = ({ onCloseSession }: CustomerDetailsProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { intake, isLoading } = useAppSelector((state) => state.operator);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isAccepting, setIsAccepting] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!phoneNumber.trim()) {
      toast.error(t("customerDetails.validation.enterPhoneNumber"));
      return;
    }

    const userDataRaw = localStorage.getItem("user_data");

    if (!userDataRaw) {
      toast.error(t("customerDetails.error.failedToSearch"));
      return;
    }

    let shopId: number | null = null;

    try {
      const parsed = JSON.parse(userDataRaw) as { shopId?: number | string };
      if (parsed.shopId !== undefined && parsed.shopId !== null) {
        shopId = Number(parsed.shopId);
      }
    } catch (e) {
      toast.error(t("customerDetails.error.failedToSearch"));
      return;
    }

    if (!shopId || Number.isNaN(shopId)) {
      toast.error(t("customerDetails.error.failedToSearch"));
      return;
    }

    try {
      await dispatch(fetchIntake(shopId)).unwrap();
      toast.success(t("customerDetails.success.customerFound"));
    } catch (error: unknown) {
      console.error("Error searching for customer:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("customerDetails.error.failedToSearch");
      toast.error(errorMessage);
    }
  }, [dispatch, phoneNumber, t]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    },
    [handleSearch]
  );

  const handleAccept = useCallback(async () => {
    const currentIntake: Intake | null = intake ?? null;

    if (!currentIntake) {
      toast.error(t("customerDetails.error.failedToSearch"));
      return;
    }

    const intakeId = currentIntake.id;

    if (!intakeId) {
      toast.error(t("customerDetails.error.failedToSearch"));
      return;
    }

    try {
      setIsAccepting(true);
      await dispatch(acceptIntakeThunk(intakeId)).unwrap();
      toast.success(t("customerDetails.success.customerAccepted"));
    } catch (error: unknown) {
      console.error("Error accepting intake:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("customerDetails.error.failedToSearch");
      toast.error(errorMessage);
    } finally {
      setIsAccepting(false);
    }
  }, [dispatch, intake, t]);

  return (
    <div className={styles.customerCard}>
      <div className={styles.customerHeader}>
        <h2 className={styles.cardTitle}>{t("customerDetails.title")}</h2>
        <div className={styles.divider} />
      </div>

      <div className={styles.customerContent}>
        <TextField
          placeholder={t("customerDetails.phonePlaceholder")}
          icon={
            <button
              type="button"
              onClick={handleSearch}
              disabled={isLoading}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label={t("customerDetails.search")}
            >
              <Search size={16} />
            </button>
          }
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />

        {intake && (
          <div className={styles.customerProfile}>
            <div className={styles.profileAvatar}>
              <User size={32} />
            </div>
            <div className={styles.profileInfo}>
              <div className={styles.profileField}>
                <div className={styles.profileLabel}>
                  {t("customerDetails.clientType.label")}
                </div>
                <div className={styles.profileValue}>
                  {intake.customer?.customerType?.code ?? "-"}
                </div>
              </div>
              <div className={styles.profileField}>
                <div className={styles.profileLabel}>
                  {t("customerDetails.discount")}
                </div>
                <div className={styles.profileValue}>
                  {intake.customer?.customerType?.bonusPercent != null
                    ? `${intake.customer.customerType.bonusPercent * 100}%`
                    : "-"}
                </div>
              </div>
              <div className={styles.profileField}>
                <div className={styles.profileLabel}>
                  {t("customerDetails.phone")}
                </div>
                <div className={styles.profileValue}>
                  {intake.customer?.phone ?? "-"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className={styles.customerActions}>
          <Button
            variant="primary"
            size="small"
            fullWidth
            className={styles.acceptButton}
            onClick={handleAccept}
            disabled={isAccepting || !intake}
          >
            <Check size={20} />
            {t("customerDetails.acceptAndPurchase")}
          </Button>
          <Button
            variant="secondary300"
            size="small"
            fullWidth
            className={styles.logoutBtn}
            onClick={onCloseSession}
          >
            <LogOut size={18} />
            {t("customerDetails.closeSession")}
          </Button>
        </div>
      </div>
    </div>
  );
};
