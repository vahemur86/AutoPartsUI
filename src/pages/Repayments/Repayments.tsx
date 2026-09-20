import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { SectionHeader } from "@/components/common";
import { Button, DataTable, Select, Tab, TabGroup, TextField } from "@/ui-kit";
import {
  repaymentsService,
  type AutomaticRepaymentDashboardSummaryDto,
  type RepaymentListItemDto,
  type FailedRepaymentListItemDto,
} from "@/services/repayments";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import styles from "./Repayments.module.css";

const money = (value?: number | null) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "AMD",
    maximumFractionDigits: 2,
  }).format(value ?? 0);

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString() : "—");

type RepaymentTab = "automatic" | "all" | "failed" | "advances";

const getStatusTone = (status?: string | null) => {
  if (!status) return styles.statusNeutral;
  const normalized = status.toLowerCase();
  if (normalized.includes("success")) return styles.statusSuccess;
  if (normalized.includes("failed")) return styles.statusError;
  return styles.statusNeutral;
};

export const RepaymentManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<RepaymentTab>("all");
  const [automaticItems, setAutomaticItems] = useState<RepaymentListItemDto[]>([]);
  const [allItems, setAllItems] = useState<RepaymentListItemDto[]>([]);
  const [failedItems, setFailedItems] = useState<FailedRepaymentListItemDto[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<AutomaticRepaymentDashboardSummaryDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [source, setSource] = useState<string>("All");
  const [status, setStatus] = useState<string>("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const loadAutomatic = async () => {
    try {
      const response = await repaymentsService.listRepayments({
        source: "Automatic",
        status: status !== "All" ? status : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page: 1,
        pageSize: 20,
      });
      setAutomaticItems(response.items ?? []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load automatic repayments."));
    }
  };

  const loadAll = async () => {
    try {
      const response = await repaymentsService.listRepayments({
        source: source !== "All" ? source : undefined,
        status: status !== "All" ? status : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page: 1,
        pageSize: 20,
      });
      setAllItems(response.items ?? []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load repayment history."));
    }
  };

  const loadFailed = async () => {
    try {
      const response = await repaymentsService.listFailedRepayments({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page: 1,
        pageSize: 20,
      });
      setFailedItems(response.items ?? []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load failed repayments."));
    }
  };

  const loadDashboardSummary = async () => {
    try {
      const response = await repaymentsService.getAutomaticRepaymentDashboardSummary(30);
      setDashboardSummary(response);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load automatic repayment summary."));
    }
  };

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        await Promise.all([loadAutomatic(), loadAll(), loadFailed(), loadDashboardSummary()]);
      } finally {
        setLoading(false);
      }
    })();
  }, [source, status, dateFrom, dateTo]);

  const retryFailed = async (powderDeliveryId: string) => {
    setRetryingId(powderDeliveryId);
    try {
      const result = await repaymentsService.retryFailedRepayment(powderDeliveryId, "Retry from admin dashboard.");
      if (result.status === "Success") {
        toast.success("Repayment retried successfully.");
        await loadFailed();
        await loadAutomatic();
        await loadAll();
      } else {
        toast.error(result.errorMessage || "Retry failed.");
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Retry failed."));
    } finally {
      setRetryingId(null);
    }
  };

  const automaticColumns = useMemo(
    () => [
      { accessorKey: "deliveryNumber", header: "Delivery" },
      { accessorKey: "agentName", header: "Agent" },
      { id: "deliveryValue", header: "Delivery Value", cell: ({ row }: any) => money(row.original.deliveryValueAmd) },
      { accessorKey: "repaymentNumber", header: "Repayment" },
      { id: "amount", header: "Repayment Amount", cell: ({ row }: any) => money(row.original.debtRepaymentAmd ?? row.original.agentPayoutAmd) },
      { accessorKey: "status", header: "Status", cell: ({ row }: any) => <span className={getStatusTone(row.original.status)}>{row.original.status || "—"}</span> },
      { id: "createdAt", header: "Processed At", cell: ({ row }: any) => formatDate(row.original.createdAt) },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: any) => (
          <Button variant="secondary" size="small" onClick={() => navigate(`/repayments/${row.original.id}`)}>
            View
          </Button>
        ),
      },
    ],
    [navigate],
  );

  const allColumns = useMemo(
    () => [
      { accessorKey: "repaymentNumber", header: "Repayment ID" },
      { accessorKey: "agentName", header: "Agent" },
      { id: "amount", header: "Repayment Amount", cell: ({ row }: any) => money(row.original.debtRepaymentAmd ?? row.original.agentPayoutAmd) },
      { accessorKey: "source", header: "Source" },
      { accessorKey: "status", header: "Status", cell: ({ row }: any) => <span className={getStatusTone(row.original.status)}>{row.original.status || "—"}</span> },
      { id: "createdAt", header: "Created", cell: ({ row }: any) => formatDate(row.original.createdAt) },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: any) => (
          <Button variant="secondary" size="small" onClick={() => navigate(`/repayments/${row.original.id}`)}>
            View
          </Button>
        ),
      },
    ],
    [navigate],
  );

  const failedColumns = useMemo(
    () => [
      { accessorKey: "deliveryNumber", header: "Delivery" },
      { accessorKey: "agentName", header: "Agent" },
      {
        accessorKey: "errorMessage",
        header: "Reason",
        cell: ({ row }: any) => (
          <div className={styles.reasonCell}>
            <span>{row.original.errorMessage || "—"}</span>
            {row.original.errorCode && <small>{row.original.errorCode}</small>}
          </div>
        ),
      },
      { id: "lastAttempt", header: "Last Attempt", cell: ({ row }: any) => formatDate(row.original.lastAttempt) },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: any) => (
          <div className={styles.actionRow}>
            <Button
              size="small"
              variant="secondary"
              onClick={() => retryFailed(row.original.powderDeliveryId)}
              disabled={retryingId === row.original.powderDeliveryId}
            >
              {retryingId === row.original.powderDeliveryId ? "Retrying..." : "Retry"}
            </Button>
            <Button size="small" variant="secondary" onClick={() => navigate(`/repayments/${row.original.powderDeliveryId}`)}>
              Details
            </Button>
          </div>
        ),
      },
    ],
    [navigate, retryingId],
  );

  return (
    <div className={styles.page}>
      <SectionHeader title="Repayments" />

      <div className={styles.banner}>
        Automatic repayments are processed by the backend when an intake is accepted. Manual repayment entry is deprecated.
      </div>

      {dashboardSummary && (
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Processed</span>
            <strong>{dashboardSummary.totalProcessed}</strong>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Successful</span>
            <strong>{dashboardSummary.totalSuccessful}</strong>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Failed</span>
            <strong>{dashboardSummary.totalFailed}</strong>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Success rate</span>
            <strong>{((dashboardSummary.successRate ?? 0) * 100).toFixed(1)}%</strong>
          </div>
        </div>
      )}

      <div className={styles.filterBar}>
        <Select value={source} onChange={(event) => setSource(event.target.value)}>
          <option value="All">Source: All</option>
          <option value="Automatic">Automatic</option>
          <option value="Manual">Manual</option>
        </Select>
        <Select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="All">Status: All</option>
          <option value="Success">Success</option>
          <option value="Failed">Failed</option>
        </Select>
        <TextField label="From" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        <TextField label="To" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
      </div>

      <TabGroup variant="segmented">
        <Tab text="Automatic Repayments" active={activeTab === "automatic"} onClick={() => setActiveTab("automatic")} />
        <Tab text="All Repayments" active={activeTab === "all"} onClick={() => setActiveTab("all")} />
        <Tab text="Failed Repayments" active={activeTab === "failed"} onClick={() => setActiveTab("failed")} />
        <Tab text="Agent Advances" active={activeTab === "advances"} onClick={() => setActiveTab("advances")} />
      </TabGroup>

      {activeTab === "automatic" && (
        <div className={styles.panel}>
          <DataTable
            columns={automaticColumns as any}
            data={automaticItems}
            isLoading={loading}
            noResultsText="No automatic repayments found."
            loadingText="Loading automatic repayments..."
          />
        </div>
      )}

      {activeTab === "all" && (
        <div className={styles.panel}>
          <DataTable
            columns={allColumns as any}
            data={allItems}
            isLoading={loading}
            noResultsText="No repayments found."
            loadingText="Loading repayments..."
          />
        </div>
      )}

      {activeTab === "failed" && (
        <div className={styles.panel}>
          <DataTable
            columns={failedColumns as any}
            data={failedItems}
            isLoading={loading}
            noResultsText="No failed repayments."
            loadingText="Loading failed repayments..."
          />
        </div>
      )}

      {activeTab === "advances" && (
        <div className={styles.panel}>
          <div className={styles.emptyState}>Agent advances remain under the contracts flow. This screen keeps them grouped alongside repayments for quick access.</div>
        </div>
      )}
    </div>
  );
};

export default RepaymentManagement;
