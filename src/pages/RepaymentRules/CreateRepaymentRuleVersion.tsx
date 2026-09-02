import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { SectionHeader } from "@/components/common";
import { Button, TextField, Textarea } from "@/ui-kit";
import { repaymentRulesService } from "@/services/repaymentRules";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { CreateRepaymentRuleVersionRequest } from "@/types/repaymentRules";
import styles from "./RepaymentRules.module.css";

export const CreateRepaymentRuleVersion = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
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

    if (isNaN(d) || d < 0 || d > 100) e.debt = t("repaymentRules.validation.percentRange");
    if (isNaN(a) || a < 0 || a > 100) e.agent = t("repaymentRules.validation.percentRange");
    if (Math.abs(d + a - 100) > 0.0001) e.total = t("repaymentRules.validation.debtAgentTotal");

    if (isNaN(eb) || eb < 0 || eb > 100) e.eb = t("repaymentRules.validation.percentRange");
    if (isNaN(ea) || ea < 0 || ea > 100) e.ea = t("repaymentRules.validation.percentRange");
    if (Math.abs(eb + ea - 100) > 0.0001) e.excesstotal = t("repaymentRules.validation.excessTotal");

    const from = new Date(effectiveFrom);
    if (!effectiveFrom || Number.isNaN(from.getTime())) e.from = t("repaymentRules.validation.requiredFrom");
    if (effectiveTo) {
      const to = new Date(effectiveTo);
      if (Number.isNaN(to.getTime())) e.to = t("repaymentRules.validation.invalidEffectiveTo");
      if (from >= to) e.dates = t("repaymentRules.validation.datesOrder");
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!id) {
      toast.error("Repayment rule id is missing.");
      return;
    }
    if (!validate()) return;
    setIsSubmitting(true);

    const payload: CreateRepaymentRuleVersionRequest = {
      debtRepaymentPercent: Number.parseFloat(debtRepaymentPercent || "0"),
      agentPayoutPercent: Number.parseFloat(agentPayoutPercent || "0"),
      excessBusinessPercent: Number.parseFloat(excessBusinessPercent || "0"),
      excessAgentPercent: Number.parseFloat(excessAgentPercent || "0"),
      defaultRepaymentPeriodDays: Number.parseInt(defaultRepaymentPeriodDays || "0", 10),
      maximumExtensions: Number.parseInt(maximumExtensions || "0", 10),
      effectiveFrom: new Date(effectiveFrom).toISOString(),
      effectiveTo: effectiveTo ? new Date(effectiveTo).toISOString() : null,
      notes: notes || undefined,
    };

    try {
      const created = await repaymentRulesService.createRepaymentRuleVersion(id, payload);
      if (created?.id) {
        await repaymentRulesService.activateRepaymentRuleVersion(created.id);
      }
      toast.success(t("repaymentRules.messages.versionCreated"));
      if (created?.id) {
        navigate(`/agents/repayment-rules/versions/${created.id}`);
        return;
      }
      navigate(`/agents/repayment-rules/${id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("repaymentRules.errors.versionSaveFailed")));
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalRepayment = Number.parseFloat(debtRepaymentPercent || "0") + Number.parseFloat(agentPayoutPercent || "0");
  const totalExcess = Number.parseFloat(excessBusinessPercent || "0") + Number.parseFloat(excessAgentPercent || "0");

  return (
    <div className={styles.page}>
      <SectionHeader title={t("repaymentRules.createVersionTitle")} goBack />

      <div className={styles.formCard}>
        <div className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <TextField
              label={t("repaymentRules.fields.debtRepaymentPercent")}
              value={debtRepaymentPercent}
              onChange={(e) => setDebtRepaymentPercent(e.target.value)}
              type="number"
              step="0.01"
              error={!!errors.debt}
              helperText={errors.debt}
            />
          </div>
          <div className={styles.fieldGroup}>
            <TextField
              label={t("repaymentRules.fields.agentPayoutPercent")}
              value={agentPayoutPercent}
              onChange={(e) => setAgentPayoutPercent(e.target.value)}
              type="number"
              step="0.01"
              error={!!errors.agent}
              helperText={errors.agent}
            />
          </div>
        </div>

        <div className={styles.totalRow}>
          <span>{t("repaymentRules.fields.totalRepayment")}</span>
          <strong>{Number.isFinite(totalRepayment) ? `${totalRepayment.toFixed(2)}%` : "0.00%"}</strong>
          {errors.total ? <small>{errors.total}</small> : null}
        </div>

        <div className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <TextField
              label={t("repaymentRules.fields.excessBusinessPercent")}
              value={excessBusinessPercent}
              onChange={(e) => setExcessBusinessPercent(e.target.value)}
              type="number"
              step="0.01"
              error={!!errors.eb}
              helperText={errors.eb}
            />
          </div>
          <div className={styles.fieldGroup}>
            <TextField
              label={t("repaymentRules.fields.excessAgentPercent")}
              value={excessAgentPercent}
              onChange={(e) => setExcessAgentPercent(e.target.value)}
              type="number"
              step="0.01"
              error={!!errors.ea}
              helperText={errors.ea}
            />
          </div>
        </div>

        <div className={styles.totalRow}>
          <span>{t("repaymentRules.fields.totalExcess")}</span>
          <strong>{Number.isFinite(totalExcess) ? `${totalExcess.toFixed(2)}%` : "0.00%"}</strong>
          {errors.excesstotal ? <small>{errors.excesstotal}</small> : null}
        </div>

        <div className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <TextField
              label={t("repaymentRules.fields.defaultRepaymentPeriodDays")}
              value={defaultRepaymentPeriodDays}
              onChange={(e) => setDefaultRepaymentPeriodDays(e.target.value)}
              type="number"
              min="0"
            />
          </div>
          <div className={styles.fieldGroup}>
            <TextField
              label={t("repaymentRules.fields.maximumExtensions")}
              value={maximumExtensions}
              onChange={(e) => setMaximumExtensions(e.target.value)}
              type="number"
              min="0"
            />
          </div>
        </div>

        <div className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <TextField
              label={t("repaymentRules.fields.effectiveFrom")}
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              type="datetime-local"
              error={!!errors.from}
              helperText={errors.from}
            />
          </div>
          <div className={styles.fieldGroup}>
            <TextField
              label={t("repaymentRules.fields.effectiveToOptional")}
              value={effectiveTo || ""}
              onChange={(e) => setEffectiveTo(e.target.value || undefined)}
              type="datetime-local"
              error={!!errors.to || !!errors.dates}
              helperText={errors.to || errors.dates}
            />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <Textarea
            label={t("repaymentRules.fields.notes")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder={t("repaymentRules.fields.notes")}
          />
        </div>

        <div className={styles.formActions}>
          <Button variant="secondary" onClick={() => navigate(-1)}>{t("actions.cancel")}</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? t("repaymentRules.creating") : t("repaymentRules.createVersion")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateRepaymentRuleVersion;
