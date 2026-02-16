import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { Select, Button, DatePicker } from "@/ui-kit";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchProfitReport } from "@/store/slices/warehouses/reportsSlice";
import { fetchWarehouses } from "@/store/slices/warehousesSlice";

// utils
import { getCashRegisterId, getApiErrorMessage } from "@/utils";

// styles
import styles from "./ProfitReport.module.css";

export const ProfitReport = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { profitData, isLoading, error } = useAppSelector(
    (state) => state.warehousesReports,
  );
  const { warehouses } = useAppSelector((state) => state.warehouses);

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(
    1,
  );
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  const cashRegisterId = useMemo(() => getCashRegisterId(), []);

  useEffect(() => {
    dispatch(fetchWarehouses());
  }, [dispatch]);

  useEffect(() => {
    if (warehouses.length > 0 && selectedWarehouseId === null) {
      setSelectedWarehouseId(warehouses[0].id);
    }
  }, [warehouses, selectedWarehouseId]);

  useEffect(() => {
    const loadInitialReport = async () => {
      try {
        await dispatch(
          fetchProfitReport({
            warehouseId: 1,
            cashRegisterId,
          }),
        ).unwrap();
      } catch (err) {
        toast.error(
          getApiErrorMessage(err, t("warehouses.profit.errors.failedToFetch")),
        );
      }
    };

    loadInitialReport();
  }, [dispatch, cashRegisterId, t]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const toSafeISO = (date: Date | null) => {
    if (!date) return undefined;
    const safeDate = new Date(date);
    safeDate.setHours(12, 0, 0, 0);
    return safeDate.toISOString();
  };

  const handleLoadReport = async () => {
    if (!selectedWarehouseId) {
      toast.error(t("warehouses.form.selectWarehouse"));
      return;
    }

    try {
      await dispatch(
        fetchProfitReport({
          warehouseId: selectedWarehouseId,
          fromUtc: toSafeISO(fromDate),
          toUtc: toSafeISO(toDate),
          cashRegisterId,
        }),
      ).unwrap();
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, t("warehouses.profit.errors.failedToFetch")),
      );
    }
  };

  const handleWarehouseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const warehouseId = Number(e.target.value);
    setSelectedWarehouseId(warehouseId || null);
  };

  return (
    <div className={styles.profitWrapper}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("warehouses.profit.title")}</h1>

        <div className={styles.filters}>
          <div className={styles.filterItem}>
            <Select
              label={t("warehouses.form.warehouse")}
              placeholder={t("warehouses.form.selectWarehouse")}
              value={selectedWarehouseId ? selectedWarehouseId.toString() : ""}
              onChange={handleWarehouseChange}
              disabled={isLoading}
            >
              <option value="">{t("warehouses.form.selectWarehouse")}</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.code}
                </option>
              ))}
            </Select>
          </div>

          <div className={styles.filterItem}>
            <label className={styles.label}>
              {t("warehouses.profit.filters.fromDate")}
            </label>
            <DatePicker
              selected={fromDate}
              onChange={(date: Date | null) => setFromDate(date)}
              dateFormat="MM/dd/yyyy"
              placeholderText={t("warehouses.profit.filters.selectFromDate")}
              isClearable
              showTimeSelect={false}
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
            />
          </div>

          <div className={styles.filterItem}>
            <label className={styles.label}>
              {t("warehouses.profit.filters.toDate")}
            </label>
            <DatePicker
              selected={toDate}
              onChange={(date: Date | null) => setToDate(date)}
              dateFormat="MM/dd/yyyy"
              placeholderText={t("warehouses.profit.filters.selectToDate")}
              isClearable
              showTimeSelect={false}
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              minDate={fromDate || undefined}
            />
          </div>

          <div className={styles.actions}>
            <Button
              variant="primary"
              size="medium"
              onClick={handleLoadReport}
              disabled={isLoading || !selectedWarehouseId}
            >
              {t("warehouses.profit.loadReport")}
            </Button>
          </div>
        </div>
      </header>

      <section className={styles.content}>
        {!selectedWarehouseId ? (
          <div className={styles.emptyState}>
            {t("warehouses.form.selectWarehouse")}
          </div>
        ) : isLoading ? (
          <div className={styles.loading}>{t("warehouses.profit.loading")}</div>
        ) : !profitData ? (
          <div className={styles.emptyState}>
            {t("warehouses.profit.emptyState")}
          </div>
        ) : (
          <div className={styles.cardsGrid}>
            <div className={styles.card}>
              <div className={styles.cardLabel}>
                {t("warehouses.profit.summary.revenueAmd")}
              </div>
              <div className={styles.cardValue}>
                {profitData.revenueAmd.toLocaleString()}
              </div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardLabel}>
                {t("warehouses.profit.summary.costAmd")}
              </div>
              <div className={styles.cardValue}>
                {profitData.costAmd.toLocaleString()}
              </div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardLabel}>
                {t("warehouses.profit.summary.profitAmd")}
              </div>
              <div className={styles.cardValue}>
                {profitData.profitAmd.toLocaleString()}
              </div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardLabel}>
                {t("warehouses.profit.summary.soldPowderKg")}
              </div>
              <div className={styles.cardValue}>
                {profitData.soldPowderKg.toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
