import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      toast.error(error instanceof Error ? error.message : t("referralPerson.errors.loadFailed"));
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
      toast.success(t("referralPerson.messages.ruleStatusUpdated"));
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("referralPerson.errors.ruleStatusFailed"));
    }
  };

  const handlePersonToggle = async () => {
    if (!id || !person) return;
    try {
      if (person.status === "Active") await deactivateReferralPerson(id);
      else await activateReferralPerson(id);
      toast.success(t("referralPerson.messages.statusUpdated"));
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("referralPerson.errors.statusFailed"));
    }
  };

  const ruleColumns = useMemo(
    () => [
      { accessorKey: "serviceName", header: t("referralPerson.rules.service") },
      { accessorKey: "serviceId", header: t("referralPerson.rules.serviceId") },
      { accessorKey: "commissionPercent", header: t("referralPerson.rules.commissionPercent") },
      { accessorKey: "effectiveFrom", header: t("referralPerson.rules.effectiveFrom") },
      { accessorKey: "effectiveTo", header: t("referralPerson.rules.effectiveTo") },
      { accessorKey: "status", header: t("referralPerson.fields.status"), cell: ({ row }: any) => t(`referralPerson.statuses.${String(row.original.status).toLowerCase()}`, { defaultValue: row.original.status }) },
      {
        id: "actions",
        header: t("common.actions"),
        cell: ({ row }: any) => (
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" size="small" onClick={() => handleRuleToggle(row.original.id)}>
              {row.original.status === "Active" ? t("referralPerson.actions.deactivate") : t("referralPerson.actions.activate")}
            </Button>
          </div>
        ),
      },
    ],
    [handleRuleToggle, t],
  );

  if (loading) {
    return <div style={{ padding: 24 }}><SectionHeader title={t("referralPerson.details.title")} goBack />{t("referralPerson.form.loading")}</div>;
  }

  if (!person) {
    return <div style={{ padding: 24 }}><SectionHeader title={t("referralPerson.details.title")} goBack />{t("referralPerson.details.noData")}</div>;
  }

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      <SectionHeader
        title={`${person.name} (${person.code})`}
        goBack
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" onClick={() => navigate(`/referral-persons/${person.id}/edit`)}>
              {t("referralPerson.actions.edit")}
            </Button>
            <Button variant="secondary" onClick={handlePersonToggle}>
              {person.status === "Active" ? t("referralPerson.actions.deactivate") : t("referralPerson.actions.activate")}
            </Button>
          </div>
        }
      />

      <div style={{ display: "grid", gap: 12, maxWidth: 720 }}>
        <div><strong>{t("referralPerson.fields.status")}:</strong> {t(`referralPerson.statuses.${String(person.status).toLowerCase()}`, { defaultValue: person.status })}</div>
        <div><strong>{t("referralPerson.fields.code")}:</strong> {person.code}</div>
        <div><strong>{t("referralPerson.fields.name")}:</strong> {person.name}</div>
        <div><strong>{t("referralPerson.fields.phone")}:</strong> {person.phone || "—"}</div>
        <div><strong>{t("referralPerson.fields.email")}:</strong> {person.email || "—"}</div>
        <div><strong>{t("referralPerson.details.created")}:</strong> {new Date(person.createdAt).toLocaleString()}</div>
        <div><strong>{t("referralPerson.details.updated")}:</strong> {person.updatedAt ? new Date(person.updatedAt).toLocaleString() : "—"}</div>
        <div><strong>{t("referralPerson.fields.notes")}:</strong> {person.notes || "—"}</div>
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{t("referralPerson.details.commissionRules")}</h3>
          <Button onClick={() => navigate(`/referral-persons/${person.id}/commission-rules/new`)}>
            {t("referralPerson.actions.addRule")}
          </Button>
        </div>

        <DataTable
          columns={ruleColumns as any}
          data={rules}
          isLoading={false}
          pageSize={10}
          manualPagination={false}
          noResultsText={t("referralPerson.list.empty")}
        />
      </div>
    </div>
  );
};
