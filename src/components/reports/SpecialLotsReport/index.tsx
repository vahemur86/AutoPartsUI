import { type FC, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { Button, DataTable, Select, TextField } from "@/ui-kit";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchSpecialLotsReport } from "@/store/slices/warehouses/reportsSlice";
import { fetchWarehouses } from "@/store/slices/warehousesSlice";

// columns
import { getSpecialLotsColumns } from "./columns";

// utils
import { getApiErrorMessage, getCashRegisterId } from "@/utils";

// styles
import styles from "./SpecialLotsReport.module.css";

export const SpecialLotsReport: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { specialLotsReport, isLoading } = useAppSelector(
    (state) => state.warehousesReports,
  );
  const { warehouses } = useAppSelector((state) => state.warehouses);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [warehouseId, setWarehouseId] = useState<number | null>(null);

  const cashRegisterId = useMemo(() => getCashRegisterId(), []);
  const columns = useMemo(() => getSpecialLotsColumns(), []);

  useEffect(() => {
    dispatch(fetchWarehouses());
  }, [dispatch]);

  const generateReport = useMemo(
    () => () => {
      dispatch(
        fetchSpecialLotsReport({
          cashRegisterId,
          fromDate: fromDate ? new Date(fromDate).toISOString() : undefined,
          toDate: toDate ? new Date(toDate).toISOString() : undefined,
          warehouseId: warehouseId ?? undefined,
        }),
      )
        .unwrap()
        .catch((error) => {
          toast.error(
            getApiErrorMessage(
              error,
              t("reports.specialLots.error.failedToFetch"),
            ),
          );
        });
    },
    [dispatch, cashRegisterId, fromDate, toDate, warehouseId, t],
  );

  useEffect(() => {
    generateReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = specialLotsReport?.byCustomer ?? [];

  const handleExportToExcel = () => {
    if (rows.length === 0) return;

    const headers = [
      t("reports.specialLots.columns.customerName"),
      t("reports.specialLots.columns.totalLots"),
      t("reports.specialLots.columns.totalPowderKg"),
      t("reports.specialLots.columns.totalCostAmd"),
      t("reports.specialLots.columns.remainingPowderKg"),
      t("reports.specialLots.columns.remainingCostAmd"),
      t("reports.specialLots.columns.revenueAmd"),
      t("reports.specialLots.columns.profitAmd"),
    ];

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        [
          `"${row.specialCustomerName ?? ""}"`,
          row.totalLotsCount,
          row.totalPowderKg,
          row.totalCostAmd,
          row.remainingPowderKg,
          row.remainingCostAmd,
          row.revenueAmd,
          row.profitAmd,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "special-lots-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const summaryCards = [
    {
      label: t("reports.specialLots.summary.totalSpecialLotsCreated"),
      value: specialLotsReport?.totalSpecialLotsCreated ?? 0,
    },
    {
      label: t("reports.specialLots.summary.uniqueSpecialCustomersCount"),
      value: specialLotsReport?.uniqueSpecialCustomersCount ?? 0,
    },
    {
      label: t("reports.specialLots.summary.totalSpecialPowderKg"),
      value: `${(specialLotsReport?.totalSpecialPowderKg ?? 0).toLocaleString(
        undefined,
        { minimumFractionDigits: 3, maximumFractionDigits: 3 },
      )} kg`,
    },
    {
      label: t("reports.specialLots.summary.totalSpecialCostAmd"),
      value: `${(specialLotsReport?.totalSpecialCostAmd ?? 0).toLocaleString()} AMD`,
    },
  ];

  return (
    <div className={styles.reportWrapper}>
      <header className={styles.header}>
        <h1>{t("reports.specialLots.title")}</h1>

        <div className={styles.filters}>
          <div className={styles.filterItem}>
            <TextField
              type="date"
              label={t("reports.specialLots.filters.fromDate")}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className={styles.filterItem}>
            <TextField
              type="date"
              label={t("reports.specialLots.filters.toDate")}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div className={styles.filterItem}>
            <Select
              value={warehouseId === null ? "" : String(warehouseId)}
              onChange={(e) =>
                setWarehouseId(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">
                {t("reports.specialLots.filters.allWarehouses")}
              </option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.code}
                </option>
              ))}
            </Select>
          </div>

          <Button variant="primary" onClick={generateReport} disabled={isLoading}>
            {t("reports.specialLots.generate")}
          </Button>
        </div>
      </header>

      <div className={styles.summaryCards}>
        {summaryCards.map((card) => (
          <div key={card.label} className={styles.card}>
            <span className={styles.cardLabel}>{card.label}</span>
            <strong className={styles.cardValue}>{card.value}</strong>
          </div>
        ))}
      </div>

      <div className={styles.tableContainer}>
        {rows.length === 0 && !isLoading ? (
          <div className={styles.emptyState}>
            {t("reports.specialLots.emptyState")}
          </div>
        ) : (
          <DataTable
            data={rows}
            columns={columns}
            pageSize={10}
            getRowClassName={() => styles.specialRow}
          />
        )}
      </div>

      <div className={styles.filters}>
        <Button
          variant="secondary"
          onClick={handleExportToExcel}
          disabled={rows.length === 0}
        >
          {t("reports.specialLots.exportToExcel")}
        </Button>
        <Button variant="secondary" onClick={() => window.print()}>
          {t("reports.specialLots.print")}
        </Button>
      </div>
    </div>
  );
};
