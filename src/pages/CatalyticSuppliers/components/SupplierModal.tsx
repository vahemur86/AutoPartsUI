import { useEffect, useState, type FC } from "react";
import { useTranslation } from "react-i18next";
import {
  isPossiblePhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

import { Button, Modal, TextField, Textarea } from "@/ui-kit";
import { CountryPhoneInput } from "@/components/common";

import type {
  CatalyticConverterSupplier,
  CreateCatalyticConverterSupplierRequest,
} from "@/types/catalyticConverters";

import styles from "../CatalyticSuppliers.module.css";

interface SupplierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: CreateCatalyticConverterSupplierRequest) => Promise<void>;
  supplier?: CatalyticConverterSupplier | null;
  isSubmitting?: boolean;
}

const DEFAULT_COUNTRY: CountryCode = "AM";

export const SupplierModal: FC<SupplierModalProps> = ({
  open,
  onOpenChange,
  onSave,
  supplier,
  isSubmitting = false,
}) => {
  const { t } = useTranslation();
  const [phone, setPhone] = useState("");
  const [selectedCountry, setSelectedCountry] =
    useState<CountryCode>(DEFAULT_COUNTRY);
  const [fullName, setFullName] = useState("");
  const [notes, setNotes] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [fullNameError, setFullNameError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const parsedPhone = supplier?.phone
      ? parsePhoneNumberFromString(supplier.phone)
      : null;

    setPhone(supplier?.phone ?? "");
    setSelectedCountry((parsedPhone?.country as CountryCode) || DEFAULT_COUNTRY);
    setFullName(supplier?.fullName ?? "");
    setNotes(supplier?.notes ?? "");
    setPhoneError(null);
    setFullNameError(null);
  }, [open, supplier]);

  const validate = () => {
    let isValid = true;

    if (!fullName.trim()) {
      setFullNameError(t("catalyticSuppliers.validation.fullNameRequired"));
      isValid = false;
    } else {
      setFullNameError(null);
    }

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setPhoneError(t("catalyticSuppliers.validation.phoneRequired"));
      isValid = false;
    } else if (!trimmedPhone.startsWith("+")) {
      setPhoneError(t("catalyticSuppliers.validation.phoneMustStartWithPlus"));
      isValid = false;
    } else if (!isPossiblePhoneNumber(trimmedPhone)) {
      setPhoneError(t("catalyticSuppliers.validation.phoneLength"));
      isValid = false;
    } else {
      setPhoneError(null);
    }

    return isValid;
  };

  const handleSave = async () => {
    if (!validate()) return;

    await onSave({
      phone: phone.trim(),
      fullName: fullName.trim(),
      notes: notes.trim() || null,
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={
        supplier ? t("catalyticSuppliers.editTitle") : t("catalyticSuppliers.createTitle")
      }
      width="640px"
      footer={
        <div className={styles.modalFooter}>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? t("common.loading") : t("common.save")}
          </Button>
        </div>
      }
    >
      <div className={styles.formGrid}>
        <TextField
          label={t("catalyticSuppliers.form.fullName")}
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            if (fullNameError) setFullNameError(null);
          }}
          error={!!fullNameError}
          helperText={fullNameError ?? undefined}
          disabled={isSubmitting}
        />

        <div className={styles.phoneFieldGroup}>
          <label className={styles.fieldLabel}>
            {t("catalyticSuppliers.form.phone")}
          </label>
          <CountryPhoneInput
            phone={phone}
            selectedCountry={selectedCountry}
            onCountryChange={setSelectedCountry}
            onPhoneChange={(value) => {
              setPhone(value);
              if (phoneError) setPhoneError(null);
            }}
            error={!!phoneError}
            disabled={isSubmitting}
          />
          {phoneError && <span className={styles.fieldError}>{phoneError}</span>}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <Textarea
          label={t("catalyticSuppliers.form.notes")}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          disabled={isSubmitting}
        />
      </div>
    </Modal>
  );
};
