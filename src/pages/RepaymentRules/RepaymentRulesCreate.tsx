import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { SectionHeader } from "@/components/common";
import { Button, Select, TextField, Textarea } from "@/ui-kit";
import { repaymentRulesService } from "@/services/repaymentRules";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { CreateRepaymentRuleRequest, RepaymentRuleType } from "@/types/repaymentRules";
import styles from "./RepaymentRules.module.css";

export const CreateRepaymentRule = ({ type: presetType }: { type?: RepaymentRuleType } = {}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<RepaymentRuleType | "">(presetType ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!code.trim()) e.code = t("repaymentRules.validation.codeRequired");
    if (!name.trim()) e.name = t("repaymentRules.validation.nameRequired");
    if (!type) e.type = t("repaymentRules.validation.typeRequired");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || (type !== "Dust" && type !== "ProductCredit")) return;
    setIsSubmitting(true);
    const payload: CreateRepaymentRuleRequest = {
      code: code.trim(),
      name: name.trim(),
      type,
      description: description.trim() || undefined,
    };
    try {
      const created = await repaymentRulesService.createRepaymentRule(payload);
      toast.success(t("repaymentRules.messages.created"));
      if (created?.id) {
        navigate(`/agents/rules/${created.id}`);
        return;
      }
      navigate("/agents/rules");
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("repaymentRules.errors.saveFailed")));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <SectionHeader
        title={`${t("repaymentRules.createTitle")}${type ? ` · ${t(`repaymentRules.types.${type}`)}` : ""}`}
        goBack
      />

      <div className={styles.formCard}>
        <div className={styles.formGrid}>
          <div className={styles.fieldGroup}>
            <TextField
              label={t("repaymentRules.fields.code")}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              error={!!errors.code}
              helperText={errors.code}
            />
          </div>
          <div className={styles.fieldGroup}>
            <Select
              label={t("repaymentRules.fields.type")}
              value={type}
              onChange={(event) => {
                const value = event.target.value;
                setType(value === "Dust" || value === "ProductCredit" ? value : "");
              }}
              disabled={Boolean(presetType)}
              error={Boolean(errors.type)}
              helperText={errors.type}
            >
              <option value="">{t("common.select")}</option>
              <option value="Dust">{t("repaymentRules.types.Dust")}</option>
              <option value="ProductCredit">{t("repaymentRules.types.ProductCredit")}</option>
            </Select>
          </div>

          <div className={styles.fieldGroup}>
            <TextField
              label={t("repaymentRules.fields.name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
            />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <Textarea
            label={t("repaymentRules.fields.description")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder={t("repaymentRules.fields.description")}
          />
        </div>

        <div className={styles.formActions}>
          <Button variant="secondary" onClick={() => navigate(-1)}>{t("actions.cancel")}</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? t("repaymentRules.creating") : t("repaymentRules.createButton")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateRepaymentRule;
