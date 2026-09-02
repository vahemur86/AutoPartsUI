import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Plus } from "lucide-react";

import { Button, DataTable, Select, TextField } from "@/ui-kit";
import { SectionHeader } from "@/components/common";
import { capitalSourcesService } from "@/services/capitalSources";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import type { CapitalSourceDto, CapitalSourceStatus, CapitalSourceType } from "@/types/capitalSources";
import styles from "./CapitalSources.module.css";

const typeOptions: Array<{ value: CapitalSourceType | ""; label: string }> = [
  { value: "", label: "All types" },
  { value: "BankLoan", label: "Bank Loan" },
  { value: "OwnerInvestment", label: "Owner Investment" },
  { value: "Other", label: "Other" },
];

const statusOptions: Array<{ value: CapitalSourceStatus | ""; label: string }> = [
  { value: "", label: "All statuses" },
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "Closed", label: "Closed" },
];

const formatMoney = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

const getStatusClass = (status?: CapitalSourceStatus | string | null) => {
  switch (status) {
    case "Active":
      return styles.statusActive;
    case "Inactive":
      return styles.statusInactive;
    case "Closed":
      return styles.statusClosed;
    default:
      return styles.statusInactive;
  }
};

export const CapitalSourcesList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<CapitalSourceDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  const page = Number(searchParams.get("page") || "1");
  const pageSize = Number(searchParams.get("pageSize") || "10");
  const type = searchParams.get("type") || "";
  const status = searchParams.get("status") || "";
  const code = searchParams.get("code") || "";
  const name = searchParams.get("name") || "";

  const load = async () => {
    setIsLoading(true);
    try {
      const result = await capitalSourcesService.listCapitalSources({
        type: type || undefined,
        status: status || undefined,
        code: code || undefined,
        name: name || undefined,
        page,
        pageSize,
      });
      setItems(result.results ?? []);
      setTotalItems(result.totalItems ?? 0);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("capitalSources.errors.loadFailed", "Failed to load capital sources.")));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [page, pageSize, type, status, code, name]);

  const applyFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set("page", "1");
    setSearchParams(next);
  };

  const resetFilters = () => {
    setSearchParams({ page: "1", pageSize: String(pageSize) });
  };

  const columns = useMemo(
    () => [
      { accessorKey: "code", header: "Code" },
      { accessorKey: "name", header: "Name" },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }: any) => row.original.type,
      },
      {
        accessorKey: "initialAmount",
        header: "Initial Amount",
        cell: ({ row }: any) => formatMoney(row.original.initialAmount),
      },
      {
        accessorKey: "currentBalance",
        header: "Current Balance",
        cell: ({ row }: any) => formatMoney(row.original.currentBalance),
      },
      {
        accessorKey: "interestRate",
        header: "Interest Rate",
        cell: ({ row }: any) => (row.original.interestRate != null ? `${row.original.interestRate}%` : "—"),
      },
      {
        accessorKey: "startDate",
        header: "Start Date",
        cell: ({ row }: any) => row.original.startDate ? new Date(row.original.startDate).toLocaleDateString() : "—",
      },
      {
        accessorKey: "endDate",
        header: "End Date",
        cell: ({ row }: any) => row.original.endDate ? new Date(row.original.endDate).toLocaleDateString() : "—",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }: any) => (
          <span className={`${styles.statusBadge} ${getStatusClass(row.original.status)}`}>
            {row.original.status}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: any) => (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button variant="secondary" size="small" onClick={() => navigate(`/capital-sources/${row.original.id}`)}>
              View
            </Button>
            <Button variant="secondary" size="small" onClick={() => navigate(`/capital-sources/${row.original.id}/edit`)}>
              Edit
            </Button>
          </div>
        ),
      },
    ],
    [navigate],
  );

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return (
    <div className={styles.page}>
      <SectionHeader
        title="Capital Sources"
        actions={
          <div className={styles.headerActions}>
            <Button onClick={() => navigate("/capital-sources/create")}>
              <Plus size={14} /> Create
            </Button>
          </div>
        }
      />

      <div className={styles.page}>
        <div className={styles.filterGrid}>
          <Select value={type} onChange={(e) => applyFilter("type", e.target.value)}>
            {typeOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select value={status} onChange={(e) => applyFilter("status", e.target.value)}>
            {statusOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <TextField
            label="Code"
            value={code}
            onChange={(e) => applyFilter("code", e.target.value)}
          />

          <TextField
            label="Name"
            value={name}
            onChange={(e) => applyFilter("name", e.target.value)}
          />
        </div>

        <div className={styles.summaryRow}>
          <div className={styles.summaryText}>{totalItems} total items</div>
          <Button variant="secondary" size="small" onClick={resetFilters}>
            Reset
          </Button>
        </div>

        <DataTable
          columns={columns as any}
          data={items}
          isLoading={isLoading}
          pageSize={pageSize}
          manualPagination
          pageCount={totalPages}
          pageIndex={page - 1}
          onPaginationChange={(newPageIndex) => {
            const next = new URLSearchParams(searchParams);
            next.set("page", String(newPageIndex + 1));
            setSearchParams(next);
          }}
          noResultsText="No capital sources found"
          loadingText="Loading capital sources..."
        />
      </div>
    </div>
  );
};
