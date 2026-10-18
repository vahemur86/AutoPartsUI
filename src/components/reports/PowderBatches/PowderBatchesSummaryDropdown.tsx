import { type FC, type RefObject, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeftRight,
  BarChart3,
  CalendarDays,
  CalendarRange,
  Gem,
  Layers3,
  LoaderCircle,
  Percent,
  Weight,
} from "lucide-react";

// ui-kit
import { Dropdown, DatePicker } from "@/ui-kit";

// types
import type { PowderBatchesSummary } from "@/types/cash";

// styles
import styles from "./PowderBatches.module.css";

interface PowderBatchesSummaryDropdownProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  onOpenChange: (open: boolean) => void;
  summary: PowderBatchesSummary | null;
  isLoading: boolean;
  onFetchSummaryByDate: (dateFrom: string, dateTo: string) => void;
  onFetchDefaultSummary: () => void;
}

export const PowderBatchesSummaryDropdown: FC<
  PowderBatchesSummaryDropdownProps
> = ({
  open,
  anchorRef,
  onOpenChange,
  summary,
  isLoading,
  onFetchSummaryByDate,
  onFetchDefaultSummary,
}) => {
  const { t } = useTranslation();

  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  useEffect(() => {
    if (!open) {
      setDateFrom(null);
      setDateTo(null);
    }
  }, [open]);

  const formatValue = (val: number, decimals = 2) =>
    val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  const formatPrice = (val: number) =>
    val.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const toSafeISO = (date: Date | null) => {
    if (!date) return null;
    const safeDate = new Date(date);
    safeDate.setHours(12, 0, 0, 0);
    return safeDate.toISOString();
  };

  useEffect(() => {
    if (dateFrom && dateTo) {
      const fromISO = toSafeISO(dateFrom);
      const toISO = toSafeISO(dateTo);
      if (fromISO && toISO) {
        onFetchSummaryByDate(fromISO, toISO);
      }
    }
  }, [dateFrom, dateTo, onFetchSummaryByDate]);

  const handleThisMonth = () => {
    setDateFrom(null);
    setDateTo(null);
    onFetchDefaultSummary();
  };

  const metals = summary
    ? [
        {
          symbol: "Pt",
          label: t("cashbox.powderBatches.summary.metals.pt"),
          price: summary.avgPtPricePerKg,
          total: summary.ptTotal_g,
          color: "#cbd5d1",
        },
        {
          symbol: "Pd",
          label: t("cashbox.powderBatches.summary.metals.pd"),
          price: summary.avgPdPricePerKg,
          total: summary.pdTotal_g,
          color: "#a8d29e",
        },
        {
          symbol: "Rh",
          label: t("cashbox.powderBatches.summary.metals.rh"),
          price: summary.avgRhPricePerKg,
          total: summary.rhTotal_g,
          color: "#d2bf8a",
        },
      ]
    : [];

  return (
    <Dropdown
      open={open}
      onOpenChange={onOpenChange}
      anchorRef={anchorRef}
      align="start"
      side="left"
      title={t("cashbox.powderBatches.summary.title")}
      contentClassName={styles.summaryDropdownContent}
    >
      <div className={styles.summaryDropdownInner}>
        <div className={styles.summaryHeader}>
          <span className={styles.summaryHeaderIcon} aria-hidden="true">
            <BarChart3 size={17} />
          </span>
          <h3>{t("cashbox.powderBatches.summary.title")}</h3>
        </div>
        {/* Date Filters */}
        <div className={styles.summaryFiltersSection}>
          <div className={styles.dateFiltersRow}>
            <div className={styles.datePickerWrapper}>
              <label className={styles.dateLabel}>
                <CalendarDays size={12} aria-hidden="true" />
                {t("cashbox.powderBatches.filters.fromDate")}
              </label>
              <DatePicker
                selected={dateFrom}
                onChange={(date: Date | null) => setDateFrom(date)}
                dateFormat="MM/dd/yyyy"
                placeholderText={t(
                  "cashbox.powderBatches.filters.selectFromDate",
                )}
                isClearable
                showTimeSelect={false}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                maxDate={dateTo || undefined}
              />
            </div>
            <div className={styles.datePickerWrapper}>
              <label className={styles.dateLabel}>
                <CalendarDays size={12} aria-hidden="true" />
                {t("cashbox.powderBatches.filters.toDate")}
              </label>
              <DatePicker
                selected={dateTo}
                onChange={(date: Date | null) => setDateTo(date)}
                dateFormat="MM/dd/yyyy"
                placeholderText={t(
                  "cashbox.powderBatches.filters.selectToDate",
                )}
                isClearable
                showTimeSelect={false}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                minDate={dateFrom || undefined}
              />
            </div>
          </div>
          <button
            className={styles.thisMonthButton}
            onClick={handleThisMonth}
            type="button"
          >
            <CalendarRange size={14} aria-hidden="true" />
            {t("cashbox.powderBatches.summary.thisMonth")}
          </button>
        </div>

        <div className={styles.summaryDivider} />

        {isLoading && (
          <div className={styles.summaryLoading} role="status" aria-live="polite">
            <LoaderCircle className={styles.loadingSpinner} size={20} aria-hidden="true" />
            <span>{t("cashbox.powderBatches.summary.calculating")}</span>
          </div>
        )}

        {!isLoading && !summary && (
          <div className={styles.summaryEmpty}>
            <BarChart3 className={styles.summaryEmptyIcon} size={28} aria-hidden="true" />
            <p>{t("cashbox.powderBatches.summary.empty")}</p>
          </div>
        )}

        {!isLoading && summary && (
          <>
            {/* Stats Cards */}
            <div className={styles.summaryCardsGrid}>
              <div className={styles.summaryCard}>
                <span className={styles.summaryCardLabel}>
                  <Weight size={13} aria-hidden="true" />
                  {t("cashbox.powderBatches.summary.totalPowderKg")}
                </span>
                <div className={styles.summaryCardValueRow}>
                  <strong className={styles.summaryCardValue}>
                    {formatValue(summary.totalPowderKg, 2)}
                  </strong>
                  <span className={styles.summaryCardUnit}>
                    {t("cashbox.powderBatches.summary.units.kg")}
                  </span>
                </div>
              </div>

              <div className={styles.summaryCard}>
                <span className={styles.summaryCardLabel}>
                  <Layers3 size={13} aria-hidden="true" />
                  {t("cashbox.powderBatches.summary.batchCount")}
                </span>
                <div className={styles.summaryCardValueRow}>
                  <strong className={styles.summaryCardValue}>
                    {summary.batchCount}
                  </strong>
                  <span className={styles.summaryCardUnit}>
                    {t("cashbox.powderBatches.summary.units.batches")}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.summaryDivider} />

            {/* Precious Metals */}
            <div className={styles.summaryMetalsSection}>
              <h4 className={styles.summaryMetalsTitle}>
                <Gem size={13} aria-hidden="true" />
                {t("cashbox.powderBatches.summary.metalsTitle")}
              </h4>
              <div className={styles.summaryMetalsList}>
                {metals.map(({ symbol, label, price, total, color }) => (
                  <div key={symbol} className={styles.summaryMetalRow}>
                    <div className={styles.summaryMetalInfo}>
                      <span
                        className={styles.summaryMetalSymbol}
                        style={
                          { "--metal-color": color } as React.CSSProperties
                        }
                      >
                        {symbol}
                      </span>
                      <div className={styles.summaryMetalMeta}>
                        <span className={styles.summaryMetalName}>{label}</span>
                        <span className={styles.summaryMetalPrice}>
                          {formatPrice(price)} USD / kg
                        </span>
                      </div>
                    </div>
                    <strong className={styles.summaryMetalValue}>
                      {formatValue(total, 3)}{" "}
                      <span className={styles.summaryMetalUnit}>
                        {t("cashbox.powderBatches.summary.units.g")}
                      </span>
                    </strong>
                  </div>
                ))}

                <div className={styles.summaryDivider} />

                {/* Averages row */}
                <div className={styles.summaryAveragesRow}>
                  <div className={styles.summaryAvgItem}>
                    <span className={styles.summaryAvgLabel}>
                      <Percent size={12} aria-hidden="true" />
                      {t("cashbox.powderBatches.columns.avgCustomerPercent")}
                    </span>
                    <strong className={styles.summaryAvgValue}>
                      {formatValue(summary.avgCustomerPercent, 3)}%
                    </strong>
                  </div>
                  <div className={styles.summaryAvgDivider} />
                  <div className={styles.summaryAvgItem}>
                    <span className={styles.summaryAvgLabel}>
                      <ArrowLeftRight size={12} aria-hidden="true" />
                      {t("cashbox.powderBatches.columns.avgFxRateToAmd")}
                    </span>
                    <strong className={styles.summaryAvgValue}>
                      {formatValue(summary.avgFxRateToAmd, 2)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Dropdown>
  );
};
