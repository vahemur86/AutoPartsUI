import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Plus, Users } from "lucide-react";
import type { CellContext, ColumnDef } from "@tanstack/react-table";

import { SectionHeader } from "@/components/common";
import { Button, DataTable, Select, TextField } from "@/ui-kit";
import {
  getReferralPersons,
  type ReferralPersonDto,
} from "@/services/referralPersons";
import styles from "./ReferralPersons.module.css";
import actionStyles from "./ReferralActions.module.css";

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

  const load = useCallback(async () => {
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
  }, [filterStatus, page, pageSize, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo<ColumnDef<ReferralPersonDto, unknown>[]>(
    () => [
      { accessorKey: "id", header: t("referralPerson.fields.id") },
      { accessorKey: "code", header: t("referralPerson.fields.code") },
      { accessorKey: "name", header: t("referralPerson.fields.name") },
      { accessorKey: "phone", header: t("referralPerson.fields.phone") },
      { accessorKey: "email", header: t("referralPerson.fields.email") },
      {
        accessorKey: "status",
        header: t("referralPerson.fields.status"),
        cell: ({ row }: CellContext<ReferralPersonDto, unknown>) => (
          <span className={`${styles.status} ${row.original.status === "Active" ? styles.statusActive : styles.statusInactive}`}>
            {t(`referralPerson.statuses.${String(row.original.status).toLowerCase()}`, { defaultValue: row.original.status })}
          </span>
        ),
      },
      {
        id: "actions",
        header: t("common.actions"),
        cell: ({ row }: CellContext<ReferralPersonDto, unknown>) => (
          <div className={styles.rowActions}>
            <button
              type="button"
              className={styles.iconAction}
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/referral-persons/${row.original.id}`);
              }}
              aria-label={t("referralPerson.actions.view")}
              title={t("referralPerson.actions.view")}
            >
              <Eye size={16} />
            </button>
            <button
              type="button"
              className={styles.iconAction}
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/referral-persons/${row.original.id}/edit`);
              }}
              aria-label={t("referralPerson.actions.edit")}
              title={t("referralPerson.actions.edit")}
            >
              <Pencil size={15} />
            </button>
          </div>
        ),
      },
    ],
    [navigate, t],
  );

  return (
    <div className={styles.page}>
      <SectionHeader
        title={t("referralPerson.title")}
        icon={<Users size={17} color="#d2bf8a" aria-hidden="true" />}
        actions={
          <div className={styles.headerActions}>
            <Button className={`${styles.createButton} ${actionStyles.referralButton} ${actionStyles.referralPrimary}`} onClick={() => navigate("/referral-persons/create")}>
              <Plus size={16} strokeWidth={2.2} />
              {t("referralPerson.actions.create")}
            </Button>
          </div>
        }
      />

      <div className={styles.filters}>
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

      <div className={styles.tableShell}>
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          pageSize={pageSize}
          manualPagination={false}
          noResultsText={t("referralPerson.list.empty")}
          loadingText={t("referralPerson.list.loading")}
        />
      </div>

      <div className={styles.resultCount}>
        {t("referralPerson.list.showing", { shown: items.length, total: totalItems })}
      </div>
    </div>
  );
};
