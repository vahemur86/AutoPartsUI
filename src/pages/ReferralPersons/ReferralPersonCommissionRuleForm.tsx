import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { CalendarDays, Percent, Wrench } from "lucide-react";

import { SectionHeader } from "@/components/common";
import { Button, Select, TextField, Textarea } from "@/ui-kit";
import { createReferralPersonRule } from "@/services/referralPersons";
import { fetchServicesCatalog } from "@/store/slices/servicesCatalogSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import styles from "./ReferralPersonCommissionRuleForm.module.css";
import actionStyles from "./ReferralActions.module.css";

export const ReferralPersonCommissionRuleForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { personId } = useParams();
  const dispatch = useAppDispatch();
  const { items: services, isLoading: servicesLoading } = useAppSelector(
    (state) => state.servicesCatalog,
  );
  const [form, setForm] = useState({
    serviceId: "",
    commissionPercent: "",
    effectiveFrom: "",
    effectiveTo: "",
    notes: "",
  });

  useEffect(() => {
    void dispatch(fetchServicesCatalog());
  }, [dispatch]);

  const activeServices = useMemo(
    () => services.filter((service) => service.isActive !== false),
    [services],
  );
  const selectedService = activeServices.find((service) => String(service.id) === form.serviceId);

  const handleSubmit = async () => {
    if (!form.serviceId || !form.commissionPercent || !form.effectiveFrom) {
      toast.error(t("referralPerson.rules.required"));
      return;
    }

    const serviceId = Number(form.serviceId);
    const percent = Number(form.commissionPercent);
    if (!serviceId || Number.isNaN(percent) || percent < 0 || percent > 100) {
      toast.error(t("referralPerson.rules.percentRange"));
      return;
    }

    try {
      await createReferralPersonRule(personId!, {
        serviceId,
        commissionPercent: percent,
        effectiveFrom: new Date(`${form.effectiveFrom}T00:00:00`).toISOString(),
        effectiveTo: form.effectiveTo
          ? new Date(`${form.effectiveTo}T23:59:59`).toISOString()
          : null,
        notes: form.notes.trim() || null,
      });
      toast.success(t("referralPerson.rules.saved"));
      navigate(`/referral-persons/${personId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("referralPerson.errors.saveFailed"));
    }
  };

  return (
    <div className={styles.page}>
      <SectionHeader title={t("referralPerson.rules.title")} goBack />

      <div className={styles.formPanel}>
        <div className={styles.formHeading}>
          <span className={styles.formIcon}><Percent size={19} /></span>
          <div>
            <span className={styles.eyebrow}>{t("header.referralWorkspaceLabel")}</span>
            <h2>{t("referralPerson.rules.title")}</h2>
          </div>
        </div>

        <div className={styles.formGrid}>
          <Select
            label={t("referralPerson.rules.service")}
            value={form.serviceId}
            disabled={servicesLoading}
            onChange={(e) => setForm((prev) => ({ ...prev, serviceId: e.target.value }))}
            searchable
          >
            <option value="">
              {servicesLoading ? t("referralPerson.rules.loadingServices") : t("referralPerson.rules.selectService")}
            </option>
            {activeServices.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} ({service.code})
              </option>
            ))}
          </Select>

          {selectedService && (
            <div className={styles.servicePrice}>
              <Wrench size={15} />
              <span>{t("referralPerson.rules.servicePrice")}</span>
              <strong>{Number(selectedService.internalCost || 0).toLocaleString()} AMD</strong>
            </div>
          )}

          <TextField
            label={t("referralPerson.rules.commissionPercent")}
            type="number"
            min="0"
            max="100"
            value={form.commissionPercent}
            onChange={(e) => setForm((prev) => ({ ...prev, commissionPercent: e.target.value }))}
            icon={<Percent size={15} />}
          />

          <TextField
            label={t("referralPerson.rules.effectiveFrom")}
            type="date"
            value={form.effectiveFrom}
            onChange={(e) => setForm((prev) => ({ ...prev, effectiveFrom: e.target.value }))}
            icon={<CalendarDays size={15} />}
          />

          <TextField
            label={t("referralPerson.rules.effectiveTo")}
            type="date"
            value={form.effectiveTo}
            onChange={(e) => setForm((prev) => ({ ...prev, effectiveTo: e.target.value }))}
            icon={<CalendarDays size={15} />}
          />

          <Textarea
            label={t("referralPerson.fields.notes")}
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            rows={3}
          />
        </div>

        <div className={styles.actions}>
          <Button className={`${actionStyles.referralButton} ${actionStyles.referralNeutral}`} onClick={() => navigate(-1)}>
            {t("referralPerson.form.cancel")}
          </Button>
          <Button className={`${actionStyles.referralButton} ${actionStyles.referralPrimary}`} onClick={handleSubmit}>{t("common.save")}</Button>
        </div>
      </div>
    </div>
  );
};
