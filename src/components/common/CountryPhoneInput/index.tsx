import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from "libphonenumber-js";

// icons
import { Search } from "lucide-react";

// ui-kit
import { Select, TextField } from "@/ui-kit";

// styles
import styles from "./CountryPhoneInput.module.css";

interface CountryPhoneInputProps {
  phone: string;
  selectedCountry: CountryCode;
  onCountryChange: (country: CountryCode) => void;
  onPhoneChange: (fullNumber: string) => void;
  onSearch?: () => void;
  error?: boolean;
  disabled?: boolean;
}

const getFlagEmoji = (countryCode: string) =>
  countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));

export const CountryPhoneInput = ({
  phone,
  selectedCountry,
  onCountryChange,
  onPhoneChange,
  onSearch,
  error,
  disabled,
}: CountryPhoneInputProps) => {
  const { t, i18n } = useTranslation();

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");

    // Armenian business logic: remove leading zero
    if (selectedCountry === "AM" && value.startsWith("0")) {
      value = value.substring(1);
    }

    const fullNumber = value ? `${dialCode}${value}` : "";
    onPhoneChange(fullNumber);
  };

  const displayPhone = phone.startsWith(dialCode)
    ? phone.slice(dialCode.length)
    : "";

  return (
    <div className={styles.phoneInputRow}>
      <div className={styles.countrySelectWrapper}>
        <Select
          searchable
          searchPlaceholder={t("customerDetails.searchByCountryCode")}
          label={undefined}
          value={selectedCountry}
          onChange={(e) => onCountryChange(e.target.value as CountryCode)}
          disabled={disabled}
        >
          {allCountryOptions.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label} ({c.code})
            </option>
          ))}
        </Select>
      </div>

      <div className={styles.phoneFieldWrapper}>
        <TextField
          label={undefined}
          placeholder="91 123456"
          value={displayPhone}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === "Enter" && onSearch?.()}
          error={error}
          disabled={disabled}
          icon={
            onSearch && (
              <Search
                size={16}
                onClick={onSearch}
                style={{ cursor: "pointer" }}
              />
            )
          }
        />
      </div>
    </div>
  );
};
