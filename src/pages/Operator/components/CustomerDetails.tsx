import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  parsePhoneNumberFromString,
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from "libphonenumber-js";

// ui-kit
import { TextField, Button, Select } from "@/ui-kit";

// icons
import { Search, User, Check } from "lucide-react";

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
  customerPhone?: string;
  onPhoneChange?: (val: string) => void;
  phoneError?: boolean;
  onSuccess?: () => void;
}

const getFlagEmoji = (countryCode: string) =>
  countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));

export const CustomerDetails = ({
  customerPhone = "",
  onPhoneChange,
  phoneError,
  onSuccess,
}: CustomerDetailsProps) => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const { intake, isLoading } = useAppSelector((state) => state.operator);

  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("AM");
  const [isAccepting, setIsAccepting] = useState(false);

  const [localHasTriedAccept, setLocalHasTriedAccept] = useState(false);

  const allCountryOptions = useMemo(() => {
    const regionNames = new Intl.DisplayNames([i18n.language], {
      type: "region",
    });

    const list = getCountries().map((country) => ({
      code: country,
      label: `${getFlagEmoji(country)} +${getCountryCallingCode(country)}`,
      dialCode: `+${getCountryCallingCode(country)}`,
      name: regionNames.of(country) || country,
    }));

    return list.sort((a, b) => {
      if (a.code === "AM") return -1;
      if (b.code === "AM") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [i18n.language]);

  const dialCode = useMemo(
    () =>
      allCountryOptions.find((c) => c.code === selectedCountry)?.dialCode || "",
    [selectedCountry, allCountryOptions],
  );

  const getIsValid = useCallback(
    (phone: string) => {
      const fullNumber = phone.startsWith("+") ? phone : `${dialCode}${phone}`;
      const phoneNumber = parsePhoneNumberFromString(
        fullNumber,
        selectedCountry,
      );
      return phoneNumber?.isValid() ?? false;
    },
    [dialCode, selectedCountry],
  );

  const isPhoneValid = getIsValid(customerPhone);

  const handleSearch = useCallback(async () => {
    if (!customerPhone?.trim()) {
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
  }, [customerPhone, isPhoneValid, t, intake?.id, dispatch]);

  const handleAccept = useCallback(async () => {
    setLocalHasTriedAccept(true);
    if (!intake?.id || !isPhoneValid) return;

    try {
      setIsAccepting(true);
      const userData = JSON.parse(localStorage.getItem("user_data") ?? "{}");

      // This will update state.operator.error, which OperatorPage is already watching
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

  const handleInternalPhoneChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setLocalHasTriedAccept(false);
    onPhoneChange?.(e.target.value);
  };

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

          <div className={styles.phoneInputRow}>
            <div className={styles.countrySelectWrapper}>
              <Select
                searchable
                searchPlaceholder={t("customerDetails.searchByCountryCode")}
                label={undefined}
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value as CountryCode);
                  setLocalHasTriedAccept(false);
                }}
                containerClassName={styles.countrySelectInner}
              >
                {allCountryOptions.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className={styles.phoneFieldWrapper}>
              <TextField
                label={undefined}
                placeholder="91 123456"
                value={customerPhone}
                onChange={handleInternalPhoneChange}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                error={phoneError || (localHasTriedAccept && !isPhoneValid)}
                disabled={isLoading || isAccepting}
                icon={
                  <Search
                    size={16}
                    onClick={handleSearch}
                    style={{ cursor: "pointer" }}
                  />
                }
              />
            </div>
          </div>
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
