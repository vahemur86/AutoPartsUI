import { useState, useEffect, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import type { CountryCode } from "libphonenumber-js";

// ui-kit
import { Dropdown, TextField, Button } from "@/ui-kit";

// common components
import { CountryPhoneInput, GenderSelect } from "@/components/common";

// types
import type { CreateCustomerRequest } from "@/types/operator";

// styles
import styles from "./AddCustomerDropdown.module.css";

interface AddCustomerDropdownProps {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CreateCustomerRequest) => void;
  isSubmitting: boolean;
}

export const AddCustomerDropdown = ({
  open,
  anchorRef,
  onOpenChange,
  onSave,
  isSubmitting,
}: AddCustomerDropdownProps) => {
  const { t } = useTranslation();

  // Local Form State
  const [phone, setPhone] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [gender, setGender] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("AM");

  // --- FORM RESET LOGIC ---
  useEffect(() => {
    if (!open) {
      setPhone("");
      setFullName("");
      setGender(0);
      setNotes("");
      setSelectedCountry("AM");
    }
  }, [open]);

  const handleSave = () => {
    // We only validate presence here; detailed validation happens inside components or parent
    if (!phone || !fullName) return;

    onSave({
      phone, // Already formatted with dial code from CountryPhoneInput
      fullName,
      gender,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Dropdown
      align="start"
      side="left"
      open={open}
      onOpenChange={onOpenChange}
      anchorRef={anchorRef}
      title={t("customers.createCustomer")}
    >
      <div className={styles.content}>
        <div className={styles.fields}>
          <TextField
            label={t("customers.form.fullName")}
            value={fullName}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setFullName(e.target.value)
            }
            placeholder={t("customers.form.fullNamePlaceholder")}
            required
            disabled={isSubmitting}
          />

          <GenderSelect
            label={t("customers.form.gender")}
            value={gender}
            onChange={setGender}
            disabled={isSubmitting}
          />

          <div className={styles.phoneSection}>
            <label className={styles.fieldLabel}>
              {t("customers.form.phone")}
            </label>
            <CountryPhoneInput
              phone={phone}
              selectedCountry={selectedCountry}
              onCountryChange={setSelectedCountry}
              onPhoneChange={setPhone}
              disabled={isSubmitting}
            />
          </div>

          <TextField
            label={t("customers.form.notes")}
            value={notes}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setNotes(e.target.value)
            }
            disabled={isSubmitting}
          />
        </div>

        <div className={styles.actions}>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSubmitting || !phone || !fullName}
          >
            {t("common.save")}
          </Button>
        </div>
      </div>
    </Dropdown>
  );
};
