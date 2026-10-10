import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { BadgeCheck, CalendarDays, Hash, Mail, Pencil, Phone, Power, Plus, UserRound } from "lucide-react";
import type { CellContext, ColumnDef } from "@tanstack/react-table";

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
import styles from "./ReferralPersonDetails.module.css";
import sharedStyles from "./ReferralPersons.module.css";
import actionStyles from "./ReferralActions.module.css";

export const ReferralPersonDetails = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [person, setPerson] = useState<ReferralPersonDto | null>(null);
  const [rules, setRules] = useState<ReferralPersonRuleDto[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
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
  }, [id, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRuleToggle = useCallback(async (ruleId: number) => {
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
  }, [id, load, rules, t]);

  const handlePersonToggle = useCallback(async () => {
    if (!id || !person) return;
    try {
      if (person.status === "Active") await deactivateReferralPerson(id);
      else await activateReferralPerson(id);
      toast.success(t("referralPerson.messages.statusUpdated"));
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("referralPerson.errors.statusFailed"));
    }
  }, [id, load, person, t]);

  const ruleColumns = useMemo<ColumnDef<ReferralPersonRuleDto, unknown>[]>(
    () => [
      { accessorKey: "serviceName", header: t("referralPerson.rules.service") },
      { accessorKey: "serviceId", header: t("referralPerson.rules.serviceId") },
      { accessorKey: "commissionPercent", header: t("referralPerson.rules.commissionPercent") },
      { accessorKey: "effectiveFrom", header: t("referralPerson.rules.effectiveFrom") },
      { accessorKey: "effectiveTo", header: t("referralPerson.rules.effectiveTo") },
      { accessorKey: "status", header: t("referralPerson.fields.status"), cell: ({ row }: CellContext<ReferralPersonRuleDto, unknown>) => t(`referralPerson.statuses.${String(row.original.status).toLowerCase()}`, { defaultValue: row.original.status }) },
      {
        id: "actions",
        header: t("common.actions"),
        cell: ({ row }: CellContext<ReferralPersonRuleDto, unknown>) => (
          <div className={sharedStyles.rowActions}>
            <button
              type="button"
              className={`${sharedStyles.iconAction} ${row.original.status === "Active" ? sharedStyles.iconActionDanger : sharedStyles.iconActionSuccess}`}
              onClick={(event) => {
                event.stopPropagation();
                void handleRuleToggle(row.original.id);
              }}
              aria-label={row.original.status === "Active" ? t("referralPerson.actions.deactivate") : t("referralPerson.actions.activate")}
              title={row.original.status === "Active" ? t("referralPerson.actions.deactivate") : t("referralPerson.actions.activate")}
            >
              <Power size={15} />
            </button>
          </div>
        ),
      },
    ],
    [handleRuleToggle, t],
  );

  if (loading) {
    return <div className={styles.page}><SectionHeader title={t("referralPerson.details.title")} goBack /><div className={styles.loadingState}>{t("referralPerson.form.loading")}</div></div>;
  }

  if (!person) {
    return <div className={styles.page}><SectionHeader title={t("referralPerson.details.title")} goBack /><div className={styles.loadingState}>{t("referralPerson.details.noData")}</div></div>;
  }

  return (
    <div className={styles.page}>
      <SectionHeader
        title={`${person.name} (${person.code})`}
        goBack
        actions={
          <div className={styles.headerActions}>
            <Button
              className={`${actionStyles.referralButton} ${actionStyles.referralPrimary}`}
              onClick={() => navigate(`/referral-persons/${person.id}/edit`)}
            >
              <Pencil size={15} />
              {t("referralPerson.actions.edit")}
            </Button>
            <Button
              className={`${actionStyles.referralButton} ${person.status === "Active" ? actionStyles.referralDanger : actionStyles.referralSuccess}`}
              onClick={handlePersonToggle}
            >
              <Power size={15} />
              {person.status === "Active" ? t("referralPerson.actions.deactivate") : t("referralPerson.actions.activate")}
            </Button>
          </div>
        }
      />

      <div className={styles.profilePanel}>
        <div className={styles.profileHeading}>
          <span className={styles.profileIcon}><UserRound size={19} /></span>
          <div>
            <span className={styles.eyebrow}>{t("header.referralWorkspaceLabel")}</span>
            <h2>{person.name}</h2>
          </div>
          <span className={`${sharedStyles.status} ${person.status === "Active" ? sharedStyles.statusActive : sharedStyles.statusInactive}`}>
            {t(`referralPerson.statuses.${String(person.status).toLowerCase()}`, { defaultValue: person.status })}
          </span>
        </div>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}><span className={styles.infoLabel}><Hash size={14} />{t("referralPerson.fields.code")}</span><strong>{person.code || "—"}</strong></div>
          <div className={styles.infoItem}><span className={styles.infoLabel}><Phone size={14} />{t("referralPerson.fields.phone")}</span><strong>{person.phone || "—"}</strong></div>
          <div className={styles.infoItem}><span className={styles.infoLabel}><Mail size={14} />{t("referralPerson.fields.email")}</span><strong>{person.email || "—"}</strong></div>
          <div className={styles.infoItem}><span className={styles.infoLabel}><CalendarDays size={14} />{t("referralPerson.details.created")}</span><strong>{new Date(person.createdAt).toLocaleString()}</strong></div>
          <div className={styles.infoItem}><span className={styles.infoLabel}><CalendarDays size={14} />{t("referralPerson.details.updated")}</span><strong>{person.updatedAt ? new Date(person.updatedAt).toLocaleString() : "—"}</strong></div>
          <div className={`${styles.infoItem} ${styles.infoWide}`}><span className={styles.infoLabel}><BadgeCheck size={14} />{t("referralPerson.fields.notes")}</span><strong>{person.notes || "—"}</strong></div>
        </div>
      </div>

      <div className={styles.rulesPanel}>
        <div className={styles.sectionHeader}>
          <h3>{t("referralPerson.details.commissionRules")}</h3>
            <Button className={`${actionStyles.referralButton} ${actionStyles.referralPrimary}`} onClick={() => navigate(`/referral-persons/${person.id}/commission-rules/new`)}>
            <Plus size={15} />
            {t("referralPerson.actions.addRule")}
          </Button>
        </div>

        <div className={sharedStyles.tableShell}>
          <DataTable
            columns={ruleColumns}
            data={rules}
            isLoading={false}
            pageSize={10}
            manualPagination={false}
            noResultsText={t("referralPerson.list.empty")}
          />
        </div>
      </div>
    </div>
  );
};
