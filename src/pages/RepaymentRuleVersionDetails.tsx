import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { SectionHeader } from "@/components/common";
import { Button } from "@/ui-kit";
import { repaymentRulesService } from "@/services/repaymentRules";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { RepaymentRuleVersion } from "@/types/repaymentRules";

export const RepaymentRuleVersionDetails = () => {
  const { versionId } = useParams();
  const [version, setVersion] = useState<RepaymentRuleVersion | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    if (!versionId) return;
    setIsLoading(true);
    try {
      const v = await repaymentRulesService.getRepaymentRuleVersion(versionId);
      setVersion(v);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load version"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [versionId]);

  if (!version) {
    return (
      <div>
        <SectionHeader title="Version" goBack />
        <div style={{ marginTop: 16 }}>Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title={`Version ${version.version}`} goBack />

      <div style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 8 }}>
          <strong>Status:</strong> {version.status}
        </div>

        <div style={{ marginBottom: 8 }}>
          <strong>Debt Repayment:</strong> {version.debtRepaymentPercent}%
        </div>

        <div style={{ marginBottom: 8 }}>
          <strong>Agent Payout:</strong> {version.agentPayoutPercent}%
        </div>

        <div style={{ marginBottom: 8 }}>
          <strong>Excess Business:</strong> {version.excessBusinessPercent}%
        </div>

        <div style={{ marginBottom: 8 }}>
          <strong>Excess Agent:</strong> {version.excessAgentPercent}%
        </div>

        <div style={{ marginBottom: 8 }}>
          <strong>Repayment Period:</strong> {version.defaultRepaymentPeriodDays} days
        </div>

        <div style={{ marginBottom: 8 }}>
          <strong>Maximum Extensions:</strong> {version.maximumExtensions}
        </div>

        <div style={{ marginBottom: 8 }}>
          <strong>Effective From:</strong> {version.effectiveFrom}
        </div>

        <div style={{ marginBottom: 8 }}>
          <strong>Effective To:</strong> {version.effectiveTo ?? "—"}
        </div>

        <div style={{ marginTop: 12 }}>
          <strong>Notes:</strong>
          <div>{version.notes ?? "—"}</div>
        </div>
      </div>
    </div>
  );
};

export default RepaymentRuleVersionDetails;
