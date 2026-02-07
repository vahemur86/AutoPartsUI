import { useState, useEffect, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import type { CountryCode } from "libphonenumber-js";

// ui-kit
import { Dropdown, Select, Button } from "@/ui-kit";

// common components
import { CountryPhoneInput, GenderSelect } from "@/components/common";

// types
import type { CustomerType } from "@/types/settings";

// styles
import styles from "./AddCustomerDropdown.module.css";

interface FilterCustomersDropdownProps {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  onOpenChange: (open: boolean) => void;
  customerTypes: CustomerType[];
  filters: {
    phone: string;
    customerTypeId: string;
    gender: number | null;
  };
  onApply: (filters: {
    phone: string;
    customerTypeId: string;
    gender: number | null;
  }) => void;
  onReset: () => void;
}

export const FilterCustomersDropdown = ({
  open,
  anchorRef,
  onOpenChange,
  customerTypes,
  filters,
  onApply,
  onReset,
}: FilterCustomersDropdownProps) => {
  const { t } = useTranslation();

  const [localPhone, setLocalPhone] = useState(filters.phone);
  const [localType, setLocalType] = useState(filters.customerTypeId);
  const [localGender, setLocalGender] = useState<number | null>(
    filters?.gender ?? null,
  );
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("AM");

  useEffect(() => {
    if (open) {
      setLocalPhone(filters.phone);
      setLocalType(filters.customerTypeId);
      setLocalGender(filters.gender);
    }
  }, [open, filters]);

  const handleApply = () => {
    onApply({
      phone: localPhone,
      customerTypeId: localType,
      gender: localGender,
    });
    onOpenChange(false);
  };

  const handleReset = () => {
    setLocalPhone("");
    setLocalType("");
    setLocalGender(null);
    onReset();
    onOpenChange(false);
  };

  return (
    <Dropdown
      align="start"
      side="left"
      open={open}
      onOpenChange={onOpenChange}
      anchorRef={anchorRef}
      title={t("common.filters")}
    >
      <div className={styles.content}>
        <div className={styles.fields}>
          <div className={styles.phoneSection}>
            <label className={styles.fieldLabel}>
              {t("customers.form.phone")}
            </label>
            <CountryPhoneInput
              phone={localPhone}
              selectedCountry={selectedCountry}
              onCountryChange={setSelectedCountry}
              onPhoneChange={setLocalPhone}
            />
          </div>

          <Select
            label={t("customers.form.customerType")}
            value={localType}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setLocalType(e.target.value)
            }
          >
            <option value="">{t("customers.form.allTypes")}</option>
            {customerTypes.map((type) => (
              <option key={type.id} value={type.id.toString()}>
                {type.code}
              </option>
            ))}
          </Select>

          <GenderSelect value={localGender} onChange={setLocalGender} />
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={handleReset}>
            {t("common.reset")}
          </Button>
          <Button variant="primary" onClick={handleApply}>
            {t("common.apply")}
          </Button>
        </div>
      </div>
    </Dropdown>
  );
};
