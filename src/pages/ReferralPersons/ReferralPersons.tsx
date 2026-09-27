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
      { accessorKey: "id", header: t("referralPerson.fields.id") },
      { accessorKey: "code", header: t("referralPerson.fields.code") },
      { accessorKey: "name", header: t("referralPerson.fields.name") },
      { accessorKey: "phone", header: t("referralPerson.fields.phone") },
      { accessorKey: "email", header: t("referralPerson.fields.email") },
      {
        accessorKey: "status",
        header: t("referralPerson.fields.status"),
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
            {t(`referralPerson.statuses.${String(row.original.status).toLowerCase()}`, { defaultValue: row.original.status })}
          </span>
        ),
      },
      {
        id: "actions",
        header: t("common.actions"),
        cell: ({ row }: any) => (
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" size="small" onClick={() => navigate(`/referral-persons/${row.original.id}`)}>
              {t("referralPerson.actions.view")}
            </Button>
            <Button variant="secondary" size="small" onClick={() => navigate(`/referral-persons/${row.original.id}/edit`)}>
              {t("referralPerson.actions.edit")}
            </Button>
          </div>
        ),
      },
    ],
    [navigate, t],
  );

  return (
    <div style={{ display: "grid", gap: 16, padding: 24 }}>
      <SectionHeader
        title={t("referralPerson.title")}
        actions={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Button variant="secondary" onClick={() => navigate("/commissions")}>
              {t("referralPerson.actions.commissions")}
            </Button>
            <Button onClick={() => navigate("/referral-persons/create")}>
              <Plus size={14} />
              {t("referralPerson.actions.create")}
            </Button>
          </div>
        }
      />

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          label={t("referralPerson.fields.search")}
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />

        <Select
          label={t("referralPerson.fields.status")}
          value={filterStatus}
          onChange={(e) => {
            setPage(1);
            setFilterStatus(e.target.value);
          }}
        >
          <option value="All">{t("referralPerson.statuses.all")}</option>
          <option value="Active">{t("referralPerson.statuses.active")}</option>
          <option value="Inactive">{t("referralPerson.statuses.inactive")}</option>
        </Select>

        <Select
          label={t("referralPerson.fields.pageSize")}
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
        noResultsText={t("referralPerson.list.empty")}
        loadingText={t("referralPerson.list.loading")}
      />

      <div style={{ fontSize: 14, color: "#475569" }}>
        {t("referralPerson.list.showing", { shown: items.length, total: totalItems })}
      </div>
    </div>
  );
};
