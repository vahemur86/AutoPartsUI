import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { ChevronDown, Eye, Power } from "lucide-react";

import { DataTable } from "@/ui-kit";
import { SectionHeader } from "@/components/common";
import { Button, ConfirmationModal } from "@/ui-kit";
import { repaymentRulesService } from "@/services/repaymentRules";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { RepaymentRule } from "@/types/repaymentRules";
import styles from "./RepaymentRules.module.css";
import { AgentIconButton } from "@/pages/Agents/AgentActionButton";
import { AgentTableDetails } from "@/pages/Agents/AgentTableDetails";

const normalizeStatus = (status?: number | string | null) => {
  const value = String(status ?? "").trim().toLowerCase();

  if (["1", "active", "true", "enabled"].includes(value)) return "active";
  if (["0", "inactive", "false", "disabled"].includes(value)) return "inactive";

  return value;
};

const getStatusLabel = (status?: number | string | null) => {
  const normalized = normalizeStatus(status);

  if (normalized === "active") return "Active";
  if (normalized === "inactive") return "Inactive";

  return String(status ?? "Unknown");
};

export const RepaymentRules = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<RepaymentRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [confirm, setConfirm] = useState<{ open: boolean; rule?: RepaymentRule }>(
    { open: false },
  );

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await repaymentRulesService.getRepaymentRules();
      setItems(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("repaymentRules.errors.loadFailed")));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const columns = useMemo(
    () => [
      { accessorKey: "code", header: t("repaymentRules.fields.code") },
      { accessorKey: "name", header: t("repaymentRules.fields.name") },
      {
        accessorKey: "status",
        header: t("repaymentRules.fields.status"),
        cell: ({ row }: any) => {
          const status = row.original.status as number | string | null;
          const isActive = normalizeStatus(status) === "active";
          return (
            <span
              className={`${styles.statusBadge} ${
                isActive ? styles.statusActive : styles.statusInactive
              }`}
            >
              {getStatusLabel(status)}
            </span>
          );
        },
      },
      {
        accessorFn: (row: RepaymentRule) => (row.currentVersion ?? "—"),
        id: "currentVersion",
        header: t("repaymentRules.fields.currentVersion"),
      },
      {
        id: "actions",
        header: t("repaymentRules.fields.actions"),
        cell: ({ row }: any) => {
          const r: RepaymentRule = row.original;
          const isActive = normalizeStatus(r.status) === "active";
          return (
            <div className={styles.actionsRow}>
              <AgentIconButton
                size="medium"
                tone="secondary"
                icon={<ChevronDown size={16} />}
                ariaLabel={`${t("common.details")} ${r.name}`}
                title={t("common.details")}
                aria-expanded={row.getIsExpanded()}
                onClick={row.getToggleExpandedHandler()}
              />
              <AgentIconButton
                size="medium"
                tone="primary"
                icon={<Eye size={16} />}
                ariaLabel={`${t("repaymentRules.actions.view")} ${r.name}`}
                title={t("repaymentRules.actions.view")}
                onClick={() => navigate(`/agents/cash-powder/rules/${r.id}`)}
              />
              <AgentIconButton
                size="medium"
                tone={isActive ? "danger" : "primary"}
                icon={<Power size={16} />}
                ariaLabel={`${t(isActive ? "repaymentRules.actions.deactivate" : "repaymentRules.actions.activate")} ${r.name}`}
                title={t(isActive ? "repaymentRules.actions.deactivate" : "repaymentRules.actions.activate")}
                disabled={isMutating}
                onClick={() => {
                  if (isActive) {
                    setConfirm({ open: true, rule: r });
                    return;
                  }

                  void (async () => {
                    try {
                      setIsMutating(true);
                      await repaymentRulesService.activateRepaymentRule(r.id);
                      toast.success(t("repaymentRules.messages.activated"));
                      await load();
                    } catch (error) {
                      toast.error(getApiErrorMessage(error, t("repaymentRules.errors.activateFailed")));
                    } finally {
                      setIsMutating(false);
                    }
                  })();
                }}
              />
            </div>
          );
        },
      },
    ],
    [navigate, t],
  );

  const handleDeactivate = async () => {
    if (!confirm.rule) return;
    try {
      setIsMutating(true);
      await repaymentRulesService.deactivateRepaymentRule(confirm.rule.id);
      toast.success(t("repaymentRules.messages.deactivated"));
      setConfirm({ open: false });
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("repaymentRules.errors.deactivateFailed")));
    } finally {
      setIsMutating(false);
    }
  };

  const activeCount = items.filter((item) => normalizeStatus(item.status) === "active").length;

  return (
    <div className={styles.page}>
      <SectionHeader
        title={t("repaymentRules.title")}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={() => navigate(`/agents/cash-powder/rules/create`)}>
              {t("repaymentRules.create")}
            </Button>
          </div>
        }
      />

      <div className={styles.summaryCard}>
        <div>
          <div className={styles.summaryLabel}>{t("repaymentRules.summary.total")}</div>
          <div className={styles.summaryValue}>{items.length}</div>
        </div>
        <div>
          <div className={styles.summaryLabel}>{t("repaymentRules.summary.active")}</div>
          <div className={styles.summaryValue}>{activeCount}</div>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <DataTable
          columns={columns as any}
          data={items}
          isLoading={isLoading}
          fitContainer
          renderSubComponent={({ row }) => (
            <AgentTableDetails
              fields={[
                { label: t("repaymentRules.fields.createdAt"), value: row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : "—" },
                { label: t("repaymentRules.fields.currentVersion"), value: row.original.currentVersion ?? "—" },
              ]}
            />
          )}
          noResultsText={t("repaymentRules.noRules")}
          loadingText={t("repaymentRules.loadingRules")}
        />
      </div>

      <ConfirmationModal
        open={confirm.open}
        onOpenChange={(open) => { if (!open) setConfirm({ open: false }); }}
        title={t("repaymentRules.confirm.deactivateTitle")}
        description={t("repaymentRules.confirm.deactivateDescription", { name: confirm.rule?.name || "" })}
        onConfirm={handleDeactivate}
        onCancel={() => setConfirm({ open: false })}
        confirmLoading={isMutating}
      />
    </div>
  );
};

export default RepaymentRules;
