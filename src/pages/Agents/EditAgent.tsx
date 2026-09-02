import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import type { CountryCode } from "libphonenumber-js";

import { SectionHeader, CountryPhoneInput } from "@/components/common";
import { Button, TextField, Textarea } from "@/ui-kit";
import { agentsService } from "@/services/agents";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { AgentDto, UpdateAgentRequest } from "@/types/agents";
import styles from "./Agents.module.css";

export const EditAgent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [agent, setAgent] = useState<AgentDto | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    registrationDate: "",
    notes: "",
  });
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("AM");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const data = await agentsService.getAgent(id);
        setAgent(data);
        setForm({
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          email: data.email || "",
          address: data.address || "",
          registrationDate: data.registrationDate,
          notes: data.notes || "",
        });
      } catch (error) {
        toast.error(getApiErrorMessage(error, t("agents.errors.loadFailed")));
        navigate("/agents");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id, navigate, t]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

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
    if (!validate() || !agent) return;

    setIsSubmitting(true);
    try {
      const payload: UpdateAgentRequest = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        registrationDate: new Date(form.registrationDate).toISOString(),
        notes: form.notes.trim() || null,
      };

      await agentsService.updateAgent(agent.id, payload);
      toast.success(t("agents.messages.statusUpdated"));
      navigate(`/agents/${agent.id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("agents.errors.createFailed")));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <SectionHeader title={t("agents.createTitle")} goBack />
        <div>{t("common.loading")}</div>
      </div>
    );
  }

  if (!agent) {
    return null;
  }

  return (
    <div className={styles.page}>
      <SectionHeader title={`${t("common.edit")} — ${agent.code}`} goBack />

      <div className={styles.formCard}>
        <div className={styles.fieldGroup}>
          <label>{t("agents.fields.code")}</label>
          <div style={{ padding: "8px", background: "#f5f5f5", borderRadius: "4px" }}>{agent.code}</div>
          <div style={{ fontSize: "0.75rem", color: "#666", marginTop: "4px" }}>{t("agents.validation.codeRequired")}</div>
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
          <div className={styles.fieldGroup}>
            <TextField
              label={t("agents.fields.email")}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={!!errors.email}
              helperText={errors.email}
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
            label={t("agents.fields.registrationDate")}
            value={form.registrationDate}
            onChange={(e) => setForm({ ...form, registrationDate: e.target.value })}
            type="datetime-local"
            error={!!errors.registrationDate}
            helperText={errors.registrationDate}
          />
        </div>

        <div className={styles.fieldGroup}>
          <Textarea
            label={t("agents.fields.notes")}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={4}
          />
        </div>

        <div className={styles.formActions}>
          <Button variant="secondary" onClick={() => navigate(`/agents/${agent.id}`)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditAgent;
