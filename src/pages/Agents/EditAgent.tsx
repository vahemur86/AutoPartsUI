import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { SectionHeader } from "@/components/common";
import { Button, TextField, Textarea } from "@/ui-kit";
import { agentsService } from "@/services/agents";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { AgentDto, UpdateAgentRequest } from "@/types/agents";
import styles from "./Agents.module.css";

const today = new Date().toISOString().slice(0, 10);

export const EditAgent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [agent, setAgent] = useState<AgentDto | null>(null);
  const [form, setForm] = useState({ address: "", registrationDate: "", notes: "" });
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
          address: data.address || "",
          registrationDate: data.registrationDate.slice(0, 10),
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

  const handleSubmit = async () => {
    const nextErrors: Record<string, string> = {};
    if (!form.registrationDate) nextErrors.registrationDate = t("agents.validation.registrationRequired");
    if (form.registrationDate > today) nextErrors.registrationDate = t("agents.validation.registrationFuture");
    if (form.address.length > 500) nextErrors.address = t("agents.validation.addressTooLong", { defaultValue: "Address cannot exceed 500 characters" });
    if (form.notes.length > 1000) nextErrors.notes = t("agents.validation.notesTooLong", { defaultValue: "Notes cannot exceed 1000 characters" });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !agent) return;

    setIsSubmitting(true);
    try {
      const payload: UpdateAgentRequest = {
        address: form.address.trim() || null,
        registrationDate: new Date(`${form.registrationDate}T00:00:00`).toISOString(),
        notes: form.notes.trim() || null,
      };
      await agentsService.updateAgent(agent.id, payload);
      toast.success(t("agents.messages.updated", { defaultValue: "Agent updated" }));
      navigate(`/agents/${agent.id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("agents.errors.updateFailed", { defaultValue: "Failed to update agent" })));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className={styles.page}><SectionHeader title={t("agents.createTitle")} goBack /><div>{t("common.loading")}</div></div>;
  if (!agent) return null;

  return (
    <div className={styles.page}>
      <SectionHeader title={`${t("common.edit")} — ${agent.code}`} goBack />
      <div className={styles.formCard}>
        <div className={styles.formSection}>
          <h3>{t("agents.details.customerInformation", { defaultValue: "Customer Information" })}</h3>
          <div className={styles.selectedCustomer}>
            <strong>{agent.customer?.fullName || "—"}</strong>
            <div>{t("agents.fields.phone")}: {agent.customer?.phone || "—"}</div>
            <div>{t("agents.fields.email")}: {agent.customer?.email || "—"}</div>
            <div>{t("agents.fields.customerType", { defaultValue: "Customer Type" })}: {agent.customer?.customerType?.code || "—"}</div>
          </div>
        </div>
        <div className={styles.formSection}>
          <h3>{t("agents.sections.details", { defaultValue: "Agent Details" })}</h3>
          <div className={styles.fieldGroup}><TextField label={t("agents.fields.code")} value={agent.code} disabled /></div>
          <div className={styles.formGrid}>
            <TextField label={t("agents.fields.registrationDate")} value={form.registrationDate} onChange={(e) => setForm({ ...form, registrationDate: e.target.value })} type="date" max={today} error={!!errors.registrationDate} helperText={errors.registrationDate} />
            <TextField label={t("agents.fields.address")} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} error={!!errors.address} helperText={errors.address} maxLength={500} />
          </div>
          <Textarea label={t("agents.fields.notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} error={!!errors.notes} helperText={errors.notes} maxLength={1000} rows={4} />
        </div>
        <div className={styles.formActions}>
          <Button variant="secondary" onClick={() => navigate(`/agents/${agent.id}`)}>{t("common.cancel")}</Button>
          <Button onClick={() => void handleSubmit()} disabled={isSubmitting}>{isSubmitting ? t("common.saving") : t("common.save")}</Button>
        </div>
      </div>
    </div>
  );
};

export default EditAgent;
