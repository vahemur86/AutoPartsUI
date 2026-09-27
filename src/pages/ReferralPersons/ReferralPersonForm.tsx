import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { SectionHeader } from "@/components/common";
import { Button, TextField, Textarea } from "@/ui-kit";
import {
  createReferralPerson,
  getReferralPerson,
  updateReferralPerson,
  type ReferralPersonCreateRequest,
  type ReferralPersonUpdateRequest,
} from "@/services/referralPersons";

const emptyForm = {
  code: "",
  name: "",
  phone: "",
  email: "",
  notes: "",
};

export const ReferralPersonForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;

    const load = async () => {
      setLoading(true);
      try {
        const person = await getReferralPerson(id!);
        if (person) {
          setForm({
            code: person.code,
            name: person.name,
            phone: person.phone ?? "",
            email: person.email ?? "",
            notes: person.notes ?? "",
          });
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("referralPerson.errors.loadFailed"));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id, isEdit]);

  const handleSubmit = async () => {
    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      notes: form.notes.trim() || null,
    };

    if (!payload.code || !payload.name) {
      toast.error(t("referralPerson.validation.required"));
      return;
    }

    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      toast.error(t("referralPerson.validation.email"));
      return;
    }

    setSaving(true);

    try {
      if (isEdit) {
        const updatePayload: ReferralPersonUpdateRequest = {
          name: payload.name,
          phone: payload.phone,
          email: payload.email,
          notes: payload.notes,
        };
        await updateReferralPerson(id!, updatePayload);
        toast.success(t("referralPerson.messages.updated"));
      } else {
        const createPayload: ReferralPersonCreateRequest = payload;
        await createReferralPerson(createPayload);
        toast.success(t("referralPerson.messages.created"));
      }

      navigate("/referral-persons");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("referralPerson.errors.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <SectionHeader title={isEdit ? t("referralPerson.form.editTitle") : t("referralPerson.form.addTitle")} goBack />
        <div>{t("referralPerson.form.loading")}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      <SectionHeader title={isEdit ? t("referralPerson.form.editTitle") : t("referralPerson.form.addTitle")} goBack />

      <div style={{ display: "grid", gap: 16, maxWidth: 720 }}>
        <TextField
          label={t("referralPerson.fields.code")}
          value={form.code}
          onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
          disabled={isEdit}
        />

        <TextField
          label={t("referralPerson.fields.name")}
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        />

        <TextField
          label={t("referralPerson.fields.phone")}
          value={form.phone}
          onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
        />

        <TextField
          label={t("referralPerson.fields.email")}
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
        />

        <Textarea
          label={t("referralPerson.fields.notes")}
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
        />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button variant="secondary" onClick={() => navigate(-1)} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? t("referralPerson.form.saving") : isEdit ? t("referralPerson.form.update") : t("referralPerson.form.create")}
          </Button>
        </div>
      </div>
    </div>
  );
};
