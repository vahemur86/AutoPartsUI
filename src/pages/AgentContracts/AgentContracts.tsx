import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { Plus } from "lucide-react";
import { SectionHeader } from "@/components/common";
import { Button, ConfirmationModal, DataTable, Select, Textarea, TextField } from "@/ui-kit";
import { agentsService } from "@/services/agents";
import { agentContractsService } from "@/services/agentContracts";
import { capitalSourcesService } from "@/services/capitalSources";
import { powderDeliveriesService } from "@/services/powderDeliveries";
import { repaymentRulesService } from "@/services/repaymentRules";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { AgentDto } from "@/types/agents";
import type { CapitalSourceDto } from "@/types/capitalSources";
import type { RepaymentRule, RepaymentRuleVersion } from "@/types/repaymentRules";
import type { AgentAdvanceDto, AgentContractDto, AgentContractListItemDto, AgentContractStatus } from "@/types/agentContracts";
import { isDraftAgentStatus, isActiveAgentStatus, normalizeAgentStatus } from "@/utils/agentStatus";
import styles from "./AgentContracts.module.css";

const statuses: AgentContractStatus[] = ["Draft", "Active", "Completed", "Cancelled", "Defaulted"];
const money = (amount?: number | null) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(amount ?? 0);
const date = (value?: string | null) => value ? new Date(value).toLocaleDateString() : "-";
const datetime = (value?: string | null) => value ? new Date(value).toLocaleString() : "-";
const agentName = (agent: AgentDto) => `${agent.code} - ${agent.customer?.fullName || "—"}`;
const isDraft = (status: string) => isDraftAgentStatus(status);
const isActiveRuleVersion = (status: RepaymentRuleVersion["status"]) => {
  const value = String(status ?? "").trim().toLowerCase();
  return value === "active" || value === "1" || value === "enabled" || value === "true";
};

const StatusBadge = ({ status }: { status: string | number }) => {
  const label = normalizeAgentStatus(status) || String(status ?? "");
  return <span className={`${styles.status} ${styles[`status${label}`] ?? ""}`}>{label}</span>;
};

const useAgents = () => {
  const [agents, setAgents] = useState<AgentDto[]>([]);
  useEffect(() => { void agentsService.getAgents({ page: 1, pageSize: 200, status: 0 }).then((result) => setAgents(result.results ?? [])); }, []);
  return agents;
};

export const AgentContractsList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<AgentContractListItemDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || 10);
  const status = searchParams.get("status") || "";
  const contractNumber = searchParams.get("contractNumber") || "";
  const agentId = searchParams.get("agentId") || "";
  const from = searchParams.get("contractDateFrom") || "";
  const to = searchParams.get("contractDateTo") || "";
  const agents = useAgents();
  const setFilter = (key: string, value: string) => { const next = new URLSearchParams(searchParams); value ? next.set(key, value) : next.delete(key); next.set("page", "1"); setSearchParams(next); };
  const load = async () => { setLoading(true); try { const result = await agentContractsService.listContracts({ page, pageSize, status: status || undefined, agentId: agentId || undefined, contractNumber: contractNumber || undefined, contractDateFrom: from || undefined, contractDateTo: to || undefined }); setItems(result.results ?? []); setTotal(result.totalItems); } catch (error) { toast.error(getApiErrorMessage(error, "Failed to load contracts.")); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, [page, pageSize, status, agentId, contractNumber, from, to]);
  const columns = useMemo(() => [
    { accessorKey: "contractNumber", header: "Contract Number" },
    { id: "agent", header: "Agent", cell: ({ row }: any) => `${row.original.agent.code} - ${row.original.agent.fullName}` },
    { id: "contractDate", header: "Contract Date", cell: ({ row }: any) => date(row.original.contractDate) },
    { accessorKey: "status", header: "Status", cell: ({ row }: any) => <StatusBadge status={row.original.status} /> },
    { id: "advanced", header: "Advanced", cell: ({ row }: any) => money(row.original.totalAdvancedAmount) },
    { id: "repaid", header: "Repaid", cell: ({ row }: any) => money(row.original.totalRepaidAmount) },
    { id: "outstanding", header: "Outstanding", cell: ({ row }: any) => money(row.original.outstandingAmount) },
    { id: "created", header: "Created At", cell: ({ row }: any) => datetime(row.original.createdAt) },
    { id: "actions", header: "Actions", cell: ({ row }: any) => <Button size="small" variant="secondary" onClick={() => navigate(`/agent-contracts/${row.original.id}`)}>View</Button> },
  ], [navigate]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return <div className={styles.page}><SectionHeader title="Agent Contracts" actions={<Button onClick={() => navigate("/agent-contracts/create")}><Plus size={14} /> Create Contract</Button>} /><div className={styles.filters}>
    <Select value={agentId} onChange={(event) => setFilter("agentId", event.target.value)}><option value="">All agents</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agentName(agent)}</option>)}</Select>
    <Select value={status} onChange={(event) => setFilter("status", event.target.value)}><option value="">All statuses</option>{statuses.map((item) => <option key={item}>{item}</option>)}</Select>
    <TextField label="Contract Number" value={contractNumber} onChange={(event) => setFilter("contractNumber", event.target.value)} />
    <TextField label="From" type="date" value={from} onChange={(event) => setFilter("contractDateFrom", event.target.value)} />
    <TextField label="To" type="date" value={to} onChange={(event) => setFilter("contractDateTo", event.target.value)} />
  </div><div className={styles.summary}><span>{total} contracts</span><Button size="small" variant="secondary" onClick={() => setSearchParams({ page: "1", pageSize: String(pageSize) })}>Reset</Button></div>
  <DataTable columns={columns as any} data={items} isLoading={loading} manualPagination pageCount={totalPages} pageIndex={page - 1} onPaginationChange={(index) => setFilter("page", String(index + 1))} noResultsText="No contracts found" loadingText="Loading contracts..." /></div>;
};

export const CreateAgentContract = () => {
  const navigate = useNavigate();
  const agents = useAgents();
  const [rules, setRules] = useState<RepaymentRule[]>([]);
  const [versions, setVersions] = useState<RepaymentRuleVersion[]>([]);
  const [agentId, setAgentId] = useState(""); const [versionId, setVersionId] = useState(""); const [contractDate, setContractDate] = useState(new Date().toISOString().slice(0, 10)); const [notes, setNotes] = useState(""); const [submitting, setSubmitting] = useState(false); const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => { void repaymentRulesService.getRepaymentRules().then(setRules).catch((error) => toast.error(getApiErrorMessage(error, "Failed to load repayment rules."))); }, []);
  useEffect(() => { void Promise.all(rules.map((rule) => repaymentRulesService.getRepaymentRuleVersions(rule.id))).then((lists) => setVersions(lists.flat().filter((version) => isActiveRuleVersion(version.status)))).catch(() => setVersions([])); }, [rules]);
  const selected = versions.find((version) => version.id === versionId);
  const label = (version: RepaymentRuleVersion) => `${rules.find((rule) => rule.id === version.ruleId)?.name ?? "Rule"} / Version ${version.version}`;
  const submit = async () => { const next: Record<string, string> = {}; if (!agentId) next.agent = "Agent is required."; if (!versionId) next.rule = "Repayment rule version is required."; if (!contractDate) next.date = "Contract date is required."; setErrors(next); if (Object.keys(next).length) return; setSubmitting(true); try { const id = await agentContractsService.createContract({ agentId, repaymentRuleVersionId: versionId, contractDate: new Date(contractDate).toISOString(), notes: notes.trim() || undefined }); toast.success("Contract created."); navigate(`/agent-contracts/${id}`); } catch (error) { toast.error(getApiErrorMessage(error, "Failed to create contract.")); } finally { setSubmitting(false); } };
  return <div className={styles.page}><SectionHeader title="Create Agent Contract" goBack /><div className={styles.form}>
    <div><label>Agent</label><Select value={agentId} onChange={(event) => setAgentId(event.target.value)}><option value="">Select agent</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agentName(agent)}</option>)}</Select>{errors.agent && <span className={styles.error}>{errors.agent}</span>}</div>
    <div><label>Repayment Rule Version</label><Select value={versionId} onChange={(event) => setVersionId(event.target.value)}><option value="">Select active rule version</option>{versions.map((version) => <option key={version.id} value={version.id}>{label(version)}</option>)}</Select>{errors.rule && <span className={styles.error}>{errors.rule}</span>}</div>
    <TextField label="Contract Date" type="date" value={contractDate} onChange={(event) => setContractDate(event.target.value)} error={Boolean(errors.date)} helperText={errors.date} />
    <Textarea label="Notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
    {selected && <Terms terms={selected} title="Repayment Terms Preview" />}
    <div className={styles.actions}><Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button><Button onClick={submit} disabled={submitting}>{submitting ? "Creating..." : "Create Contract"}</Button></div>
  </div></div>;
};

const Terms = ({ terms, title = "Repayment Terms" }: { terms: Omit<RepaymentRuleVersion, "id" | "ruleId" | "status" | "effectiveFrom" | "createdAt"> | AgentContractDto["repaymentTerms"]; title?: string }) => <section className={styles.section}><h2>{title}</h2><div className={styles.detailGrid}><Detail label="Debt repayment" value={`${terms.debtRepaymentPercent}%`} /><Detail label="Agent payout" value={`${terms.agentPayoutPercent}%`} /><Detail label="Excess business" value={`${terms.excessBusinessPercent}%`} /><Detail label="Excess agent" value={`${terms.excessAgentPercent}%`} /><Detail label="Repayment period" value={`${terms.defaultRepaymentPeriodDays} days`} /><Detail label="Maximum extensions" value={terms.maximumExtensions} />{"ruleVersion" in terms && <Detail label="Rule version" value={terms.ruleVersion} />}</div></section>;
const Detail = ({ label, value }: { label: string; value: React.ReactNode }) => <div className={styles.detail}><span>{label}</span><strong>{value ?? "-"}</strong></div>;

export const AgentContractDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState<AgentContractDto | null>(null);
  const [capitalSources, setCapitalSources] = useState<CapitalSourceDto[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceDate, setAdvanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [advanceNotes, setAdvanceNotes] = useState("");
  const [advanceSaving, setAdvanceSaving] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [contractResult, sourceResult] = await Promise.all([
        agentContractsService.getContract(id),
        capitalSourcesService.listCapitalSources({ page: 1, pageSize: 200 }),
      ]);

      setContract(contractResult);
      setCapitalSources(sourceResult.results ?? []);

      if (contractResult?.agent?.id) {
        const deliveryResult = await powderDeliveriesService.listForAgent(contractResult.agent.id, { page: 1, pageSize: 200 });
        setDeliveries(deliveryResult.results ?? []);
      } else {
        setDeliveries([]);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load contract details."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [id]);

  const cancel = async () => { if (!id) return; try { await agentContractsService.cancelContract(id); toast.success("Contract cancelled."); void load(); } catch (error) { toast.error(getApiErrorMessage(error, "Failed to cancel contract.")); } };

  const createAdvance = async () => {
    if (!id || !advanceAmount || Number(advanceAmount) <= 0) {
      toast.error("Please enter a valid advance amount.");
      return;
    }

    setAdvanceSaving(true);
    try {
      await agentContractsService.createAdvance(id, {
        amount: Number(advanceAmount),
        advanceDate: new Date(advanceDate).toISOString(),
        notes: advanceNotes.trim() || undefined,
      });

      toast.success("Advance created successfully.");
      setAdvanceOpen(false);
      setAdvanceAmount("");
      setAdvanceNotes("");
      setAdvanceDate(new Date().toISOString().slice(0, 10));
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to create advance."));
    } finally {
      setAdvanceSaving(false);
    }
  };

  const fundingRows = useMemo(() => {
    if (!contract) return [] as Array<{ id: string; name: string; status: string; amount: number; usedAmount: number; remainingAmount: number; contributionPercent: number }>;

    const map = new Map<string, { id: string; name: string; status: string; amount: number; usedAmount: number; remainingAmount: number; contributionPercent: number }>();

    for (const advance of contract.advances ?? []) {
      for (const allocation of advance.allocations ?? []) {
        const existing = map.get(allocation.capitalSourceId) ?? {
          id: allocation.capitalSourceId,
          name: allocation.capitalSourceName,
          status: "Active",
          amount: 0,
          usedAmount: 0,
          remainingAmount: 0,
          contributionPercent: 0,
        };

        existing.amount += allocation.amount;
        existing.usedAmount += Math.min(allocation.amount, contract.financials.totalAdvancedAmount || allocation.amount);
        existing.remainingAmount = Math.max(0, existing.amount - existing.usedAmount);

        const source = capitalSources.find((item) => item.id === allocation.capitalSourceId);
        if (source) {
          existing.name = source.name || allocation.capitalSourceName;
          existing.status = source.status;
        }

        map.set(allocation.capitalSourceId, existing);
      }
    }

    return Array.from(map.values()).map((row) => ({
      ...row,
      contributionPercent: contract.financials.totalAdvancedAmount ? Number(((row.usedAmount / contract.financials.totalAdvancedAmount) * 100).toFixed(2)) : 0,
    }));
  }, [capitalSources, contract]);

  const totalAllocatedCapital = fundingRows.reduce((sum, row) => sum + row.amount, 0);
  const totalUsedCapital = fundingRows.reduce((sum, row) => sum + row.usedAmount, 0);
  const totalRemainingCapital = Math.max(0, totalAllocatedCapital - totalUsedCapital);

  const deliveryColumns = useMemo(() => [
    { accessorKey: "deliveryNumber", header: "Delivery ID" },
    { id: "date", header: "Date", cell: ({ row }: any) => date(row.original.deliveryDate) },
    { id: "weight", header: "Powder (kg)", cell: ({ row }: any) => money(row.original.netWeightKg) },
    { id: "value", header: "Kitco Value", cell: ({ row }: any) => money(row.original.totalValueAmd) },
    { id: "status", header: "Status", cell: ({ row }: any) => <StatusBadge status={row.original.status} /> },
  ], []);

  if (loading || !contract) return <div className={styles.page}><SectionHeader title="Contract Details" goBack />Loading contract...</div>;

  const activeRule = contract.repaymentTerms;
  const hasActiveContract = isActiveAgentStatus(contract.status);
  const hasActiveRule = Boolean(activeRule && (activeRule.debtRepaymentPercent > 0 || activeRule.agentPayoutPercent > 0 || activeRule.excessBusinessPercent > 0 || activeRule.excessAgentPercent > 0));
  const hasFunding = fundingRows.length > 0 && totalAllocatedCapital > 0;

  return <div className={styles.page}><SectionHeader title={contract.contractNumber} goBack actions={<div className={styles.headerActions}><Button variant="secondary" onClick={() => navigate(`/agent-contracts/${contract.id}/powder-deliveries`)}>Delivery History</Button>{isDraft(contract.status) && <Button onClick={() => setAdvanceOpen(true)}><Plus size={14} /> Create Advance</Button>}{isDraft(contract.status) && <Button variant="danger" onClick={() => setCancelOpen(true)}>Cancel Contract</Button>}</div>} />
    {!hasActiveContract || !hasActiveRule || !hasFunding ? <div className={styles.notice} style={{ marginBottom: 16 }}>
      <strong>Automatic compliance check:</strong>
      {!hasActiveContract && " No active contract. "}
      {!hasActiveRule && " No active repayment rule. "}
      {!hasFunding && " No capital source funding available. "}
    </div> : null}

    <section className={styles.section}>
      <h2>Automatic Flow</h2>
      <div className={styles.detailGrid}>
        <div className={styles.detail}><span>Customer Purchase</span><strong>Completed</strong></div>
        <div className={styles.detail}><span>Agent Detected</span><strong>{contract.agent.fullName}</strong></div>
        <div className={styles.detail}><span>PowderDelivery Created</span><strong>Automatic</strong></div>
        <div className={styles.detail}><span>Admin Confirms</span><strong>Settlement step</strong></div>
        <div className={styles.detail}><span>Contract + Rule Applied</span><strong>{hasActiveRule ? "Applied" : "Missing"}</strong></div>
        <div className={styles.detail}><span>Capital Source Updated</span><strong>{hasFunding ? "Available" : "Missing"}</strong></div>
      </div>
    </section>

    <section className={styles.section}><h2>Agent Information</h2><div className={styles.detailGrid}><Detail label="Agent" value={`${contract.agent.code} - ${contract.agent.fullName}`} /><Detail label="Phone" value="-" /><Detail label="Agent type" value="-" /><Detail label="Contract number" value={contract.contractNumber} /><Detail label="Contract status" value={<StatusBadge status={contract.status} />} /></div></section>

    <section className={styles.section}><h2>Active Contract Rule</h2><div className={styles.detailGrid}><Detail label="Rule version" value={activeRule.ruleVersion} /><Detail label="Debt repayment %" value={`${activeRule.debtRepaymentPercent}%`} /><Detail label="Agent payout %" value={`${activeRule.agentPayoutPercent}%`} /><Detail label="Excess business %" value={`${activeRule.excessBusinessPercent}%`} /><Detail label="Excess agent %" value={`${activeRule.excessAgentPercent}%`} /><Detail label="Repayment period" value={`${activeRule.defaultRepaymentPeriodDays} days`} /><Detail label="Maximum extensions" value={activeRule.maximumExtensions} /><Detail label="Effective from" value={date(contract.contractDate)} /><Detail label="Effective to" value="-" /></div></section>

    <section className={styles.section}><h2>Capital Funding</h2>{fundingRows.length ? <DataTable columns={[{ accessorKey: "name", header: "Capital Source" }, { accessorKey: "status", header: "Status" }, { id: "contribution", header: "Contribution %", cell: ({ row }: any) => `${row.original.contributionPercent}%` }, { id: "allocated", header: "Allocated", cell: ({ row }: any) => money(row.original.amount) }, { id: "used", header: "Used", cell: ({ row }: any) => money(row.original.usedAmount) }, { id: "remaining", header: "Remaining", cell: ({ row }: any) => money(row.original.remainingAmount) }]} data={fundingRows as any} noResultsText="No capital funding found" /> : <div className={styles.muted}>No capital source allocation found for this agent.</div>}<div className={styles.financials} style={{ marginTop: 16 }}><Detail label="Total allocated capital" value={money(totalAllocatedCapital)} /><Detail label="Total used capital" value={money(totalUsedCapital)} /><Detail label="Total remaining capital" value={money(totalRemainingCapital)} /></div></section>

    <section className={styles.section}><h2>Advance Funding</h2>{isDraft(contract.status) && <div style={{ marginBottom: 12 }}><Button onClick={() => setAdvanceOpen(true)}><Plus size={14} /> Create Advance</Button></div>}{(contract.advances ?? []).length ? <DataTable columns={[{ accessorKey: "advanceNumber", header: "Advance" }, { id: "amount", header: "Advanced", cell: ({ row }: any) => money(row.original.advancedAmount) }, { id: "allocated", header: "Allocated", cell: ({ row }: any) => money(row.original.allocatedAmount) }, { accessorKey: "status", header: "Status", cell: ({ row }: any) => <StatusBadge status={row.original.status} /> }, { id: "actions", header: "Actions", cell: ({ row }: any) => <div className={styles.inlineActions}><Button size="small" variant="secondary" onClick={() => navigate(`/agent-advances/${row.original.id}`)}>View</Button>{isDraftAgentStatus(row.original.status) && <Button size="small" onClick={() => navigate(`/agent-advances/${row.original.id}`)}>Add Allocation</Button>}</div> }]} data={contract.advances ?? []} noResultsText="No advances for this contract" /> : <div className={styles.muted}>No advances exist for this contract yet. Create the first advance to begin funding.</div>}</section>

    <section className={styles.section}><h2>Automatic Powder Deliveries</h2>{deliveries.length ? <DataTable columns={deliveryColumns as any} data={deliveries} noResultsText="No confirmed powder deliveries" /> : <div className={styles.muted}>No powder deliveries found for this agent yet.</div>}</section>

    <section className={styles.section}><h2>Repayment Summary</h2><div className={styles.financials}><Detail label="Initial debt" value={money(contract.financials.outstandingAmount)} /><Detail label="Total delivered value" value={money(deliveries.reduce((sum, item) => sum + (item.totalValueAmd ?? 0), 0))} /><Detail label="Total repaid" value={money(contract.financials.totalRepaidAmount)} /><Detail label="Remaining debt" value={money(contract.financials.outstandingAmount)} /><Detail label="Next deadline" value="-" /><Detail label="Extensions used" value="0" /><Detail label="Remaining extensions" value={activeRule.maximumExtensions} /></div></section>

    <ConfirmationModal open={advanceOpen} onOpenChange={setAdvanceOpen} title="Create Advance" description="Create a new advance for this contract before funding it from capital sources." confirmText="Create Advance" confirmLoading={advanceSaving} onConfirm={createAdvance}>
      <div className={styles.modalFields}>
        <TextField label="Advance amount" type="number" min="0.01" value={advanceAmount} onChange={(event) => setAdvanceAmount(event.target.value)} />
        <TextField label="Advance date" type="date" value={advanceDate} onChange={(event) => setAdvanceDate(event.target.value)} />
        <Textarea label="Notes" value={advanceNotes} onChange={(event) => setAdvanceNotes(event.target.value)} />
      </div>
    </ConfirmationModal>

    <ConfirmationModal open={cancelOpen} onOpenChange={setCancelOpen} title="Cancel contract" description="This can only be done for a draft contract without funded or active advances." confirmText="Cancel Contract" onConfirm={cancel} />
  </div>;
};

export const AgentAdvancesList = () => {
  const navigate = useNavigate(); const [searchParams, setSearchParams] = useSearchParams(); const [items, setItems] = useState<AgentAdvanceDto[]>([]); const [total, setTotal] = useState(0); const [loading, setLoading] = useState(false); const agents = useAgents(); const page = Number(searchParams.get("page") || 1); const pageSize = Number(searchParams.get("pageSize") || 10); const status = searchParams.get("status") || ""; const agentId = searchParams.get("agentId") || ""; const contractId = searchParams.get("contractId") || ""; const advanceNumber = searchParams.get("advanceNumber") || ""; const from = searchParams.get("advanceDateFrom") || ""; const to = searchParams.get("advanceDateTo") || ""; const setFilter = (key: string, value: string) => { const next = new URLSearchParams(searchParams); value ? next.set(key, value) : next.delete(key); next.set("page", "1"); setSearchParams(next); };
  useEffect(() => { const load = async () => { setLoading(true); try { const result = await agentContractsService.listAdvances({ page, pageSize, status: status || undefined, agentId: agentId || undefined, contractId: contractId || undefined, advanceNumber: advanceNumber || undefined, advanceDateFrom: from || undefined, advanceDateTo: to || undefined }); setItems(result.results ?? []); setTotal(result.totalItems); } catch (error) { toast.error(getApiErrorMessage(error, "Failed to load advances.")); } finally { setLoading(false); } }; void load(); }, [page, pageSize, status, agentId, contractId, advanceNumber, from, to]);
  const columns = useMemo(() => [{ accessorKey: "advanceNumber", header: "Advance Number" }, { id: "agent", header: "Agent", cell: ({ row }: any) => `${row.original.agent.code} - ${row.original.agent.fullName}` }, { accessorKey: "agentContractId", header: "Contract" }, { id: "amount", header: "Advanced", cell: ({ row }: any) => money(row.original.advancedAmount) }, { id: "allocated", header: "Allocated", cell: ({ row }: any) => money(row.original.allocatedAmount) }, { id: "date", header: "Advance Date", cell: ({ row }: any) => datetime(row.original.advanceDate) }, { accessorKey: "status", header: "Status", cell: ({ row }: any) => <StatusBadge status={row.original.status} /> }, { id: "created", header: "Created At", cell: ({ row }: any) => datetime(row.original.createdAt) }, { id: "actions", header: "Actions", cell: ({ row }: any) => <Button size="small" variant="secondary" onClick={() => navigate(`/agent-advances/${row.original.id}`)}>View</Button> }], [navigate]);
  return <div className={styles.page}><SectionHeader title="Agent Advances" actions={<Button variant="secondary" onClick={() => navigate("/agent-contracts")}>Contracts</Button>} /><div className={styles.filters}><Select value={agentId} onChange={(event) => setFilter("agentId", event.target.value)}><option value="">All agents</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agentName(agent)}</option>)}</Select><Select value={status} onChange={(event) => setFilter("status", event.target.value)}><option value="">All statuses</option>{statuses.map((item) => <option key={item}>{item}</option>)}</Select><TextField label="Contract ID" value={contractId} onChange={(event) => setFilter("contractId", event.target.value)} /><TextField label="Advance Number" value={advanceNumber} onChange={(event) => setFilter("advanceNumber", event.target.value)} /><TextField label="From" type="date" value={from} onChange={(event) => setFilter("advanceDateFrom", event.target.value)} /><TextField label="To" type="date" value={to} onChange={(event) => setFilter("advanceDateTo", event.target.value)} /></div><DataTable columns={columns as any} data={items} isLoading={loading} manualPagination pageCount={Math.max(1, Math.ceil(total / pageSize))} pageIndex={page - 1} onPaginationChange={(index) => setFilter("page", String(index + 1))} noResultsText="No advances found" loadingText="Loading advances..." /></div>;
};

export const AgentAdvanceDetails = () => {
  const { id } = useParams(); const navigate = useNavigate(); const [advance, setAdvance] = useState<AgentAdvanceDto | null>(null); const [sources, setSources] = useState<CapitalSourceDto[]>([]); const [sourceId, setSourceId] = useState(""); const [amount, setAmount] = useState(""); const [description, setDescription] = useState(""); const [allocationOpen, setAllocationOpen] = useState(false); const [removeId, setRemoveId] = useState<string | null>(null); const [activateOpen, setActivateOpen] = useState(false); const [saving, setSaving] = useState(false);
  const load = async () => { if (!id) return; try { const [result, sourceResult] = await Promise.all([agentContractsService.getAdvance(id), capitalSourcesService.listCapitalSources({ page: 1, pageSize: 200, status: "Active" })]); setAdvance(result); setSources(sourceResult.results ?? []); } catch (error) { toast.error(getApiErrorMessage(error, "Failed to load advance.")); } };
  useEffect(() => { void load(); }, [id]);
  if (!advance) return <div className={styles.page}><SectionHeader title="Advance Details" goBack />Loading advance...</div>;
  const remaining = Math.max(0, advance.advancedAmount - advance.allocatedAmount); const draft = isDraft(advance.status);
  const addAllocation = async () => { const parsed = Number(amount); if (!sourceId || !(parsed > 0) || parsed > remaining) { toast.error("Choose a capital source and enter an amount up to the remaining balance."); return; } if (!id) return; setSaving(true); try { await agentContractsService.addAllocation(id, { capitalSourceId: sourceId, amount: parsed, description: description.trim() || undefined }); toast.success("Allocation added."); setSourceId(""); setAmount(""); setDescription(""); setAllocationOpen(false); await load(); } catch (error) { toast.error(getApiErrorMessage(error, "Failed to add allocation.")); } finally { setSaving(false); } };
  const remove = async () => { if (!id || !removeId) return; try { await agentContractsService.removeAllocation(id, removeId); toast.success("Allocation removed."); void load(); } catch (error) { toast.error(getApiErrorMessage(error, "Failed to remove allocation.")); } finally { setRemoveId(null); } };
  const activate = async () => { if (!id) return; try { await agentContractsService.activateAdvance(id); toast.success("Advance activated."); void load(); } catch (error) { toast.error(getApiErrorMessage(error, "Failed to activate advance.")); } };
  const columns = [{ accessorKey: "capitalSourceCode", header: "Capital Source Code" }, { accessorKey: "capitalSourceName", header: "Capital Source" }, { id: "amount", header: "Amount", cell: ({ row }: any) => money(row.original.amount) }, { id: "created", header: "Created At", cell: ({ row }: any) => datetime(row.original.createdAt) }, { accessorKey: "createdBy", header: "Created By" }, { id: "actions", header: "Actions", cell: ({ row }: any) => draft && <Button size="small" variant="danger" onClick={() => setRemoveId(row.original.id)}>Remove</Button> }];
  return <div className={styles.page}><SectionHeader title={advance.advanceNumber} goBack actions={<div className={styles.headerActions}><Button variant="secondary" onClick={() => navigate(`/agent-contracts/${advance.agentContractId}`)}>View Contract</Button>{draft && <Button onClick={() => setAllocationOpen(true)}>Add Allocation</Button>}{draft && <Button disabled={remaining !== 0} onClick={() => setActivateOpen(true)}>Activate Advance</Button>}</div>} /><div className={styles.detailGrid}><Detail label="Status" value={<StatusBadge status={advance.status} />} /><Detail label="Advance date" value={datetime(advance.advanceDate)} /><Detail label="Agent" value={`${advance.agent.code} - ${advance.agent.fullName}`} /><Detail label="Notes" value={advance.notes} /></div><section className={styles.section}><h2>Funding Summary</h2><div className={styles.financials}><Detail label="Advanced amount" value={money(advance.advancedAmount)} /><Detail label="Allocated amount" value={money(advance.allocatedAmount)} /><Detail label="Remaining amount" value={money(remaining)} /></div><div className={styles.progress}><span style={{ width: `${advance.advancedAmount ? Math.min(100, (advance.allocatedAmount / advance.advancedAmount) * 100) : 0}%` }} /></div></section><section className={styles.section}><h2>Allocations</h2><DataTable columns={columns as any} data={advance.allocations ?? []} noResultsText="No allocations yet" /></section><ConfirmationModal open={allocationOpen} onOpenChange={setAllocationOpen} title="Add Allocation" description={`Remaining to allocate: ${money(remaining)}`} confirmText="Add Allocation" confirmLoading={saving} preventClose onConfirm={addAllocation}><div className={styles.modalFields}><Select value={sourceId} onChange={(event) => setSourceId(event.target.value)}><option value="">Select capital source</option>{sources.map((source) => <option key={source.id} value={source.id}>{source.code} - current balance: {money(source.currentBalance)}</option>)}</Select><TextField label="Amount" type="number" min="0.01" max={remaining} value={amount} onChange={(event) => setAmount(event.target.value)} /><TextField label="Description" value={description} onChange={(event) => setDescription(event.target.value)} /></div></ConfirmationModal><ConfirmationModal open={Boolean(removeId)} onOpenChange={(open) => !open && setRemoveId(null)} title="Remove allocation" description="The allocated funds will be returned to the capital source." confirmText="Remove Allocation" onConfirm={remove} /><ConfirmationModal open={activateOpen} onOpenChange={setActivateOpen} title="Activate advance" description="Activation makes the advance and its allocations read-only." confirmText="Activate Advance" onConfirm={activate} /></div>;
};