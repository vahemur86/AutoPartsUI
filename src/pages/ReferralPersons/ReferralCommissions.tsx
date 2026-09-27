import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { SectionHeader } from "@/components/common";
import { Button, DataTable, Select, TextField } from "@/ui-kit";
import {
  getReferralCommissions,
  type ReferralCommissionDto,
} from "@/services/referralCommissions";
import { fetchServicesCatalog } from "@/store/slices/servicesCatalogSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const statusColors: Record<string, string> = {
  Pending: "#dbeafe",
  Approved: "#fef3c7",
  Paid: "#dcfce7",
  Rejected: "#fee2e2",
  Cancelled: "#e5e7eb",
};

const statusTextColors: Record<string, string> = {
  Pending: "#1d4ed8",
  Approved: "#b45309",
  Paid: "#166534",
  Rejected: "#b91c1c",
  Cancelled: "#374151",
};

export const ReferralCommissions = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items: services, isLoading: servicesLoading } = useAppSelector(
    (state) => state.servicesCatalog,
  );
  const [dashboard, setDashboard] = useState<Record<string, { count: number; total: number }>>({});
  const [items, setItems] = useState<ReferralCommissionDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [status, setStatus] = useState("All");
  const [serviceId, setServiceId] = useState("");
  const [search, setSearch] = useState("");
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    void dispatch(fetchServicesCatalog());
  }, [dispatch]);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const list = await getReferralCommissions({
        page,
        pageSize,
        status,
        search,
        serviceId: serviceId ? Number(serviceId) : undefined,
      });
      const stats = list.results.reduce<Record<string, { count: number; total: number }>>((result, item) => {
        const current = result[item.status] ?? { count: 0, total: 0 };
        result[item.status] = {
          count: current.count + 1,
          total: current.total + item.commissionAmount,
        };
        return result;
      }, {});
      setDashboard(stats);
      setItems(list.results);
      setTotalItems(list.totalItems);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("referralCommissions.errors.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [page, pageSize, status, search, serviceId]);

  const columns = useMemo(
    () => [
      { accessorKey: "serviceOrderId", header: t("referralCommissions.fields.orderId") },
      { accessorKey: "referralPersonName", header: t("referralCommissions.fields.referralPerson") },
      { accessorKey: "serviceName", header: t("referralCommissions.fields.service") },
      {
        accessorKey: "servicePrice",
        header: t("referralCommissions.fields.servicePrice"),
        cell: ({ row }: any) => `${Number(row.original.servicePrice || 0).toLocaleString()} AMD`,
      },
      {
        accessorKey: "commissionAmount",
        header: t("referralCommissions.fields.commissionAmount"),
        cell: ({ row }: any) => `${Number(row.original.commissionAmount || 0).toLocaleString()} AMD`,
      },
      {
        accessorKey: "status",
        header: t("referralCommissions.fields.status"),
        cell: ({ row }: any) => (
          <span
            style={{
              display: "inline-flex",
              padding: "4px 10px",
              borderRadius: 999,
              background: statusColors[row.original.status] ?? "#e5e7eb",
              color: statusTextColors[row.original.status] ?? "#374151",
              fontWeight: 600,
            }}
          >
            {t(`referralCommissions.statuses.${String(row.original.status).toLowerCase()}`, { defaultValue: row.original.status })}
          </span>
        ),
      },
      {
        id: "actions",
        header: t("referralCommissions.fields.actions"),
        cell: ({ row }: any) => (
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" size="small" onClick={() => navigate(`/commissions/${row.original.id}`)}>
              {t("referralCommissions.actions.view")}
            </Button>
          </div>
        ),
      },
    ],
    [navigate, t],
  );

  return (
    <div style={{ display: "grid", gap: 20, padding: 24 }}>
      <SectionHeader title={t("referralCommissions.title")} />

      <div style={{ color: "#475569", fontSize: 14 }}>
        {t("referralCommissions.description")}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
        {Object.entries(dashboard).map(([statusKey, value]) => (
          <div
            key={statusKey}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 16,
              background: "#fff",
            }}
          >
            <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase" }}>{t(`referralCommissions.statuses.${statusKey.toLowerCase()}`, { defaultValue: statusKey })}</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>{value.count}</div>
            <div style={{ color: "#475569", marginTop: 4 }}>{value.total.toLocaleString()} AMD</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          label={t("referralCommissions.filters.search")}
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />

        <Select
          label={t("referralCommissions.filters.status")}
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="All">{t("referralCommissions.statuses.all")}</option>
          <option value="Pending">{t("referralCommissions.statuses.pending")}</option>
          <option value="Approved">{t("referralCommissions.statuses.approved")}</option>
          <option value="Paid">{t("referralCommissions.statuses.paid")}</option>
          <option value="Rejected">{t("referralCommissions.statuses.rejected")}</option>
          <option value="Cancelled">{t("referralCommissions.statuses.cancelled")}</option>
        </Select>

        <Select
          label={t("referralCommissions.filters.service")}
          value={serviceId}
          disabled={servicesLoading}
          onChange={(e) => {
            setPage(1);
            setServiceId(e.target.value);
          }}
          searchable
        >
          <option value="">{servicesLoading ? t("referralCommissions.filters.loadingServices") : t("referralCommissions.filters.allServices")}</option>
          {services.filter((service) => service.isActive !== false).map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} ({service.code})
            </option>
          ))}
        </Select>

        <Select
          label={t("referralCommissions.filters.pageSize")}
          value={String(pageSize)}
          onChange={(e) => {
            setPage(1);
            setPageSize(Number(e.target.value));
          }}
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </Select>
      </div>

      <DataTable
        columns={columns as any}
        data={items}
        isLoading={isLoading}
        pageSize={pageSize}
        manualPagination={false}
        noResultsText={t("referralCommissions.list.empty")}
        loadingText={t("referralCommissions.list.loading")}
      />

      <div style={{ fontSize: 14, color: "#475569" }}>
        {t("referralCommissions.list.showing", { shown: items.length, total: totalItems })}
      </div>
    </div>
  );
};
