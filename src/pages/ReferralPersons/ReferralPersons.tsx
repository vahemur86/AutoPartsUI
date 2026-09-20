import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

import { SectionHeader } from "@/components/common";
import { Button, DataTable, Select, TextField } from "@/ui-kit";
import {
  getReferralPersons,
  type ReferralPersonDto,
} from "@/services/referralPersons";

export const ReferralPersons = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<ReferralPersonDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [totalItems, setTotalItems] = useState(0);

  const load = async () => {
    setIsLoading(true);
    try {
      const response = await getReferralPersons({
        page,
        pageSize,
        status: filterStatus === "All" ? undefined : filterStatus,
        search,
      });
      setItems(response.results);
      setTotalItems(response.totalItems);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [page, pageSize, filterStatus, search]);

  const columns = useMemo(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "code", header: "Code" },
      { accessorKey: "name", header: "Name" },
      { accessorKey: "phone", header: "Phone" },
      { accessorKey: "email", header: "Email" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }: any) => (
          <span
            style={{
              display: "inline-flex",
              padding: "4px 10px",
              borderRadius: 999,
              background: row.original.status === "Active" ? "#d1fae5" : "#e5e7eb",
              color: row.original.status === "Active" ? "#065f46" : "#374151",
              fontWeight: 600,
            }}
          >
            {row.original.status}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: any) => (
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" size="small" onClick={() => navigate(`/referral-persons/${row.original.id}`)}>
              View
            </Button>
            <Button variant="secondary" size="small" onClick={() => navigate(`/referral-persons/${row.original.id}/edit`)}>
              Edit
            </Button>
          </div>
        ),
      },
    ],
    [navigate],
  );

  return (
    <div style={{ display: "grid", gap: 16, padding: 24 }}>
      <SectionHeader
        title={t("referralPerson.title", "Referral Persons")}
        actions={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Button variant="secondary" onClick={() => navigate("/commissions")}>
              Referral Commissions
            </Button>
            <Button onClick={() => navigate("/referral-persons/create")}>
              <Plus size={14} />
              {t("referralPerson.actions.create", "Add New Person")}
            </Button>
          </div>
        }
      />

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          label="Search"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />

        <Select
          label="Status"
          value={filterStatus}
          onChange={(e) => {
            setPage(1);
            setFilterStatus(e.target.value);
          }}
        >
          <option value="All">All</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </Select>

        <Select
          label="Page size"
          value={String(pageSize)}
          onChange={(e) => {
            setPage(1);
            setPageSize(Number(e.target.value));
          }}
        >
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
        </Select>
      </div>

      <DataTable
        columns={columns as any}
        data={items}
        isLoading={isLoading}
        pageSize={pageSize}
        manualPagination={false}
      />

      <div style={{ fontSize: 14, color: "#475569" }}>
        Showing {items.length} of {totalItems} referral persons
      </div>
    </div>
  );
};
