import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { SectionHeader } from "@/components/common";
import { Button, Select, TextField, Textarea } from "@/ui-kit";
import { repaymentRulesService } from "@/services/repaymentRules";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type {
  CreateRepaymentRuleVersionRequest,
  RepaymentRule,
} from "@/types/repaymentRules";
import styles from "./RepaymentRules.module.css";

const toDateTimeLocal = (date: Date) => {
  const localDate = new Date(date);
  localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
  return localDate.toISOString().slice(0, 16);
};

export const CreateRepaymentRuleVersion = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [rule, setRule] = useState<RepaymentRule | null>(null);
  const [loading, setLoading] = useState(true);
  const [debtRepaymentPercent, setDebtRepaymentPercent] = useState("");
  const [agentPayoutPercent, setAgentPayoutPercent] = useState("");
  const [excessBusinessPercent, setExcessBusinessPercent] = useState("100");
  const [excessAgentPercent, setExcessAgentPercent] = useState("0");
  const [defaultRepaymentPeriodDays, setDefaultRepaymentPeriodDays] = useState("90");
  const [maximumExtensions, setMaximumExtensions] = useState("0");
  const [extensionMode, setExtensionMode] = useState<"unlimited" | "limited">("unlimited");
  const [maximumProductCreditExtensions, setMaximumProductCreditExtensions] = useState("1");
  const [effectiveFrom, setEffectiveFrom] = useState(() => toDateTimeLocal(new Date()));
  const [effectiveTo, setEffectiveTo] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) {
      setLoading(false);
      toast.error(t("repaymentRules.errors.ruleLoadFailed"));
      return;
    }
    let active = true;
    void repaymentRulesService
      .getRepaymentRule(id)
      .then((loadedRule) => {
        if (active) setRule(loadedRule);
      })
      .catch((error) => {
        if (active) toast.error(getApiErrorMessage(error, t("repaymentRules.errors.ruleLoadFailed")));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, t]);

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    const days = Number(defaultRepaymentPeriodDays);
    if (rule?.type === "ProductCredit" && (!Number.isInteger(days) || days <= 0)) {
      nextErrors.days = t("repaymentRules.validation.periodDaysPositive");
    }

    if (rule?.type === "Dust") {
      const debt = Number(debtRepaymentPercent);
      const payout = Number(agentPayoutPercent);
      const business = Number(excessBusinessPercent);
      const agent = Number(excessAgentPercent);
      if (!Number.isFinite(debt) || debt < 0 || debt > 100) nextErrors.debt = t("repaymentRules.validation.percentRange");
      if (!Number.isFinite(payout) || payout < 0 || payout > 100) nextErrors.agent = t("repaymentRules.validation.percentRange");
      if (Math.abs(debt + payout - 100) > 0.0001) nextErrors.total = t("repaymentRules.validation.debtAgentTotal");
      if (!Number.isFinite(business) || business < 0 || business > 100) nextErrors.business = t("repaymentRules.validation.percentRange");
      if (!Number.isFinite(agent) || agent < 0 || agent > 100) nextErrors.excessAgent = t("repaymentRules.validation.percentRange");
      if (Math.abs(business + agent - 100) > 0.0001) nextErrors.excessTotal = t("repaymentRules.validation.excessTotal");
    }

    if (!effectiveFrom || Number.isNaN(new Date(effectiveFrom).getTime())) {
      nextErrors.from = t("repaymentRules.validation.requiredFrom");
    }
    if (effectiveTo) {
      const to = new Date(effectiveTo);
      if (Number.isNaN(to.getTime())) nextErrors.to = t("repaymentRules.validation.invalidEffectiveTo");
      if (!Number.isNaN(new Date(effectiveFrom).getTime()) && new Date(effectiveFrom) >= to) {
        nextErrors.dates = t("repaymentRules.validation.datesOrder");
      }
    }
    if (rule?.type === "ProductCredit" && extensionMode === "limited") {
      const extensionLimit = Number(maximumProductCreditExtensions);
      if (!Number.isInteger(extensionLimit) || extensionLimit <= 0) {
        nextErrors.productExtensions = t("repaymentRules.validation.extensionLimitPositive");
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!id || !rule) {
      toast.error(t("repaymentRules.errors.ruleLoadFailed"));
      return;
    }
    if (!validate()) return;
    setIsSubmitting(true);

    const common = {
      defaultRepaymentPeriodDays: Number.parseInt(defaultRepaymentPeriodDays || "0", 10),
      effectiveFrom: new Date(effectiveFrom).toISOString(),
      effectiveTo: effectiveTo ? new Date(effectiveTo).toISOString() : null,
      notes: notes.trim() || undefined,
    };
    const payload: CreateRepaymentRuleVersionRequest = rule.type === "ProductCredit"
      ? {
          ...common,
          maximumProductCreditExtensions: extensionMode === "unlimited"
            ? null
            : Number(maximumProductCreditExtensions),
        }
      : {
          ...common,
          debtRepaymentPercent: Number(debtRepaymentPercent),
          agentPayoutPercent: Number(agentPayoutPercent),
          excessBusinessPercent: Number(excessBusinessPercent),
          excessAgentPercent: Number(excessAgentPercent),
          maximumExtensions: Number.parseInt(maximumExtensions || "0", 10),
        };

    try {
      const created = await repaymentRulesService.createRepaymentRuleVersion(id, payload);
      if (created?.id) await repaymentRulesService.activateRepaymentRuleVersion(created.id);
      toast.success(t("repaymentRules.messages.versionCreated"));
      const rulePath = "/agents/rules";
      if (created?.id) {
        navigate(`${rulePath}/versions/${created.id}`);
        return;
      }
      navigate(`${rulePath}/${id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("repaymentRules.errors.versionSaveFailed")));
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalRepayment = Number(debtRepaymentPercent || "0") + Number(agentPayoutPercent || "0");
  const totalExcess = Number(excessBusinessPercent || "0") + Number(excessAgentPercent || "0");

  return (
    <div className={styles.page}>
      <SectionHeader
        title={rule
          ? `${t("repaymentRules.createVersionTitle")} · ${rule.name} · ${t(`repaymentRules.types.${rule.type}`)}`
          : t("repaymentRules.createVersionTitle")}
        goBack
      />
      {loading ? (
        <div>{t("repaymentRules.loadingRules")}</div>
      ) : !rule ? (
        <div className={styles.formCard} role="alert">{t("repaymentRules.errors.ruleLoadFailed")}</div>
      ) : (
        <div className={styles.formCard}>
          {rule.type === "Dust" && (
            <>
              <div className={styles.formGrid}>
                <div className={styles.fieldGroup}>
                  <TextField label={t("repaymentRules.fields.debtRepaymentPercent")} value={debtRepaymentPercent} onChange={(event) => setDebtRepaymentPercent(event.target.value)} type="number" step="0.01" error={Boolean(errors.debt)} helperText={errors.debt} />
                </div>
                <div className={styles.fieldGroup}>
                  <TextField label={t("repaymentRules.fields.agentPayoutPercent")} value={agentPayoutPercent} onChange={(event) => setAgentPayoutPercent(event.target.value)} type="number" step="0.01" error={Boolean(errors.agent)} helperText={errors.agent} />
                </div>
              </div>
              <div className={styles.totalRow}>
                <span>{t("repaymentRules.fields.totalRepayment")}</span>
                <strong>{Number.isFinite(totalRepayment) ? `${totalRepayment.toFixed(2)}%` : "0.00%"}</strong>
                {errors.total && <small>{errors.total}</small>}
              </div>
              <div className={styles.formGrid}>
                <div className={styles.fieldGroup}>
                  <TextField label={t("repaymentRules.fields.excessBusinessPercent")} value={excessBusinessPercent} onChange={(event) => setExcessBusinessPercent(event.target.value)} type="number" step="0.01" error={Boolean(errors.business)} helperText={errors.business} />
                </div>
                <div className={styles.fieldGroup}>
                  <TextField label={t("repaymentRules.fields.excessAgentPercent")} value={excessAgentPercent} onChange={(event) => setExcessAgentPercent(event.target.value)} type="number" step="0.01" error={Boolean(errors.excessAgent)} helperText={errors.excessAgent} />
                </div>
              </div>
              <div className={styles.totalRow}>
                <span>{t("repaymentRules.fields.totalExcess")}</span>
                <strong>{Number.isFinite(totalExcess) ? `${totalExcess.toFixed(2)}%` : "0.00%"}</strong>
                {errors.excessTotal && <small>{errors.excessTotal}</small>}
              </div>
            </>
          )}

          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <TextField
                label={t("repaymentRules.fields.defaultRepaymentPeriodDays")}
                value={defaultRepaymentPeriodDays}
                onChange={(event) => setDefaultRepaymentPeriodDays(event.target.value)}
                type="number"
                min={rule.type === "ProductCredit" ? "1" : "0"}
                step="1"
                error={Boolean(errors.days)}
                helperText={errors.days}
              />
            </div>
            {rule.type === "Dust" ? (
              <div className={styles.fieldGroup}>
                <TextField
                  label={t("repaymentRules.fields.maximumExtensions")}
                  value={maximumExtensions}
                  onChange={(event) => setMaximumExtensions(event.target.value)}
                  type="number"
                  min="0"
                  step="1"
                />
              </div>
            ) : (
              <div className={styles.fieldGroup}>
                <Select
                  label={t("repaymentRules.fields.maximumProductCreditExtensions")}
                  value={extensionMode}
                  onChange={(event) => setExtensionMode(event.target.value === "limited" ? "limited" : "unlimited")}
                >
                  <option value="unlimited">{t("repaymentRules.fields.unlimited")}</option>
                  <option value="limited">{t("repaymentRules.fields.limited")}</option>
                </Select>
                {extensionMode === "limited" && (
                  <TextField
                    label={t("repaymentRules.fields.maximumProductCreditExtensions")}
                    value={maximumProductCreditExtensions}
                    onChange={(event) => setMaximumProductCreditExtensions(event.target.value)}
                    type="number"
                    min="1"
                    step="1"
                    error={Boolean(errors.productExtensions)}
                    helperText={errors.productExtensions}
                  />
                )}
              </div>
            )}
          </div>

          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <TextField label={t("repaymentRules.fields.effectiveFrom")} value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} type="datetime-local" error={Boolean(errors.from)} helperText={errors.from} />
            </div>
            <div className={styles.fieldGroup}>
              <TextField label={t("repaymentRules.fields.effectiveToOptional")} value={effectiveTo} onChange={(event) => setEffectiveTo(event.target.value)} type="datetime-local" error={Boolean(errors.to || errors.dates)} helperText={errors.to || errors.dates} />
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <Textarea label={t("repaymentRules.fields.notes")} value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder={t("repaymentRules.fields.notes")} />
          </div>

          <div className={styles.formActions}>
            <Button variant="secondary" onClick={() => navigate(-1)}>{t("actions.cancel")}</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? t("repaymentRules.creating") : t("repaymentRules.createVersion")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateRepaymentRuleVersion;
