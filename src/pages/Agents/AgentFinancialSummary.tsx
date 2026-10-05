import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { SectionHeader } from "@/components/common";
import { Button, TextField } from "@/ui-kit";
import { agentsService } from "@/services/agents";
import { fundingAnalyticsService } from "@/services/fundingAnalytics";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { AgentFinancialSummaryDto } from "@/types/agents";
import type { AgentProfitabilityAnalyticsDto } from "@/types/fundingAnalytics";
import styles from "./Agents.module.css";

const formatMoney = (value: number) => {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  return `֏ ${formatted}`;
};

const AgentFinancialSummary = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [summary, setSummary] = useState<AgentFinancialSummaryDto | null>(null);
  const [profitability, setProfitability] = useState<AgentProfitabilityAnalyticsDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [profitLoading, setProfitLoading] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

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

  useEffect(() => {
    if (!id) return;

    const loadProfitability = async () => {
      if (fromDate && toDate && new Date(`${fromDate}T00:00:00`) > new Date(`${toDate}T00:00:00`)) {
        toast.error(t("fundingAnalytics.validation.dateRange"));
        return;
      }

      setProfitLoading(true);
      try {
        const data = await fundingAnalyticsService.getAgentProfitabilityAnalytics(id, {
          fromDate: fromDate ? new Date(`${fromDate}T00:00:00`).toISOString() : undefined,
          toDate: toDate ? new Date(`${toDate}T23:59:59`).toISOString() : undefined,
        });
        setProfitability(data);
      } catch (error) {
        toast.error(getApiErrorMessage(error, t("fundingAnalytics.errors.agentLoadFailed")));
      } finally {
        setProfitLoading(false);
      }
    };

    void loadProfitability();
  }, [id, fromDate, toDate, t]);

  const progress = useMemo(() => {
    if (!summary || summary.agent.totalAdvancedAmount <= 0) return 0;
    return (summary.agent.totalRepaidAmount / summary.agent.totalAdvancedAmount) * 100;
  }, [summary]);

  const summaryTitle = summary
    ? `${summary.agent.code || "Agent"}${summary.agent.name ? ` — ${summary.agent.name}` : ""}`
    : t("agentFinancialSummary.title");

  const firstContract = summary?.contract ?? null;

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
        title={summaryTitle}
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

      <div className={styles.premiumPanel}>
        <div className={styles.premiumFilterBar}>
          <TextField label={t("fundingAnalytics.filters.fromDate")} type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          <TextField label={t("fundingAnalytics.filters.toDate")} type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
        </div>

        {profitability && (
          <div className={styles.premiumStatsGrid}>
            <div className={styles.summaryCard}><div className={styles.summaryLabel}>{t("fundingAnalytics.fields.totalAgentFunding")}</div><div className={styles.summaryValue}>{formatMoney(profitability.totalAgentFunding)}</div></div>
            <div className={styles.summaryCard}><div className={styles.summaryLabel}>{t("fundingAnalytics.fields.totalAgentOutstanding")}</div><div className={styles.summaryValue}>{formatMoney(profitability.totalAgentOutstanding)}</div></div>
            <div className={styles.summaryCard}><div className={styles.summaryLabel}>{t("fundingAnalytics.fields.totalKitcoValue")}</div><div className={styles.summaryValue}>{formatMoney(profitability.totalKitcoValue)}</div></div>
            <div className={styles.summaryCard}><div className={styles.summaryLabel}>{t("fundingAnalytics.fields.totalAgentPayout")}</div><div className={styles.summaryValue}>{formatMoney(profitability.totalAgentPayout)}</div></div>
            <div className={styles.summaryCard}><div className={styles.summaryLabel}>{t("fundingAnalytics.fields.totalGrossCatalystMargin")}</div><div className={styles.summaryValue}>{formatMoney(profitability.totalGrossCatalystMargin)}</div></div>
            <div className={styles.summaryCard}><div className={styles.summaryLabel}>{t("fundingAnalytics.fields.totalFundingCost")}</div><div className={styles.summaryValue}>{formatMoney(profitability.totalFundingCost)}</div></div>
            <div className={styles.summaryCard}><div className={styles.summaryLabel}>{t("fundingAnalytics.fields.netProfitLoss")}</div><div className={styles.summaryValue}>{formatMoney(profitability.totalNetProfitLoss)}</div></div>
            <div className={styles.summaryCard}><div className={styles.summaryLabel}>{t("fundingAnalytics.fields.roi")}</div><div className={styles.summaryValue}>{Number(profitability.roiPercent ?? 0).toFixed(2)}%</div></div>
          </div>
        )}

        {profitLoading && <div className={styles.banner}>{t("common.loading")}</div>}
      </div>

      {loading && <div className={styles.banner}>{t("agentFinancialSummary.loading")}</div>}

      {summary && (
        <>
          <section className={styles.dashboardPanel}>
            <div className={styles.dashboardHeader}>
              <div>
                <div className={styles.kicker}>{t("agentFinancialSummary.overview")}</div>
                <h3>{summary.agent.name || summary.agent.code || "Agent"}</h3>
              </div>
              <div className={styles.statusPill}>{t(`agents.statuses.${summary.agent.status.toLowerCase()}`, { defaultValue: summary.agent.status || "Active" })}</div>
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
                  <strong>{firstContract?.number || "—"}</strong>
                </div>
                <div className={styles.activityItem}>
                  <span className={styles.activityLabel}>{t("agentFinancialSummary.status")}</span>
                  <strong>{firstContract?.status || summary.agent.status || "Active"}</strong>
                </div>
                <div className={styles.activityItem}>
                  <span className={styles.activityLabel}>{t("agentFinancialSummary.debtRepaymentPercent")}</span>
                  <strong>{firstContract?.debtRepaymentPercent ?? 0}%</strong>
                </div>
                <div className={styles.activityItem}>
                  <span className={styles.activityLabel}>{t("agentFinancialSummary.agentPayoutPercent")}</span>
                  <strong>{firstContract?.agentPayoutPercent ?? 0}%</strong>
                </div>
                <div className={styles.activityItem}>
                  <span className={styles.activityLabel}>{t("agentFinancialSummary.defaultRepaymentPeriod")}</span>
                  <strong>{firstContract?.defaultRepaymentPeriodDays ?? 0} {t("agentFinancialSummary.days")}</strong>
                </div>
                <div className={styles.activityItem}>
                  <span className={styles.activityLabel}>{t("agentFinancialSummary.maximumExtensions")}</span>
                  <strong>{firstContract?.maximumExtensions ?? 0}</strong>
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
