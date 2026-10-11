import { useEffect, useState, type FC } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { BadgeCheck, NotebookPen, Phone, Truck, UserRound, X } from "lucide-react";
import {
  isPossiblePhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

import { Button, TextField, Textarea } from "@/ui-kit";
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
  viewOnly?: boolean;
  isSubmitting?: boolean;
}

const DEFAULT_COUNTRY: CountryCode = "AM";

export const SupplierModal: FC<SupplierModalProps> = ({
  open,
  onOpenChange,
  onSave,
  supplier,
  viewOnly = false,
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
    if (viewOnly) return;
    if (!validate()) return;

    await onSave({
      phone: phone.trim(),
      fullName: fullName.trim(),
      notes: notes.trim() || null,
    });
  };

  if (!open) return null;

  const title = viewOnly
    ? t("catalyticSuppliers.viewTitle")
    : supplier
      ? t("catalyticSuppliers.editTitle")
      : t("catalyticSuppliers.createTitle");
  const closeDrawer = () => onOpenChange(false);

  return createPortal(
    <div
      className={styles.drawerBackdrop}
      onMouseDown={closeDrawer}
    >
      <aside
        className={styles.supplierDrawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="supplier-drawer-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.drawerHeader}>
          <div className={styles.drawerIcon} aria-hidden="true">
            <Truck size={20} />
          </div>
          <div className={styles.drawerHeaderCopy}>
            <span className={styles.drawerEyebrow}>{t("header.operations")}</span>
            <h2 id="supplier-drawer-title">{title}</h2>
          </div>
          <button
            type="button"
            className={styles.drawerClose}
            onClick={closeDrawer}
            aria-label={t("common.close")}
            title={t("common.close")}
          >
            <X size={18} />
          </button>
        </header>

        <div className={styles.drawerBody}>
          <div className={styles.drawerSectionHeading}>
            <BadgeCheck size={15} />
            <span>{t("catalyticSuppliers.viewTitle")}</span>
          </div>

          <div className={styles.drawerFieldGrid}>
            <TextField
              label={t("catalyticSuppliers.form.fullName")}
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (fullNameError) setFullNameError(null);
              }}
              icon={<UserRound size={15} />}
              error={!!fullNameError}
              helperText={fullNameError ?? undefined}
              disabled={isSubmitting || viewOnly}
              autoFocus={!viewOnly}
            />

            <div className={styles.drawerPhoneField}>
              <label className={styles.drawerFieldLabel}>
                <Phone size={14} />
                <span>{t("catalyticSuppliers.form.phone")}</span>
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
                disabled={isSubmitting || viewOnly}
              />
              {phoneError && <span className={styles.fieldError}>{phoneError}</span>}
            </div>
          </div>

          <label className={styles.drawerNotesLabel}>
            <NotebookPen size={14} />
            <span>{t("catalyticSuppliers.form.notes")}</span>
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            resizable={false}
            disabled={isSubmitting || viewOnly}
          />
        </div>

        <footer className={styles.drawerFooter}>
          <Button
            variant="secondary"
            className={styles.modalNeutralButton}
            onClick={closeDrawer}
            disabled={isSubmitting}
          >
            {viewOnly ? t("common.close") : t("common.cancel")}
          </Button>
          {!viewOnly && (
            <Button
              className={styles.modalPrimaryButton}
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? t("common.loading") : t("common.save")}
            </Button>
          )}
        </footer>
      </aside>
    </div>,
    document.body,
  );
};
