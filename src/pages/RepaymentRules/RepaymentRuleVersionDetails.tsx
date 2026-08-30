import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { SectionHeader } from "@/components/common";
import { repaymentRulesService } from "@/services/repaymentRules";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { RepaymentRuleVersion } from "@/types/repaymentRules";

export const RepaymentRuleVersionDetails = () => {
  const { t } = useTranslation();
  const { versionId } = useParams();
  const [version, setVersion] = useState<RepaymentRuleVersion | null>(null);

  const load = async () => {
    if (!versionId) return;
    try {
      const v = await repaymentRulesService.getRepaymentRuleVersion(versionId);
      setVersion(v);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("repaymentRules.errors.versionLoadFailed")));
    }
  };

  useEffect(() => {
    load();
  }, [versionId]);

  if (!version) {
    return (
      <div>
        <SectionHeader title={t("repaymentRules.versionTitle")} goBack />
        <div style={{ marginTop: 16 }}>{t("repaymentRules.loadingVersion")}</div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title={`${t("repaymentRules.versionTitle")} ${version.version}`} goBack />

      <div style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 8 }}>
          <strong>{t("repaymentRules.fields.status")}:</strong> {version.status}
        </div>

        <div style={{ marginBottom: 8 }}>
          <strong>{t("repaymentRules.fields.debtRepaymentPercent")}:</strong> {version.debtRepaymentPercent}%
        </div>

        <div style={{ marginBottom: 8 }}>
          <strong>{t("repaymentRules.fields.agentPayoutPercent")}:</strong> {version.agentPayoutPercent}%
        </div>

        <div style={{ marginBottom: 8 }}>
          <strong>{t("repaymentRules.fields.excessBusinessPercent")}:</strong> {version.excessBusinessPercent}%
        </div>

        <div style={{ marginBottom: 8 }}>
          <strong>{t("repaymentRules.fields.excessAgentPercent")}:</strong> {version.excessAgentPercent}%
        </div>

        <div style={{ marginBottom: 8 }}>
          <strong>{t("repaymentRules.fields.defaultRepaymentPeriodDays")}:</strong> {version.defaultRepaymentPeriodDays} {t("repaymentRules.fields.days")}
        </div>

        <div style={{ marginBottom: 8 }}>
          <strong>{t("repaymentRules.fields.maximumExtensions")}:</strong> {version.maximumExtensions}
        </div>

        <div style={{ marginBottom: 8 }}>
          <strong>{t("repaymentRules.fields.effectiveFrom")}:</strong> {version.effectiveFrom}
        </div>

        <div style={{ marginBottom: 8 }}>
          <strong>{t("repaymentRules.fields.effectiveTo")}:</strong> {version.effectiveTo ?? "—"}
        </div>

        <div style={{ marginTop: 12 }}>
          <strong>{t("repaymentRules.fields.notes")}:</strong>
          <div>{version.notes ?? "—"}</div>
        </div>
      </div>
    </div>
  );
};

export default RepaymentRuleVersionDetails;
