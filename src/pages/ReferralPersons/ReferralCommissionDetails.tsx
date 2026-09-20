import { useEffect, useMemo, useState } from "react";
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
      toast.success("Commission approved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve commission.");
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
      toast.success("Commission rejected");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reject commission.");
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
      toast.success("Commission paid successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to pay commission.");
    } finally {
      setActionBusy(false);
    }
  };

  if (!commission) {
    return <div style={{ padding: 24 }}><SectionHeader title="Commission Details" goBack />Loading...</div>;
  }

  return (
    <div style={{ padding: 24, display: "grid", gap: 20 }}>
      <SectionHeader
        title={`Commission #${commission.id}`}
        goBack
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            {statusActions.includes("Approve") && (
              <Button onClick={handleApprove} disabled={actionBusy}>Approve</Button>
            )}
            {statusActions.includes("Reject") && (
              <Button variant="secondary" onClick={handleReject} disabled={actionBusy}>Reject</Button>
            )}
            {statusActions.includes("Pay") && (
              <Button onClick={handlePay} disabled={actionBusy}>Pay</Button>
            )}
          </div>
        }
      />

      <div style={{ display: "grid", gap: 12, maxWidth: 800 }}>
        <div><strong>Status:</strong> {commission.status}</div>
        <div><strong>Order ID:</strong> {commission.serviceOrderId}</div>
        <div><strong>Referral Person:</strong> {commission.referralPersonName}</div>
        <div><strong>Service:</strong> {commission.serviceName}</div>
        <div><strong>Service Price:</strong> ${commission.servicePrice.toFixed(2)}</div>
        <div><strong>Commission %:</strong> {commission.commissionPercent}%</div>
        <div><strong>Commission Amount:</strong> ${commission.commissionAmount.toFixed(2)}</div>
        <div><strong>Created:</strong> {new Date(commission.createdAt).toLocaleString()}</div>
        {commission.approvedAt && <div><strong>Approved:</strong> {new Date(commission.approvedAt).toLocaleString()}</div>}
        {commission.paidAt && <div><strong>Paid:</strong> {new Date(commission.paidAt).toLocaleString()}</div>}
        {commission.rejectedAt && <div><strong>Rejected:</strong> {new Date(commission.rejectedAt).toLocaleString()}</div>}
      </div>

      {(commission.status === "Pending" || commission.status === "Approved") && (
        <div style={{ display: "grid", gap: 12, maxWidth: 640 }}>
          {commission.status === "Pending" && (
            <Textarea
              label="Approval Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          )}

          {commission.status === "Approved" && (
            <>
              <TextField
                label="Reference"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
              />
              <Textarea
                label="Payment Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </>
          )}

          {commission.status === "Pending" && (
            <Textarea
              label="Reject Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          )}

        </div>
      )}
    </div>
  );
};
