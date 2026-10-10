import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Eye } from "lucide-react";
import type { CellContext, ColumnDef } from "@tanstack/react-table";

import { SectionHeader } from "@/components/common";
import { DataTable, Select, TextField } from "@/ui-kit";
import {
  getReferralCommissions,
  type ReferralCommissionDto,
} from "@/services/referralCommissions";
import { fetchServicesCatalog } from "@/store/slices/servicesCatalogSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import styles from "./ReferralPersons.module.css";

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

  const refresh = useCallback(async () => {
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
  }, [page, pageSize, search, serviceId, status, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const columns = useMemo<ColumnDef<ReferralCommissionDto, unknown>[]>(
    () => [
      { accessorKey: "serviceOrderId", header: t("referralCommissions.fields.orderId") },
      { accessorKey: "referralPersonName", header: t("referralCommissions.fields.referralPerson") },
      { accessorKey: "serviceName", header: t("referralCommissions.fields.service") },
      {
        accessorKey: "servicePrice",
        header: t("referralCommissions.fields.servicePrice"),
        cell: ({ row }: CellContext<ReferralCommissionDto, unknown>) => `${Number(row.original.servicePrice || 0).toLocaleString()} AMD`,
      },
      {
        accessorKey: "commissionAmount",
        header: t("referralCommissions.fields.commissionAmount"),
        cell: ({ row }: CellContext<ReferralCommissionDto, unknown>) => `${Number(row.original.commissionAmount || 0).toLocaleString()} AMD`,
      },
      {
        accessorKey: "status",
        header: t("referralCommissions.fields.status"),
        cell: ({ row }: CellContext<ReferralCommissionDto, unknown>) => (
          <span className={`${styles.commissionStatus} ${styles[`commissionStatus${row.original.status}`] ?? ""}`}>
            {t(`referralCommissions.statuses.${String(row.original.status).toLowerCase()}`, { defaultValue: row.original.status })}
          </span>
        ),
      },
      {
        id: "actions",
        header: t("referralCommissions.fields.actions"),
        cell: ({ row }: CellContext<ReferralCommissionDto, unknown>) => (
          <div className={styles.rowActions}>
            <button
              type="button"
              className={styles.iconAction}
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/commissions/${row.original.id}`);
              }}
              aria-label={t("referralCommissions.actions.view")}
              title={t("referralCommissions.actions.view")}
            >
              <Eye size={16} />
            </button>
          </div>
        ),
      },
    ],
    [navigate, t],
  );

  return (
    <div className={styles.page}>
      <SectionHeader title={t("referralCommissions.title")} />

      <div className={styles.description}>
        {t("referralCommissions.description")}
      </div>

      <div className={styles.metricsGrid}>
        {Object.entries(dashboard).map(([statusKey, value]) => (
          <div
            key={statusKey}
            className={styles.metricCard}
          >
            <div className={styles.metricLabel}>{t(`referralCommissions.statuses.${statusKey.toLowerCase()}`, { defaultValue: statusKey })}</div>
            <div className={styles.metricValue}>{value.count}</div>
            <div className={styles.metricAmount}>{value.total.toLocaleString()} AMD</div>
          </div>
        ))}
      </div>

      <div className={`${styles.filters} ${styles.commissionFilters}`}>
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

      <div className={styles.tableShell}>
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          pageSize={pageSize}
          manualPagination={false}
          noResultsText={t("referralCommissions.list.empty")}
          loadingText={t("referralCommissions.list.loading")}
        />
      </div>

      <div className={styles.resultCount}>
        {t("referralCommissions.list.showing", { shown: items.length, total: totalItems })}
      </div>
    </div>
  );
};
