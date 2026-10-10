import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Banknote, CalendarDays, Check, CircleDollarSign, FileText, Hash, UserRound, Wrench, X } from "lucide-react";

import { SectionHeader } from "@/components/common";
import { Button, TextField, Textarea } from "@/ui-kit";
import {
  approveReferralCommission,
  getReferralCommission,
  payReferralCommission,
  rejectReferralCommission,
  type ReferralCommissionDto,
} from "@/services/referralCommissions";
import styles from "./ReferralCommissionDetails.module.css";
import sharedStyles from "./ReferralPersons.module.css";
import actionStyles from "./ReferralActions.module.css";

export const ReferralCommissionDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [commission, setCommission] = useState<ReferralCommissionDto | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [paymentReference, setPaymentReference] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    const result = await getReferralCommission(id);
    setCommission(result);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const statusActions = useMemo(() => {
    if (!commission) return [];

    switch (commission.status) {
      case "Pending":
        return ["Approve", "Reject"];
      case "Approved":
        return ["Pay"];
      case "Paid":
        return ["View Receipt"];
      default:
        return [];
    }
  }, [commission]);

  const handleApprove = async () => {
    if (!id) return;
    setActionBusy(true);
    try {
      await approveReferralCommission(id, notes || undefined);
      await load();
      toast.success(t("referralCommissions.messages.approved"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("referralCommissions.errors.approveFailed"));
    } finally {
      setActionBusy(false);
    }
  };

  const handleReject = async () => {
    if (!id) return;
    setActionBusy(true);
    try {
      await rejectReferralCommission(id, reason);
      await load();
      toast.success(t("referralCommissions.messages.rejected"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("referralCommissions.errors.rejectFailed"));
    } finally {
      setActionBusy(false);
    }
  };

  const handlePay = async () => {
    if (!id) return;
    setActionBusy(true);
    try {
      await payReferralCommission(id, { reference: paymentReference || undefined });
      await load();
      toast.success(t("referralCommissions.messages.paid"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("referralCommissions.errors.payFailed"));
    } finally {
      setActionBusy(false);
    }
  };

  if (!commission) {
    return <div className={styles.page}><SectionHeader title={t("referralCommissions.details.title")} goBack /><div className={styles.loadingState}>{t("common.loading")}</div></div>;
  }

  return (
    <div className={styles.page}>
      <SectionHeader
        title={t("referralCommissions.details.number", { id: commission.id })}
        goBack
        actions={
          <div className={styles.headerActions}>
            {statusActions.includes("Approve") && (
              <Button className={`${actionStyles.referralButton} ${actionStyles.referralSuccess}`} onClick={handleApprove} disabled={actionBusy}><Check size={15} />{t("referralCommissions.actions.approve")}</Button>
            )}
            {statusActions.includes("Reject") && (
              <Button className={`${actionStyles.referralButton} ${actionStyles.referralDanger}`} onClick={handleReject} disabled={actionBusy}><X size={15} />{t("referralCommissions.actions.reject")}</Button>
            )}
            {statusActions.includes("Pay") && (
              <Button className={`${actionStyles.referralButton} ${actionStyles.referralPrimary}`} onClick={handlePay} disabled={actionBusy}><Banknote size={15} />{t("referralCommissions.actions.pay")}</Button>
            )}
          </div>
        }
      />

      <section className={styles.detailPanel}>
        <div className={styles.panelHeading}>
          <span className={styles.panelIcon}><CircleDollarSign size={18} /></span>
          <span className={`${sharedStyles.commissionStatus} ${sharedStyles[`commissionStatus${commission.status}`] ?? ""}`}>
            {t(`referralCommissions.statuses.${commission.status.toLowerCase()}`, { defaultValue: commission.status })}
          </span>
        </div>
        <div className={styles.detailGrid}>
          <div className={styles.detailItem}><span><Hash size={14} />{t("referralCommissions.fields.orderId")}</span><strong>{commission.serviceOrderId}</strong></div>
          <div className={styles.detailItem}><span><UserRound size={14} />{t("referralCommissions.fields.referralPerson")}</span><strong>{commission.referralPersonName}</strong></div>
          <div className={styles.detailItem}><span><Wrench size={14} />{t("referralCommissions.fields.service")}</span><strong>{commission.serviceName}</strong></div>
          <div className={styles.detailItem}><span><Banknote size={14} />{t("referralCommissions.fields.servicePrice")}</span><strong>${commission.servicePrice.toFixed(2)}</strong></div>
          <div className={styles.detailItem}><span><CircleDollarSign size={14} />{t("referralCommissions.fields.commissionPercent")}</span><strong>{commission.commissionPercent}%</strong></div>
          <div className={styles.detailItem}><span><CircleDollarSign size={14} />{t("referralCommissions.fields.commissionAmount")}</span><strong>${commission.commissionAmount.toFixed(2)}</strong></div>
          <div className={styles.detailItem}><span><CalendarDays size={14} />{t("referralCommissions.fields.created")}</span><strong>{new Date(commission.createdAt).toLocaleString()}</strong></div>
          {commission.approvedAt && <div className={styles.detailItem}><span><CalendarDays size={14} />{t("referralCommissions.fields.approved")}</span><strong>{new Date(commission.approvedAt).toLocaleString()}</strong></div>}
          {commission.paidAt && <div className={styles.detailItem}><span><CalendarDays size={14} />{t("referralCommissions.fields.paid")}</span><strong>{new Date(commission.paidAt).toLocaleString()}</strong></div>}
          {commission.rejectedAt && <div className={styles.detailItem}><span><CalendarDays size={14} />{t("referralCommissions.fields.rejected")}</span><strong>{new Date(commission.rejectedAt).toLocaleString()}</strong></div>}
        </div>
      </section>

      {(commission.status === "Pending" || commission.status === "Approved") && (
        <section className={styles.actionPanel}>
          <h3><FileText size={16} />{commission.status === "Pending" ? t("referralCommissions.actions.approve") : t("referralCommissions.actions.pay")}</h3>
          <div className={styles.actionFields}>
          {commission.status === "Pending" && (
            <Textarea
              label={t("referralCommissions.fields.approvalNotes")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          )}

          {commission.status === "Approved" && (
            <>
              <TextField
                label={t("referralCommissions.fields.reference")}
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                icon={<Hash size={15} />}
              />
              <Textarea
                label={t("referralCommissions.fields.paymentNotes")}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </>
          )}

          {commission.status === "Pending" && (
            <Textarea
              label={t("referralCommissions.fields.rejectReason")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          )}
          </div>
        </section>
      )}
    </div>
  );
};
