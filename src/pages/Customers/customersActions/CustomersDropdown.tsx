import { useState, useEffect, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import type { CountryCode } from "libphonenumber-js";

// ui-kit
import { Dropdown, TextField, Button, Select } from "@/ui-kit";

// common components
import { CountryPhoneInput, GenderSelect } from "@/components/common";

// types
import type { CreateCustomerRequest } from "@/types/operator";
import type { CustomerType } from "@/types/settings";

// styles
import styles from "./CustomersDropdown.module.css";

type DropdownType = "add" | "filter";

interface FormState {
  phone: string;
  fullName: string;
  gender: number | null;
  notes: string;
  customerTypeId: string;
  selectedCountry: CountryCode;
}

const initialFormState: FormState = {
  phone: "",
  fullName: "",
  gender: 0,
  notes: "",
  customerTypeId: "",
  selectedCountry: "AM",
};

interface CustomersDropdownProps {
  type: DropdownType;
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  onOpenChange: (open: boolean) => void;
  customerTypes?: CustomerType[];
  isSubmitting?: boolean;
  onSave?: (data: CreateCustomerRequest) => void;
  filters?: {
    phone: string;
    customerTypeId: string;
    gender: number | null;
  };
  onApply?: (filters: {
    phone: string;
    customerTypeId: string;
    gender: number | null;
  }) => void;
  onReset?: () => void;
}

export const CustomersDropdown = ({
  type,
  open,
  anchorRef,
  onOpenChange,
  customerTypes = [],
  isSubmitting = false,
  onSave,
  filters,
  onApply,
  onReset,
}: CustomersDropdownProps) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(initialFormState);

  const updateField = (updates: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    if (open) {
      if (type === "filter" && filters) {
        setForm({
          ...initialFormState,
          phone: filters.phone,
          customerTypeId: filters.customerTypeId,
          gender: filters.gender,
        });
      } else {
        setForm(initialFormState);
      }
    }
  }, [open, type, filters]);

  const handlePrimaryAction = () => {
    if (type === "add") {
      if (!form.phone || !form.fullName || !onSave) return;
      onSave({
        phone: form.phone,
        fullName: form.fullName,
        gender: form.gender ?? 0,
        notes: form.notes.trim() || undefined,
      });
    } else if (type === "filter" && onApply) {
      onApply({
        phone: form.phone,
        customerTypeId: form.customerTypeId,
        gender: form.gender,
      });
      onOpenChange(false);
    }
  };

  const handleSecondaryAction = () => {
    if (type === "filter" && onReset) {
      onReset();
      onOpenChange(false);
    } else {
      onOpenChange(false);
    }
  };

  const isAddDisabled =
    type === "add" && (isSubmitting || !form.phone || !form.fullName);

  return (
    <Dropdown
      align="start"
      side="left"
      open={open}
      onOpenChange={onOpenChange}
      anchorRef={anchorRef}
      title={
        type === "add" ? t("customers.createCustomer") : t("common.filters")
      }
    >
      <div className={styles.content}>
        <div className={styles.fields}>
          {type === "add" && (
            <TextField
              label={t("customers.form.fullName")}
              value={form.fullName}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                updateField({ fullName: e.target.value })
              }
              placeholder={t("customers.form.fullNamePlaceholder")}
              required
              disabled={isSubmitting}
            />
          )}

          <div className={styles.phoneSection}>
            <label className={styles.fieldLabel}>
              {t("customers.form.phone")}
            </label>
            <CountryPhoneInput
              phone={form.phone}
              selectedCountry={form.selectedCountry}
              onCountryChange={(country) =>
                updateField({ selectedCountry: country })
              }
              onPhoneChange={(val) => updateField({ phone: val })}
              disabled={isSubmitting}
            />
          </div>

          {type === "filter" && (
            <Select
              label={t("customers.form.customerType")}
              value={form.customerTypeId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                updateField({ customerTypeId: e.target.value })
              }
            >
              <option value="">{t("customers.form.allTypes")}</option>
              {customerTypes.map((ct) => (
                <option key={ct.id} value={ct.id.toString()}>
                  {ct.code}
                </option>
              ))}
            </Select>
          )}

          <GenderSelect
            label={t("customers.form.gender")}
            value={form.gender}
            onChange={(val) => updateField({ gender: val })}
            disabled={isSubmitting}
          />

          {type === "add" && (
            <TextField
              label={t("customers.form.notes")}
              value={form.notes}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                updateField({ notes: e.target.value })
              }
              disabled={isSubmitting}
            />
          )}
        </div>

        <div className={styles.actions}>
          <Button
            variant="secondary"
            onClick={handleSecondaryAction}
            disabled={isSubmitting}
          >
            {type === "add" ? t("common.cancel") : t("common.reset")}
          </Button>

          <Button
            variant="primary"
            onClick={handlePrimaryAction}
            disabled={isAddDisabled}
          >
            {type === "add" ? t("common.save") : t("common.apply")}
          </Button>
        </div>
      </div>
    </Dropdown>
  );
};
