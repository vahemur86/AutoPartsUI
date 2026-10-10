import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { BadgeCheck, Hash, Mail, NotebookPen, Phone, UserRound, UserRoundPlus, X } from "lucide-react";
import { createPortal } from "react-dom";
import { isPossiblePhoneNumber, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

import { CountryPhoneInput, SectionHeader } from "@/components/common";
import { Button, TextField, Textarea } from "@/ui-kit";
import {
  createReferralPerson,
  getReferralPerson,
  updateReferralPerson,
  type ReferralPersonCreateRequest,
  type ReferralPersonUpdateRequest,
} from "@/services/referralPersons";
import styles from "./ReferralPersonForm.module.css";
import actionStyles from "./ReferralActions.module.css";

const emptyForm = {
  code: "",
  name: "",
  phone: "",
  email: "",
  notes: "",
};

const DEFAULT_COUNTRY: CountryCode = "AM";

export const ReferralPersonForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(emptyForm);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;

    const load = async () => {
      setLoading(true);
      try {
        const person = await getReferralPerson(id!);
        if (person) {
          const parsedPhone = person.phone ? parsePhoneNumberFromString(person.phone) : null;
          setForm({
            code: person.code,
            name: person.name,
            phone: person.phone ?? "",
            email: person.email ?? "",
            notes: person.notes ?? "",
          });
          setSelectedCountry((parsedPhone?.country as CountryCode) || DEFAULT_COUNTRY);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("referralPerson.errors.loadFailed"));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id, isEdit, t]);

  useEffect(() => {
    if (isEdit) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") navigate("/referral-persons");
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isEdit, navigate]);

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

    if (payload.phone && !isPossiblePhoneNumber(payload.phone)) {
      toast.error(t("referralPerson.validation.phone"));
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
      <div className={styles.editPage}>
        <SectionHeader title={isEdit ? t("referralPerson.form.editTitle") : t("referralPerson.form.addTitle")} goBack />
        <div className={styles.loadingState}>{t("referralPerson.form.loading")}</div>
      </div>
    );
  }

  if (!isEdit) {
    const closeDrawer = () => navigate("/referral-persons");

    return createPortal(
      <div className={styles.backdrop} onMouseDown={closeDrawer}>
        <aside
          className={styles.drawer}
          role="dialog"
          aria-modal="true"
          aria-labelledby="referral-person-create-title"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <header className={styles.drawerHeader}>
            <div className={styles.headerIcon} aria-hidden="true">
              <UserRoundPlus size={20} />
            </div>
            <div className={styles.headerCopy}>
              <span className={styles.eyebrow}>{t("header.referralWorkspaceLabel")}</span>
              <h2 id="referral-person-create-title">{t("referralPerson.form.addTitle")}</h2>
            </div>
            <button
              type="button"
              className={styles.closeButton}
              onClick={closeDrawer}
              aria-label={t("common.close")}
              title={t("common.close")}
            >
              <X size={18} />
            </button>
          </header>

          <div className={styles.drawerBody}>
            <div className={styles.sectionHeading}>
              <BadgeCheck size={15} />
              <span>{t("referralPerson.details.title")}</span>
            </div>

            <div className={styles.fieldGrid}>
              <TextField
                label={t("referralPerson.fields.code")}
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                icon={<Hash size={15} />}
                autoFocus
              />
              <TextField
                label={t("referralPerson.fields.name")}
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                icon={<UserRound size={15} />}
              />
              <div className={styles.phoneField}>
                <label className={styles.phoneLabel}>
                  <Phone size={14} />
                  <span>{t("referralPerson.fields.phone")}</span>
                </label>
                <CountryPhoneInput
                  phone={form.phone}
                  selectedCountry={selectedCountry}
                  onCountryChange={(country) => {
                    setSelectedCountry(country);
                    setForm((prev) => ({ ...prev, phone: "" }));
                  }}
                  onPhoneChange={(phone) => setForm((prev) => ({ ...prev, phone }))}
                />
              </div>
              <TextField
                label={t("referralPerson.fields.email")}
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                icon={<Mail size={15} />}
                type="email"
              />
            </div>

            <label className={styles.notesLabel} htmlFor="referral-person-notes">
              <NotebookPen size={14} />
              <span>{t("referralPerson.fields.notes")}</span>
            </label>
            <Textarea
              id="referral-person-notes"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
              resizable={false}
            />
          </div>

          <footer className={styles.drawerFooter}>
            <Button className={`${actionStyles.referralButton} ${actionStyles.referralNeutral}`} onClick={closeDrawer} disabled={saving}>
              {t("referralPerson.form.cancel")}
            </Button>
            <Button className={`${actionStyles.referralButton} ${actionStyles.referralPrimary}`} onClick={() => void handleSubmit()} disabled={saving}>
              {saving ? t("referralPerson.form.saving") : t("referralPerson.form.create")}
            </Button>
          </footer>
        </aside>
      </div>,
      document.body,
    );
  }

  return (
    <div className={styles.editPage}>
      <SectionHeader title={isEdit ? t("referralPerson.form.editTitle") : t("referralPerson.form.addTitle")} goBack />

      <div className={styles.editCard}>
        <div className={styles.editGrid}>
          <TextField
            label={t("referralPerson.fields.code")}
            value={form.code}
            onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
            disabled={isEdit}
            icon={<Hash size={15} />}
          />

          <TextField
            label={t("referralPerson.fields.name")}
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            icon={<UserRound size={15} />}
          />

          <div className={styles.editPhoneField}>
            <label className={styles.editFieldLabel}>
              <Phone size={14} />
              <span>{t("referralPerson.fields.phone")}</span>
            </label>
            <CountryPhoneInput
              phone={form.phone}
              selectedCountry={selectedCountry}
              onCountryChange={(country) => {
                setSelectedCountry(country);
                setForm((prev) => ({ ...prev, phone: "" }));
              }}
              onPhoneChange={(phone) => setForm((prev) => ({ ...prev, phone }))}
            />
          </div>

          <TextField
            label={t("referralPerson.fields.email")}
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            icon={<Mail size={15} />}
            type="email"
          />
        </div>

        <Textarea
          label={t("referralPerson.fields.notes")}
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          rows={3}
        />

        <div className={styles.editActions}>
          <Button className={`${actionStyles.referralButton} ${actionStyles.referralNeutral}`} onClick={() => navigate(-1)} disabled={saving}>
            {t("referralPerson.form.cancel")}
          </Button>
          <Button className={`${actionStyles.referralButton} ${actionStyles.referralPrimary}`} onClick={handleSubmit} disabled={saving}>
            {saving ? t("referralPerson.form.saving") : isEdit ? t("referralPerson.form.update") : t("referralPerson.form.create")}
          </Button>
        </div>
      </div>
    </div>
  );
};
