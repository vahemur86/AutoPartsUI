import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { SectionHeader } from "@/components/common";
import { Button, TextField, Textarea } from "@/ui-kit";
import { agentsService } from "@/services/agents";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { AgentTypeDto, AgentTypeRequest } from "@/types/agents";
import styles from "./Agents.module.css";

const initialForm = {
  code: "",
  name: "",
  description: "",
  priority: 50,
};

export const CreateEditAgentType = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!id);
  const [agentType, setAgentType] = useState<AgentTypeDto | null>(null);

  useEffect(() => {
    if (id) {
      void (async () => {
        try {
          const data = await agentsService.getAgentType(id);
          setAgentType(data);
          setForm({
            code: data.code,
            name: data.name,
            description: data.description || "",
            priority: data.priority,
          });
        } catch (error) {
          toast.error(getApiErrorMessage(error, t("agentTypes.errors.loadFailed")));
          navigate("/agent-types");
        } finally {
          setIsLoading(false);
        }
      })();
    } else {
      setIsLoading(false);
    }
  }, [id, navigate, t]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!id && !form.code.trim()) {
      nextErrors.code = t("agentTypes.validation.codeRequired");
    }
    if (!form.name.trim()) {
      nextErrors.name = t("agentTypes.validation.nameRequired");
    }
    if (form.priority === null || form.priority === undefined) {
      nextErrors.priority = t("agentTypes.validation.priorityRequired");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: AgentTypeRequest = {
        code: !id ? form.code.trim() : null,
        name: form.name.trim(),
        description: form.description.trim() || null,
        priority: form.priority,
      };

      if (id) {
        await agentsService.updateAgentType(id, payload);
        toast.success(t("agentTypes.messages.updated"));
      } else {
        const newId = await agentsService.createAgentType(payload);
        toast.success(t("agentTypes.messages.created"));
        navigate(`/agent-types/${newId}`);
        return;
      }

      navigate("/agent-types");
    } catch (error) {
      toast.error(getApiErrorMessage(error, id ? t("agentTypes.errors.updateFailed") : t("agentTypes.errors.createFailed")));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <SectionHeader title={id ? t("agentTypes.editTitle") : t("agentTypes.createTitle")} goBack />
        <div>{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <SectionHeader title={id ? t("agentTypes.editTitle") : t("agentTypes.createTitle")} goBack />

      <div className={styles.formCard}>
        <div className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <TextField
              label={t("agentTypes.fields.code")}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              error={!!errors.code}
              helperText={errors.code}
              disabled={!!id || !!agentType?.isSystem}
              placeholder="E.g., PARTNER"
            />
          </div>
          <div className={styles.fieldGroup}>
            <TextField
              label={t("agentTypes.fields.priority")}
              type="number"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value, 10) || 0 })}
              error={!!errors.priority}
              helperText={errors.priority}
            />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <TextField
            label={t("agentTypes.fields.name")}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={!!errors.name}
            helperText={errors.name}
          />
        </div>

        <div className={styles.fieldGroup}>
          <Textarea
            label={t("agentTypes.fields.description")}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
          />
        </div>

        <div className={styles.formActions}>
          <Button variant="secondary" onClick={() => navigate("/agent-types")}>
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

export default CreateEditAgentType;
