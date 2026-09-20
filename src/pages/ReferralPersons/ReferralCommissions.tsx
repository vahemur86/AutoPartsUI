import { useEffect, useMemo, useState } from "react";
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
      toast.error(error instanceof Error ? error.message : "Failed to load commissions.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [page, pageSize, status, search, serviceId]);

  const columns = useMemo(
    () => [
      { accessorKey: "serviceOrderId", header: "Order ID" },
      { accessorKey: "referralPersonName", header: "Referral Person" },
      { accessorKey: "serviceName", header: "Service" },
      {
        accessorKey: "servicePrice",
        header: "Service Price",
        cell: ({ row }: any) => `${Number(row.original.servicePrice || 0).toLocaleString()} AMD`,
      },
      {
        accessorKey: "commissionAmount",
        header: "Commission Amount",
        cell: ({ row }: any) => `${Number(row.original.commissionAmount || 0).toLocaleString()} AMD`,
      },
      {
        accessorKey: "status",
        header: "Status",
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
            {row.original.status}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }: any) => (
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" size="small" onClick={() => navigate(`/commissions/${row.original.id}`)}>
              View
            </Button>
          </div>
        ),
      },
    ],
    [navigate],
  );

  return (
    <div style={{ display: "grid", gap: 20, padding: 24 }}>
      <SectionHeader title="Referral Commissions" />

      <div style={{ color: "#475569", fontSize: 14 }}>
        Commissions are created by the service-order workflow when an eligible referral person and active rule are applied. Review pending commissions here, approve them, then mark approved commissions as paid.
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
            <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase" }}>{statusKey}</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>{value.count}</div>
            <div style={{ color: "#475569", marginTop: 4 }}>{value.total.toLocaleString()} AMD</div>
          </div>
        ))}
      </div>

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
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="All">All</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Paid">Paid</option>
          <option value="Rejected">Rejected</option>
          <option value="Cancelled">Cancelled</option>
        </Select>

        <Select
          label="Service"
          value={serviceId}
          disabled={servicesLoading}
          onChange={(e) => {
            setPage(1);
            setServiceId(e.target.value);
          }}
          searchable
        >
          <option value="">{servicesLoading ? "Loading services..." : "All services"}</option>
          {services.filter((service) => service.isActive !== false).map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} ({service.code})
            </option>
          ))}
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
      />

      <div style={{ fontSize: 14, color: "#475569" }}>
        Showing {items.length} of {totalItems} commissions
      </div>
    </div>
  );
};
