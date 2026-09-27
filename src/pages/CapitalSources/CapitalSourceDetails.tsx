import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { Button, DataTable, Modal, TextField, Textarea } from "@/ui-kit";
import { SectionHeader } from "@/components/common";
import { capitalSourcesService } from "@/services/capitalSources";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { CapitalSourceDto, CapitalSourceTransactionDto } from "@/types/capitalSources";
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
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [receiveAmount, setReceiveAmount] = useState("");
  const [receiveDescription, setReceiveDescription] = useState("");
  const [returnAmount, setReturnAmount] = useState("");
  const [returnDescription, setReturnDescription] = useState("");

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
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("capitalSources.errors.loadDetailsFailed")));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

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
