import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

// ui-kit
import { TextField, Button } from "@/ui-kit";

// icons
import { User, Check } from "lucide-react";

// components
import { CountryPhoneInput, GenderSelect } from "@/components/common";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchIntake,
  acceptIntake as acceptIntakeThunk,
} from "@/store/slices/operatorSlice";
import { fetchBalance } from "@/store/slices/cash/registersSlice";

// styles
import styles from "../OperatorPage.module.css";

interface CustomerDetailsProps {
  customerData: {
    phone: string;
    fullName: string;
    gender: number;
    notes: string;
  };
  onCustomerChange: (data: {
    phone: string;
    fullName: string;
    gender: number;
    notes: string;
  }) => void;
  phoneError?: boolean;
  onSuccess?: () => void;
}

export const CustomerDetails = ({
  customerData,
  onCustomerChange,
  phoneError,
  onSuccess,
}: CustomerDetailsProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { intake, isLoading } = useAppSelector((state) => state.operator);

  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("AM");
  const [isAccepting, setIsAccepting] = useState(false);
  const [localHasTriedAccept, setLocalHasTriedAccept] = useState(false);

  const isPhoneValid = useMemo(() => {
    if (!customerData.phone) return false;
    const phoneNumber = parsePhoneNumberFromString(
      customerData.phone,
      selectedCountry,
    );
    return phoneNumber?.isValid() ?? false;
  }, [customerData.phone, selectedCountry]);

  const handleSearch = useCallback(async () => {
    if (!customerData.phone?.trim()) {
      setLocalHasTriedAccept(true);
      toast.error(t("customerDetails.validation.enterCustomerPhone"));
      return;
    }

    if (!isPhoneValid) {
      setLocalHasTriedAccept(true);
      toast.error(t("customerDetails.validation.invalidPhone"));
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
      toast.error(
        typeof error === "string"
          ? error
          : t("customerDetails.error.failedToSearch"),
      );
    }
  }, [customerData.phone, isPhoneValid, t, intake?.id, dispatch]);

  const handleAccept = useCallback(async () => {
    setLocalHasTriedAccept(true);
    if (!intake?.id || !isPhoneValid) return;

    try {
      setIsAccepting(true);
      const userData = JSON.parse(localStorage.getItem("user_data") ?? "{}");

      await dispatch(
        acceptIntakeThunk({
          intakeId: intake.id,
          cashRegisterId: userData.cashRegisterId,
        }),
      ).unwrap();

      toast.success(t("customerDetails.success.customerAccepted"));
      dispatch(fetchBalance(userData.cashRegisterId));
      onSuccess?.();
      setLocalHasTriedAccept(false);
    } catch {
      /* Handled by global watcher */
    } finally {
      setIsAccepting(false);
    }
  }, [intake?.id, isPhoneValid, t, dispatch, onSuccess]);

  return (
    <div className={styles.customerCard}>
      <div className={styles.customerHeader}>
        <h2 className={styles.cardTitle}>{t("customerDetails.title")}</h2>
      </div>

      <div className={styles.divider} />

      <div className={styles.customerContent}>
        <div className={styles.phoneSection}>
          <span className={styles.phoneLabel}>
            {t("customerDetails.phone")}
          </span>
          <CountryPhoneInput
            phone={customerData.phone}
            selectedCountry={selectedCountry}
            onCountryChange={(country) => {
              setSelectedCountry(country);
              onCustomerChange({ ...customerData, phone: "" });
            }}
            onPhoneChange={(fullNumber) => {
              setLocalHasTriedAccept(false);
              onCustomerChange({ ...customerData, phone: fullNumber });
            }}
            onSearch={handleSearch}
            error={phoneError || (localHasTriedAccept && !isPhoneValid)}
            disabled={isLoading || isAccepting}
          />
        </div>

        <div className={styles.additionalFields}>
          <TextField
            label={t("customerDetails.fullName")}
            value={customerData.fullName}
            onChange={(e) =>
              onCustomerChange({ ...customerData, fullName: e.target.value })
            }
            placeholder={t("customerDetails.fullNamePlaceholder")}
            disabled={isLoading || isAccepting}
          />
          <GenderSelect
            value={customerData.gender}
            onChange={(val) =>
              onCustomerChange({ ...customerData, gender: val })
            }
            disabled={isLoading || isAccepting}
          />
        </div>

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
