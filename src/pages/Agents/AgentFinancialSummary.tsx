import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { SectionHeader } from "@/components/common";
import { Button } from "@/ui-kit";
import { agentsService } from "@/services/agents";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { AgentFinancialSummaryDto } from "@/types/agents";
import styles from "./Agents.module.css";

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);

const AgentFinancialSummary = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [summary, setSummary] = useState<AgentFinancialSummaryDto | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      try {
        const data = await agentsService.getAgentFinancialSummary(id);
        setSummary(data);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Failed to load agent financial summary."));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  const progress = useMemo(() => {
    if (!summary || summary.agent.totalAdvancedAmount <= 0) return 0;
    return (summary.agent.totalRepaidAmount / summary.agent.totalAdvancedAmount) * 100;
  }, [summary]);

  if (!summary && !loading) {
    return (
      <div className={styles.page}>
        <SectionHeader title="Agent Financial Summary" goBack />
        <div className={styles.banner}>No financial summary available.</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <SectionHeader
        title={summary ? `${summary.agent.code} — ${summary.agent.name}` : "Agent Financial Summary"}
        goBack
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" size="small" onClick={() => navigate(`/agents/${id}`)}>
              View agent
            </Button>
            <Button variant="secondary" size="small" onClick={() => navigate(`/agents/${id}/powder-deliveries`)}>
              Deliveries
            </Button>
          </div>
        }
      />

      {loading && <div className={styles.banner}>Loading financial summary...</div>}

      {summary && (
        <>
          <section className={styles.dashboardPanel}>
            <div className={styles.dashboardHeader}>
              <div>
                <div className={styles.kicker}>Agent financial overview</div>
                <h3>{summary.agent.name}</h3>
              </div>
              <div className={styles.statusPill}>{summary.agent.status}</div>
            </div>

            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryLabel}>Total advanced</div>
                <div className={styles.summaryValue}>{formatMoney(summary.agent.totalAdvancedAmount)}</div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryLabel}>Total repaid</div>
                <div className={styles.summaryValue}>{formatMoney(summary.agent.totalRepaidAmount)}</div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryLabel}>Outstanding</div>
                <div className={styles.summaryValue}>{formatMoney(summary.agent.outstandingAmount)}</div>
              </div>
            </div>

            <div className={styles.progressCard}>
              <div className={styles.progressHeader}>
                <strong>Debt reduction progress</strong>
                <span>{progress.toFixed(1)}%</span>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${Math.min(progress, 100)}%`, background: progress >= 75 ? "#22c55e" : progress >= 40 ? "#f59e0b" : "#ef4444" }}
                />
              </div>
              <div className={styles.progressMeta}>
                <span>{formatMoney(summary.agent.totalRepaidAmount)} repaid</span>
                <span>{formatMoney(summary.agent.totalAdvancedAmount)} total advanced</span>
              </div>
            </div>
          </section>

          <section className={styles.dashboardGrid}>
            <div className={styles.dashboardCard}>
              <div className={styles.cardHeader}>
                <h4>Contract terms</h4>
              </div>
              <div className={styles.activityList}>
                <div className={styles.activityItem}>
                  <span className={styles.activityLabel}>Contract</span>
                  <strong>{summary.contract.number}</strong>
                </div>
                <div className={styles.activityItem}>
                  <span className={styles.activityLabel}>Status</span>
                  <strong>{summary.contract.status}</strong>
                </div>
                <div className={styles.activityItem}>
                  <span className={styles.activityLabel}>Debt repayment %</span>
                  <strong>{summary.contract.debtRepaymentPercent ?? 0}%</strong>
                </div>
                <div className={styles.activityItem}>
                  <span className={styles.activityLabel}>Agent payout %</span>
                  <strong>{summary.contract.agentPayoutPercent ?? 0}%</strong>
                </div>
                <div className={styles.activityItem}>
                  <span className={styles.activityLabel}>Default repayment period</span>
                  <strong>{summary.contract.defaultRepaymentPeriodDays ?? 0} days</strong>
                </div>
                <div className={styles.activityItem}>
                  <span className={styles.activityLabel}>Maximum extensions</span>
                  <strong>{summary.contract.maximumExtensions ?? 0}</strong>
                </div>
              </div>
            </div>

            <div className={styles.dashboardCard}>
              <div className={styles.cardHeader}>
                <h4>Recent deliveries</h4>
              </div>
              {summary.recentDeliveries.length === 0 ? (
                <div className={styles.emptyState}>No recent deliveries.</div>
              ) : (
                <div className={styles.contractList}>
                  {summary.recentDeliveries.map((delivery) => (
                    <div key={delivery.id} className={styles.contractRow}>
                      <div className={styles.contractMain}>
                        <strong>{delivery.number}</strong>
                        <span>{delivery.status}</span>
                      </div>
                      <div className={styles.contractNumbers}>
                        <div>
                          <small>Date</small>
                          <strong>{delivery.date ? new Date(delivery.date).toLocaleDateString() : "—"}</strong>
                        </div>
                        <div>
                          <small>Value</small>
                          <strong>{formatMoney(delivery.valueAmd)}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.dashboardCard}>
              <div className={styles.cardHeader}>
                <h4>Recent repayments</h4>
              </div>
              {summary.recentRepayments.length === 0 ? (
                <div className={styles.emptyState}>No recent repayments.</div>
              ) : (
                <div className={styles.contractList}>
                  {summary.recentRepayments.map((repayment) => (
                    <div key={repayment.id} className={styles.contractRow}>
                      <div className={styles.contractMain}>
                        <strong>{repayment.number}</strong>
                        <span>{repayment.source}</span>
                      </div>
                      <div className={styles.contractNumbers}>
                        <div>
                          <small>Date</small>
                          <strong>{repayment.date ? new Date(repayment.date).toLocaleDateString() : "—"}</strong>
                        </div>
                        <div>
                          <small>Repaid</small>
                          <strong>{formatMoney(repayment.debtRepaymentAmd)}</strong>
                        </div>
                        <div>
                          <small>Outstanding after</small>
                          <strong>{formatMoney(repayment.outstandingAfterAmd)}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.dashboardCard}>
              <div className={styles.cardHeader}>
                <h4>Advances</h4>
              </div>
              {summary.advances.length === 0 ? (
                <div className={styles.emptyState}>No advances found.</div>
              ) : (
                <div className={styles.contractList}>
                  {summary.advances.map((advance) => (
                    <div key={advance.id} className={styles.contractRow}>
                      <div className={styles.contractMain}>
                        <strong>{advance.number}</strong>
                        <span>{advance.status}</span>
                      </div>
                      <div className={styles.contractNumbers}>
                        <div>
                          <small>Date</small>
                          <strong>{advance.date ? new Date(advance.date).toLocaleDateString() : "—"}</strong>
                        </div>
                        <div>
                          <small>Amount</small>
                          <strong>{formatMoney(advance.amount)}</strong>
                        </div>
                        <div>
                          <small>Outstanding</small>
                          <strong>{formatMoney(advance.outstanding)}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default AgentFinancialSummary;
