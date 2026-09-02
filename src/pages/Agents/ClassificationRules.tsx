import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { SectionHeader } from "@/components/common";
import { Button } from "@/ui-kit";
import { agentsService } from "@/services/agents";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { AgentClassificationRuleDto } from "@/types/agents";
import styles from "./Agents.module.css";

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
        <SectionHeader title={t("classificationRules.title")} goBack />
        <div>{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <SectionHeader title={t("classificationRules.title")} goBack />

      <div className={styles.banner}>{t("classificationRules.info.metricsUnavailable")}</div>

      <div className={styles.listHeader}>
        <Button onClick={() => navigate("/agent-classification-rules/new")}>
          {t("classificationRules.actions.create")}
        </Button>
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
              <div>{rule.name}</div>
              <div>{rule.agentTypeCode}</div>
              <div>{rule.priority}</div>
              <div>{rule.conditions.length}</div>
              <div>
                <span className={rule.isActive ? styles.badgeActive : styles.badgeInactive}>
                  {rule.isActive ? t("common.active") : t("common.inactive")}
                </span>
              </div>
              <div className={styles.actions}>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => navigate(`/agent-classification-rules/${rule.id}`)}
                >
                  {t("actions.edit")}
                </Button>
                <Button
                  variant={rule.isActive ? "danger" : "primary"}
                  size="small"
                  onClick={() => handleToggleStatus(rule.id, rule.isActive)}
                  disabled={mutatingId === rule.id}
                >
                  {rule.isActive ? t("actions.deactivate") : t("actions.activate")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassificationRules;
