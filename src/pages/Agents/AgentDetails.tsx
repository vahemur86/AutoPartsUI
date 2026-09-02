import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { SectionHeader } from "@/components/common";
import { Button, DataTable, ConfirmationModal } from "@/ui-kit";
import { agentsService } from "@/services/agents";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import { AgentStatus } from "@/types/agents";
import type { AgentDto } from "@/types/agents";
import styles from "./Agents.module.css";

const getStatusLabel = (status?: number | string | null) => {
  switch (Number(status ?? 0)) {
    case AgentStatus.Active:
      return "Active";
    case AgentStatus.Inactive:
      return "Inactive";
    case AgentStatus.Suspended:
      return "Suspended";
    case AgentStatus.Blocked:
      return "Blocked";
    default:
      return "Unknown";
  }
};

const getStatusClass = (status?: number | string | null) => {
  switch (Number(status ?? 0)) {
    case AgentStatus.Active:
      return styles.statusActive;
    case AgentStatus.Inactive:
      return styles.statusInactive;
    case AgentStatus.Suspended:
      return styles.statusSuspended;
    case AgentStatus.Blocked:
      return styles.statusBlocked;
    default:
      return styles.statusInactive;
  }
};

const AGENT_STATUS_TRANSITIONS: Record<number, number[]> = {
  [AgentStatus.Active]: [AgentStatus.Inactive, AgentStatus.Suspended, AgentStatus.Blocked],
  [AgentStatus.Inactive]: [AgentStatus.Active],
  [AgentStatus.Suspended]: [AgentStatus.Active],
  [AgentStatus.Blocked]: [AgentStatus.Active],
};

export const AgentDetails = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [agent, setAgent] = useState<AgentDto | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; status: number } | null>(null);

  const load = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [agentData, historyData] = await Promise.all([
        agentsService.getAgent(id),
        agentsService.getAgentTypeHistory(id),
      ]);
      setAgent(agentData);
      setHistory(historyData || []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("agents.errors.loadFailed")));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const handleStatusChange = async (nextStatus: number) => {
    // Show confirmation for sensitive actions
    if (nextStatus === AgentStatus.Suspended || nextStatus === AgentStatus.Blocked) {
      setConfirmAction({ type: "status", status: nextStatus });
      return;
    }

    if (!agent) return;
    try {
      setIsMutating(true);
      if (nextStatus === AgentStatus.Active) await agentsService.activateAgent(agent.id);
      if (nextStatus === AgentStatus.Inactive) await agentsService.deactivateAgent(agent.id);
      toast.success(t("agents.messages.statusUpdated"));
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("agents.errors.statusFailed")));
    } finally {
      setIsMutating(false);
    }
  };

  const confirmStatusChange = async () => {
    if (!confirmAction || !agent) return;
    
    try {
      setIsMutating(true);
      if (confirmAction.status === AgentStatus.Suspended) await agentsService.suspendAgent(agent.id);
      if (confirmAction.status === AgentStatus.Blocked) await agentsService.blockAgent(agent.id);
      toast.success(t("agents.messages.statusUpdated"));
      setConfirmAction(null);
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("agents.errors.statusFailed")));
    } finally {
      setIsMutating(false);
    }
  };

  const historyColumns = [
    { accessorKey: "changedAt", header: t("agents.history.date") },
    {
      accessorFn: (row: any) => {
        const prev = row.previousType?.code ?? "Initial";
        const next = row.newType?.code ?? "—";
        return `${prev} → ${next}`;
      },
      id: "transition",
      header: t("agents.history.transition"),
    },
    { accessorKey: "reason", header: t("agents.history.reason") },
    { accessorKey: "changedBy", header: t("agents.history.changedBy") },
  ];

  if (!agent) {
    return (
      <div className={styles.page}>
        <SectionHeader title={t("agents.title")} goBack />
        <div className={styles.banner}>{t("agents.loading")}</div>
      </div>
    );
  }

  const currentStatus = Number(agent.status ?? 0);
  const allowedNext = AGENT_STATUS_TRANSITIONS[currentStatus] ?? [];

  return (
    <div className={styles.page}>
      <SectionHeader title={`${agent.code} — ${agent.firstName} ${agent.lastName}`} goBack />

      <div className={styles.detailHeader}>
        <span className={`${styles.statusBadge} ${getStatusClass(agent.status)}`}>
          {getStatusLabel(agent.status)}
        </span>
        <span className={styles.typeBadge}>{agent.agentType?.code ?? "NEW"}</span>
      </div>

      <div className={styles.actionRow}>
        <Button variant="secondary" size="small" onClick={() => navigate(`/agents/${agent.id}/edit`)}>
          {t("common.edit")}
        </Button>
        {allowedNext.includes(AgentStatus.Active) && (
          <Button variant="primary" size="small" onClick={() => handleStatusChange(AgentStatus.Active)} disabled={isMutating}>
            {t("agents.actions.activate")}
          </Button>
        )}
        {allowedNext.includes(AgentStatus.Inactive) && (
          <Button variant="secondary" size="small" onClick={() => handleStatusChange(AgentStatus.Inactive)} disabled={isMutating}>
            {t("agents.actions.deactivate")}
          </Button>
        )}
        {allowedNext.includes(AgentStatus.Suspended) && (
          <Button variant="secondary" size="small" onClick={() => handleStatusChange(AgentStatus.Suspended)} disabled={isMutating}>
            {t("agents.actions.suspend")}
          </Button>
        )}
        {allowedNext.includes(AgentStatus.Blocked) && (
          <Button variant="danger" size="small" onClick={() => handleStatusChange(AgentStatus.Blocked)} disabled={isMutating}>
            {t("agents.actions.block")}
          </Button>
        )}
        <Button variant="secondary" size="small" onClick={() => navigate(`/agents/${agent.id}/classify`)}>
          {t("agents.actions.classify")}
        </Button>
        <Button variant="secondary" size="small" onClick={() => navigate(`/agents/${agent.id}/powder-deliveries`)}>
          Powder Deliveries
        </Button>
      </div>

      <div className={styles.detailsGrid}>
        <div className={styles.infoCard}>
          <h3>{t("agents.details.title")}</h3>
          <div className={styles.detailRow}><strong>{t("agents.fields.code")}:</strong> {agent.code}</div>
          <div className={styles.detailRow}><strong>{t("agents.fields.fullName")}:</strong> {agent.firstName} {agent.lastName}</div>
          <div className={styles.detailRow}><strong>{t("agents.fields.phone")}:</strong> {agent.phone}</div>
          <div className={styles.detailRow}><strong>{t("agents.fields.email")}:</strong> {agent.email ?? "—"}</div>
          <div className={styles.detailRow}><strong>{t("agents.fields.address")}:</strong> {agent.address ?? "—"}</div>
          <div className={styles.detailRow}><strong>{t("agents.fields.registrationDate")}:</strong> {agent.registrationDate}</div>
          <div className={styles.detailRow}><strong>{t("agents.fields.notes")}:</strong> {agent.notes ?? "—"}</div>
          <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div className={styles.detailRow}><strong>{t("common.createdAt")}:</strong> {agent.createdAt}</div>
            <div className={styles.detailRow}><strong>Created by:</strong> {agent.createdBy}</div>
            {agent.updatedAt && <div className={styles.detailRow}><strong>Updated at:</strong> {agent.updatedAt}</div>}
            {agent.updatedBy && <div className={styles.detailRow}><strong>Updated by:</strong> {agent.updatedBy}</div>}
          </div>
        </div>

        <div className={styles.infoCard}>
          <h3>{t("agents.history.title")}</h3>
          <DataTable columns={historyColumns as any} data={history} isLoading={isLoading} noResultsText={t("agents.history.empty")} loadingText={t("agents.loading")} />
        </div>
      </div>

      {confirmAction && (
        <ConfirmationModal
          open={!!confirmAction}
          onOpenChange={(open) => !open && setConfirmAction(null)}
          title={
            confirmAction.status === AgentStatus.Suspended
              ? t("agents.actions.suspend")
              : t("agents.actions.block")
          }
          description={
            confirmAction.status === AgentStatus.Suspended
              ? t("agents.messages.suspendConfirm")
              : t("agents.messages.blockConfirm")
          }
          onConfirm={confirmStatusChange}
          onCancel={() => setConfirmAction(null)}
          confirmLoading={isMutating}
        />
      )}
    </div>
  );
};

export default AgentDetails;
