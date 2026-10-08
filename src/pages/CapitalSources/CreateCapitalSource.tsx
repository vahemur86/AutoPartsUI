import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Banknote, Landmark, Sparkles, Wallet } from "lucide-react";

import { Button, TextField, Textarea } from "@/ui-kit";
import { SectionHeader } from "@/components/common";
import { capitalSourcesService } from "@/services/capitalSources";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type {
  CreateCapitalSourceRequest,
  UpdateCapitalSourceRequest,
} from "@/types/capitalSources";
import styles from "./CapitalSources.module.css";

const typeOptions = [
  { value: "BankLoan", icon: Landmark },
  { value: "OwnerInvestment", icon: Wallet },
  { value: "Other", icon: Sparkles },
] as const;

const emptyForm = () => ({
  code: "",
  name: "",
  type: "BankLoan" as "BankLoan" | "OwnerInvestment" | "Other",
  initialAmount: "",
  interestRate: "",
  startDate: "",
  endDate: "",
  description: "",
});

export const CreateCapitalSource = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    const payload: CreateCapitalSourceRequest = {
      code: form.code.trim(),
      name: form.name.trim(),
      type: form.type,
      initialAmount: Number(form.initialAmount),
      interestRate: form.interestRate === "" ? null : Number(form.interestRate),
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      description: form.description.trim() || null,
    };

    if (!payload.code || !payload.name || !payload.initialAmount || Number(payload.initialAmount) <= 0) {
      toast.error(t("capitalSources.validation.required"));
      return;
    }

    if (payload.startDate && payload.endDate && new Date(payload.endDate) < new Date(payload.startDate)) {
      toast.error(t("capitalSources.validation.dateOrder"));
      return;
    }

    if (
      payload.interestRate != null &&
      (payload.interestRate < 0 || payload.interestRate > 100)
    ) {
      toast.error(t("capitalSources.validation.interestRange"));
      return;
    }

    setIsSubmitting(true);
    try {
      const id = await capitalSourcesService.createCapitalSource(payload);
      toast.success(t("capitalSources.messages.created"));
      navigate(`/capital-sources/${id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("capitalSources.errors.saveFailed")));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <SectionHeader title={t("capitalSources.createTitle")} goBack />

      <div className={styles.formShell}>
        <section className={styles.formIntro}>
          <span className={styles.formMark}><Banknote size={20} /></span>
          <div>
            <p>{t("capitalSources.create.eyebrow")}</p>
            <h2>{t("capitalSources.create.title")}</h2>
            <span>{t("capitalSources.create.description")}</span>
          </div>
        </section>

        <div className={styles.formGrid}>
          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <h3>{t("capitalSources.create.sourceDetails")}</h3>
              <span>{t("capitalSources.create.sourceDetailsHint")}</span>
            </div>

            <TextField label={t("capitalSources.fields.code")} value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} />
            <TextField label={t("capitalSources.fields.name")} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            <div className={styles.typeSelector}>
              <label>{t("capitalSources.fields.type")}</label>
              <div className={styles.typeOptions}>
                {typeOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = option.value === form.type;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`${styles.typeOption} ${isSelected ? styles.typeOptionSelected : ""}`}
                      onClick={() => setForm((p) => ({ ...p, type: option.value }))}
                    >
                      <Icon size={17} />
                      <span>{t(`capitalSources.types.${option.value}`)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <h3>{t("capitalSources.create.fundingDetails")}</h3>
              <span>{t("capitalSources.create.fundingDetailsHint")}</span>
            </div>

            <TextField
              label={t("capitalSources.fields.initialAmount")}
              type="number"
              min="0"
              step="0.01"
              suffix="AMD"
              value={form.initialAmount}
              onChange={(e) => setForm((p) => ({ ...p, initialAmount: e.target.value }))}
            />
            <TextField
              label={t("capitalSources.fields.interestRate")}
              type="number"
              min="0"
              max="100"
              step="0.01"
              suffix="%"
              value={form.interestRate}
              onChange={(e) => setForm((p) => ({ ...p, interestRate: e.target.value }))}
            />
            <div className={styles.dateGrid}>
              <TextField label={t("capitalSources.fields.startDate")} type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
              <TextField label={t("capitalSources.fields.endDate")} type="date" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} />
            </div>
            <Textarea label={t("capitalSources.fields.description")} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </div>
        </div>

        <div className={styles.actionRow}>
          <Button variant="secondary" onClick={() => navigate(-1)} disabled={isSubmitting}>{t("common.cancel")}</Button>
          <Button onClick={submit} disabled={isSubmitting}>{isSubmitting ? t("common.saving") : t("capitalSources.actions.create")}</Button>
        </div>
      </div>
    </div>
  );
};

export const EditCapitalSource = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState(emptyForm());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const source = await capitalSourcesService.getCapitalSource(id);
        setForm({
          code: source.code,
          name: source.name,
          type: source.type,
          initialAmount: String(source.initialAmount ?? ""),
          interestRate: source.interestRate == null ? "" : String(source.interestRate),
          startDate: source.startDate ? source.startDate.slice(0, 10) : "",
          endDate: source.endDate ? source.endDate.slice(0, 10) : "",
          description: source.description ?? "",
        });
      } catch (error) {
        toast.error(getApiErrorMessage(error, t("capitalSources.errors.loadFailed")));
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [id, t]);

  const submit = async () => {
    if (!id) return;

    const payload: UpdateCapitalSourceRequest = {
      code: form.code.trim(),
      name: form.name.trim(),
      type: form.type,
      initialAmount: Number(form.initialAmount),
      interestRate: form.interestRate === "" ? null : Number(form.interestRate),
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      description: form.description.trim() || null,
    };

    if (!payload.code || !payload.name || Number(payload.initialAmount) <= 0) {
      toast.error(t("capitalSources.validation.required"));
      return;
    }

    if (payload.startDate && payload.endDate && new Date(payload.endDate) < new Date(payload.startDate)) {
      toast.error(t("capitalSources.validation.dateOrder"));
      return;
    }

    if (payload.interestRate != null && (payload.interestRate < 0 || payload.interestRate > 100)) {
      toast.error(t("capitalSources.validation.interestRange"));
      return;
    }

    setIsSubmitting(true);
    try {
      await capitalSourcesService.updateCapitalSource(id, payload);
      toast.success(t("capitalSources.messages.updated"));
      navigate(`/capital-sources/${id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("capitalSources.errors.saveFailed")));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <SectionHeader title={isLoading ? t("common.loading") : t("capitalSources.editTitle")} goBack />

      <div className={styles.formShell}>
        <section className={styles.formIntro}>
          <span className={styles.formMark}><Banknote size={20} /></span>
          <div>
            <p>{t("capitalSources.edit.eyebrow")}</p>
            <h2>{t("capitalSources.edit.title")}</h2>
            <span>{t("capitalSources.edit.description")}</span>
          </div>
        </section>

        <div className={styles.formGrid}>
          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <h3>{t("capitalSources.create.sourceDetails")}</h3>
              <span>{t("capitalSources.create.sourceDetailsHint")}</span>
            </div>

            <TextField label={t("capitalSources.fields.code")} value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} />
            <TextField label={t("capitalSources.fields.name")} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            <div className={styles.typeSelector}>
              <label>{t("capitalSources.fields.type")}</label>
              <div className={styles.typeOptions}>
                {typeOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = option.value === form.type;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`${styles.typeOption} ${isSelected ? styles.typeOptionSelected : ""}`}
                      onClick={() => setForm((p) => ({ ...p, type: option.value }))}
                    >
                      <Icon size={17} />
                      <span>{t(`capitalSources.types.${option.value}`)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className={styles.formCard}>
            <div className={styles.cardHeader}>
              <h3>{t("capitalSources.create.fundingDetails")}</h3>
              <span>{t("capitalSources.create.fundingDetailsHint")}</span>
            </div>

            <TextField
              label={t("capitalSources.fields.initialAmount")}
              type="number"
              min="0"
              step="0.01"
              suffix="AMD"
              value={form.initialAmount}
              onChange={(e) => setForm((p) => ({ ...p, initialAmount: e.target.value }))}
            />
            <TextField
              label={t("capitalSources.fields.interestRate")}
              type="number"
              min="0"
              max="100"
              step="0.01"
              suffix="%"
              value={form.interestRate}
              onChange={(e) => setForm((p) => ({ ...p, interestRate: e.target.value }))}
            />
            <div className={styles.dateGrid}>
              <TextField label={t("capitalSources.fields.startDate")} type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
              <TextField label={t("capitalSources.fields.endDate")} type="date" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} />
            </div>
            <Textarea label={t("capitalSources.fields.description")} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </div>
        </div>

        <div className={styles.actionRow}>
          <Button variant="secondary" onClick={() => navigate(-1)} disabled={isSubmitting}>{t("common.cancel")}</Button>
          <Button onClick={submit} disabled={isSubmitting || isLoading}>{isSubmitting ? t("common.saving") : t("common.save")}</Button>
        </div>
      </div>
    </div>
  );
};
