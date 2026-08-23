import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { SectionHeader } from "@/components/common";
import { Button, TextField } from "@/ui-kit";
import { repaymentRulesService } from "@/services/repaymentRules";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { CreateRepaymentRuleVersionRequest } from "@/types/repaymentRules";

export const CreateRepaymentRuleVersion = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [debtRepaymentPercent, setDebtRepaymentPercent] = useState<string>("");
  const [agentPayoutPercent, setAgentPayoutPercent] = useState<string>("");
  const [excessBusinessPercent, setExcessBusinessPercent] = useState<string>("100");
  const [excessAgentPercent, setExcessAgentPercent] = useState<string>("0");
  const [defaultRepaymentPeriodDays, setDefaultRepaymentPeriodDays] = useState<string>("90");
  const [maximumExtensions, setMaximumExtensions] = useState<string>("0");
  const [effectiveFrom, setEffectiveFrom] = useState<string>(new Date().toISOString());
  const [effectiveTo, setEffectiveTo] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const d = parseFloat(debtRepaymentPercent || "0");
    const a = parseFloat(agentPayoutPercent || "0");
    const eb = parseFloat(excessBusinessPercent || "0");
    const ea = parseFloat(excessAgentPercent || "0");

    if (isNaN(d) || d < 0 || d > 100) e.debt = "Debt Repayment % must be between 0 and 100";
    if (isNaN(a) || a < 0 || a > 100) e.agent = "Agent Payout % must be between 0 and 100";
    if (Math.abs(d + a - 100) > 0.0001) e.total = "Debt Repayment % + Agent Payout % must equal 100%";

    if (isNaN(eb) || eb < 0 || eb > 100) e.eb = "Business % must be between 0 and 100";
    if (isNaN(ea) || ea < 0 || ea > 100) e.ea = "Agent % must be between 0 and 100";
    if (Math.abs(eb + ea - 100) > 0.0001) e.excesstotal = "Business % + Agent % must equal 100%";

    const from = new Date(effectiveFrom);
    if (!effectiveFrom || Number.isNaN(from.getTime())) e.from = "Effective From is required";
    if (effectiveTo) {
      const to = new Date(effectiveTo);
      if (Number.isNaN(to.getTime())) e.to = "Effective To is invalid";
      if (from >= to) e.dates = "Effective From must be before Effective To";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!id) return;
    if (!validate()) return;
    setIsSubmitting(true);
    const payload: CreateRepaymentRuleVersionRequest = {
      debtRepaymentPercent: parseFloat(debtRepaymentPercent),
      agentPayoutPercent: parseFloat(agentPayoutPercent),
      excessBusinessPercent: parseFloat(excessBusinessPercent),
      excessAgentPercent: parseFloat(excessAgentPercent),
      defaultRepaymentPeriodDays: parseInt(defaultRepaymentPeriodDays, 10),
      maximumExtensions: parseInt(maximumExtensions, 10),
      effectiveFrom,
      effectiveTo: effectiveTo || undefined,
      notes: notes || undefined,
    };

    try {
      const created = await repaymentRulesService.createRepaymentRuleVersion(id, payload);
      toast.success("Version created");
      navigate(`/repayment-rules/versions/${created.id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to create version"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <SectionHeader title="Create Repayment Rule Version" goBack />

      <div style={{ marginTop: 16, maxWidth: 720 }}>
        <div style={{ marginBottom: 12 }}>
          <label>Debt Repayment %</label>
          <TextField value={debtRepaymentPercent} onChange={(e) => setDebtRepaymentPercent(e.target.value)} />
          {errors.debt && <div style={{ color: "var(--danger)" }}>{errors.debt}</div>}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Agent Payout %</label>
          <TextField value={agentPayoutPercent} onChange={(e) => setAgentPayoutPercent(e.target.value)} />
          {errors.agent && <div style={{ color: "var(--danger)" }}>{errors.agent}</div>}
        </div>

        {errors.total && <div style={{ color: "var(--danger)", marginBottom: 8 }}>{errors.total}</div>}

        <div style={{ marginBottom: 12 }}>
          <label>Excess Business %</label>
          <TextField value={excessBusinessPercent} onChange={(e) => setExcessBusinessPercent(e.target.value)} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Excess Agent %</label>
          <TextField value={excessAgentPercent} onChange={(e) => setExcessAgentPercent(e.target.value)} />
        </div>

        {errors.excesstotal && <div style={{ color: "var(--danger)", marginBottom: 8 }}>{errors.excesstotal}</div>}

        <div style={{ marginBottom: 12 }}>
          <label>Default Repayment Period (days)</label>
          <TextField value={defaultRepaymentPeriodDays} onChange={(e) => setDefaultRepaymentPeriodDays(e.target.value)} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Maximum Extensions</label>
          <TextField value={maximumExtensions} onChange={(e) => setMaximumExtensions(e.target.value)} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Effective From</label>
          <TextField value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
          {errors.from && <div style={{ color: "var(--danger)" }}>{errors.from}</div>}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Effective To (optional)</label>
          <TextField value={effectiveTo || ""} onChange={(e) => setEffectiveTo(e.target.value || undefined)} />
          {errors.to && <div style={{ color: "var(--danger)" }}>{errors.to}</div>}
          {errors.dates && <div style={{ color: "var(--danger)" }}>{errors.dates}</div>}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Notes</label>
          <TextField value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create Version"}</Button>
        </div>
      </div>
    </div>
  );
};

export default CreateRepaymentRuleVersion;
