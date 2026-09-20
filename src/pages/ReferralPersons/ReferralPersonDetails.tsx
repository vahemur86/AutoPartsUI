import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { SectionHeader } from "@/components/common";
import { Button, DataTable } from "@/ui-kit";
import {
  activateReferralPerson,
  deactivateReferralPerson,
  getReferralPerson,
  getReferralPersonRules,
  toggleReferralPersonRuleStatus,
  type ReferralPersonDto,
  type ReferralPersonRuleDto,
} from "@/services/referralPersons";

export const ReferralPersonDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [person, setPerson] = useState<ReferralPersonDto | null>(null);
  const [rules, setRules] = useState<ReferralPersonRuleDto[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [personData, personRules] = await Promise.all([
        getReferralPerson(id),
        getReferralPersonRules(id),
      ]);
      setPerson(personData);
      setRules(personRules);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load referral person.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const handleRuleToggle = async (ruleId: number) => {
    if (!id) return;
    try {
      const rule = rules.find((item) => item.id === ruleId);
      if (!rule) return;

      await toggleReferralPersonRuleStatus(id, ruleId, rule.status === "Active" ? "Inactive" : "Active");
      toast.success("Commission rule status updated.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update rule status.");
    }
  };

  const handlePersonToggle = async () => {
    if (!id || !person) return;
    try {
      if (person.status === "Active") await deactivateReferralPerson(id);
      else await activateReferralPerson(id);
      toast.success("Referral person status updated.");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update referral person status.");
    }
  };

  const ruleColumns = useMemo(
    () => [
      { accessorKey: "serviceName", header: "Service" },
      { accessorKey: "serviceId", header: "Service ID" },
      { accessorKey: "commissionPercent", header: "Commission %" },
      { accessorKey: "effectiveFrom", header: "Effective From" },
      { accessorKey: "effectiveTo", header: "Effective To" },
      { accessorKey: "status", header: "Status" },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: any) => (
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" size="small" onClick={() => handleRuleToggle(row.original.id)}>
              {row.original.status === "Active" ? "Deactivate" : "Activate"}
            </Button>
          </div>
        ),
      },
    ],
    [handleRuleToggle],
  );

  if (loading) {
    return <div style={{ padding: 24 }}><SectionHeader title="Referral Person" goBack />Loading...</div>;
  }

  if (!person) {
    return <div style={{ padding: 24 }}><SectionHeader title="Referral Person" goBack />No data found.</div>;
  }

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      <SectionHeader
        title={`${person.name} (${person.code})`}
        goBack
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" onClick={() => navigate(`/referral-persons/${person.id}/edit`)}>
              Edit
            </Button>
            <Button variant="secondary" onClick={handlePersonToggle}>
              {person.status === "Active" ? "Deactivate" : "Activate"}
            </Button>
          </div>
        }
      />

      <div style={{ display: "grid", gap: 12, maxWidth: 720 }}>
        <div><strong>Status:</strong> {person.status}</div>
        <div><strong>Code:</strong> {person.code}</div>
        <div><strong>Name:</strong> {person.name}</div>
        <div><strong>Phone:</strong> {person.phone || "—"}</div>
        <div><strong>Email:</strong> {person.email || "—"}</div>
        <div><strong>Created:</strong> {new Date(person.createdAt).toLocaleString()}</div>
        <div><strong>Updated:</strong> {person.updatedAt ? new Date(person.updatedAt).toLocaleString() : "—"}</div>
        <div><strong>Notes:</strong> {person.notes || "—"}</div>
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Commission Rules</h3>
          <Button onClick={() => navigate(`/referral-persons/${person.id}/commission-rules/new`)}>
            Add Rule
          </Button>
        </div>

        <DataTable
          columns={ruleColumns as any}
          data={rules}
          isLoading={false}
          pageSize={10}
          manualPagination={false}
        />
      </div>
    </div>
  );
};
