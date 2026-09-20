import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { SectionHeader } from "@/components/common";
import { Button, Select, TextField, Textarea } from "@/ui-kit";
import { createReferralPersonRule } from "@/services/referralPersons";
import { fetchServicesCatalog } from "@/store/slices/servicesCatalogSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export const ReferralPersonCommissionRuleForm = () => {
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
      toast.error("Service, commission percentage, and effective from date are required.");
      return;
    }

    const serviceId = Number(form.serviceId);
    const percent = Number(form.commissionPercent);
    if (!serviceId || Number.isNaN(percent) || percent < 0 || percent > 100) {
      toast.error("Commission percentage must be between 0 and 100.");
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
      toast.success("Commission rule saved.");
      navigate(`/referral-persons/${personId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save commission rule.");
    }
  };

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      <SectionHeader title="Add Commission Rule" goBack />

      <div style={{ display: "grid", gap: 16, maxWidth: 720 }}>
        <Select
          label="Service"
          value={form.serviceId}
          disabled={servicesLoading}
          onChange={(e) => setForm((prev) => ({ ...prev, serviceId: e.target.value }))}
        >
          <option value="">
            {servicesLoading ? "Loading services..." : "Select service"}
          </option>
          {activeServices.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} ({service.code})
            </option>
          ))}
        </Select>

        {selectedService && (
          <div style={{ color: "#475569", fontSize: 14 }}>
            Service price: <strong>{Number(selectedService.internalCost || 0).toLocaleString()} AMD</strong>
          </div>
        )}

        <TextField
          label="Commission %"
          type="number"
          value={form.commissionPercent}
          onChange={(e) => setForm((prev) => ({ ...prev, commissionPercent: e.target.value }))}
        />

        <TextField
          label="Effective From"
          type="date"
          value={form.effectiveFrom}
          onChange={(e) => setForm((prev) => ({ ...prev, effectiveFrom: e.target.value }))}
        />

        <TextField
          label="Effective To"
          type="date"
          value={form.effectiveTo}
          onChange={(e) => setForm((prev) => ({ ...prev, effectiveTo: e.target.value }))}
        />

        <Textarea
          label="Notes"
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
        />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save</Button>
        </div>
      </div>
    </div>
  );
};
