import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  CalendarDays,
  CircleCheck,
  CircleX,
  FileText,
  Hash,
  Landmark,
  Percent,
  Pencil,
  Power,
  PowerOff,
  RotateCcw,
  Search,
  Wallet,
  X,
} from "lucide-react";

import { Button, DataTable, IconButton, Modal, TextField, Textarea } from "@/ui-kit";
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

const getStatusIcon = (status: string) => {
  if (status === "Active") return CircleCheck;
  if (status === "Closed") return CircleX;
  return PowerOff;
};

const getStatusClass = (status: string) => {
  if (status === "Active") return styles.statusActive;
  if (status === "Closed") return styles.statusClosed;
  return styles.statusInactive;
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
  const [appliedFromDate, setAppliedFromDate] = useState("");
  const [appliedToDate, setAppliedToDate] = useState("");
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
    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) return undefined;
    if (endOfDay) parsed.setUTCHours(23, 59, 59, 999);
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
        fromDate: toDateTimeRange(appliedFromDate, false),
        toDate: toDateTimeRange(appliedToDate, true),
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
  }, [id, appliedFromDate, appliedToDate, t]);

  const applyFundingFilters = () => {
    if (fromDate && toDate && new Date(`${fromDate}T00:00:00`) > new Date(`${toDate}T00:00:00`)) {
      toast.error(t("fundingAnalytics.validation.dateRange"));
      return;
    }
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
  };

  const resetFundingFilters = () => {
    setFromDate("");
    setToDate("");
    setAppliedFromDate("");
    setAppliedToDate("");
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

  const StatusIcon = getStatusIcon(source.status);

  return (
    <div className={styles.page}>
      <SectionHeader title={source.name} goBack actions={
        <div className={styles.headerActions}>
          <IconButton
            variant="primary"
            size="medium"
            icon={<Pencil size={17} />}
            ariaLabel={`${t("capitalSources.actions.edit")} ${source.name}`}
            title={t("capitalSources.actions.edit")}
            className={styles.editIconAction}
            onClick={() => navigate(`/capital-sources/${id}/edit`)}
          />
          <Button className={styles.sageButton} onClick={() => setIsReceiveOpen(true)}><ArrowDownToLine size={15} />{t("capitalSources.actions.receiveMoney")}</Button>
          <Button className={styles.outlineButton} onClick={() => setIsReturnOpen(true)}><ArrowUpFromLine size={15} />{t("capitalSources.actions.returnMoney")}</Button>
          {source.status === "Inactive" && <Button variant="secondary" onClick={() => void handleStatusAction("activate")}><Power size={15} />{t("capitalSources.actions.activate")}</Button>}
          {source.status === "Active" && <Button variant="secondary" onClick={() => void handleStatusAction("deactivate")}><PowerOff size={15} />{t("capitalSources.actions.deactivate")}</Button>}
          {source.status !== "Closed" && <Button variant="secondary" onClick={() => void handleStatusAction("close")}><CircleX size={15} />{t("capitalSources.actions.close")}</Button>}
        </div>
      } />

      <div className={styles.statsGrid}>
        <div className={`${styles.contentCard} ${styles.detailStatCard}`}>
          <span className={`${styles.statIcon} ${styles.statIconGold}`}><Banknote size={18} /></span>
          <div>
            <div className={styles.statLabel}>{t("capitalSources.fields.currentBalance")}</div>
            <h3 className={styles.statValue}>{formatMoney(source.currentBalance)} AMD</h3>
          </div>
        </div>
        <div className={`${styles.contentCard} ${styles.detailStatCard}`}>
          <span className={styles.statIcon}><Landmark size={18} /></span>
          <div>
            <div className={styles.statLabel}>{t("capitalSources.fields.initialAmount")}</div>
            <h3 className={styles.statValue}>{formatMoney(source.initialAmount)} AMD</h3>
          </div>
        </div>
        <div className={`${styles.contentCard} ${styles.detailStatCard}`}>
          <span className={styles.statIcon}><Wallet size={18} /></span>
          <div>
            <div className={styles.statLabel}>{t("capitalSources.fields.type")}</div>
            <h3 className={styles.statValue}>{t(`capitalSources.types.${source.type}`, { defaultValue: source.type })}</h3>
          </div>
        </div>
        <div className={`${styles.contentCard} ${styles.detailStatCard}`}>
          <span className={styles.statIcon}><StatusIcon size={18} /></span>
          <div>
            <div className={styles.statLabel}>{t("capitalSources.fields.status")}</div>
            <span className={`${styles.statusBadge} ${getStatusClass(source.status)}`}>
              {t(`capitalSources.statuses.${source.status}`, { defaultValue: source.status })}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.detailsGrid}>
        <div className={styles.detailItem}>
          <span><Hash size={14} />{t("capitalSources.fields.code")}</span>
          <strong>{source.code}</strong>
        </div>
        <div className={styles.detailItem}>
          <span><Percent size={14} />{t("capitalSources.fields.interestRate")}</span>
          <strong>{source.interestRate != null ? `${source.interestRate}%` : "—"}</strong>
        </div>
        <div className={styles.detailItem}>
          <span><CalendarDays size={14} />{t("capitalSources.fields.startDate")}</span>
          <strong>{source.startDate ? new Date(source.startDate).toLocaleDateString() : "—"}</strong>
        </div>
        <div className={styles.detailItem}>
          <span><CalendarDays size={14} />{t("capitalSources.fields.endDate")}</span>
          <strong>{source.endDate ? new Date(source.endDate).toLocaleDateString() : "—"}</strong>
        </div>
        <div className={`${styles.detailItem} ${styles.detailDescription}`}>
          <span><FileText size={14} />{t("capitalSources.fields.description")}</span>
          <strong>{source.description || "—"}</strong>
        </div>
      </div>

      <section className={styles.analyticsSection}>
        <div className={styles.analyticsHeader}>
          <div>
            <h3>{t("fundingAnalytics.capitalSource.title")}</h3>
            <p>{t("fundingAnalytics.capitalSource.description")}</p>
          </div>
          <div className={styles.filterPanel}>
            <div className={styles.analyticsFilters}>
              <TextField label={t("fundingAnalytics.filters.fromDate")} type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} />
              <TextField label={t("fundingAnalytics.filters.toDate")} type="date" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)} />
              <Button variant="secondary" onClick={applyFundingFilters} disabled={isLoading}><Search size={15} />{t("common.apply")}</Button>
              <Button variant="secondary" onClick={resetFundingFilters} disabled={isLoading || (!fromDate && !toDate && !appliedFromDate && !appliedToDate)}><RotateCcw size={15} />{t("common.reset")}</Button>
            </div>
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
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(145,169,154,0.18)" />
                  <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} stroke="#aab2a9" />
                  <YAxis yAxisId="principal" stroke="#91a99a" />
                  <YAxis yAxisId="cost" orientation="right" stroke="#c4a96a" />
                  <Tooltip formatter={(value) => `${formatMoney(Number(value))} AMD`} labelFormatter={(value) => new Date(String(value)).toLocaleDateString()} />
                  <Line yAxisId="principal" type="monotone" dataKey="outstandingPrincipal" stroke="#91a99a" strokeWidth={2} dot={false} name={t("fundingAnalytics.fields.outstandingPrincipal")} />
                  <Line yAxisId="cost" type="monotone" dataKey="dailyFundingCost" stroke="#c4a96a" strokeWidth={2} dot={false} name={t("fundingAnalytics.fields.dailyFundingCost")} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className={`${styles.section} ${styles.tableSection}`}>
              <h3>{t("fundingAnalytics.capitalSource.historyTitle")}</h3>
              <div className={`${styles.tableContainer} ${styles.fundingHistoryTable}`}>
                <DataTable columns={fundingHistoryColumns as any} data={fundingHistory} isLoading={isLoading} noResultsText={t("fundingAnalytics.capitalSource.historyEmpty")} loadingText={t("common.loading")} />
              </div>
            </div>
          </>
        )}
      </section>

      <div className={`${styles.section} ${styles.tableSection}`}>
        <h3>{t("capitalSources.transactions.title")}</h3>
        <div className={styles.tableContainer}>
          <DataTable columns={columns as any} data={transactions} isLoading={isLoading} noResultsText={t("capitalSources.transactions.empty")} loadingText={t("common.loading")} />
        </div>
      </div>

      <Modal open={isReceiveOpen} onOpenChange={setIsReceiveOpen} title={t("capitalSources.actions.receiveMoney")} footer={
        <div className={styles.actionRow}>
          <Button variant="secondary" onClick={() => setIsReceiveOpen(false)}><X size={15} />{t("common.cancel")}</Button>
          <Button className={styles.sageButton} onClick={() => void handleMoneyAction("receive")} disabled={isActionLoading}><ArrowDownToLine size={15} />{isActionLoading ? t("capitalSources.actions.processing") : t("capitalSources.actions.receive")}</Button>
        </div>
      }>
        <div className={styles.modalField}>
          <TextField label={t("capitalSources.transactions.fields.amount")} type="number" min="0" step="0.01" value={receiveAmount} onChange={(e) => setReceiveAmount(e.target.value)} />
          <Textarea label={t("capitalSources.fields.description")} value={receiveDescription} onChange={(e) => setReceiveDescription(e.target.value)} />
        </div>
      </Modal>

      <Modal open={isReturnOpen} onOpenChange={setIsReturnOpen} title={t("capitalSources.actions.returnMoney")} footer={
        <div className={styles.actionRow}>
          <Button variant="secondary" onClick={() => setIsReturnOpen(false)}><X size={15} />{t("common.cancel")}</Button>
          <Button className={styles.sageButton} onClick={() => void handleMoneyAction("return")} disabled={isActionLoading}><ArrowUpFromLine size={15} />{isActionLoading ? t("capitalSources.actions.processing") : t("capitalSources.actions.return")}</Button>
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
