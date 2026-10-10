import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { CountryCode } from "libphonenumber-js";
import { isPossiblePhoneNumber } from "libphonenumber-js";
import { createPortal } from "react-dom";
import { NotebookPen, Phone, UserRound, UserRoundPlus, X } from "lucide-react";
import { toast } from "react-toastify";

// ui-kit
import { TextField, Button, Textarea } from "@/ui-kit";

// common components
import { CountryPhoneInput, GenderSelect } from "@/components/common";

// types
import type { CreateCustomerRequest } from "@/types/operator";
// styles
import pageStyles from "../Customers.module.css";

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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting?: boolean;
  onSave?: (data: CreateCustomerRequest) => void;
}

export const CustomersDropdown = ({
  open,
  onOpenChange,
  isSubmitting = false,
  onSave,
}: CustomersDropdownProps) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(initialFormState);

  const updateField = (updates: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    if (open) setForm(initialFormState);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onOpenChange]);

  const handleSave = () => {
    if (!form.phone || !form.fullName || !onSave) return;
    if (!isPossiblePhoneNumber(form.phone)) {
      toast.error(t("customers.validation.phoneInvalid"));
      return;
    }
    onSave({
      phone: form.phone,
      fullName: form.fullName,
      gender: form.gender ?? 0,
      notes: form.notes.trim() || undefined,
    });
  };

  if (!open) return null;

  const closeDrawer = () => onOpenChange(false);

  return createPortal(
    <div className={pageStyles.backdrop} onMouseDown={closeDrawer}>
      <aside
        className={pageStyles.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-create-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={pageStyles.drawerHeader}>
          <div className={pageStyles.headerIcon} aria-hidden="true">
            <UserRoundPlus size={20} />
          </div>
          <div className={pageStyles.headerCopy}>
            <span className={pageStyles.eyebrow}>{t("header.customers")}</span>
            <h2 id="customer-create-title">{t("customers.createCustomer")}</h2>
          </div>
          <button
            type="button"
            className={pageStyles.closeButton}
            onClick={closeDrawer}
            aria-label={t("common.close")}
            title={t("common.close")}
          >
            <X size={18} />
          </button>
        </header>

        <div className={pageStyles.drawerBody}>
          <div className={pageStyles.fieldGrid}>
            <TextField
              label={t("customers.form.fullName")}
              value={form.fullName}
              onChange={(event) => updateField({ fullName: event.target.value })}
              placeholder={t("customers.form.fullNamePlaceholder")}
              icon={<UserRound size={15} />}
              required
              disabled={isSubmitting}
              autoFocus
            />

            <div className={pageStyles.phoneField}>
              <label className={pageStyles.fieldLabel}>
                <Phone size={14} />
                <span>{t("customers.form.phone")}</span>
              </label>
              <CountryPhoneInput
                phone={form.phone}
                selectedCountry={form.selectedCountry}
                onCountryChange={(country) =>
                  updateField({ selectedCountry: country, phone: "" })
                }
                onPhoneChange={(phone) => updateField({ phone })}
                disabled={isSubmitting}
              />
            </div>

            <div className={pageStyles.genderField}>
              <GenderSelect
                label={t("customers.form.gender")}
                value={form.gender}
                onChange={(gender) => updateField({ gender })}
                disabled={isSubmitting}
              />
            </div>

            <label className={pageStyles.notesLabel} htmlFor="customer-notes">
              <NotebookPen size={14} />
              <span>{t("customers.form.notes")}</span>
            </label>
            <Textarea
              id="customer-notes"
              value={form.notes}
              onChange={(event) => updateField({ notes: event.target.value })}
              rows={3}
              resizable={false}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <footer className={pageStyles.drawerFooter}>
          <Button
            className={`${pageStyles.customerButton} ${pageStyles.neutralButton}`}
            onClick={closeDrawer}
            disabled={isSubmitting}
          >
            {t("common.cancel")}
          </Button>
          <Button
            className={`${pageStyles.customerButton} ${pageStyles.primaryButton}`}
            onClick={handleSave}
            disabled={isSubmitting || !form.phone || !form.fullName}
          >
            {isSubmitting ? t("common.saving") : t("common.save")}
          </Button>
        </footer>
      </aside>
    </div>,
    document.body,
  );
};
