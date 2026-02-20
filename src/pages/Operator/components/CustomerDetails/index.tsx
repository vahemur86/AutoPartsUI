import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

// icons
import { User, Check } from "lucide-react";

// ui-kit
import { TextField, Button } from "@/ui-kit";

// components
import { CountryPhoneInput, GenderSelect } from "@/components/common";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchIntake,
  acceptIntake as acceptIntakeThunk,
} from "@/store/slices/operatorSlice";
import { fetchBalance } from "@/store/slices/cash/registersSlice";
import { fetchCustomers } from "@/store/slices/customersSlice";

// styles
import styles from "./CustomerDetails.module.css";
import sharedStyles from "../../OperatorPage.module.css";

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
  const { intake, isLoading: isIntakeLoading } = useAppSelector(
    (state) => state.operator,
  );
  const { items: searchedCustomers, isLoading: isSearching } = useAppSelector(
    (state) => state.customers,
  );

  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("AM");
  const [isAccepting, setIsAccepting] = useState(false);
  const [localHasTriedAccept, setLocalHasTriedAccept] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const activeCustomer = useMemo(
    () => searchedCustomers[0],
    [searchedCustomers],
  );

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
      const { cashRegisterId } = JSON.parse(userDataRaw);
      const response = await dispatch(
        fetchCustomers({
          phone: customerData.phone,
          cashRegisterId: Number(cashRegisterId),
        }),
      ).unwrap();
      setHasSearched(true);

      if (response.results && response.results.length > 0) {
        const foundCustomer = response.results[0];
        onCustomerChange({
          phone: foundCustomer.phone,
          fullName: foundCustomer.fullName || "",
          gender: foundCustomer.gender ?? 0,
          notes: foundCustomer.notes || "",
        });
        toast.success(t("customerDetails.success.customerFound"));
        if (intake?.id)
          dispatch(fetchIntake({ intakeId: intake.id, cashRegisterId }));
      } else {
        onCustomerChange({
          ...customerData,
          fullName: "",
          gender: 0,
          notes: "",
        });
        toast.info(t("customerDetails.info.newCustomer"));
      }
    } catch {
      toast.error(t("customerDetails.error.failedToSearch"));
    }
  }, [customerData, isPhoneValid, t, dispatch, onCustomerChange, intake?.id]);

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
      setHasSearched(false);
    } catch {
      /* Handled globally */
    } finally {
      setIsAccepting(false);
    }
  }, [intake?.id, isPhoneValid, t, dispatch, onSuccess]);

  const isGlobalLoading = isIntakeLoading || isAccepting || isSearching;
  const isFormLocked =
    isGlobalLoading ||
    !hasSearched ||
    (!!activeCustomer && !!customerData.fullName && !isSearching);

  return (
    <div className={styles.customerCard}>
      <div className={styles.customerHeader}>
        <h2 className={sharedStyles.cardTitle}>{t("customerDetails.title")}</h2>
      </div>
      <div className={sharedStyles.divider} />
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
              setHasSearched(false);
            }}
            onPhoneChange={(fullNumber) => {
              setLocalHasTriedAccept(false);
              onCustomerChange({ ...customerData, phone: fullNumber });
              setHasSearched(false);
            }}
            onSearch={handleSearch}
            error={phoneError || (localHasTriedAccept && !isPhoneValid)}
            disabled={isGlobalLoading}
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
            disabled={isFormLocked}
          />
          <GenderSelect
            value={customerData.gender}
            onChange={(val) =>
              onCustomerChange({ ...customerData, gender: val })
            }
            disabled={isFormLocked}
          />
        </div>

        {activeCustomer && (
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
                  {activeCustomer.customerType?.code ?? "-"}
                </span>
              </div>
              <div className={styles.profileField}>
                <span className={styles.profileLabel}>
                  {t("customerDetails.discount")}:{" "}
                </span>
                <span className={styles.profileValue}>
                  {activeCustomer.customerType?.bonusPercent != null
                    ? `${(activeCustomer.customerType.bonusPercent * 100).toFixed(0)}%`
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
            disabled={isGlobalLoading || !intake || !hasSearched}
          >
            <Check size={20} style={{ marginRight: "8px" }} />
            {t("customerDetails.acceptAndPurchase")}
          </Button>
        </div>
      </div>
    </div>
  );
};
