import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { DataTable } from "@/ui-kit";

// services
import { getServiceOrders } from "@/services/operator";

// utils
import { getApiErrorMessage } from "@/utils";

// types
import type { WorkshopOrder } from "@/types/operator";

// styles
import styles from "./WorkshopOrdersReport.module.css";

const PAGE_SIZE = 20;

export const WorkshopOrdersReport = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<WorkshopOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);

        const rawUserData = localStorage.getItem("user_data");
        const userData = rawUserData ? JSON.parse(rawUserData) : null;
        const cashRegisterId = userData?.cashRegisterId
          ? Number(userData.cashRegisterId)
          : undefined;

        const data = await getServiceOrders({ cashRegisterId });
        setOrders(data);
      } catch (error) {
        toast.error(
          getApiErrorMessage(error, t("reports.errors.failedToFetch")),
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [t]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: t("reports.workshopOrders.columns.id"),
      },
      {
        accessorKey: "templateId",
        header: t("reports.workshopOrders.columns.templateId"),
      },
      {
        accessorKey: "isManualMode",
        header: t("reports.workshopOrders.columns.isManualMode"),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cell: ({ getValue }: any) =>
          getValue()
            ? t("common.yes", { defaultValue: "Yes" })
            : t("common.no", { defaultValue: "No" }),
      },
      {
        accessorKey: "mechanicPrice",
        header: t("reports.workshopOrders.columns.mechanicPrice"),
      },
      {
        accessorKey: "electricianPrice",
        header: t("reports.workshopOrders.columns.electricianPrice"),
      },
      {
        accessorKey: "sparePartsPrice",
        header: t("reports.workshopOrders.columns.sparePartsPrice"),
      },
      {
        accessorKey: "totalAmount",
        header: t("reports.workshopOrders.columns.totalAmount"),
      },
      {
        accessorKey: "comment",
        header: t("reports.workshopOrders.columns.comment"),
      },
      {
        accessorKey: "operatorUserId",
        header: t("reports.workshopOrders.columns.operatorUserId"),
      },
      {
        accessorKey: "cashRegisterId",
        header: t("reports.workshopOrders.columns.cashRegisterId"),
      },
      {
        accessorKey: "sessionId",
        header: t("reports.workshopOrders.columns.sessionId"),
      },
      {
        accessorKey: "createdAt",
        header: t("reports.workshopOrders.columns.createdAt"),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cell: ({ getValue }: any) =>
          new Date(getValue() as string).toLocaleString(),
      },
    ],
    [t],
  );

  const paginatedData = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    return orders.slice(start, start + PAGE_SIZE);
  }, [orders, currentPage]);

  const pageCount = useMemo(
    () => Math.ceil(orders.length / PAGE_SIZE),
    [orders.length],
  );

  return (
    <div className={styles.reportWrapper}>
      <header className={styles.header}>
        <h1>{t("reports.navigation.workshopOrders")}</h1>
      </header>

      <div className={styles.tableContainer}>
        {isLoading ? (
          <div className={styles.tableSkeleton} aria-busy="true" aria-live="polite">
            <div className={styles.tableSkeletonHeader}>
              <div className={`${styles.skeletonLine} ${styles.skeletonLineWide}`} />
              <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
            </div>
            <div className={styles.tableSkeletonRows}>
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className={styles.tableSkeletonRow}>
                  <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
                  <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
                  <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                </div>
              ))}
            </div>
          </div>
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
