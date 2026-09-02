import { useEffect, useMemo, useState } from "react";
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
      toast.error(getApiErrorMessage(error, "Failed to load capital source details."));
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
      toast.error("Amount must be greater than 0.");
      return;
    }

    setIsActionLoading(true);
    try {
      if (mode === "receive") {
        await capitalSourcesService.receiveMoney(id, { amount: amountValue, description });
        toast.success("Money received successfully");
      } else {
        await capitalSourcesService.returnMoney(id, { amount: amountValue, description });
        toast.success("Money returned successfully");
      }
      setReceiveAmount("");
      setReceiveDescription("");
      setReturnAmount("");
      setReturnDescription("");
      setIsReceiveOpen(false);
      setIsReturnOpen(false);
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to update capital source."));
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
      toast.success(`${action[0].toUpperCase()}${action.slice(1)} action completed`);
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, `Failed to ${action} capital source.`));
    } finally {
      setIsActionLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "createdAt",
        header: "Date/Time",
        cell: ({ row }: any) => row.original.createdAt ? new Date(row.original.createdAt).toLocaleString() : "—",
      },
      { accessorKey: "type", header: "Type" },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }: any) => formatSigned(row.original.type, row.original.amount),
      },
      { accessorKey: "balanceBefore", header: "Balance Before", cell: ({ row }: any) => formatMoney(row.original.balanceBefore) },
      { accessorKey: "balanceAfter", header: "Balance After", cell: ({ row }: any) => formatMoney(row.original.balanceAfter) },
      { accessorKey: "referenceType", header: "Reference Type" },
      { accessorKey: "referenceId", header: "Reference Id" },
      { accessorKey: "description", header: "Description" },
      { accessorKey: "createdBy", header: "Created By" },
    ],
    [],
  );

  if (isLoading || !source) {
    return <div>Loading capital source...</div>;
  }

  return (
    <div className={styles.page}>
      <SectionHeader title={source.name} goBack actions={
        <div className={styles.headerActions}>
          <Button variant="secondary" onClick={() => navigate(`/capital-sources/${id}/edit`)}>Edit</Button>
          <Button onClick={() => setIsReceiveOpen(true)}>Receive Money</Button>
          <Button variant="secondary" onClick={() => setIsReturnOpen(true)}>Return Money</Button>
          {source.status === "Inactive" && <Button variant="secondary" onClick={() => void handleStatusAction("activate")}>Activate</Button>}
          {source.status === "Active" && <Button variant="secondary" onClick={() => void handleStatusAction("deactivate")}>Deactivate</Button>}
          {source.status !== "Closed" && <Button variant="danger" onClick={() => void handleStatusAction("close")}>Close</Button>}
        </div>
      } />

      <div className={styles.statsGrid}>
        <div className={styles.contentCard}>
          <div className={styles.statLabel}>Current Balance</div>
          <h3 className={styles.statValue}>{formatMoney(source.currentBalance)}</h3>
        </div>
        <div className={styles.contentCard}>
          <div className={styles.statLabel}>Initial Amount</div>
          <h3 className={styles.statValue}>{formatMoney(source.initialAmount)}</h3>
        </div>
        <div className={styles.contentCard}>
          <div className={styles.statLabel}>Type</div>
          <h3 className={styles.statValue}>{source.type}</h3>
        </div>
        <div className={styles.contentCard}>
          <div className={styles.statLabel}>Status</div>
          <h3 className={styles.statValue}>{source.status}</h3>
        </div>
      </div>

      <div className={styles.detailsGrid}>
        <div><strong>Code:</strong> {source.code}</div>
        <div><strong>Interest Rate:</strong> {source.interestRate != null ? `${source.interestRate}%` : "—"}</div>
        <div><strong>Start Date:</strong> {source.startDate ? new Date(source.startDate).toLocaleDateString() : "—"}</div>
        <div><strong>End Date:</strong> {source.endDate ? new Date(source.endDate).toLocaleDateString() : "—"}</div>
        <div><strong>Description:</strong> {source.description || "—"}</div>
      </div>

      <div className={styles.section}>
        <h3>Transactions</h3>
        <DataTable columns={columns as any} data={transactions} noResultsText="No transactions found" />
      </div>

      <Modal open={isReceiveOpen} onOpenChange={setIsReceiveOpen} title="Receive Money" footer={
        <div className={styles.actionRow}>
          <Button variant="secondary" onClick={() => setIsReceiveOpen(false)}>Cancel</Button>
          <Button onClick={() => void handleMoneyAction("receive")} disabled={isActionLoading}>{isActionLoading ? "Processing..." : "Receive"}</Button>
        </div>
      }>
        <div className={styles.modalField}>
          <TextField label="Amount" type="number" min="0" step="0.01" value={receiveAmount} onChange={(e) => setReceiveAmount(e.target.value)} />
          <Textarea label="Description" value={receiveDescription} onChange={(e) => setReceiveDescription(e.target.value)} />
        </div>
      </Modal>

      <Modal open={isReturnOpen} onOpenChange={setIsReturnOpen} title="Return Money To Source" footer={
        <div className={styles.actionRow}>
          <Button variant="secondary" onClick={() => setIsReturnOpen(false)}>Cancel</Button>
          <Button onClick={() => void handleMoneyAction("return")} disabled={isActionLoading}>{isActionLoading ? "Processing..." : "Return"}</Button>
        </div>
      }>
        <div className={styles.modalField}>
          <TextField label="Amount" type="number" min="0" step="0.01" value={returnAmount} onChange={(e) => setReturnAmount(e.target.value)} />
          <Textarea label="Description" value={returnDescription} onChange={(e) => setReturnDescription(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
};
