import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { Button, DataTable, Modal, TextField, Textarea } from "@/ui-kit";
import { SectionHeader } from "@/components/common";
import { capitalSourcesService } from "@/services/capitalSources";
import { fundingAnalyticsService } from "@/services/fundingAnalytics";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { CapitalSourceDto, CapitalSourceTransactionDto } from "@/types/capitalSources";
import type { CapitalSourceFundingAnalyticsDto, FundingDailyCostDto } from "@/types/fundingAnalytics";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import styles from "./CapitalSources.module.css";

const formatMoney = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatSigned = (type: string, amount: number) => {
  const positiveTypes = ["MoneyReceived", "MoneyReturned", "OtherIncome"];
  const prefix = positiveTypes.includes(type) ? "+" : "-";
  return `${prefix}${formatMoney(amount)}`;
};

export const CapitalSourceDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [source, setSource] = useState<CapitalSourceDto | null>(null);
  const [transactions, setTransactions] = useState<CapitalSourceTransactionDto[]>([]);
  const [fundingAnalytics, setFundingAnalytics] = useState<CapitalSourceFundingAnalyticsDto | null>(null);
  const [fundingHistory, setFundingHistory] = useState<FundingDailyCostDto[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [receiveAmount, setReceiveAmount] = useState("");
  const [receiveDescription, setReceiveDescription] = useState("");
  const [returnAmount, setReturnAmount] = useState("");
  const [returnDescription, setReturnDescription] = useState("");

  const toDateTimeRange = (value: string, endOfDay: boolean) => {
    if (!value) return undefined;
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return undefined;
    if (endOfDay) parsed.setHours(23, 59, 59, 999);
    return parsed.toISOString();
  };

  const load = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [sourceData, history] = await Promise.all([
        capitalSourcesService.getCapitalSource(id),
        capitalSourcesService.getTransactionHistory(id),
      ]);
      setSource(sourceData);
      setTransactions(history ?? []);
      const params = {
        fromDate: toDateTimeRange(fromDate, false),
        toDate: toDateTimeRange(toDate, true),
      };
      try {
        const [analytics, costs] = await Promise.all([
          fundingAnalyticsService.getCapitalSourceFundingAnalytics(id, params),
          fundingAnalyticsService.getCapitalSourceFundingCostHistory(id, params),
        ]);
        setFundingAnalytics(analytics);
        setFundingHistory(costs ?? []);
      } catch (error) {
        setFundingAnalytics(null);
        setFundingHistory([]);
        toast.error(getApiErrorMessage(error, t("fundingAnalytics.errors.capitalSourceLoadFailed")));
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("capitalSources.errors.loadDetailsFailed")));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id, fromDate, toDate, t]);

  const applyFundingFilters = () => {
    if (fromDate && toDate && new Date(`${fromDate}T00:00:00`) > new Date(`${toDate}T00:00:00`)) {
      toast.error(t("fundingAnalytics.validation.dateRange"));
      return;
    }
    void load();
  };

  const fundingHistoryColumns = useMemo(
    () => [
      {
        id: "date",
        header: t("fundingAnalytics.fields.date"),
        cell: ({ row }: any) => new Date(row.original.date).toLocaleDateString(),
      },
      { accessorKey: "outstandingPrincipal", header: t("fundingAnalytics.fields.outstandingPrincipal"), cell: ({ row }: any) => `${formatMoney(row.original.outstandingPrincipal)} AMD` },
      { accessorKey: "annualInterestRate", header: t("fundingAnalytics.fields.annualInterestRate"), cell: ({ row }: any) => `${row.original.annualInterestRate}%` },
      { accessorKey: "dailyFundingCost", header: t("fundingAnalytics.fields.dailyFundingCost"), cell: ({ row }: any) => `${formatMoney(row.original.dailyFundingCost)} AMD` },
      { accessorKey: "cumulativeFundingCost", header: t("fundingAnalytics.fields.cumulativeFundingCost"), cell: ({ row }: any) => `${formatMoney(row.original.cumulativeFundingCost)} AMD` },
    ],
    [t],
  );

  const handleMoneyAction = async (mode: "receive" | "return") => {
    if (!id || !source) return;
    const amountValue = Number(mode === "receive" ? receiveAmount : returnAmount);
    const description = (mode === "receive" ? receiveDescription : returnDescription).trim();
    if (!amountValue || amountValue <= 0) {
      toast.error(t("capitalSources.validation.amountPositive"));
      return;
    }

    setIsActionLoading(true);
    try {
      if (mode === "receive") {
        await capitalSourcesService.receiveMoney(id, { amount: amountValue, description });
        toast.success(t("capitalSources.messages.moneyReceived"));
      } else {
        await capitalSourcesService.returnMoney(id, { amount: amountValue, description });
        toast.success(t("capitalSources.messages.moneyReturned"));
      }
      setReceiveAmount("");
      setReceiveDescription("");
      setReturnAmount("");
      setReturnDescription("");
      setIsReceiveOpen(false);
      setIsReturnOpen(false);
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("capitalSources.errors.moneyActionFailed")));
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStatusAction = async (action: "activate" | "deactivate" | "close") => {
    if (!id) return;
    setIsActionLoading(true);
    try {
      if (action === "activate") await capitalSourcesService.activateCapitalSource(id);
      if (action === "deactivate") await capitalSourcesService.deactivateCapitalSource(id);
      if (action === "close") await capitalSourcesService.closeCapitalSource(id);
      const messageKeys = {
        activate: "capitalSources.messages.activated",
        deactivate: "capitalSources.messages.deactivated",
        close: "capitalSources.messages.closed",
      } as const;
      toast.success(t(messageKeys[action]));
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("capitalSources.errors.actionFailed")));
    } finally {
      setIsActionLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "createdAt",
        header: t("capitalSources.transactions.fields.dateTime"),
        cell: ({ row }: any) => row.original.createdAt ? new Date(row.original.createdAt).toLocaleString() : "—",
      },
      { accessorKey: "type", header: t("capitalSources.fields.type"), cell: ({ row }: any) => t(`capitalSources.transactionTypes.${row.original.type}`, { defaultValue: row.original.type }) },
      {
        accessorKey: "amount",
        header: t("capitalSources.transactions.fields.amount"),
        cell: ({ row }: any) => formatSigned(row.original.type, row.original.amount),
      },
      { accessorKey: "balanceBefore", header: t("capitalSources.transactions.fields.balanceBefore"), cell: ({ row }: any) => formatMoney(row.original.balanceBefore) },
      { accessorKey: "balanceAfter", header: t("capitalSources.transactions.fields.balanceAfter"), cell: ({ row }: any) => formatMoney(row.original.balanceAfter) },
      { accessorKey: "referenceType", header: t("capitalSources.transactions.fields.referenceType") },
      { accessorKey: "referenceId", header: t("capitalSources.transactions.fields.referenceId") },
      { accessorKey: "description", header: t("capitalSources.fields.description") },
      { accessorKey: "createdBy", header: t("capitalSources.transactions.fields.createdBy") },
    ],
    [t],
  );

  if (isLoading || !source) {
    return <div>{t("common.loading")}</div>;
  }

  return (
    <div className={styles.page}>
      <SectionHeader title={source.name} goBack actions={
        <div className={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate(`/capital-sources/${id}/edit`)}>{t("capitalSources.actions.edit")}</Button>
          <Button onClick={() => setIsReceiveOpen(true)}>{t("capitalSources.actions.receiveMoney")}</Button>
          <Button variant="secondary" onClick={() => setIsReturnOpen(true)}>{t("capitalSources.actions.returnMoney")}</Button>
          {source.status === "Inactive" && <Button variant="secondary" onClick={() => void handleStatusAction("activate")}>{t("capitalSources.actions.activate")}</Button>}
          {source.status === "Active" && <Button variant="secondary" onClick={() => void handleStatusAction("deactivate")}>{t("capitalSources.actions.deactivate")}</Button>}
          {source.status !== "Closed" && <Button variant="danger" onClick={() => void handleStatusAction("close")}>{t("capitalSources.actions.close")}</Button>}
        </div>
      } />

      <div className={styles.statsGrid}>
        <div className={styles.contentCard}>
          <div className={styles.statLabel}>{t("capitalSources.fields.currentBalance")}</div>
          <h3 className={styles.statValue}>{formatMoney(source.currentBalance)}</h3>
        </div>
        <div className={styles.contentCard}>
          <div className={styles.statLabel}>{t("capitalSources.fields.initialAmount")}</div>
          <h3 className={styles.statValue}>{formatMoney(source.initialAmount)}</h3>
        </div>
        <div className={styles.contentCard}>
          <div className={styles.statLabel}>{t("capitalSources.fields.type")}</div>
          <h3 className={styles.statValue}>{t(`capitalSources.types.${source.type}`, { defaultValue: source.type })}</h3>
        </div>
        <div className={styles.contentCard}>
          <div className={styles.statLabel}>{t("capitalSources.fields.status")}</div>
          <h3 className={styles.statValue}>{t(`capitalSources.statuses.${source.status}`, { defaultValue: source.status })}</h3>
        </div>
      </div>

      <div className={styles.detailsGrid}>
        <div><strong>{t("capitalSources.fields.code")}:</strong> {source.code}</div>
        <div><strong>{t("capitalSources.fields.interestRate")}:</strong> {source.interestRate != null ? `${source.interestRate}%` : "—"}</div>
        <div><strong>{t("capitalSources.fields.startDate")}:</strong> {source.startDate ? new Date(source.startDate).toLocaleDateString() : "—"}</div>
        <div><strong>{t("capitalSources.fields.endDate")}:</strong> {source.endDate ? new Date(source.endDate).toLocaleDateString() : "—"}</div>
        <div><strong>{t("capitalSources.fields.description")}:</strong> {source.description || "—"}</div>
      </div>

      <section className={styles.analyticsSection}>
        <div className={styles.analyticsHeader}>
          <div>
            <h3>{t("fundingAnalytics.capitalSource.title")}</h3>
            <p>{t("fundingAnalytics.capitalSource.description")}</p>
          </div>
          <div className={styles.analyticsFilters}>
            <TextField label={t("fundingAnalytics.filters.fromDate")} type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            <TextField label={t("fundingAnalytics.filters.toDate")} type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            <Button variant="secondary" onClick={applyFundingFilters} disabled={isLoading}>{t("common.apply")}</Button>
          </div>
        </div>
        {fundingAnalytics && (
          <div className={styles.statsGrid}>
            <div className={styles.contentCard}><div className={styles.statLabel}>{t("fundingAnalytics.fields.originalPrincipal")}</div><h3 className={styles.statValue}>{formatMoney(fundingAnalytics.originalPrincipal)} AMD</h3></div>
            <div className={styles.contentCard}><div className={styles.statLabel}>{t("fundingAnalytics.fields.currentAvailableBalance")}</div><h3 className={styles.statValue}>{formatMoney(fundingAnalytics.currentAvailableBalance)} AMD</h3></div>
            <div className={styles.contentCard}><div className={styles.statLabel}>{t("fundingAnalytics.fields.currentOutstandingPrincipal")}</div><h3 className={styles.statValue}>{formatMoney(fundingAnalytics.currentOutstandingPrincipal)} AMD</h3></div>
            <div className={styles.contentCard}><div className={styles.statLabel}>{t("fundingAnalytics.fields.annualInterestRate")}</div><h3 className={styles.statValue}>{fundingAnalytics.annualInterestRate}%</h3></div>
            <div className={styles.contentCard}><div className={styles.statLabel}>{t("fundingAnalytics.fields.dailyFundingCost")}</div><h3 className={styles.statValue}>{formatMoney(fundingAnalytics.dailyFundingCost)} AMD</h3></div>
            <div className={styles.contentCard}><div className={styles.statLabel}>{t("fundingAnalytics.fields.accruedFundingCost")}</div><h3 className={styles.statValue}>{formatMoney(fundingAnalytics.accruedFundingCost)} AMD</h3></div>
          </div>
        )}
        {fundingHistory.length > 0 && (
          <>
            <div className={styles.analyticsChart}>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={fundingHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                  <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} stroke="#94a3b8" />
                  <YAxis yAxisId="principal" stroke="#c4a96a" />
                  <YAxis yAxisId="cost" orientation="right" stroke="#6ee7b7" />
                  <Tooltip formatter={(value) => `${formatMoney(Number(value))} AMD`} labelFormatter={(value) => new Date(String(value)).toLocaleDateString()} />
                  <Line yAxisId="principal" type="monotone" dataKey="outstandingPrincipal" stroke="#c4a96a" strokeWidth={2} dot={false} name={t("fundingAnalytics.fields.outstandingPrincipal")} />
                  <Line yAxisId="cost" type="monotone" dataKey="dailyFundingCost" stroke="#6ee7b7" strokeWidth={2} dot={false} name={t("fundingAnalytics.fields.dailyFundingCost")} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.section}>
              <h3>{t("fundingAnalytics.capitalSource.historyTitle")}</h3>
              <DataTable columns={fundingHistoryColumns as any} data={fundingHistory} isLoading={isLoading} noResultsText={t("fundingAnalytics.capitalSource.historyEmpty")} loadingText={t("common.loading")} />
            </div>
          </>
        )}
      </section>

      <div className={styles.section}>
        <h3>{t("capitalSources.transactions.title")}</h3>
        <DataTable columns={columns as any} data={transactions} isLoading={isLoading} noResultsText={t("capitalSources.transactions.empty")} loadingText={t("common.loading")} />
      </div>

      <Modal open={isReceiveOpen} onOpenChange={setIsReceiveOpen} title={t("capitalSources.actions.receiveMoney")} footer={
        <div className={styles.actionRow}>
          <Button variant="secondary" onClick={() => setIsReceiveOpen(false)}>{t("common.cancel")}</Button>
          <Button onClick={() => void handleMoneyAction("receive")} disabled={isActionLoading}>{isActionLoading ? t("capitalSources.actions.processing") : t("capitalSources.actions.receive")}</Button>
        </div>
      }>
        <div className={styles.modalField}>
          <TextField label={t("capitalSources.transactions.fields.amount")} type="number" min="0" step="0.01" value={receiveAmount} onChange={(e) => setReceiveAmount(e.target.value)} />
          <Textarea label={t("capitalSources.fields.description")} value={receiveDescription} onChange={(e) => setReceiveDescription(e.target.value)} />
        </div>
      </Modal>

      <Modal open={isReturnOpen} onOpenChange={setIsReturnOpen} title={t("capitalSources.actions.returnMoney")} footer={
        <div className={styles.actionRow}>
          <Button variant="secondary" onClick={() => setIsReturnOpen(false)}>{t("common.cancel")}</Button>
          <Button onClick={() => void handleMoneyAction("return")} disabled={isActionLoading}>{isActionLoading ? t("capitalSources.actions.processing") : t("capitalSources.actions.return")}</Button>
        </div>
      }>
        <div className={styles.modalField}>
          <TextField label={t("capitalSources.transactions.fields.amount")} type="number" min="0" step="0.01" value={returnAmount} onChange={(e) => setReturnAmount(e.target.value)} />
          <Textarea label={t("capitalSources.fields.description")} value={returnDescription} onChange={(e) => setReturnDescription(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
};
