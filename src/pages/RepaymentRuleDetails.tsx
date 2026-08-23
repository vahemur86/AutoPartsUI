import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { SectionHeader } from "@/components/common";
import { Button, DataTable, ConfirmationModal } from "@/ui-kit";
import { repaymentRulesService } from "@/services/repaymentRules";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { RepaymentRuleVersion, RepaymentRule } from "@/types/repaymentRules";

export const RepaymentRuleDetails = () => {
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
      toast.error(getApiErrorMessage(error, "Failed to load rule"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const columns = [
    { accessorKey: "version", header: "Version" },
    { accessorKey: "status", header: "Status" },
    {
      accessorFn: (row: RepaymentRuleVersion) => `${row.debtRepaymentPercent}% / ${row.agentPayoutPercent}%`,
      id: "distribution",
      header: "Distribution",
    },
    { accessorKey: "defaultRepaymentPeriodDays", header: "Period (days)" },
    { accessorKey: "maximumExtensions", header: "Extensions" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => {
        const v: RepaymentRuleVersion = row.original;
        return (
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" size="small" onClick={() => navigate(`/repayment-rules/versions/${v.id}`)}>View</Button>
            {v.status === "Draft" && (
              <Button variant="primary" size="small" onClick={async () => {
                // activate draft
                try {
                  setIsMutating(true);
                  await repaymentRulesService.activateRepaymentRuleVersion(v.id);
                  toast.success("Version activated");
                  load();
                } catch (error) {
                  toast.error(getApiErrorMessage(error, "Failed to activate version"));
                } finally {
                  setIsMutating(false);
                }
              }}>Activate</Button>
            )}
            {v.status === "Active" && (
              <Button variant="danger" size="small" onClick={() => setConfirmExpire({ open: true, version: v })}>Expire</Button>
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
      toast.success("Version expired");
      setConfirmExpire({ open: false });
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to expire version"));
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div>
      <SectionHeader title={rule ? `${rule.name} — ${rule.code}` : "Repayment Rule"} goBack />

      <div style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <strong>Status:</strong> {rule?.status ?? "—"}
        </div>

        <div style={{ marginBottom: 12 }}>
          <strong>Current Version:</strong> {rule?.currentVersion ?? "—"}
        </div>

        <div style={{ marginBottom: 12 }}>
          <Button onClick={() => navigate(`/repayment-rules/${id}/versions/create`)}>Create Version</Button>
        </div>

        <div style={{ marginTop: 16 }}>
          <h3>Version History</h3>
          <DataTable columns={columns as any} data={versions} isLoading={isLoading} noResultsText={"No versions have been created for this rule."} loadingText={"Loading Versions..."} />
        </div>
      </div>

      <ConfirmationModal
        open={confirmExpire.open}
        onOpenChange={(open) => { if (!open) setConfirmExpire({ open: false }); }}
        title="Confirm Expire"
        description={`Are you sure you want to expire Version ${confirmExpire.version?.version ?? ""}? This cannot be undone.`}
        onConfirm={handleExpire}
        onCancel={() => setConfirmExpire({ open: false })}
        confirmLoading={isMutating}
      />
    </div>
  );
};

export default RepaymentRuleDetails;
