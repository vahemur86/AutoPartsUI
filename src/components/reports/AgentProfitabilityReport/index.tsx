import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { SectionHeader } from "@/components/common";
import { Button, DataTable, Select, TextField } from "@/ui-kit";
import styles from "./AgentProfitabilityReport.module.css";
import { agentsService } from "@/services/agents";
import { capitalSourcesService } from "@/services/capitalSources";
import { fundingAnalyticsService } from "@/services/fundingAnalytics";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { AgentDto } from "@/types/agents";
import type { CapitalSourceDto } from "@/types/capitalSources";
import type { AgentProfitabilityAnalyticsDto } from "@/types/fundingAnalytics";

const money = (value?: number | null) => {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value ?? 0);

  return `֏ ${formatted}`;
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString();
};

const toIsoDate = (value?: string) => {
  if (!value) return undefined;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
};

const Detail = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className={styles.detail}>
    <span>{label}</span>
    <strong>{value ?? "-"}</strong>
  </div>
);

const Value = ({ value, negative }: { value: number | null | undefined; negative?: boolean }) => (
  <span className={negative && Number(value ?? 0) < 0 ? styles.profitNegative : styles.profitPositive}>
    {money(value)}
  </span>
);

interface AgentProfitabilityReportProps {
  agentId?: string;
}

export const AgentProfitabilityReport = ({ agentId: initialAgentId }: AgentProfitabilityReportProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();

  const [agents, setAgents] = useState<AgentDto[]>([]);
  const [capitalSources, setCapitalSources] = useState<CapitalSourceDto[]>([]);
  const [report, setReport] = useState<AgentProfitabilityAnalyticsDto | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [agentId, setAgentId] = useState(initialAgentId ?? id ?? "");
  const [capitalSourceId, setCapitalSourceId] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);

  const loadLookups = useCallback(async () => {
    try {
      const [agentResult, capitalResult] = await Promise.all([
        agentsService.getAgents({ page: 1, pageSize: 500, status: 0 }),
        capitalSourcesService.listCapitalSources({ page: 1, pageSize: 200, status: "Active" }),
      ]);
      setAgents(agentResult.results ?? []);
      setCapitalSources(capitalResult.results ?? []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("reports.agentProfitability.loadFailed")));
    }
  }, [t]);

  useEffect(() => {
    void loadLookups();
  }, [loadLookups]);

  const loadReport = useCallback(async () => {
    if (fromDate && toDate && new Date(`${fromDate}T00:00:00`) > new Date(`${toDate}T00:00:00`)) {
      toast.error(t("fundingAnalytics.validation.dateRange"));
      return;
    }

    setLoading(true);
    try {
      const result = await fundingAnalyticsService.getGlobalAgentProfitabilityAnalytics({
        fromDate: toIsoDate(fromDate),
        toDate: toIsoDate(toDate),
        agentId: agentId || undefined,
        capitalSourceId: capitalSourceId || undefined,
        page,
        pageSize,
      });
      setReport(result);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("reports.agentProfitability.loadFailed")));
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, agentId, capitalSourceId, page, pageSize, t]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const getAgentLabel = useCallback((agentIdValue?: string | null) => {
    const agent = agents.find((item) => item.id === agentIdValue);
    if (!agent) return agentIdValue || t("common.notSpecified");
    return `${agent.code} - ${agent.customer?.fullName || agent.phone || agent.code}`;
  }, [agents, t]);

  const columns = useMemo(
    () => [
      ...(!initialAgentId ? [{ accessorKey: "agentId", header: t("reports.agentProfitability.columns.agent"), cell: ({ row }: any) => getAgentLabel(row.original.agentId) }] : []),
      { accessorKey: "advanceDate", header: t("reports.agentProfitability.columns.advanceDate"), cell: ({ row }: any) => formatDate(row.original.advanceDate) },
      { accessorKey: "originalAdvanceAmount", header: t("reports.agentProfitability.columns.originalAmount"), cell: ({ row }: any) => `${money(row.original.originalAdvanceAmount)}` },
      { accessorKey: "currentOutstandingAdvance", header: t("reports.agentProfitability.columns.outstandingAmount"), cell: ({ row }: any) => `${money(row.original.currentOutstandingAdvance)}` },
      { accessorKey: "status", header: t("reports.agentProfitability.columns.status"), cell: ({ row }: any) => <span className={styles.statusBadge}>{row.original.status || "-"}</span> },
      { accessorKey: "totalAcceptedPowderValue", header: t("reports.agentProfitability.columns.acceptedPowderValue"), cell: ({ row }: any) => `${money(row.original.totalAcceptedPowderValue)}` },
      { accessorKey: "totalKitcoValue", header: t("reports.agentProfitability.columns.kitcoValue"), cell: ({ row }: any) => `${money(row.original.totalKitcoValue)}` },
      { accessorKey: "totalAgentPayout", header: t("reports.agentProfitability.columns.agentPayout"), cell: ({ row }: any) => `${money(row.original.totalAgentPayout)}` },
      { accessorKey: "grossCatalystMargin", header: t("reports.agentProfitability.columns.grossMargin"), cell: ({ row }: any) => <Value value={row.original.grossCatalystMargin} negative /> },
      { accessorKey: "fundingCost", header: t("reports.agentProfitability.columns.fundingCost"), cell: ({ row }: any) => <Value value={row.original.fundingCost} negative /> },
      { accessorKey: "netProfitLoss", header: t("reports.agentProfitability.columns.netProfitLoss"), cell: ({ row }: any) => <span className={row.original.netProfitLoss < 0 ? styles.profitNegative : styles.profitPositive}>{money(row.original.netProfitLoss)}</span> },
      { accessorKey: "roiPercent", header: t("reports.agentProfitability.columns.roi"), cell: ({ row }: any) => <span className={row.original.roiPercent < 0 ? styles.profitNegative : styles.profitPositive}>{Number(row.original.roiPercent ?? 0).toFixed(2)}%</span> },
      {
        id: "actions",
        header: t("common.actions"),
        cell: ({ row }: any) => (
          <Button size="small" variant="secondary" onClick={() => navigate(`/agents/cash-powder/advances/${row.original.agentAdvanceId}`)}>
            {t("common.details")}
          </Button>
        ),
      },
    ],
    [getAgentLabel, initialAgentId, navigate, t],
  );

  const renderAdvanceDetails = ({ row }: { row: any }) => {
    const advance = row.original;
    const isPositive = advance.netProfitLoss >= 0;
    const noPowder = Number(advance.totalAcceptedPowderValue ?? 0) === 0;

    return (
      <div className={styles.detailPanel}>
        <div className={styles.detailHeader}>
          <div>
            <span className={styles.detailEyebrow}>{t("reports.agentProfitability.details.advance")}</span>
          </div>
          <span className={`${styles.detailOutcome} ${isPositive ? styles.profitPositive : styles.profitNegative}`}>
            {isPositive ? t("reports.agentProfitability.details.profit") : t("reports.agentProfitability.details.loss")}
          </span>
        </div>

        <div className={styles.detailGrid}>
          <Detail label={t("reports.agentProfitability.details.agent")} value={getAgentLabel(advance.agentId)} />
          <Detail label={t("reports.agentProfitability.details.contract")} value={advance.agentContractId || t("common.notSpecified")} />
          <Detail label={t("reports.agentProfitability.details.originalAmount")} value={`${money(advance.originalAdvanceAmount)}`} />
          <Detail label={t("reports.agentProfitability.details.outstandingAmount")} value={`${money(advance.currentOutstandingAdvance)}`} />
          <Detail label={t("reports.agentProfitability.details.daysOutstanding")} value={advance.totalDaysOutstanding} />
          <Detail label={t("reports.agentProfitability.details.advanceDate")} value={formatDate(advance.advanceDate)} />
          <Detail label={t("reports.agentProfitability.details.closedDate")} value={formatDate(advance.closedDate)} />
          <Detail label={t("reports.agentProfitability.details.status")} value={advance.status || "-"} />
          <Detail label={t("reports.agentProfitability.details.acceptedPowderValue")} value={`${money(advance.totalAcceptedPowderValue)}`} />
          <Detail label={t("reports.agentProfitability.details.kitcoValue")} value={`${money(advance.totalKitcoValue)}`} />
          <Detail label={t("reports.agentProfitability.details.agentPayout")} value={`${money(advance.totalAgentPayout)}`} />
          <Detail label={t("reports.agentProfitability.details.grossMargin")} value={<span className={advance.grossCatalystMargin < 0 ? styles.profitNegative : styles.profitPositive}>{money(advance.grossCatalystMargin)}</span>} />
          <Detail label={t("reports.agentProfitability.details.fundingCost")} value={<span className={advance.fundingCost < 0 ? styles.profitNegative : styles.profitPositive}>{money(advance.fundingCost)}</span>} />
          <Detail label={t("reports.agentProfitability.details.netProfitLoss")} value={<span className={advance.netProfitLoss < 0 ? styles.profitNegative : styles.profitPositive}>{money(advance.netProfitLoss)}</span>} />
          <Detail label={t("reports.agentProfitability.details.roi")} value={<span className={advance.roiPercent < 0 ? styles.profitNegative : styles.profitPositive}>{Number(advance.roiPercent ?? 0).toFixed(2)}%</span>} />
        </div>

        <div className={styles.detailSections}>
          <section>
            <h3>{t("reports.agentProfitability.details.allocations")}</h3>
            {(advance.allocations ?? []).length ? (
              <DataTable
                columns={[
                  { accessorKey: "capitalSourceId", header: t("reports.agentProfitability.details.capitalSource") },
                  { accessorKey: "allocatedPrincipal", header: t("reports.agentProfitability.details.allocatedPrincipal"), cell: ({ row }: any) => money(row.original.allocatedPrincipal) },
                  { accessorKey: "outstandingPrincipal", header: t("reports.agentProfitability.details.outstandingPrincipal"), cell: ({ row }: any) => money(row.original.outstandingPrincipal) },
                  { accessorKey: "annualInterestRate", header: t("reports.agentProfitability.details.interestRate"), cell: ({ row }: any) => `${Number(row.original.annualInterestRate ?? 0).toFixed(2)}%` },
                  { accessorKey: "fundingCost", header: t("reports.agentProfitability.details.fundingCost"), cell: ({ row }: any) => money(row.original.fundingCost) },
                  { accessorKey: "daysOutstanding", header: t("reports.agentProfitability.details.daysOutstanding"), cell: ({ row }: any) => row.original.daysOutstanding ?? "-" },
                ] as any}
                data={advance.allocations ?? []}
                pageSize={10}
                noResultsText={t("reports.agentProfitability.details.noAllocations")}
              />
            ) : (
              <p className={styles.emptyDetail}>{t("reports.agentProfitability.details.noAllocations")}</p>
            )}
          </section>

          <section>
            <h3>{t("reports.agentProfitability.details.dailyHistory")}</h3>
            {(advance.dailyHistory ?? []).length ? (
              <DataTable
                columns={[
                  { accessorKey: "date", header: t("reports.agentProfitability.details.date"), cell: ({ row }: any) => formatDate(row.original.date) },
                  { accessorKey: "dailyFundingCost", header: t("reports.agentProfitability.details.dailyFundingCost"), cell: ({ row }: any) => money(row.original.dailyFundingCost) },
                  { accessorKey: "cumulativeFundingCost", header: t("reports.agentProfitability.details.cumulativeFundingCost"), cell: ({ row }: any) => money(row.original.cumulativeFundingCost) },
                  { accessorKey: "outstandingPrincipal", header: t("reports.agentProfitability.details.outstandingPrincipal"), cell: ({ row }: any) => money(row.original.outstandingPrincipal) },
                ] as any}
                data={advance.dailyHistory ?? []}
                pageSize={10}
                noResultsText={t("reports.agentProfitability.details.noHistory")}
              />
            ) : (
              <p className={styles.emptyDetail}>{t("reports.agentProfitability.details.noHistory")}</p>
            )}
          </section>
        </div>

        {noPowder && (
          <div className={styles.noPowderMessage}>
            <strong>{t("reports.agentProfitability.details.noPowderTitle")}</strong>
            <span>{t("reports.agentProfitability.details.noPowderMessage")}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.root}>
      <div className={styles.reportHeader}>
        <SectionHeader title={t("reports.agentProfitability.title")} />
        <span className={styles.headerBadge}>{t("reports.agentProfitability.live")}</span>
      </div>

      <div className={styles.filterBar}>
        <TextField aria-label={t("fundingAnalytics.filters.fromDate")} type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
        <TextField aria-label={t("fundingAnalytics.filters.toDate")} type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
        <Select value={agentId} onChange={(event) => { setAgentId(event.target.value); setPage(1); }}>
          <option value="">{t("reports.agentProfitability.filters.allAgents")}</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>{agent.code} - {agent.customer?.fullName || agent.phone || agent.code}</option>
          ))}
        </Select>
        <Select value={capitalSourceId} onChange={(event) => { setCapitalSourceId(event.target.value); setPage(1); }}>
          <option value="">{t("reports.agentProfitability.filters.allCapitalSources")}</option>
          {capitalSources.map((source) => (
            <option key={source.id} value={source.id}>{source.code} - {source.name}</option>
          ))}
        </Select>
        <Select value={String(pageSize)} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}>
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
        </Select>
      </div>

      {report && (
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>{t("reports.agentProfitability.summary.totalCapital")}</div>
            <div className={styles.kpiValue}>{money(report.totalCapital)}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>{t("reports.agentProfitability.summary.totalOutstandingCapital")}</div>
            <div className={styles.kpiValue}>{money(report.totalOutstandingCapital)}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>{t("reports.agentProfitability.summary.totalFundingCost")}</div>
            <div className={styles.kpiValue}>{money(report.totalFundingCost)}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>{t("reports.agentProfitability.summary.totalAgentFunding")}</div>
            <div className={styles.kpiValue}>{money(report.totalAgentFunding)}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>{t("reports.agentProfitability.summary.totalAgentOutstanding")}</div>
            <div className={styles.kpiValue}>{money(report.totalAgentOutstanding)}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>{t("reports.agentProfitability.summary.totalKitcoValue")}</div>
            <div className={styles.kpiValue}>{money(report.totalKitcoValue)}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>{t("reports.agentProfitability.summary.totalAgentPayout")}</div>
            <div className={styles.kpiValue}>{money(report.totalAgentPayout)}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>{t("reports.agentProfitability.summary.totalGrossCatalystMargin")}</div>
            <div className={styles.kpiValue}>{money(report.totalGrossCatalystMargin)}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>{t("reports.agentProfitability.summary.totalNetProfitLoss")}</div>
            <div className={`${styles.kpiValue} ${report.totalNetProfitLoss < 0 ? styles.profitNegative : styles.profitPositive}`}>{money(report.totalNetProfitLoss)}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>{t("reports.agentProfitability.summary.roi")}</div>
            <div className={`${styles.kpiValue} ${report.roiPercent < 0 ? styles.profitNegative : styles.profitPositive}`}>{Number(report.roiPercent ?? 0).toFixed(2)}%</div>
          </div>
        </div>
      )}

      <div className={styles.tableWrap}>
        <DataTable
          columns={columns as any}
          data={report?.advances?.results ?? []}
          isLoading={loading}
          manualPagination
          pageCount={Math.max(1, Math.ceil((report?.advances?.totalItems ?? 0) / pageSize))}
          pageIndex={Math.max(page - 1, 0)}
          onPaginationChange={(newIndex) => setPage(newIndex + 1)}
          noResultsText={t("reports.agentProfitability.empty")}
          loadingText={t("common.loading")}
          renderSubComponent={renderAdvanceDetails}
        />
      </div>
    </div>
  );
};
