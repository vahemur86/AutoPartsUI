import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { SectionHeader } from "@/components/common";
import { Button, TextField, Textarea } from "@/ui-kit";
import {
  approveReferralCommission,
  getReferralCommission,
  payReferralCommission,
  rejectReferralCommission,
  type ReferralCommissionDto,
} from "@/services/referralCommissions";

export const ReferralCommissionDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [commission, setCommission] = useState<ReferralCommissionDto | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [paymentReference, setPaymentReference] = useState("");

  const load = async () => {
    if (!id) return;
    const result = await getReferralCommission(id);
    setCommission(result);
  };

  useEffect(() => {
    void load();
  }, [id]);

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
    return <div style={{ padding: 24 }}><SectionHeader title={t("referralCommissions.details.title")} goBack />{t("common.loading")}</div>;
  }

  return (
    <div style={{ padding: 24, display: "grid", gap: 20 }}>
      <SectionHeader
        title={t("referralCommissions.details.number", { id: commission.id })}
        goBack
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            {statusActions.includes("Approve") && (
              <Button onClick={handleApprove} disabled={actionBusy}>{t("referralCommissions.actions.approve")}</Button>
            )}
            {statusActions.includes("Reject") && (
              <Button variant="secondary" onClick={handleReject} disabled={actionBusy}>{t("referralCommissions.actions.reject")}</Button>
            )}
            {statusActions.includes("Pay") && (
              <Button onClick={handlePay} disabled={actionBusy}>{t("referralCommissions.actions.pay")}</Button>
            )}
          </div>
        }
      />

      <div style={{ display: "grid", gap: 12, maxWidth: 800 }}>
        <div><strong>{t("referralCommissions.fields.status")}:</strong> {t(`referralCommissions.statuses.${commission.status.toLowerCase()}`, { defaultValue: commission.status })}</div>
        <div><strong>{t("referralCommissions.fields.orderId")}:</strong> {commission.serviceOrderId}</div>
        <div><strong>{t("referralCommissions.fields.referralPerson")}:</strong> {commission.referralPersonName}</div>
        <div><strong>{t("referralCommissions.fields.service")}:</strong> {commission.serviceName}</div>
        <div><strong>{t("referralCommissions.fields.servicePrice")}:</strong> ${commission.servicePrice.toFixed(2)}</div>
        <div><strong>{t("referralCommissions.fields.commissionPercent")}:</strong> {commission.commissionPercent}%</div>
        <div><strong>{t("referralCommissions.fields.commissionAmount")}:</strong> ${commission.commissionAmount.toFixed(2)}</div>
        <div><strong>{t("referralCommissions.fields.created")}:</strong> {new Date(commission.createdAt).toLocaleString()}</div>
        {commission.approvedAt && <div><strong>{t("referralCommissions.fields.approved")}:</strong> {new Date(commission.approvedAt).toLocaleString()}</div>}
        {commission.paidAt && <div><strong>{t("referralCommissions.fields.paid")}:</strong> {new Date(commission.paidAt).toLocaleString()}</div>}
        {commission.rejectedAt && <div><strong>{t("referralCommissions.fields.rejected")}:</strong> {new Date(commission.rejectedAt).toLocaleString()}</div>}
      </div>

      {(commission.status === "Pending" || commission.status === "Approved") && (
        <div style={{ display: "grid", gap: 12, maxWidth: 640 }}>
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
      )}
    </div>
  );
};
