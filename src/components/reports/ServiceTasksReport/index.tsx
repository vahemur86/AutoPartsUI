import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { Button, DataTable, Select, TextField } from "@/ui-kit";
import { getServiceTasksReport } from "@/services/operator";
import { getApiErrorMessage } from "@/utils";
import type { ServiceTasksReportItem, ServiceTaskReportRow } from "@/types/operator";

import styles from "./ServiceTasksReport.module.css";

const PAGE_SIZE = 20;

export const ServiceTasksReport = () => {
  const { t } = useTranslation();
  const [payments, setPayments] = useState<ServiceTasksReportItem[]>([]);
  const [items, setItems] = useState<ServiceTaskReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [paymentType, setPaymentType] = useState(0);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const rawUserData = localStorage.getItem("user_data");
      const userData = rawUserData ? JSON.parse(rawUserData) : null;
      const cashRegisterId = userData?.cashRegisterId
        ? Number(userData.cashRegisterId)
        : undefined;

      const data = await getServiceTasksReport({
        cashRegisterId,
        from: from || undefined,
        to: to || undefined,
        paymentType: paymentType || undefined,
      });
      setPayments(data);

      const flattened: ServiceTaskReportRow[] = data.flatMap((payment: ServiceTasksReportItem) =>
        payment.items.map((item) => ({
          paymentId: payment.paymentId,
          createdAt: payment.createdAt,
          createdByUserId: payment.createdByUserId,
          totalAmount: payment.totalAmount,
          cashTotal: payment.cashTotal,
          nonCashTotal: payment.nonCashTotal,
          serviceTaskCode: item.serviceTaskCode,
          price: item.price,
          paymentType: item.paymentType,
        })),
      );

      setItems(flattened);
      setCurrentPage(0);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("reports.errors.failedToFetch")));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = useMemo(
    () => [
      { accessorKey: "paymentId", header: t("reports.serviceTasks.columns.paymentId") },
      { accessorKey: "createdAt", header: t("reports.serviceTasks.columns.createdAt"), cell: ({ getValue }: any) => new Date(getValue() as string).toLocaleString() },
      { accessorKey: "createdByUserId", header: t("reports.serviceTasks.columns.createdByUserId") },
      { accessorKey: "serviceTaskCode", header: t("reports.serviceTasks.columns.serviceTaskCode") },
      { accessorKey: "price", header: t("reports.serviceTasks.columns.price") },
      {
        accessorKey: "paymentType",
        header: t("reports.serviceTasks.columns.paymentType"),
        cell: ({ getValue }: any) => {
          const value = getValue() as number;
          return value === 1 ? t("reports.serviceTasks.paymentTypes.cash") : t("reports.serviceTasks.paymentTypes.nonCash");
        },
      },
    ],
    [t],
  );

  const overallTotals = useMemo(() => {
    const totalAmount = payments.reduce((s, p) => s + (p.totalAmount || 0), 0);
    const cashTotal = payments.reduce((s, p) => s + (p.cashTotal || 0), 0);
    const nonCashTotal = payments.reduce((s, p) => s + (p.nonCashTotal || 0), 0);
    return { totalAmount, cashTotal, nonCashTotal };
  }, [payments]);

  const paginatedData = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, currentPage]);

  const pageCount = useMemo(() => Math.ceil(items.length / PAGE_SIZE), [items.length]);

  return (
    <div className={styles.reportWrapper}>
      <header className={styles.header}>
        <h1>{t("reports.navigation.serviceTasks")}</h1>
      </header>

      <div className={styles.filterRow}>
        <TextField
          label={t("reports.serviceTasks.filters.from")}
          type="datetime-local"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <TextField
          label={t("reports.serviceTasks.filters.to")}
          type="datetime-local"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        {/* userId filter removed as requested */}
        <Select value={paymentType} onChange={(e) => setPaymentType(Number(e.target.value))}>
          <option value={0}>{t("reports.serviceTasks.paymentTypes.all")}</option>
          <option value={1}>{t("reports.serviceTasks.paymentTypes.cash")}</option>
          <option value={2}>{t("reports.serviceTasks.paymentTypes.nonCash")}</option>
        </Select>
        <Button variant="secondary" onClick={fetchReport} disabled={isLoading}>
          {t("common.search")}
        </Button>
      </div>

      <div className={styles.totalsRow}>
        <div className={styles.totalCard}>
          <div className={styles.totalLabel}>{t("reports.serviceTasks.columns.totalAmount")}</div>
          <div className={styles.totalValue}>{overallTotals.totalAmount.toLocaleString()} AMD</div>
        </div>
        <div className={styles.totalCard}>
          <div className={styles.totalLabel}>{t("reports.serviceTasks.columns.cashTotal")}</div>
          <div className={styles.totalValue}>{overallTotals.cashTotal.toLocaleString()} AMD</div>
        </div>
        <div className={styles.totalCard}>
          <div className={styles.totalLabel}>{t("reports.serviceTasks.columns.nonCashTotal")}</div>
          <div className={styles.totalValue}>{overallTotals.nonCashTotal.toLocaleString()} AMD</div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        {isLoading ? (
          <div className={styles.loading}>{t("reports.serviceTasks.loading")}</div>
        ) : (
          <DataTable
            columns={columns}
            data={paginatedData}
            pageSize={PAGE_SIZE}
            manualPagination
            pageCount={pageCount}
            pageIndex={currentPage}
            onPaginationChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
};
