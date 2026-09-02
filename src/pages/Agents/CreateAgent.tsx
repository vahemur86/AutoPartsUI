import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import type { CountryCode } from "libphonenumber-js";

import { SectionHeader, CountryPhoneInput } from "@/components/common";
import { Button, TextField } from "@/ui-kit";
import { agentsService } from "@/services/agents";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import styles from "./Agents.module.css";

const initialForm = {
  code: "",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  address: "",
  registrationDate: new Date().toISOString().slice(0, 16),
  notes: "",
};

export const CreateAgent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("AM");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.code.trim()) nextErrors.code = t("agents.validation.codeRequired");
    if (!form.firstName.trim()) nextErrors.firstName = t("agents.validation.firstNameRequired");
    if (!form.lastName.trim()) nextErrors.lastName = t("agents.validation.lastNameRequired");

    if (!form.phone || !/^\+[0-9]{8,16}$/.test(form.phone)) {
      nextErrors.phone = t("agents.validation.phoneInvalid");
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = t("agents.validation.emailInvalid");
    }

    if (!form.registrationDate) {
      nextErrors.registrationDate = t("agents.validation.registrationRequired");
    } else {
      const regDate = new Date(form.registrationDate);
      if (Number.isNaN(regDate.getTime()) || regDate > new Date()) {
        nextErrors.registrationDate = t("agents.validation.registrationFuture");
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        code: form.code.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        registrationDate: new Date(form.registrationDate).toISOString(),
        notes: form.notes.trim() || null,
      };

      const createdId = await agentsService.createAgent(payload);
      toast.success(t("agents.messages.created"));
      navigate(`/agents/${createdId}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("agents.errors.createFailed")));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <SectionHeader title={t("agents.createTitle")} goBack />

      <div className={styles.formCard}>
        <div className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <TextField
              label={t("agents.fields.code")}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              error={!!errors.code}
              helperText={errors.code}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label>{t("agents.fields.phone")}</label>
            <CountryPhoneInput
              phone={form.phone}
              selectedCountry={selectedCountry}
              onCountryChange={setSelectedCountry}
              onPhoneChange={(phone) => setForm({ ...form, phone })}
              error={!!errors.phone}
            />
            {errors.phone && <div style={{ color: "#d32f2f", fontSize: "0.75rem", marginTop: "4px" }}>{errors.phone}</div>}
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <TextField
              label={t("agents.fields.firstName")}
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              error={!!errors.firstName}
              helperText={errors.firstName}
            />
          </div>
          <div className={styles.fieldGroup}>
            <TextField
              label={t("agents.fields.lastName")}
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              error={!!errors.lastName}
              helperText={errors.lastName}
            />
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <TextField
              label={t("agents.fields.email")}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={!!errors.email}
              helperText={errors.email}
            />
          </div>
          <div className={styles.fieldGroup}>
            <TextField
              label={t("agents.fields.registrationDate")}
              value={form.registrationDate}
              onChange={(e) => setForm({ ...form, registrationDate: e.target.value })}
              type="datetime-local"
              error={!!errors.registrationDate}
              helperText={errors.registrationDate}
            />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <TextField
            label={t("agents.fields.address")}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>

        <div className={styles.fieldGroup}>
          <TextField
            label={t("agents.fields.notes")}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <div className={styles.formActions}>
          <Button variant="secondary" onClick={() => navigate(-1)}>{t("common.cancel")}</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? t("agents.creating") : t("agents.createButton")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateAgent;
