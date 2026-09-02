import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { DataTable } from "@/ui-kit";
import { SectionHeader } from "@/components/common";
import { Button, ConfirmationModal } from "@/ui-kit";
import { repaymentRulesService } from "@/services/repaymentRules";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { RepaymentRule } from "@/types/repaymentRules";
import styles from "./RepaymentRules.module.css";

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
      { accessorKey: "createdAt", header: t("repaymentRules.fields.createdAt") },
      {
        id: "actions",
        header: t("repaymentRules.fields.actions"),
        cell: ({ row }: any) => {
          const r: RepaymentRule = row.original;
          const isActive = normalizeStatus(r.status) === "active";
          return (
            <div className={styles.actionsRow}>
              <Button variant="secondary" size="small" onClick={() => navigate(`/agents/repayment-rules/${r.id}`)}>
                {t("repaymentRules.actions.view")}
              </Button>
              {isActive ? (
                <Button
                  variant="danger"
                  size="small"
                  onClick={() => setConfirm({ open: true, rule: r })}
                >
                  {t("repaymentRules.actions.deactivate")}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="small"
                  onClick={async () => {
                    try {
                      setIsMutating(true);
                      await repaymentRulesService.activateRepaymentRule(r.id);
                      toast.success(t("repaymentRules.messages.activated"));
                      load();
                    } catch (error) {
                      toast.error(getApiErrorMessage(error, t("repaymentRules.errors.activateFailed")));
                    } finally {
                      setIsMutating(false);
                    }
                  }}
                >
                  {t("repaymentRules.actions.activate")}
                </Button>
              )}
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
            <Button onClick={() => navigate(`/agents/repayment-rules/create`)}>
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
