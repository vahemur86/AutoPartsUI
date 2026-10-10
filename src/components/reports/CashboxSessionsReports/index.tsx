import { type FC, useEffect, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  RotateCcw,
  Store,
  Wallet,
} from "lucide-react";

// ui-kit
import { Select, Button, DatePicker } from "@/ui-kit";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchCashboxReport,
  clearSelection,
} from "@/store/slices/cash/cashboxSessionsSlice";
import { fetchShops } from "@/store/slices/shopsSlice";
import { fetchCashRegisters } from "@/store/slices/cash/registersSlice";

// utils
import { getApiErrorMessage } from "@/utils";

// styles
import styles from "./CashboxReport.module.css";

export const CashboxSessionsReports: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { cashboxReport, isLoading } = useAppSelector(
    (state) => state.cashboxSessions,
  );
  const { shops } = useAppSelector((state) => state.shops);
  const { cashRegisters } = useAppSelector((state) => state.cashRegisters);

  const [selectedShopId, setSelectedShopId] = useState<number | "">("");
  const [selectedRegisterId, setSelectedRegisterId] = useState<number | "">("");
  const [selectedDateFrom, setSelectedDateFrom] = useState<Date | null>(null);
  const [selectedDateTo, setSelectedDateTo] = useState<Date | null>(null);
  const [shopError, setShopError] = useState(false);
  const [registerError, setRegisterError] = useState(false);

  useEffect(() => {
    if (!shops.length) {
      dispatch(fetchShops()).catch(() => {
        toast.error(
          t("shops.error.failedToFetch", {
            defaultValue: "Failed to load shops",
          }),
        );
      });
    }

    if (!cashRegisters.length) {
      dispatch(fetchCashRegisters(undefined)).catch((error) => {
        toast.error(
          getApiErrorMessage(
            error,
            t("cashRegisters.error.failedToFetch", {
              defaultValue: "Failed to load cash registers",
            }),
          ),
        );
      });
    }

    return () => {
      dispatch(clearSelection());
    };
  }, [cashRegisters.length, dispatch, shops.length, t]);

  const handleShopChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value ? Number(event.target.value) : "";
    setSelectedShopId(value);
    setSelectedRegisterId("");
    setShopError(false);
    setRegisterError(false);
    dispatch(clearSelection());
  };

  const handleRegisterChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value ? Number(event.target.value) : "";
    setSelectedRegisterId(value);
    setRegisterError(false);
    dispatch(clearSelection());
  };

  const handleDateFromChange = (date: Date | null) => {
    setSelectedDateFrom(date);
    if (date && selectedDateTo && selectedDateTo < date) {
      setSelectedDateTo(null);
    }
    dispatch(clearSelection());
  };

  const handleDateToChange = (date: Date | null) => {
    setSelectedDateTo(date);
    dispatch(clearSelection());
  };

  const handleResetFilters = () => {
    setSelectedShopId("");
    setSelectedRegisterId("");
    setSelectedDateFrom(null);
    setSelectedDateTo(null);
    setShopError(false);
    setRegisterError(false);
    dispatch(clearSelection());
  };

  const handleLoadReport = () => {
    let hasError = false;

    if (selectedShopId === "") {
      setShopError(true);
      hasError = true;
    }

    if (selectedRegisterId === "") {
      setRegisterError(true);
      hasError = true;
    }

    if (hasError) return;

    const formatDate = (date: Date | null) => {
      if (date == null) return undefined;
      return new Date(
        Date.UTC(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
        ),
      )
        .toISOString()
        .split("T")[0];
    };

    const dateFromParam = formatDate(selectedDateFrom);
    const dateToParam = formatDate(selectedDateTo);

    dispatch(
      fetchCashboxReport({
        cashRegisterId: selectedRegisterId as number,
        dateFrom: dateFromParam,
        dateTo: dateToParam,
      }),
    )
      .unwrap()
      .catch((error) => {
        toast.error(
          getApiErrorMessage(
            error,
            t("cashbox.errors.failedToFetchCashboxReport"),
          ),
        );
      });
  };

  const selectedShop = shops.find((shop) => shop.id === selectedShopId);
  const selectedRegister = cashRegisters.find(
    (register) => register.id === selectedRegisterId,
  );
  const formatDateLabel = (date: Date) =>
    date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  const reportPeriod = selectedDateFrom || selectedDateTo
    ? `${selectedDateFrom ? formatDateLabel(selectedDateFrom) : t("common.notSpecified")} - ${selectedDateTo ? formatDateLabel(selectedDateTo) : t("common.notSpecified")}`
    : cashboxReport?.date && cashboxReport.date !== "0001-01-01"
      ? formatDateLabel(new Date(`${cashboxReport.date}T00:00:00`))
      : t("cashbox.cashboxReport.allDates");
  const formatAmd = (value: number) => `${value.toLocaleString()} AMD`;

  return (
    <div className={styles.cashboxReportWrapper}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.titleIcon} aria-hidden="true">
            <Wallet size={19} />
          </span>
          <div>
          <span className={styles.eyebrow}>{t("reports.navigationGroups.cashbox")}</span>
          <h1>{t("cashbox.cashboxReport.title")}</h1>
          </div>
        </div>
      </header>

      <section className={styles.filters} aria-label={t("common.filters")}>
        <div className={styles.filtersContent}>
          <Select
            label={t("cashbox.cashboxReport.shopLabel", {
              defaultValue: "Shop",
            })}
            value={selectedShopId === "" ? "" : String(selectedShopId)}
            onChange={handleShopChange}
            placeholder={t("cashbox.cashboxReport.selectShop", {
              defaultValue: "Select shop",
            })}
            error={shopError}
            helperText={
              shopError
                ? t("cashbox.cashboxReport.validation.shopRequired", {
                    defaultValue: "Please select a shop",
                  })
                : ""
            }
          >
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.code}
              </option>
            ))}
          </Select>

          <Select
            label={t("cashbox.cashboxReport.registerLabel", {
              defaultValue: "Cash register",
            })}
            value={selectedRegisterId === "" ? "" : String(selectedRegisterId)}
            onChange={handleRegisterChange}
            placeholder={t("cashbox.cashboxReport.selectRegister", {
              defaultValue: "Select cash register",
            })}
            disabled={selectedShopId === ""}
            error={registerError}
            helperText={
              registerError
                ? t("cashbox.cashboxReport.validation.registerRequired", {
                    defaultValue: "Please select a cash register",
                  })
                : ""
            }
          >
            {cashRegisters
              .filter(
                (register) =>
                  selectedShopId !== "" && register.shopId === selectedShopId,
              )
              .map((register) => (
                <option key={register.id} value={register.id}>
                  {register.code}
                </option>
              ))}
          </Select>
        </div>

        <div className={styles.actionsRow}>
          <div className={styles.dateFilters}>
            <div className={styles.dateFilter}>
              <label className={styles.dateLabel}>
                {t("cashbox.cashboxReport.dateFromLabel")}
              </label>
              <DatePicker
                selected={selectedDateFrom}
                onChange={handleDateFromChange}
                dateFormat="MM/dd/yyyy"
                placeholder={t("cashbox.cashboxReport.selectDateFromPlaceholder")}
                isClearable
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
              />
            </div>
            <div className={styles.dateFilter}>
              <label className={styles.dateLabel}>
                {t("cashbox.cashboxReport.dateToLabel")}
              </label>
              <DatePicker
                selected={selectedDateTo}
                onChange={handleDateToChange}
                dateFormat="MM/dd/yyyy"
                placeholder={t("cashbox.cashboxReport.selectDateToPlaceholder")}
                isClearable
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                minDate={selectedDateFrom || undefined}
              />
            </div>
          </div>

          <div className={styles.actionsButtons}>
            <Button
              variant="secondary"
              className={styles.neutralButton}
              onClick={handleResetFilters}
            >
              <RotateCcw size={15} />
              {t("common.reset")}
            </Button>
            <Button
              variant="primary"
              className={styles.primaryButton}
              onClick={handleLoadReport}
            >
              <BarChart3 size={16} />
              {t("cashbox.cashboxReport.load", {
                defaultValue: "Load report",
              })}
            </Button>
          </div>
        </div>
      </section>

      <div className={styles.reportResult}>
        {cashboxReport ? (
          <section className={styles.reportSummary} aria-label={t("cashbox.cashboxReport.title")}>
            <header className={styles.summaryHeader}>
              <div className={styles.selectedCashbox}>
                <span>
                  <Store size={15} aria-hidden="true" />
                  {selectedShop?.code ?? `#${selectedShopId}`}
                </span>
                <ArrowRight size={14} aria-hidden="true" />
                <span>
                  <Wallet size={15} aria-hidden="true" />
                  {selectedRegister?.code ?? `#${selectedRegisterId}`}
                </span>
              </div>
              <div className={styles.period}>
                <CalendarDays size={15} aria-hidden="true" />
                <span className={styles.periodLabel}>
                  {t("cashbox.cashboxReport.periodLabel")}
                </span>
                <strong>{reportPeriod}</strong>
              </div>
            </header>

            <div className={styles.balanceFlow}>
              <article className={styles.balanceMetric}>
                <span className={styles.metricIcon}>
                  <Wallet size={17} aria-hidden="true" />
                </span>
                <span className={styles.metricLabel}>
                  {t("cashbox.cashboxReport.columns.openingBalance")}
                </span>
                <strong>{formatAmd(cashboxReport.openingBalanceAmd)}</strong>
              </article>
              <article className={`${styles.balanceMetric} ${styles.cashInMetric}`}>
                <span className={styles.metricIcon}>
                  <ArrowDownLeft size={17} aria-hidden="true" />
                </span>
                <span className={styles.metricLabel}>
                  {t("cashbox.cashboxReport.columns.cashIn")}
                </span>
                <strong>{formatAmd(cashboxReport.cashInAmd)}</strong>
              </article>
              <article className={`${styles.balanceMetric} ${styles.cashOutMetric}`}>
                <span className={styles.metricIcon}>
                  <ArrowUpRight size={17} aria-hidden="true" />
                </span>
                <span className={styles.metricLabel}>
                  {t("cashbox.cashboxReport.columns.cashOut")}
                </span>
                <strong>{formatAmd(cashboxReport.cashOutAmd)}</strong>
              </article>
              <article className={`${styles.balanceMetric} ${styles.closingMetric}`}>
                <span className={styles.metricIcon}>
                  <Wallet size={17} aria-hidden="true" />
                </span>
                <span className={styles.metricLabel}>
                  {t("cashbox.cashboxReport.columns.expectedClosingBalance")}
                </span>
                <strong>{formatAmd(cashboxReport.expectedClosingBalanceAmd)}</strong>
              </article>
            </div>

            <p className={styles.balanceEquation}>
              {t("cashbox.cashboxReport.balanceEquation")}
            </p>
          </section>
        ) : selectedShopId === "" || selectedRegisterId === "" || !isLoading ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon} aria-hidden="true">
              <Wallet size={24} />
            </span>
            <strong>{t("cashbox.cashboxReport.emptyTitle")}</strong>
            <span>{t("cashbox.cashboxReport.emptyPrompt")}</span>
          </div>
        ) : (
          <div className={styles.reportSkeleton} aria-busy="true" aria-live="polite">
            <div className={styles.skeletonContext}>
              <div className={`${styles.skeletonLine} ${styles.skeletonLineWide}`} />
              <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
            </div>
            <div className={styles.skeletonMetrics}>
              {Array.from({ length: 4 }).map((_, index) => (
                <div className={styles.skeletonMetric} key={index}>
                  <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
                  <div className={`${styles.skeletonLine} ${styles.skeletonLineWide}`} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
