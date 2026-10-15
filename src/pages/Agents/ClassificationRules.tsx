import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Pencil, Plus, Power } from "lucide-react";

import { SectionHeader } from "@/components/common";
import { agentsService } from "@/services/agents";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { AgentClassificationRuleDto } from "@/types/agents";
import styles from "./Agents.module.css";
import { AgentActionButton, AgentIconButton } from "./AgentActionButton";

export const ClassificationRules = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [rules, setRules] = useState<AgentClassificationRuleDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [filterActive, setFilterActive] = useState<boolean | null>(null);

  useEffect(() => {
    void loadData();
  }, [filterActive]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const rulesData = await agentsService.getClassificationRules(
        filterActive !== null ? { isActive: filterActive } : undefined,
      );
      setRules(rulesData || []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("classificationRules.errors.loadFailed")));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    setMutatingId(id);
    try {
      if (isActive) {
        await agentsService.deactivateClassificationRule(id);
      } else {
        await agentsService.activateClassificationRule(id);
      }
      toast.success(t("classificationRules.messages.statusUpdated"));
      await loadData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("classificationRules.errors.statusFailed")));
    } finally {
      setMutatingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <SectionHeader title={t("classificationRules.title")} />
        <div>{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <SectionHeader title={t("classificationRules.title")} />

      <div className={styles.banner}>{t("classificationRules.info.metricsUnavailable")}</div>

      <div className={styles.listHeader}>
        <AgentActionButton icon={<Plus size={16} />} onClick={() => navigate("/agents/classification-rules/new")}>
          {t("classificationRules.actions.create")}
        </AgentActionButton>
        <div className={styles.filters}>
          <label>
            <input
              type="checkbox"
              checked={filterActive === true}
              onChange={() => setFilterActive(filterActive === true ? null : true)}
            />
            {t("classificationRules.filters.onlyActive")}
          </label>
        </div>
      </div>

      {rules.length === 0 ? (
        <div className={styles.empty}>{t("classificationRules.empty")}</div>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <div>{t("classificationRules.fields.name")}</div>
            <div>{t("classificationRules.fields.agentType")}</div>
            <div>{t("classificationRules.fields.priority")}</div>
            <div>{t("classificationRules.fields.conditions")}</div>
            <div>{t("common.active")}</div>
            <div>{t("common.actions")}</div>
          </div>
          {rules.map((rule) => (
            <div key={rule.id} className={styles.tableRow}>
              <div data-label={t("classificationRules.fields.name")}>{rule.name}</div>
              <div data-label={t("classificationRules.fields.agentType")}>{rule.agentTypeCode}</div>
              <div data-label={t("classificationRules.fields.priority")}>{rule.priority}</div>
              <div data-label={t("classificationRules.fields.conditions")}>{rule.conditions.length}</div>
              <div data-label={t("common.active")}>
                <span className={rule.isActive ? styles.badgeActive : styles.badgeInactive}>
                  {rule.isActive ? t("common.active") : t("common.inactive")}
                </span>
              </div>
              <div className={styles.actions} data-label={t("common.actions")}>
                <AgentIconButton
                  size="medium"
                  tone="secondary"
                  icon={<Pencil size={16} />}
                  ariaLabel={`${t("actions.edit")} ${rule.name}`}
                  title={t("actions.edit")}
                  onClick={() => navigate(`/agents/classification-rules/${rule.id}`)}
                />
                <AgentIconButton
                  size="medium"
                  tone={rule.isActive ? "danger" : "primary"}
                  icon={<Power size={16} />}
                  ariaLabel={`${t(rule.isActive ? "actions.deactivate" : "actions.activate")} ${rule.name}`}
                  title={t(rule.isActive ? "actions.deactivate" : "actions.activate")}
                  onClick={() => handleToggleStatus(rule.id, rule.isActive)}
                  disabled={mutatingId === rule.id}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassificationRules;
