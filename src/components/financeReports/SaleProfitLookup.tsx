import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { TextField } from "@/ui-kit";

// services
import { getProfitBySaleId } from "@/services/financeReports";

// utils
import { getApiErrorMessage, getCashRegisterId } from "@/utils";
import { FinanceReportResult } from "./FinanceReportResult";

// local
import { getDynamicColumns, toDynamicRows } from "./tableUtils";
import styles from "./FinanceReports.module.css";
import { FinanceFilterHeading } from "./FinanceFilterHeading";
import { FinanceReportLoadButton } from "./FinanceReportLoadButton";

export const SaleProfitLookup = () => {
  const { t } = useTranslation();

  const [saleId, setSaleId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<unknown>(null);

  const cashRegisterId = useMemo(() => getCashRegisterId(0), []);

  const handleLoad = useCallback(async () => {
    const parsedSaleId = Number(saleId);
    if (!saleId.trim() || Number.isNaN(parsedSaleId) || parsedSaleId <= 0) {
      toast.error(t("financeReports.validation.enterSaleId"));
      return;
    }

    setIsLoading(true);
    try {
      const response = await getProfitBySaleId(parsedSaleId, cashRegisterId);
      setData(response);
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(error, t("financeReports.error.failedToLoad")),
      );
    } finally {
      setIsLoading(false);
    }
  }, [saleId, cashRegisterId, t]);

  const rows = useMemo(() => toDynamicRows(data), [data]);
  const columns = useMemo(
    () =>
      getDynamicColumns(rows, {
        preferredKeys: [
          "id",
          "saleId",
          "shopId",
          "totalSales",
          "totalCost",
          "profit",
          "profitPercentage",
          "createdAt",
          "updatedAt",
        ],
      }),
    [rows],
  );

  return (
    <div className={styles.panel}>
      <div className={styles.filters}>
        <FinanceFilterHeading />
        <TextField
          label={t("financeReports.filters.saleId")}
          placeholder={t("financeReports.filters.saleId")}
          value={saleId}
          onChange={(e) => setSaleId(e.target.value)}
        />
      </div>

      <div className={styles.actions}>
        <FinanceReportLoadButton loading={isLoading} label={t("financeReports.actions.load")} onClick={handleLoad} />
      </div>

      <div className={styles.result}>
        <FinanceReportResult
          rows={rows}
          columns={columns}
          loading={isLoading}
          loadingLabel={t("common.loading")}
          hasData={data !== null}
          emptyLabel={t("financeReports.empty")}
          noRowsLabel={t("common.noData")}
        />
      </div>
    </div>
  );
};
