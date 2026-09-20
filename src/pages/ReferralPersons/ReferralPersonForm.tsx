import { useEffect, useState } from "react";
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
        toast.error(error instanceof Error ? error.message : "Failed to load referral person.");
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
      toast.error("Code and name are required.");
      return;
    }

    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      toast.error("Please enter a valid email address.");
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
        toast.success("Referral person updated successfully.");
      } else {
        const createPayload: ReferralPersonCreateRequest = payload;
        await createReferralPerson(createPayload);
        toast.success("Referral person created successfully.");
      }

      navigate("/referral-persons");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <SectionHeader title={isEdit ? "Edit Referral Person" : "Add Referral Person"} goBack />
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      <SectionHeader title={isEdit ? "Edit Referral Person" : "Add Referral Person"} goBack />

      <div style={{ display: "grid", gap: 16, maxWidth: 720 }}>
        <TextField
          label="Code"
          value={form.code}
          onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
          disabled={isEdit}
        />

        <TextField
          label="Name"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        />

        <TextField
          label="Phone"
          value={form.phone}
          onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
        />

        <TextField
          label="Email"
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
        />

        <Textarea
          label="Notes"
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
        />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button variant="secondary" onClick={() => navigate(-1)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Update" : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
};
