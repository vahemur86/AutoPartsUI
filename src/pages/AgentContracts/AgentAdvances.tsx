import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Plus } from "lucide-react";

import { SectionHeader } from "@/components/common";
import { Button, ConfirmationModal, DataTable, Select, Textarea, TextField } from "@/ui-kit";
import { agentContractsService } from "@/services/agentContracts";
import { agentsService } from "@/services/agents";
import { capitalSourcesService } from "@/services/capitalSources";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { RootState } from "@/store/store";
import type { AgentDto } from "@/types/agents";
import type { CapitalSourceDto } from "@/types/capitalSources";
import type { AgentAdvanceDto, AgentAdvanceExtensionDto, AgentContractStatus, RepaymentTermsSnapshotDto } from "@/types/agentContracts";
import { isActiveAgentStatus, isDraftAgentStatus, normalizeAgentStatus } from "@/utils/agentStatus";
import styles from "./AgentContracts.module.css";

const statuses: AgentContractStatus[] = ["Draft", "Active", "Completed", "Cancelled", "Defaulted"];
const money = (amount?: number | null) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(amount ?? 0);
const date = (value?: string | null) => value ? new Date(value).toLocaleDateString() : "-";
const datetime = (value?: string | null) => value ? new Date(value).toLocaleString() : "-";
const today = () => new Date(new Date().setHours(0, 0, 0, 0));
const daysBetween = (left: Date, right: Date) => Math.ceil((left.getTime() - right.getTime()) / 86400000);
const addDays = (value: Date, days: number) => new Date(value.getTime() + days * 86400000);
const isoDate = (value: Date) => value.toISOString().slice(0, 10);
const agentName = (agent: AgentDto) => `${agent.code} - ${agent.customer?.fullName || "—"}`;

const deadlineFor = (advance: AgentAdvanceDto, terms?: RepaymentTermsSnapshotDto | null) => {
  if (advance.repaymentDeadline) return new Date(advance.repaymentDeadline);
  return addDays(new Date(advance.advanceDate), terms?.defaultRepaymentPeriodDays ?? advance.repaymentTerms?.defaultRepaymentPeriodDays ?? 30);
};

const deadlineStatus = (days: number) => days > 14 ? "safe" : days > 7 ? "warning" : days >= 0 ? "urgent" : "overdue";

const DeadlineWarning = ({ deadline }: { deadline: Date }) => {
  const days = daysBetween(deadline, today());
  const status = deadlineStatus(days);
  const text = days < 0 ? `OVERDUE (${Math.abs(days)} days)` : `${days} days remaining`;
  return <div className={`${styles.deadline} ${styles[`deadline${status}`]}`} role="status" aria-live="polite"><strong>{date(deadline.toISOString())}</strong><span>{text}</span></div>;
};

const StatusBadge = ({ status }: { status: string | number }) => {
  const label = normalizeAgentStatus(status) || String(status ?? "");
  return <span className={`${styles.status} ${styles[`status${label}`] ?? ""}`}>{label}</span>;
};
const Detail = ({ label, value }: { label: string; value: React.ReactNode }) => <div className={styles.detail}><span>{label}</span><strong>{value ?? "-"}</strong></div>;

const ExtensionHistory = ({ extensions, loading }: { extensions: AgentAdvanceExtensionDto[]; loading: boolean }) => {
  const columns = useMemo(() => [
    { accessorKey: "extensionNumber", header: "Extension #" },
    { id: "previous", header: "Previous Deadline", cell: ({ row }: any) => date(row.original.previousDeadline) },
    { id: "new", header: "New Deadline", cell: ({ row }: any) => date(row.original.newDeadline) },
    { id: "days", header: "Days Added", cell: ({ row }: any) => daysBetween(new Date(row.original.newDeadline), new Date(row.original.previousDeadline)) },
    { accessorKey: "reason", header: "Reason", cell: ({ row }: any) => row.original.reason || "-" },
    { id: "granted", header: "Granted", cell: ({ row }: any) => `${row.original.createdBy || "-"} · ${datetime(row.original.createdAt)}` },
  ], []);
  const sorted = [...extensions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return <section className={styles.section}><h2>Extension History</h2><DataTable columns={columns as any} data={sorted} isLoading={loading} noResultsText="No extensions granted" loadingText="Loading extensions..." /></section>;
};

const ExtensionModal = ({ open, advance, deadline, extensionCount, maximumExtensions, onClose, onSubmit, saving }: { open: boolean; advance: AgentAdvanceDto; deadline: Date; extensionCount: number; maximumExtensions: number; onClose: () => void; onSubmit: (request: { newDeadline: string; reason?: string | null }) => Promise<void>; saving: boolean }) => {
  const [selected, setSelected] = useState("plus14");
  const [customDate, setCustomDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { if (open) { setSelected("plus14"); setCustomDate(""); setReason(""); setError(""); } }, [open]);
  const options = [7, 14, 21, 30].map((days) => ({ id: `plus${days}`, days, date: addDays(deadline, days) }));
  const selectedDate = selected === "custom" ? (customDate ? new Date(`${customDate}T00:00:00`) : null) : options.find((option) => option.id === selected)?.date ?? null;
  const submit = async () => {
    if (!selectedDate || Number.isNaN(selectedDate.getTime())) { setError("New deadline is required."); return; }
    if (selectedDate <= deadline) { setError("New deadline must be after the current deadline."); return; }
    if (selectedDate < today()) { setError("New deadline cannot be in the past."); return; }
    if (daysBetween(selectedDate, today()) > 365) { setError("New deadline cannot be more than one year away."); return; }
    if (reason.length > 500) { setError("Reason must not exceed 500 characters."); return; }
    await onSubmit({ newDeadline: selectedDate.toISOString(), reason: reason.trim() || null });
  };
  return <ConfirmationModal open={open} onOpenChange={(value) => !value && onClose()} title="Request Deadline Extension" description={`Extend ${advance.advanceNumber}. Current deadline: ${date(deadline.toISOString())}. ${extensionCount}/${maximumExtensions} extensions used.`} confirmText="Submit Request" confirmLoading={saving} preventClose onConfirm={() => void submit()}>
    <div className={styles.modalFields}>
      <div className={styles.quickOptions}><strong>New Deadline Selection</strong>{options.map((option) => <label key={option.id}><input type="radio" name="extension-option" checked={selected === option.id} onChange={() => setSelected(option.id)} />{`+${option.days} days (${date(option.date.toISOString())})`}</label>)}<label><input type="radio" name="extension-option" checked={selected === "custom"} onChange={() => setSelected("custom")} />Custom date</label></div>
      {selected === "custom" && <TextField label="Custom Deadline" type="date" min={isoDate(addDays(deadline, 1))} value={customDate} onChange={(event) => setCustomDate(event.target.value)} />}
      <Textarea label="Reason (optional)" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} rows={4} />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  </ConfirmationModal>;
};

export const AgentAdvancesList = () => {
  const navigate = useNavigate(); const [searchParams, setSearchParams] = useSearchParams(); const [items, setItems] = useState<AgentAdvanceDto[]>([]); const [total, setTotal] = useState(0); const [loading, setLoading] = useState(false); const [agents, setAgents] = useState<AgentDto[]>([]);
  const page = Number(searchParams.get("page") || 1); const pageSize = Number(searchParams.get("pageSize") || 10); const status = searchParams.get("status") || ""; const agentId = searchParams.get("agentId") || ""; const advanceNumber = searchParams.get("advanceNumber") || ""; const from = searchParams.get("advanceDateFrom") || ""; const to = searchParams.get("advanceDateTo") || "";
  const setFilter = (key: string, value: string) => { const next = new URLSearchParams(searchParams); value ? next.set(key, value) : next.delete(key); next.set("page", "1"); setSearchParams(next); };
  useEffect(() => { void agentsService.getAgents({ page: 1, pageSize: 200, status: 0 }).then((result) => setAgents(result.results ?? [])).catch(() => undefined); }, []);
  useEffect(() => { void (async () => { setLoading(true); try { const result = await agentContractsService.listAdvances({ page, pageSize, status: status || undefined, agentId: agentId || undefined, advanceNumber: advanceNumber || undefined, advanceDateFrom: from || undefined, advanceDateTo: to || undefined }); setItems(result.results ?? []); setTotal(result.totalItems); } catch (error) { toast.error(getApiErrorMessage(error, "Failed to load advances.")); } finally { setLoading(false); } })(); }, [page, pageSize, status, agentId, advanceNumber, from, to]);
  const columns = useMemo(() => [{ accessorKey: "advanceNumber", header: "Advance #" }, { id: "agent", header: "Agent", cell: ({ row }: any) => `${row.original.agent.code} - ${row.original.agent.fullName}` }, { id: "amount", header: "Amount", cell: ({ row }: any) => money(row.original.advancedAmount) }, { accessorKey: "status", header: "Status", cell: ({ row }: any) => <StatusBadge status={row.original.status} /> }, { id: "deadline", header: "Deadline", cell: ({ row }: any) => <DeadlineWarning deadline={deadlineFor(row.original)} /> }, { id: "extensions", header: "Extensions", cell: ({ row }: any) => `${row.original.extensionCount ?? 0}/${row.original.maximumExtensions ?? row.original.repaymentTerms?.maximumExtensions ?? "-"}` }, { id: "actions", header: "Actions", cell: ({ row }: any) => <Button size="small" variant="secondary" onClick={() => navigate(`/agent-advances/${row.original.id}`)}>View</Button> }], [navigate]);
  return <div className={styles.page}><SectionHeader title="Agent Advances" actions={<Button variant="secondary" onClick={() => navigate("/agent-contracts")}><Plus size={14} /> Contracts</Button>} /><div className={styles.filters}><Select value={agentId} onChange={(event) => setFilter("agentId", event.target.value)}><option value="">All agents</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agentName(agent)}</option>)}</Select><Select value={status} onChange={(event) => setFilter("status", event.target.value)}><option value="">All statuses</option>{statuses.map((item) => <option key={item}>{item}</option>)}</Select><TextField label="Advance Number" value={advanceNumber} onChange={(event) => setFilter("advanceNumber", event.target.value)} /><TextField label="From" type="date" value={from} onChange={(event) => setFilter("advanceDateFrom", event.target.value)} /><TextField label="To" type="date" value={to} onChange={(event) => setFilter("advanceDateTo", event.target.value)} /></div><DataTable columns={columns as any} data={items} isLoading={loading} manualPagination pageCount={Math.max(1, Math.ceil(total / pageSize))} pageIndex={page - 1} onPaginationChange={(index) => setFilter("page", String(index + 1))} noResultsText="No advances found" loadingText="Loading advances..." /></div>;
};

export const AgentAdvanceDetails = () => {
  const { id } = useParams(); const navigate = useNavigate(); const role = useSelector((state: RootState) => state.auth.user?.role?.toLowerCase() || ""); const canRequest = ["admin", "operations manager", "operationsmanager", "sales manager", "salesmanager", "agent"].includes(role);
  const [advance, setAdvance] = useState<AgentAdvanceDto | null>(null); const [extensions, setExtensions] = useState<AgentAdvanceExtensionDto[]>([]); const [sources, setSources] = useState<CapitalSourceDto[]>([]); const [sourceId, setSourceId] = useState(""); const [amount, setAmount] = useState(""); const [description, setDescription] = useState(""); const [allocationOpen, setAllocationOpen] = useState(false); const [removeId, setRemoveId] = useState<string | null>(null); const [activateOpen, setActivateOpen] = useState(false); const [extensionOpen, setExtensionOpen] = useState(false); const [loading, setLoading] = useState(true); const [extensionLoading, setExtensionLoading] = useState(false); const [saving, setSaving] = useState(false);
  const load = async () => { if (!id) return; setLoading(true); try { const [result, sourceResult, extensionResult] = await Promise.all([agentContractsService.getAdvance(id), capitalSourcesService.listCapitalSources({ page: 1, pageSize: 200, status: "Active" }), agentContractsService.getAdvanceExtensions(id)]); setAdvance(result); setSources(sourceResult.results ?? []); setExtensions(extensionResult); } catch (error) { toast.error(getApiErrorMessage(error, "Failed to load advance.")); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, [id]);
  if (loading || !advance) return <div className={styles.page}><SectionHeader title="Advance Details" goBack />Loading advance...</div>;
  const deadline = deadlineFor(advance, advance.repaymentTerms); const extensionCount = advance.extensionCount ?? extensions.length; const maximumExtensions = advance.maximumExtensions ?? advance.repaymentTerms?.maximumExtensions ?? 0; const remaining = Math.max(0, advance.advancedAmount - advance.allocatedAmount); const draft = isDraftAgentStatus(advance.status); const active = isActiveAgentStatus(advance.status); const fundingStatus = isActiveAgentStatus(advance.status) ? "Active" : advance.allocatedAmount >= advance.advancedAmount ? "Fully Allocated" : advance.allocatedAmount > 0 ? "Partially Funded" : "Not Funded";
  const addAllocation = async () => { const parsed = Number(amount); if (!sourceId || !(parsed > 0) || parsed > remaining) { toast.error("Choose a capital source and enter an amount up to the remaining balance."); return; } if (!id) return; setSaving(true); try { await agentContractsService.addAllocation(id, { capitalSourceId: sourceId, amount: parsed, description: description.trim() || undefined }); toast.success("Allocation added."); setAllocationOpen(false); setSourceId(""); setAmount(""); setDescription(""); await load(); } catch (error) { toast.error(getApiErrorMessage(error, "Failed to add allocation.")); } finally { setSaving(false); } };
  const remove = async () => { if (!id || !removeId) return; try { await agentContractsService.removeAllocation(id, removeId); toast.success("Allocation removed."); await load(); } catch (error) { toast.error(getApiErrorMessage(error, "Failed to remove allocation.")); } finally { setRemoveId(null); } };
  const activate = async () => { if (!id) return; try { await agentContractsService.activateAdvance(id); toast.success("Advance activated."); await load(); } catch (error) { toast.error(getApiErrorMessage(error, "Failed to activate advance.")); } };
  const createExtension = async (request: { newDeadline: string; reason?: string | null }) => { if (!id) return; setExtensionLoading(true); try { await agentContractsService.createAdvanceExtension(id, request); toast.success("Extension granted successfully."); setExtensionOpen(false); await load(); } catch (error) { toast.error(getApiErrorMessage(error, "Failed to create extension.")); } finally { setExtensionLoading(false); } };
  const allocationColumns = [{ accessorKey: "capitalSourceCode", header: "Capital Source Code" }, { accessorKey: "capitalSourceName", header: "Capital Source" }, { id: "amount", header: "Amount", cell: ({ row }: any) => money(row.original.amount) }, { accessorKey: "createdBy", header: "Created By" }, { id: "actions", header: "Actions", cell: ({ row }: any) => draft && <Button size="small" variant="danger" onClick={() => setRemoveId(row.original.id)}>Remove</Button> }];
  return <div className={styles.page}><SectionHeader title={advance.advanceNumber} goBack actions={<div className={styles.headerActions}><Button variant="secondary" onClick={() => navigate(`/agent-contracts/${advance.agentContractId}`)}>View Contract</Button>{draft && <Button onClick={() => setAllocationOpen(true)}>Allocate Capital</Button>}{draft && <Button disabled={remaining !== 0} onClick={() => setActivateOpen(true)}>Activate Advance</Button>}{canRequest && active && extensionCount < maximumExtensions && <Button onClick={() => setExtensionOpen(true)}>Request Extension</Button>}</div>} /><div className={styles.detailGrid}><Detail label="Status" value={<StatusBadge status={advance.status} />} /><Detail label="Advance date" value={datetime(advance.advanceDate)} /><Detail label="Agent" value={`${advance.agent.code} - ${advance.agent.fullName}`} /><Detail label="Advanced amount" value={`${money(advance.advancedAmount)} AMD`} /></div><section className={styles.section}><h2>Repayment Information</h2><div className={styles.detailGrid}><Detail label="Current deadline" value={<DeadlineWarning deadline={deadline} />} /><Detail label="Extensions granted" value={`${extensionCount}/${maximumExtensions}`} /><Detail label="Extended until" value={extensionCount > 0 ? date(deadline.toISOString()) : "-"} /><Detail label="Notes" value={advance.notes} /></div></section><ExtensionHistory extensions={extensions} loading={extensionLoading} /><section className={styles.section}><h2>Capital Sources / Funding</h2><div className={styles.financials}><Detail label="Funding status" value={fundingStatus} /><Detail label="Advanced amount" value={money(advance.advancedAmount)} /><Detail label="Allocated amount" value={money(advance.allocatedAmount)} /><Detail label="Remaining amount" value={money(remaining)} /></div><div className={styles.progress}><span style={{ width: `${advance.advancedAmount ? Math.min(100, (advance.allocatedAmount / advance.advancedAmount) * 100) : 0}%` }} /></div></section><section className={styles.section}><h2>Capital Source Allocations</h2><DataTable columns={allocationColumns as any} data={advance.allocations ?? []} noResultsText="No allocations yet" /></section><ExtensionModal open={extensionOpen} advance={advance} deadline={deadline} extensionCount={extensionCount} maximumExtensions={maximumExtensions} onClose={() => setExtensionOpen(false)} onSubmit={createExtension} saving={extensionLoading} /><ConfirmationModal open={allocationOpen} onOpenChange={setAllocationOpen} title="Add Allocation" description={`Remaining to allocate: ${money(remaining)}`} confirmText="Add Allocation" confirmLoading={saving} preventClose onConfirm={() => void addAllocation()}><div className={styles.modalFields}><Select value={sourceId} onChange={(event) => setSourceId(event.target.value)}><option value="">Select capital source</option>{sources.map((source) => <option key={source.id} value={source.id}>{source.code} - current balance: {money(source.currentBalance)}</option>)}</Select><TextField label="Amount" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} /><Textarea label="Description" value={description} onChange={(event) => setDescription(event.target.value)} /></div></ConfirmationModal><ConfirmationModal open={Boolean(removeId)} onOpenChange={(value) => !value && setRemoveId(null)} title="Remove allocation" description="Remove this capital allocation?" confirmText="Remove" onConfirm={() => void remove()} /><ConfirmationModal open={activateOpen} onOpenChange={setActivateOpen} title="Activate advance" description="Activate this advance after all funds are allocated?" confirmText="Activate" onConfirm={() => void activate()} /></div>;
};
