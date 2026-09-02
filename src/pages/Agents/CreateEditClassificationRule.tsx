import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Plus, Trash2 } from "lucide-react";

import { SectionHeader } from "@/components/common";
import { Button, TextField, Textarea } from "@/ui-kit";
import { agentsService } from "@/services/agents";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { AgentTypeDto, AgentClassificationRuleConditionDto, SaveAgentClassificationRuleRequest } from "@/types/agents";
import styles from "./Agents.module.css";

const METRIC_LABELS: Record<number, string> = {
  0: "CompletedAdvances",
  1: "TotalAdvances",
  2: "OnTimeRepaymentPercent",
  3: "LateRepaymentCount",
  4: "OverdueAdvanceCount",
  5: "DefaultCount",
  6: "TotalExtensions",
  7: "AverageRepaymentDays",
  8: "AverageExtensionCount",
  9: "CurrentOutstandingAmount",
  10: "TotalRepaidAmount",
  11: "TotalPowderValue",
};

const OPERATOR_LABELS: Record<number, string> = {
  0: "=",
  1: "≠",
  2: ">",
  3: "≥",
  4: "<",
  5: "≤",
};

interface FormCondition extends Omit<AgentClassificationRuleConditionDto, "id"> {
  tempId?: string;
}

const initialForm = {
  agentTypeId: "",
  name: "",
  description: "",
  priority: 50,
};

export const CreateEditClassificationRule = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState(initialForm);
  const [conditions, setConditions] = useState<FormCondition[]>([]);
  const [agentTypes, setAgentTypes] = useState<AgentTypeDto[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!id);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    try {
      const types = await agentsService.getAgentTypes();
      setAgentTypes(types);

      if (id) {
        const rule = await agentsService.getClassificationRule(id);
        setForm({
          agentTypeId: rule.agentTypeId,
          name: rule.name,
          description: rule.description || "",
          priority: rule.priority,
        });
        setConditions(rule.conditions.map((c) => ({ ...c, tempId: c.id })));
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("classificationRules.errors.loadFailed")));
      navigate("/agent-classification-rules");
    } finally {
      setIsLoading(false);
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.agentTypeId) {
      nextErrors.agentTypeId = t("classificationRules.validation.typeRequired");
    }
    if (!form.name.trim()) {
      nextErrors.name = t("classificationRules.validation.nameRequired");
    }
    if (form.priority === null || form.priority === undefined) {
      nextErrors.priority = t("classificationRules.validation.priorityRequired");
    }
    if (conditions.length === 0) {
      nextErrors.conditions = t("classificationRules.validation.atLeastOneCondition");
    }

    // Validate unique order per logical group
    const groupOrders = new Map<number, Set<number>>();
    for (const cond of conditions) {
      if (!groupOrders.has(cond.logicalGroup)) {
        groupOrders.set(cond.logicalGroup, new Set());
      }
      const orders = groupOrders.get(cond.logicalGroup)!;
      if (orders.has(cond.order)) {
        nextErrors.conditions = t("classificationRules.validation.uniqueOrderPerGroup");
        break;
      }
      orders.add(cond.order);
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleAddCondition = (group: number) => {
    const maxOrder = Math.max(...conditions.filter((c) => c.logicalGroup === group).map((c) => c.order), -1);
    const newCondition: FormCondition = {
      metric: 0,
      operator: 0,
      value: 0,
      logicalGroup: group,
      order: maxOrder + 1,
      tempId: `new-${Date.now()}`,
    };
    setConditions([...conditions, newCondition]);
  };

  const handleAddGroup = () => {
    const maxGroup = Math.max(...conditions.map((c) => c.logicalGroup), -1);
    handleAddCondition(maxGroup + 1);
  };

  const handleUpdateCondition = (tempId: string | undefined, field: string, value: any) => {
    setConditions(
      conditions.map((c) => (c.tempId === tempId ? { ...c, [field]: value } : c))
    );
  };

  const handleDeleteCondition = (tempId: string | undefined) => {
    setConditions(conditions.filter((c) => c.tempId !== tempId));
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: SaveAgentClassificationRuleRequest = {
        agentTypeId: form.agentTypeId,
        name: form.name.trim(),
        description: form.description.trim() || null,
        priority: form.priority,
        conditions: conditions.map(({ tempId, ...c }) => c) as any,
      };

      if (id) {
        await agentsService.updateClassificationRule(id, payload);
        toast.success(t("classificationRules.messages.updated"));
      } else {
        const newId = await agentsService.createClassificationRule(payload);
        toast.success(t("classificationRules.messages.created"));
        navigate(`/agent-classification-rules/${newId}`);
        return;
      }

      navigate("/agent-classification-rules");
    } catch (error) {
      toast.error(getApiErrorMessage(error, id ? t("classificationRules.errors.updateFailed") : t("classificationRules.errors.createFailed")));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <SectionHeader title={id ? t("classificationRules.editTitle") : t("classificationRules.createTitle")} goBack />
        <div>{t("common.loading")}</div>
      </div>
    );
  }

  const groupedConditions = conditions.reduce(
    (acc, cond) => {
      if (!acc[cond.logicalGroup]) acc[cond.logicalGroup] = [];
      acc[cond.logicalGroup].push(cond);
      return acc;
    },
    {} as Record<number, FormCondition[]>
  );

  const groups = Object.keys(groupedConditions).sort((a, b) => parseInt(a) - parseInt(b));

  return (
    <div className={styles.page}>
      <SectionHeader title={id ? t("classificationRules.editTitle") : t("classificationRules.createTitle")} goBack />

      <div className={styles.banner}>{t("classificationRules.info.metricsUnavailable")}</div>

      <div className={styles.formCard}>
        <div className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <label>{t("classificationRules.fields.agentType")}</label>
            <select
              value={form.agentTypeId}
              onChange={(e) => setForm({ ...form, agentTypeId: e.target.value })}
              style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
            >
              <option value="">{t("common.select")}</option>
              {agentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.code} - {type.name}
                </option>
              ))}
            </select>
            {errors.agentTypeId && <div style={{ color: "#d32f2f", fontSize: "0.75rem" }}>{errors.agentTypeId}</div>}
          </div>
          <div className={styles.fieldGroup}>
            <TextField
              label={t("classificationRules.fields.priority")}
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
            label={t("classificationRules.fields.name")}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={!!errors.name}
            helperText={errors.name}
          />
        </div>

        <div className={styles.fieldGroup}>
          <Textarea
            label={t("classificationRules.fields.description")}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
        </div>

        {errors.conditions && <div style={{ color: "#d32f2f", marginBottom: "16px" }}>{errors.conditions}</div>}

        <div className={styles.conditionsSection}>
          <h3>{t("classificationRules.conditions.title")}</h3>

          {groups.length === 0 ? (
            <div>{t("classificationRules.conditions.empty")}</div>
          ) : (
            groups.map((groupStr, groupIdx) => {
              const group = parseInt(groupStr);
              const groupConditions = groupedConditions[group]!.sort((a, b) => a.order - b.order);

              return (
                <div key={group} className={styles.conditionGroup}>
                  {groupIdx > 0 && <div style={{ textAlign: "center", margin: "12px 0" }}>OR</div>}

                  <div style={{ background: "#f5f5f5", padding: "12px", borderRadius: "4px" }}>
                    <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
                      {t("classificationRules.conditions.group", { number: groupIdx + 1 })}
                    </div>

                    {groupConditions.map((cond, idx) => (
                      <div key={cond.tempId} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "flex-end" }}>
                        {idx > 0 && <div style={{ minWidth: "20px" }}>AND</div>}

                        <select
                          value={cond.metric}
                          onChange={(e) => handleUpdateCondition(cond.tempId, "metric", parseInt(e.target.value))}
                          style={{ padding: "6px", borderRadius: "4px", border: "1px solid #ccc", flex: 1 }}
                        >
                          {Object.entries(METRIC_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>

                        <select
                          value={cond.operator}
                          onChange={(e) => handleUpdateCondition(cond.tempId, "operator", parseInt(e.target.value))}
                          style={{ padding: "6px", borderRadius: "4px", border: "1px solid #ccc" }}
                        >
                          {Object.entries(OPERATOR_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          step="0.01"
                          value={cond.value}
                          onChange={(e) => handleUpdateCondition(cond.tempId, "value", parseFloat(e.target.value))}
                          style={{ padding: "6px", borderRadius: "4px", border: "1px solid #ccc", width: "100px" }}
                        />

                        <Button
                          variant="danger"
                          size="small"
                          onClick={() => handleDeleteCondition(cond.tempId)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}

                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => handleAddCondition(group)}
                      style={{ marginTop: "8px" }}
                    >
                      <Plus size={16} /> {t("classificationRules.conditions.addCondition")}
                    </Button>
                  </div>
                </div>
              );
            })
          )}

          <Button variant="secondary" onClick={handleAddGroup} style={{ marginTop: "12px" }}>
            <Plus size={16} /> {t("classificationRules.conditions.addGroup")}
          </Button>
        </div>

        <div className={styles.formActions}>
          <Button variant="secondary" onClick={() => navigate("/agent-classification-rules")}>
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

export default CreateEditClassificationRule;
