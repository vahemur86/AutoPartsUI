import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { SectionHeader } from "@/components/common";
import { Button, TextField } from "@/ui-kit";
import { repaymentRulesService } from "@/services/repaymentRules";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { CreateRepaymentRuleRequest } from "@/types/repaymentRules";

export const CreateRepaymentRule = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!code.trim()) e.code = "Code is required";
    if (!name.trim()) e.name = "Name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    const payload: CreateRepaymentRuleRequest = { code: code.trim(), name: name.trim(), description: description.trim() || undefined };
    try {
      const created = await repaymentRulesService.createRepaymentRule(payload);
      toast.success("Repayment rule created");
      navigate(`/repayment-rules/${created.id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to create rule"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <SectionHeader title="Create Repayment Rule" goBack />

      <div style={{ marginTop: 16, maxWidth: 640 }}>
        <div style={{ marginBottom: 12 }}>
          <label>Code</label>
          <TextField value={code} onChange={(e) => setCode(e.target.value)} />
          {errors.code && <div style={{ color: "var(--danger)" }}>{errors.code}</div>}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Name</label>
          <TextField value={name} onChange={(e) => setName(e.target.value)} />
          {errors.name && <div style={{ color: "var(--danger)" }}>{errors.name}</div>}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Description</label>
          <TextField value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create"}</Button>
        </div>
      </div>
    </div>
  );
};

export default CreateRepaymentRule;
