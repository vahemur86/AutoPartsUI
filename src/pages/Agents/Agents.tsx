import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { DataTable, TextField, Button, Select } from "@/ui-kit";
import { SectionHeader } from "@/components/common";
import { agentsService } from "@/services/agents";
import { getApiErrorMessage, getAgentTypeIcon, getAgentTypeColor } from "@/utils";
import type { AgentDto, AgentTypeDto } from "@/types/agents";
import { AgentStatus } from "@/types/agents";
import styles from "./Agents.module.css";

const getStatusLabel = (status?: AgentStatus | number | string | null) => {
  const value = Number(status ?? 0);

  switch (value) {
    case AgentStatus.Active:
      return "Active";
    case AgentStatus.Inactive:
      return "Inactive";
    case AgentStatus.Suspended:
      return "Suspended";
    case AgentStatus.Blocked:
      return "Blocked";
    default:
      return "Unknown";
  }
};

const getStatusClass = (status?: AgentStatus | number | string | null) => {
  const value = Number(status ?? 0);

  switch (value) {
    case AgentStatus.Active:
      return styles.statusActive;
    case AgentStatus.Inactive:
      return styles.statusInactive;
    case AgentStatus.Suspended:
      return styles.statusSuspended;
    case AgentStatus.Blocked:
      return styles.statusBlocked;
    default:
      return styles.statusInactive;
  }
};

export const Agents = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Parse query params
  const code = searchParams.get("code") || "";
  const customerName = searchParams.get("customerName") || "";
  const phone = searchParams.get("phone") || "";
  const status = searchParams.get("status") || "";
  const agentTypeId = searchParams.get("agentTypeId") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

  const [items, setItems] = useState<AgentDto[]>([]);
  const [total, setTotal] = useState(0);
  const [agentTypes, setAgentTypes] = useState<AgentTypeDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Load agent types
  useEffect(() => {
    void (async () => {
      try {
        const types = await agentsService.getAgentTypes();
        setAgentTypes(types || []);
      } catch (error) {
        console.error("Failed to load agent types:", error);
      }
    })();
  }, []);

  // Load agents
  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: any = {};
      if (code) filters.code = code;
      if (customerName) filters.customerName = customerName;
      if (phone) filters.phone = phone;
      if (status) filters.status = Number(status);
      if (agentTypeId) filters.agentTypeId = agentTypeId;

      const result = await agentsService.getAgents({
        ...filters,
        page,
        pageSize,
      });
      
      setItems(result.results ?? []);
      setTotal(result.totalItems ?? 0);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("agents.errors.loadFailed")));
    } finally {
      setIsLoading(false);
    }
  }, [code, customerName, phone, status, agentTypeId, page, pageSize, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateQueryParam = useCallback(
    (key: string, value: string) => {
      const newParams = new URLSearchParams(searchParams);
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
      newParams.set("page", "1"); // Reset to page 1 on filter change
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams],
  );

  const handleDebounce = useCallback(
    (key: string, value: string) => {
      clearTimeout(debounceTimers.current[key]);
      debounceTimers.current[key] = setTimeout(() => {
        updateQueryParam(key, value);
      }, 300);
    },
    [updateQueryParam],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("page", String(newPage));
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams],
  );

  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const columns = useMemo(
    () => [
      { 
        accessorKey: "code", 
        header: t("agents.fields.code"),
      },
      {
        accessorFn: (row: AgentDto) => row.customer?.fullName || "—",
        id: "fullName",
        header: t("agents.fields.fullName"),
      },
      { 
        accessorKey: "phone", 
        header: t("agents.fields.phone"),
      },
      {
        accessorKey: "status",
        header: t("agents.fields.status"),
        cell: ({ row }: any) => (
          <span className={`${styles.statusBadge} ${getStatusClass(row.original.status)}`}>
            {getStatusLabel(row.original.status)}
          </span>
        ),
      },
      {
        accessorFn: (row: AgentDto) => row.agentType?.code ?? "—",
        id: "agentType",
        header: t("agents.fields.agentType"),
        cell: ({ row }: any) => {
          const code = row.original.agentType?.code;
          if (!code) return "—";
          const IconComponent = getAgentTypeIcon(code);
          const iconColor = getAgentTypeColor(code);
          return (
            <div className={styles.agentTypeWithIcon}>
              <IconComponent size={16} style={{ color: iconColor }} />
              <span>{code}</span>
            </div>
          );
        },
      },
      { 
        accessorKey: "registrationDate", 
        header: t("agents.fields.registrationDate"),
      },
      {
        id: "actions",
        header: t("agents.fields.actions"),
        cell: ({ row }: any) => (
          <div className={styles.actionsRow}>
            <Button variant="secondary" size="small" onClick={() => navigate(`/agents/${row.original.id}`)}>
              {t("agents.actions.view")}
            </Button>
          </div>
        ),
      },
    ],
    [navigate, t],
  );

  const activeCount = items.filter((item) => Number(item.status) === AgentStatus.Active).length;
  const blockedCount = items.filter((item) => Number(item.status) === AgentStatus.Blocked).length;
  const maxPage = Math.ceil(total / pageSize) || 1;

  return (
    <div className={styles.page}>
      <SectionHeader
        title={t("agents.title")}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={() => navigate("/agents/new")}>{t("agents.actions.create")}</Button>
          </div>
        }
      />

      <div className={styles.banner}>{t("agents.info.metricsUnavailable")}</div>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>{t("agents.summary.total")}</div>
          <div className={styles.summaryValue}>{total}</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>{t("agents.summary.active")}</div>
          <div className={styles.summaryValue}>{activeCount}</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>{t("agents.summary.blocked")}</div>
          <div className={styles.summaryValue}>{blockedCount}</div>
        </div>
      </div>

      {/* Filters Section */}
      <div className={styles.filtersSection}>
        <h3>{t("common.filters")}</h3>
        <div className={styles.filterGrid}>
          <TextField
            label={t("agents.fields.code")}
            placeholder={t("common.search")}
            value={code}
            onChange={(e) => handleDebounce("code", e.target.value)}
          />
          <TextField
            label={t("agents.fields.fullName")}
            placeholder={t("common.search")}
            value={customerName}
            onChange={(e) => handleDebounce("customerName", e.target.value)}
          />
          <TextField
            label={t("agents.fields.phone")}
            placeholder={t("common.search")}
            value={phone}
            onChange={(e) => handleDebounce("phone", e.target.value)}
          />
          <Select
            label={t("agents.fields.status")}
            value={status}
            onChange={(e) => updateQueryParam("status", e.target.value)}
          >
            <option value="">{t("common.all")}</option>
            <option value={String(AgentStatus.Active)}>{getStatusLabel(AgentStatus.Active)}</option>
            <option value={String(AgentStatus.Inactive)}>{getStatusLabel(AgentStatus.Inactive)}</option>
            <option value={String(AgentStatus.Suspended)}>{getStatusLabel(AgentStatus.Suspended)}</option>
            <option value={String(AgentStatus.Blocked)}>{getStatusLabel(AgentStatus.Blocked)}</option>
          </Select>
          <Select
            label={t("agents.fields.agentType")}
            value={agentTypeId}
            onChange={(e) => updateQueryParam("agentTypeId", e.target.value)}
          >
            <option value="">{t("common.all")}</option>
            {agentTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.code} - {type.name}
              </option>
            ))}
          </Select>
        </div>
        {(code || customerName || phone || status || agentTypeId) && (
          <Button variant="secondary" size="small" onClick={resetFilters} style={{ marginTop: "8px" }}>
            {t("common.reset")}
          </Button>
        )}
      </div>

      <div className={styles.tableWrap}>
        <DataTable
          columns={columns as any}
          data={items}
          isLoading={isLoading}
          noResultsText={t("agents.empty")}
          loadingText={t("agents.loading")}
        />
      </div>

      {/* Pagination */}
      <div className={styles.paginationSection}>
        <div className={styles.paginationInfo}>
          {t("common.results", { from: (page - 1) * pageSize + 1, to: Math.min(page * pageSize, total), total })}
        </div>
        <div className={styles.paginationControls}>
          <Button
            variant="secondary"
            size="small"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1 || isLoading}
          >
            {t("common.previous")}
          </Button>
          <input
            type="number"
            min="1"
            max={maxPage}
            value={page}
            onChange={(e) => handlePageChange(Math.max(1, Math.min(maxPage, Number(e.target.value))))}
            disabled={isLoading}
            className={styles.pageInput}
          />
          <span>/ {maxPage}</span>
          <Button
            variant="secondary"
            size="small"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= maxPage || isLoading}
          >
            {t("common.next")}
          </Button>
          <Select
            value={String(pageSize)}
            onChange={(e) => {
              const newParams = new URLSearchParams(searchParams);
              newParams.set("pageSize", e.target.value);
              newParams.set("page", "1");
              setSearchParams(newParams);
            }}
            disabled={isLoading}
            style={{ width: "80px" }}
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default Agents;

