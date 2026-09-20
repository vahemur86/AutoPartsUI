import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { SectionHeader } from "@/components/common";
import { Button } from "@/ui-kit";
import { repaymentsService, type RepaymentListItemDto } from "@/services/repayments";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import styles from "./RepaymentDetails.module.css";

const money = (value?: number | null) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "AMD",
    maximumFractionDigits: 2,
  }).format(value ?? 0);

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString() : "—");

const RepaymentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [repayment, setRepayment] = useState<RepaymentListItemDto | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      try {
        const data = await repaymentsService.getRepayment(id);
        setRepayment(data);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Failed to load repayment details."));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  return (
    <div className={styles.page}>
      <SectionHeader
        title={repayment?.repaymentNumber ?? "Repayment Details"}
        goBack
        actions={
          <Button variant="secondary" size="small" onClick={() => navigate("/repayments")}>
            Back to repayments
          </Button>
        }
      />

      {loading && <div className={styles.banner}>Loading repayment details...</div>}

      {!loading && !repayment && <div className={styles.banner}>No repayment details were found.</div>}

      {repayment && (
        <div className={styles.content}>
          <section className={styles.card}>
            <h3>Overview</h3>
            <div className={styles.grid}>
              <div><span className={styles.label}>Agent</span><strong>{repayment.agentName || "—"}</strong></div>
              <div><span className={styles.label}>Status</span><strong>{repayment.status || "—"}</strong></div>
              <div><span className={styles.label}>Source</span><strong>{repayment.source || "—"}</strong></div>
              <div><span className={styles.label}>Created</span><strong>{formatDate(repayment.createdAt)}</strong></div>
              <div><span className={styles.label}>Delivery</span><strong>{repayment.deliveryNumber || "—"}</strong></div>
              <div><span className={styles.label}>Intake ID</span><strong>{repayment.intakeId ?? "—"}</strong></div>
            </div>
          </section>

          <section className={styles.card}>
            <h3>Amounts</h3>
            <div className={styles.grid}>
              <div><span className={styles.label}>Delivery value</span><strong>{money(repayment.deliveryValueAmd)}</strong></div>
              <div><span className={styles.label}>Outstanding before</span><strong>{money(repayment.outstandingBeforeAmd)}</strong></div>
              <div><span className={styles.label}>Debt repayment</span><strong>{money(repayment.debtRepaymentAmd)}</strong></div>
              <div><span className={styles.label}>Agent payout</span><strong>{money(repayment.agentPayoutAmd)}</strong></div>
              <div><span className={styles.label}>Outstanding after</span><strong>{money(repayment.outstandingAfterAmd)}</strong></div>
              <div><span className={styles.label}>Percentages</span><strong>{repayment.debtRepaymentPercent ?? 0}% / {repayment.agentPayoutPercent ?? 0}%</strong></div>
            </div>
          </section>

          <section className={styles.card}>
            <h3>Processing details</h3>
            <div className={styles.grid}>
              <div><span className={styles.label}>Repayment number</span><strong>{repayment.repaymentNumber}</strong></div>
              <div><span className={styles.label}>Contract ID</span><strong>{repayment.agentContractId || "—"}</strong></div>
              <div><span className={styles.label}>Advance ID</span><strong>{repayment.agentAdvanceId || "—"}</strong></div>
              <div><span className={styles.label}>Created by</span><strong>{repayment.createdBy || "System"}</strong></div>
              <div><span className={styles.label}>Error</span><strong>{repayment.errorMessage || "—"}</strong></div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default RepaymentDetails;
