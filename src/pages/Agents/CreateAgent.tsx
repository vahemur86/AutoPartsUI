import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { SectionHeader } from "@/components/common";
import { getCustomers } from "@/services/customers";
import { getCustomerTypes } from "@/services/settings/customerTypes";
import { agentsService } from "@/services/agents";
import { Button, Select, TextField, Textarea } from "@/ui-kit";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { Customer } from "@/types/operator";
import type { AgentTypeDto } from "@/types/agents";
import styles from "./Agents.module.css";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  code: "",
  agentTypeId: "",
  address: "",
  notes: "",
};

const customerLabel = (customer: Customer) => customer.fullName || customer.phone;

const getCustomerName = (customer: Customer) => {
  const fullNameParts = (customer.fullName || "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: customer.firstName?.trim() || fullNameParts[0] || "",
    lastName: customer.lastName?.trim() || fullNameParts.slice(1).join(" "),
  };
};

export const CreateAgent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [agentTypes, setAgentTypes] = useState<AgentTypeDto[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [types, customerTypes] = await Promise.all([
          agentsService.getAgentTypes(),
          getCustomerTypes(),
        ]);
        setAgentTypes((types || []).filter((type) => type.isActive));
        const agentCustomerType = (customerTypes || []).find(
          (type: { id: number; code?: string; isActive?: boolean }) => type.isActive !== false && type.code?.toLowerCase() === "agent",
        );
        if (!agentCustomerType) throw new Error("Agent customer type is not configured.");
        const result = await getCustomers({ customerTypeId: agentCustomerType.id, page: 1, pageSize: 100 });
        setCustomers(result.results || []);
      } catch (error) {
        toast.error(getApiErrorMessage(error, t("agents.errors.loadFailed")));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [t]);

  const matchingCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return customers.slice(0, 8);
    return customers
      .filter((customer) => `${customer.fullName || ""} ${customer.phone}`.toLowerCase().includes(query))
      .slice(0, 8);
  }, [customerSearch, customers]);

  const selectCustomer = (customer: Customer) => {
    const { firstName, lastName } = getCustomerName(customer);
    setSelectedCustomer(customer);
    setCustomerSearch("");
    setForm((current) => ({
      ...current,
      firstName,
      lastName,
      email: customer.email?.trim() || "",
    }));
    setErrors((current) => ({ ...current, customer: "" }));
    window.requestAnimationFrame(() => {
      codeInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      codeInputRef.current?.focus();
    });
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!selectedCustomer) nextErrors.customer = t("agents.validation.customerRequired", { defaultValue: "Please select a Customer" });
    if (!form.firstName.trim()) nextErrors.firstName = t("agents.validation.firstNameRequired", { defaultValue: "First Name is required" });
    if (!form.lastName.trim()) nextErrors.lastName = t("agents.validation.lastNameRequired", { defaultValue: "Last Name is required" });
    if (!form.code.trim()) nextErrors.code = t("agents.validation.codeRequired");
    if (!form.agentTypeId) nextErrors.agentTypeId = t("agents.validation.agentTypeRequired", { defaultValue: "Please select an Agent Type" });
    if (form.address.length > 500) nextErrors.address = t("agents.validation.addressTooLong", { defaultValue: "Address cannot exceed 500 characters" });
    if (form.notes.length > 1000) nextErrors.notes = t("agents.validation.notesTooLong", { defaultValue: "Notes cannot exceed 1000 characters" });
    if (errors.customer) nextErrors.customer = errors.customer;
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !selectedCustomer) return;
    setIsSubmitting(true);
    try {
      const createdId = await agentsService.createAgent({
        customerId: selectedCustomer.id,
        code: form.code.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: selectedCustomer.phone,
        email: form.email.trim() || null,
        agentTypeId: form.agentTypeId,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
      });
      toast.success(t("agents.messages.created"));
      navigate(`/agents/${createdId}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("agents.errors.createFailed")));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <SectionHeader title={t("agents.createTitle")} goBack />
      <div className={styles.formCard}>
        <div className={styles.formSection}>
          <h3>{t("agents.sections.customer", { defaultValue: "Customer" })}</h3>
          {selectedCustomer ? (
            <div className={styles.selectedCustomer}>
              <div><strong>{customerLabel(selectedCustomer)}</strong></div>
              <div>{t("agents.fields.phone")}: {selectedCustomer.phone || "—"}</div>
              <div>{t("agents.fields.email")}: {selectedCustomer.email || "—"}</div>
              <div>{t("agents.fields.customerType", { defaultValue: "Customer Type" })}: {selectedCustomer.customerType?.code || "Agent"}</div>
              {errors.customer && <div role="alert" className={styles.error}>{errors.customer}</div>}
              <Button variant="secondary" size="small" onClick={() => setSelectedCustomer(null)}>{t("agents.actions.changeCustomer", { defaultValue: "Change Customer" })}</Button>
            </div>
          ) : (
            <div className={styles.customerPicker}>
              <TextField label={t("agents.fields.customer", { defaultValue: "Select Customer" })} placeholder={t("common.search")} value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)} error={!!errors.customer} helperText={errors.customer} disabled={isLoading} />
              {matchingCustomers.length > 0 && (
                <div className={styles.customerResults}>
                  {matchingCustomers.map((customer) => (
                    <button type="button" key={customer.id} onClick={() => selectCustomer(customer)} className={styles.customerResult}>
                      <strong>{customerLabel(customer)}</strong><span>{customer.phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.formSection}>
          <h3>{t("agents.sections.details", { defaultValue: "Agent Details" })}</h3>
          <div className={styles.formGrid}>
            <TextField label={t("agents.fields.firstName")} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} error={!!errors.firstName} helperText={errors.firstName} maxLength={100} />
            <TextField label={t("agents.fields.lastName")} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} error={!!errors.lastName} helperText={errors.lastName} maxLength={100} />
            <TextField label={t("agents.fields.email")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" maxLength={200} />
            <TextField ref={codeInputRef} label={t("agents.fields.code")} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} error={!!errors.code} helperText={errors.code} />
            <Select label={t("agents.fields.agentType")} value={form.agentTypeId} onChange={(e) => setForm({ ...form, agentTypeId: e.target.value })} error={!!errors.agentTypeId}>
              <option value="">{t("common.select")}</option>
              {agentTypes.map((type) => <option key={type.id} value={type.id}>{type.name} ({type.code})</option>)}
            </Select>
          </div>
          <TextField label={t("agents.fields.address")} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} error={!!errors.address} helperText={errors.address} maxLength={500} />
          <Textarea label={t("agents.fields.notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} error={!!errors.notes} helperText={errors.notes} maxLength={1000} rows={4} />
        </div>

        <div className={styles.formActions}>
          <Button variant="secondary" onClick={() => navigate(-1)}>{t("common.cancel")}</Button>
          <Button onClick={() => void handleSubmit()} disabled={isSubmitting || isLoading}>{isSubmitting ? t("agents.creating") : t("agents.createButton")}</Button>
        </div>
      </div>
    </div>
  );
};

export default CreateAgent;
