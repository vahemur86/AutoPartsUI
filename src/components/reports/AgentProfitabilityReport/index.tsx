import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
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

const toIsoDate = (value?: string) => {
  if (!value) return undefined;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
};

export const AgentProfitabilityReport = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [agents, setAgents] = useState<AgentDto[]>([]);
  const [capitalSources, setCapitalSources] = useState<CapitalSourceDto[]>([]);
  const [report, setReport] = useState<AgentProfitabilityAnalyticsDto | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [agentId, setAgentId] = useState("");
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

  const columns = useMemo(
    () => [
      { accessorKey: "agentAdvanceId", header: t("reports.agentProfitability.columns.advanceId") },
      { accessorKey: "advanceDate", header: t("reports.agentProfitability.columns.advanceDate"), cell: ({ row }: any) => new Date(row.original.advanceDate).toLocaleDateString() },
      { accessorKey: "originalAdvanceAmount", header: t("reports.agentProfitability.columns.originalAmount"), cell: ({ row }: any) => `${money(row.original.originalAdvanceAmount)} AMD` },
      { accessorKey: "currentOutstandingAdvance", header: t("reports.agentProfitability.columns.outstandingAmount"), cell: ({ row }: any) => `${money(row.original.currentOutstandingAdvance)} AMD` },
      { accessorKey: "status", header: t("reports.agentProfitability.columns.status") },
      { accessorKey: "totalAcceptedPowderValue", header: t("reports.agentProfitability.columns.acceptedPowderValue"), cell: ({ row }: any) => `${money(row.original.totalAcceptedPowderValue)} AMD` },
      { accessorKey: "totalKitcoValue", header: t("reports.agentProfitability.columns.kitcoValue"), cell: ({ row }: any) => `${money(row.original.totalKitcoValue)} AMD` },
      { accessorKey: "totalAgentPayout", header: t("reports.agentProfitability.columns.agentPayout"), cell: ({ row }: any) => `${money(row.original.totalAgentPayout)} AMD` },
      { accessorKey: "grossCatalystMargin", header: t("reports.agentProfitability.columns.grossMargin"), cell: ({ row }: any) => `${money(row.original.grossCatalystMargin)} AMD` },
      { accessorKey: "fundingCost", header: t("reports.agentProfitability.columns.fundingCost"), cell: ({ row }: any) => `${money(row.original.fundingCost)} AMD` },
      { accessorKey: "netProfitLoss", header: t("reports.agentProfitability.columns.netProfitLoss"), cell: ({ row }: any) => `${money(row.original.netProfitLoss)} AMD` },
      { accessorKey: "roiPercent", header: t("reports.agentProfitability.columns.roi"), cell: ({ row }: any) => `${Number(row.original.roiPercent ?? 0).toFixed(2)}%` },
      {
        id: "actions",
        header: t("common.actions"),
        cell: ({ row }: any) => (
          <Button size="small" variant="secondary" onClick={() => navigate(`/agents/cash-powder/advances/${row.original.agentAdvanceId}`)}>
            {t("common.view")}
          </Button>
        ),
      },
    ],
    [navigate, t],
  );

  return (
    <div className={styles.root}>
      <div className={styles.reportHeader}>
        <SectionHeader title={t("reports.agentProfitability.title")} />
        <span className={styles.headerBadge}>Live analytics</span>
      </div>

      <div className={styles.filterBar}>
        <TextField label={t("fundingAnalytics.filters.fromDate")} type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
        <TextField label={t("fundingAnalytics.filters.toDate")} type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
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
            <div className={styles.kpiValue}>{money(report.totalNetProfitLoss)}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>{t("reports.agentProfitability.summary.roi")}</div>
            <div className={styles.kpiValue}>{Number(report.roiPercent ?? 0).toFixed(2)}%</div>
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
        />
      </div>
    </div>
  );
};
