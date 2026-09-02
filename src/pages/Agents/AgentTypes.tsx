import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { SectionHeader } from "@/components/common";
import { Button } from "@/ui-kit";
import { agentsService } from "@/services/agents";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import { getAgentTypeIcon, getAgentTypeColor } from "@/utils/agentTypeIcons";
import type { AgentTypeDto } from "@/types/agents";
import styles from "./Agents.module.css";

export const AgentTypes = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [types, setTypes] = useState<AgentTypeDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  useEffect(() => {
    void loadTypes();
  }, []);

  const loadTypes = async () => {
    setIsLoading(true);
    try {
      const data = await agentsService.getAgentTypes();
      setTypes(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("agentTypes.errors.loadFailed")));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    setMutatingId(id);
    try {
      if (isActive) {
        await agentsService.deactivateAgentType(id);
      } else {
        await agentsService.activateAgentType(id);
      }
      toast.success(t("agentTypes.messages.statusUpdated"));
      await loadTypes();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("agentTypes.errors.statusFailed")));
    } finally {
      setMutatingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <SectionHeader title={t("agentTypes.title")} goBack />
        <div>{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <SectionHeader title={t("agentTypes.title")} goBack />

      <div className={styles.listHeader}>
        <Button onClick={() => navigate("/agent-types/new")}>{t("agentTypes.actions.create")}</Button>
      </div>

      {types.length === 0 ? (
        <div className={styles.empty}>{t("agentTypes.empty")}</div>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <div>{t("agentTypes.fields.code")}</div>
            <div>{t("agentTypes.fields.name")}</div>
            <div>{t("agentTypes.fields.priority")}</div>
            <div>{t("agentTypes.fields.system")}</div>
            <div>{t("agentTypes.fields.active")}</div>
            <div>{t("common.actions")}</div>
          </div>
          {types.map((type) => {
            const IconComponent = getAgentTypeIcon(type.code);
            const iconColor = getAgentTypeColor(type.code);
            return (
              <div key={type.id} className={styles.tableRow}>
                <div className={styles.agentTypeWithIcon}>
                  <IconComponent size={16} style={{ color: iconColor }} />
                  <span>{type.code}</span>
                </div>
                <div>{type.name}</div>
                <div>{type.priority}</div>
                <div>{type.isSystem ? t("common.yes") : t("common.no")}</div>
                <div>
                  <span className={type.isActive ? styles.badgeActive : styles.badgeInactive}>
                    {type.isActive ? t("common.active") : t("common.inactive")}
                  </span>
                </div>
                <div className={styles.actions}>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => navigate(`/agent-types/${type.id}`)}
                  >
                    {t("actions.edit")}
                  </Button>
                  {type.code !== "NEW" && (
                    <Button
                      variant={type.isActive ? "danger" : "primary"}
                      size="small"
                      onClick={() => handleToggleStatus(type.id, type.isActive)}
                      disabled={mutatingId === type.id}
                    >
                      {type.isActive ? t("actions.deactivate") : t("actions.activate")}
                    </Button>
                  )}
                  {type.code === "NEW" && (
                    <Button variant="secondary" size="small" disabled title={t("agentTypes.messages.newCannotDeactivate")}>
                      {t("actions.deactivate")}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AgentTypes;
