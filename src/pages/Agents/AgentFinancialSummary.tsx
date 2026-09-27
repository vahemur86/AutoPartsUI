import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
        toast.error(getApiErrorMessage(error, t("agents.errors.financialSummaryFailed")));
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
        <SectionHeader title={t("agentFinancialSummary.title")} goBack />
        <div className={styles.banner}>{t("agentFinancialSummary.empty")}</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <SectionHeader
        title={summary ? `${summary.agent.code} — ${summary.agent.name}` : t("agentFinancialSummary.title")}
        goBack
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" size="small" onClick={() => navigate(`/agents/${id}`)}>
              {t("agentFinancialSummary.viewAgent")}
            </Button>
            <Button variant="secondary" size="small" onClick={() => navigate(`/agents/${id}/powder-deliveries`)}>
              {t("agentFinancialSummary.deliveries")}
            </Button>
          </div>
        }
      />

      {loading && <div className={styles.banner}>{t("agentFinancialSummary.loading")}</div>}

      {summary && (
        <>
          <section className={styles.dashboardPanel}>
            <div className={styles.dashboardHeader}>
              <div>
                <div className={styles.kicker}>{t("agentFinancialSummary.overview")}</div>
                <h3>{summary.agent.name}</h3>
              </div>
              <div className={styles.statusPill}>{t(`agents.statuses.${summary.agent.status.toLowerCase()}`, { defaultValue: summary.agent.status })}</div>
            </div>

            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryLabel}>{t("agentFinancialSummary.totalAdvanced")}</div>
                <div className={styles.summaryValue}>{formatMoney(summary.agent.totalAdvancedAmount)}</div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryLabel}>{t("agentFinancialSummary.totalRepaid")}</div>
                <div className={styles.summaryValue}>{formatMoney(summary.agent.totalRepaidAmount)}</div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryLabel}>{t("agentFinancialSummary.outstanding")}</div>
                <div className={styles.summaryValue}>{formatMoney(summary.agent.outstandingAmount)}</div>
              </div>
            </div>

            <div className={styles.progressCard}>
              <div className={styles.progressHeader}>
                <strong>{t("agentFinancialSummary.debtReductionProgress")}</strong>
                <span>{progress.toFixed(1)}%</span>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressBar}
                  style={{ width: `${Math.min(progress, 100)}%`, background: progress >= 75 ? "#22c55e" : progress >= 40 ? "#f59e0b" : "#ef4444" }}
                />
              </div>
              <div className={styles.progressMeta}>
                <span>{formatMoney(summary.agent.totalRepaidAmount)} {t("agentFinancialSummary.repaid")}</span>
                <span>{formatMoney(summary.agent.totalAdvancedAmount)} {t("agentFinancialSummary.totalAdvancedCaption")}</span>
              </div>
            </div>
          </section>

          <section className={styles.dashboardGrid}>
            <div className={styles.dashboardCard}>
              <div className={styles.cardHeader}>
                <h4>{t("agentFinancialSummary.contractTerms")}</h4>
              </div>
              <div className={styles.activityList}>
                <div className={styles.activityItem}>
                  <span className={styles.activityLabel}>{t("agentFinancialSummary.contract")}</span>
                  <strong>{summary.contract.number}</strong>
                </div>
                <div className={styles.activityItem}>
                  <span className={styles.activityLabel}>{t("agentFinancialSummary.status")}</span>
                  <strong>{summary.contract.status}</strong>
                </div>
                <div className={styles.activityItem}>
                  <span className={styles.activityLabel}>{t("agentFinancialSummary.debtRepaymentPercent")}</span>
                  <strong>{summary.contract.debtRepaymentPercent ?? 0}%</strong>
                </div>
                <div className={styles.activityItem}>
                  <span className={styles.activityLabel}>{t("agentFinancialSummary.agentPayoutPercent")}</span>
                  <strong>{summary.contract.agentPayoutPercent ?? 0}%</strong>
                </div>
                <div className={styles.activityItem}>
                  <span className={styles.activityLabel}>{t("agentFinancialSummary.defaultRepaymentPeriod")}</span>
                  <strong>{summary.contract.defaultRepaymentPeriodDays ?? 0} {t("agentFinancialSummary.days")}</strong>
                </div>
                <div className={styles.activityItem}>
                  <span className={styles.activityLabel}>{t("agentFinancialSummary.maximumExtensions")}</span>
                  <strong>{summary.contract.maximumExtensions ?? 0}</strong>
                </div>
              </div>
            </div>

            <div className={styles.dashboardCard}>
              <div className={styles.cardHeader}>
                <h4>{t("agentFinancialSummary.recentDeliveries")}</h4>
              </div>
              {summary.recentDeliveries.length === 0 ? (
                <div className={styles.emptyState}>{t("agentFinancialSummary.noRecentDeliveries")}</div>
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
                          <small>{t("agentFinancialSummary.date")}</small>
                          <strong>{delivery.date ? new Date(delivery.date).toLocaleDateString() : "—"}</strong>
                        </div>
                        <div>
                          <small>{t("agentFinancialSummary.value")}</small>
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
                <h4>{t("agentFinancialSummary.recentRepayments")}</h4>
              </div>
              {summary.recentRepayments.length === 0 ? (
                <div className={styles.emptyState}>{t("agentFinancialSummary.noRecentRepayments")}</div>
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
                          <small>{t("agentFinancialSummary.date")}</small>
                          <strong>{repayment.date ? new Date(repayment.date).toLocaleDateString() : "—"}</strong>
                        </div>
                        <div>
                          <small>{t("agentFinancialSummary.repaidAmount")}</small>
                          <strong>{formatMoney(repayment.debtRepaymentAmd)}</strong>
                        </div>
                        <div>
                          <small>{t("agentFinancialSummary.outstandingAfter")}</small>
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
                <h4>{t("agentFinancialSummary.advances")}</h4>
              </div>
              {summary.advances.length === 0 ? (
                <div className={styles.emptyState}>{t("agentFinancialSummary.noAdvances")}</div>
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
                          <small>{t("agentFinancialSummary.date")}</small>
                          <strong>{advance.date ? new Date(advance.date).toLocaleDateString() : "—"}</strong>
                        </div>
                        <div>
                          <small>{t("agentFinancialSummary.amount")}</small>
                          <strong>{formatMoney(advance.amount)}</strong>
                        </div>
                        <div>
                          <small>{t("agentFinancialSummary.outstanding")}</small>
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
