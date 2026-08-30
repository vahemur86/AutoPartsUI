import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { SectionHeader } from "@/components/common";
import { Button, DataTable, ConfirmationModal } from "@/ui-kit";
import { repaymentRulesService } from "@/services/repaymentRules";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { RepaymentRuleVersion, RepaymentRule } from "@/types/repaymentRules";

const normalizeStatus = (status?: number | string | null) => {
  const value = String(status ?? "").trim().toLowerCase();

  if (["0", "draft", "new", "pending", "inactive", "false", "disabled"].includes(value)) return "draft";
  if (["1", "active", "enabled", "true"].includes(value)) return "active";
  if (["2", "expired", "finished", "ended"].includes(value)) return "expired";

  return value;
};

const getStatusLabel = (status?: number | string | null) => {
  const normalized = normalizeStatus(status);

  if (normalized === "draft") return "Draft";
  if (normalized === "active") return "Active";
  if (normalized === "expired") return "Expired";

  return String(status ?? "Unknown");
};

export const RepaymentRuleDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [rule, setRule] = useState<RepaymentRule | null>(null);
  const [versions, setVersions] = useState<RepaymentRuleVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [confirmExpire, setConfirmExpire] = useState<{ open: boolean; version?: RepaymentRuleVersion }>({ open: false });

  const load = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [r, v] = await Promise.all([
        repaymentRulesService.getRepaymentRule(id),
        repaymentRulesService.getRepaymentRuleVersions(id),
      ]);
      setRule(r);
      setVersions(v || []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("repaymentRules.errors.loadFailed")));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const columns = [
    { accessorKey: "version", header: t("repaymentRules.fields.version") },
    {
      accessorKey: "status",
      header: t("repaymentRules.fields.status"),
      cell: ({ row }: any) => getStatusLabel(row.original.status),
    },
    {
      accessorFn: (row: RepaymentRuleVersion) => `${row.debtRepaymentPercent}% / ${row.agentPayoutPercent}%`,
      id: "distribution",
      header: t("repaymentRules.fields.distribution"),
    },
    { accessorKey: "defaultRepaymentPeriodDays", header: t("repaymentRules.fields.periodDays") },
    { accessorKey: "maximumExtensions", header: t("repaymentRules.fields.extensions") },
    {
      id: "actions",
      header: t("repaymentRules.fields.actions"),
      cell: ({ row }: any) => {
        const v: RepaymentRuleVersion = row.original;
        const isDraft = normalizeStatus(v.status) === "draft";
        const isActive = normalizeStatus(v.status) === "active";
        return (
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" size="small" onClick={() => navigate(`/settings/repayment-rules/versions/${v.id}`)}>{t("repaymentRules.actions.view")}</Button>
            {isDraft && (
              <Button variant="primary" size="small" onClick={async () => {
                try {
                  setIsMutating(true);
                  await repaymentRulesService.activateRepaymentRuleVersion(v.id);
                  toast.success(t("repaymentRules.messages.versionActivated"));
                  load();
                } catch (error) {
                  toast.error(getApiErrorMessage(error, t("repaymentRules.errors.activateFailed")));
                } finally {
                  setIsMutating(false);
                }
              }}>{t("repaymentRules.actions.activate")}</Button>
            )}
            {isActive && (
              <Button variant="danger" size="small" onClick={() => setConfirmExpire({ open: true, version: v })}>{t("repaymentRules.actions.expire")}</Button>
            )}
          </div>
        );
      },
    },
  ];

  const handleExpire = async () => {
    if (!confirmExpire.version) return;
    try {
      setIsMutating(true);
      await repaymentRulesService.expireRepaymentRuleVersion(confirmExpire.version.id);
      toast.success(t("repaymentRules.messages.versionExpired"));
      setConfirmExpire({ open: false });
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("repaymentRules.errors.expireFailed")));
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div>
      <SectionHeader title={rule ? `${rule.name} — ${rule.code}` : t("repaymentRules.title")} goBack />

      <div style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <strong>{t("repaymentRules.fields.status")}:</strong> {rule ? getStatusLabel(rule.status) : "—"}
        </div>

        <div style={{ marginBottom: 12 }}>
          <strong>{t("repaymentRules.fields.currentVersion")}:</strong> {rule?.currentVersion ?? "—"}
        </div>

        <div style={{ marginBottom: 12 }}>
          <Button onClick={() => navigate(`/settings/repayment-rules/${id}/versions/create`)}>{t("repaymentRules.actions.createVersion")}</Button>
        </div>

        <div style={{ marginTop: 16 }}>
          <h3>{t("repaymentRules.section.versionHistory")}</h3>
          <DataTable columns={columns as any} data={versions} isLoading={isLoading} noResultsText={t("repaymentRules.noVersions")} loadingText={t("repaymentRules.loadingVersions")} />
        </div>
      </div>

      <ConfirmationModal
        open={confirmExpire.open}
        onOpenChange={(open) => { if (!open) setConfirmExpire({ open: false }); }}
        title={t("repaymentRules.confirm.expireTitle")}
        description={t("repaymentRules.confirm.expireDescription", { version: confirmExpire.version?.version ?? "" })}
        onConfirm={handleExpire}
        onCancel={() => setConfirmExpire({ open: false })}
        confirmLoading={isMutating}
      />
    </div>
  );
};

export default RepaymentRuleDetails;
