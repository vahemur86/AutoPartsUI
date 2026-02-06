import { useMemo } from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Select } from "@/ui-kit";

interface GenderSelectProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  label?: string;
}

export const GenderSelect = ({
  value,
  onChange,
  disabled,
  label,
}: GenderSelectProps) => {
  const { t } = useTranslation();

  const genderOptions = useMemo(
    () => [
      { label: t("common.gender.unknown"), value: 0 },
      { label: t("common.gender.male"), value: 1 },
      { label: t("common.gender.female"), value: 2 },
    ],
    [t],
  );

  return (
    <Select
      label={label ?? t("customerDetails.gender")}
      value={value.toString()}
      onChange={(e) => onChange(Number(e.target.value))}
      disabled={disabled}
    >
      {genderOptions.map((opt) => (
        <option key={opt.value} value={opt.value.toString()}>
          {opt.label}
        </option>
      ))}
    </Select>
  );
};
