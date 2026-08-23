import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { DataTable } from "@/ui-kit";
import { SectionHeader } from "@/components/common";
import { Button, ConfirmationModal } from "@/ui-kit";
import { repaymentRulesService } from "@/services/repaymentRules";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { RepaymentRule } from "@/types/repaymentRules";

export const RepaymentRules = () => {
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
      toast.error(getApiErrorMessage(error, "Failed to load rules"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const columns = useMemo(
    () => [
      { accessorKey: "code", header: "Code" },
      { accessorKey: "name", header: "Name" },
      { accessorKey: "status", header: "Status" },
      {
        accessorFn: (row: RepaymentRule) => (row.currentVersion ?? "—"),
        id: "currentVersion",
        header: "Current Version",
      },
      { accessorKey: "createdAt", header: "Created At" },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: any) => {
          const r: RepaymentRule = row.original;
          return (
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="secondary" size="small" onClick={() => navigate(`/repayment-rules/${r.id}`)}>
                View
              </Button>
              {r.status === "Active" ? (
                <Button
                  variant="danger"
                  size="small"
                  onClick={() => setConfirm({ open: true, rule: r })}
                >
                  Deactivate
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="small"
                  onClick={async () => {
                    try {
                      setIsMutating(true);
                      await repaymentRulesService.activateRepaymentRule(r.id);
                      toast.success("Rule activated");
                      load();
                    } catch (error) {
                      toast.error(getApiErrorMessage(error, "Failed to activate rule"));
                    } finally {
                      setIsMutating(false);
                    }
                  }}
                >
                  Activate
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [navigate],
  );

  const handleDeactivate = async () => {
    if (!confirm.rule) return;
    try {
      setIsMutating(true);
      await repaymentRulesService.deactivateRepaymentRule(confirm.rule.id);
      toast.success("Rule deactivated");
      setConfirm({ open: false });
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to deactivate rule"));
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="Repayment Rules"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={() => navigate(`/repayment-rules/create`)}>
              Create Repayment Rule
            </Button>
          </div>
        }
      />

      <div style={{ marginTop: 16 }}>
        <DataTable
          columns={columns as any}
          data={items}
          isLoading={isLoading}
          noResultsText={"No repayment rules found."}
          loadingText={"Loading Rules..."}
        />
      </div>

      <ConfirmationModal
        open={confirm.open}
        onOpenChange={(open) => { if (!open) setConfirm({ open: false }); }}
        title="Confirm Deactivate"
        description={`Are you sure you want to deactivate rule ${confirm.rule?.name || ""}?`}
        onConfirm={handleDeactivate}
        onCancel={() => setConfirm({ open: false })}
        confirmLoading={isMutating}
      />
    </div>
  );
};

export default RepaymentRules;
