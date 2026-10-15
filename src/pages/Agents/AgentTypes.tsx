import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Pencil, Plus, Power } from "lucide-react";

import { SectionHeader } from "@/components/common";
import { agentsService } from "@/services/agents";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import { getAgentTypeIcon, getAgentTypeColor } from "@/utils/agentTypeIcons";
import type { AgentTypeDto } from "@/types/agents";
import styles from "./Agents.module.css";
import { AgentActionButton, AgentIconButton } from "./AgentActionButton";

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
        <SectionHeader title={t("agentTypes.title")} />
        <div>{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <SectionHeader title={t("agentTypes.title")} />

      <div className={styles.listHeader}>
        <AgentActionButton icon={<Plus size={16} />} onClick={() => navigate("/agents/types/new")}>
          {t("agentTypes.actions.create")}
        </AgentActionButton>
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
                <div className={styles.agentTypeWithIcon} data-label={t("agentTypes.fields.code")}>
                  <IconComponent size={16} style={{ color: iconColor }} />
                  <span>{type.code}</span>
                </div>
                <div data-label={t("agentTypes.fields.name")}>{type.name}</div>
                <div data-label={t("agentTypes.fields.priority")}>{type.priority}</div>
                <div data-label={t("agentTypes.fields.system")}>{type.isSystem ? t("common.yes") : t("common.no")}</div>
                <div data-label={t("agentTypes.fields.active")}>
                  <span className={type.isActive ? styles.badgeActive : styles.badgeInactive}>
                    {type.isActive ? t("common.active") : t("common.inactive")}
                  </span>
                </div>
                <div className={styles.actions} data-label={t("common.actions")}>
                  <AgentIconButton
                    size="medium"
                    tone="secondary"
                    icon={<Pencil size={16} />}
                    ariaLabel={`${t("actions.edit")} ${type.code}`}
                    title={t("actions.edit")}
                    onClick={() => navigate(`/agents/types/${type.id}`)}
                  />
                  {type.code !== "NEW" && (
                    <AgentIconButton
                      size="medium"
                      tone={type.isActive ? "danger" : "primary"}
                      icon={<Power size={16} />}
                      ariaLabel={`${t(type.isActive ? "actions.deactivate" : "actions.activate")} ${type.code}`}
                      title={t(type.isActive ? "actions.deactivate" : "actions.activate")}
                      onClick={() => handleToggleStatus(type.id, type.isActive)}
                      disabled={mutatingId === type.id}
                    />
                  )}
                  {type.code === "NEW" && (
                    <AgentIconButton
                      size="medium"
                      tone="secondary"
                      icon={<Power size={16} />}
                      ariaLabel={t("agentTypes.messages.newCannotDeactivate")}
                      title={t("agentTypes.messages.newCannotDeactivate")}
                      disabled
                    />
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
