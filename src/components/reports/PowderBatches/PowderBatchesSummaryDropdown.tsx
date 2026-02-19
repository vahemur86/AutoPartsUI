import { type FC, type RefObject, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Dropdown, DatePicker, Button } from "@/ui-kit";

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
        {/* Date Filters Section */}
        <div className={styles.summaryFiltersSection}>
          <div className={styles.dateFiltersRow}>
            <div className={styles.datePickerWrapper}>
              <label className={styles.dateLabel}>
                {t("cashbox.powderBatches.filters.fromDate")}
              </label>
              <DatePicker
                selected={dateFrom}
                onChange={(date: Date | null) => {
                  setDateFrom(date);
                }}
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
                {t("cashbox.powderBatches.filters.toDate")}
              </label>
              <DatePicker
                selected={dateTo}
                onChange={(date: Date | null) => {
                  setDateTo(date);
                }}
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
          <Button
            variant="secondary"
            size="small"
            onClick={handleThisMonth}
            className={styles.thisMonthButton}
          >
            {t("cashbox.powderBatches.summary.thisMonth")}
          </Button>
        </div>

        <div className={styles.summaryDivider} />

        {isLoading && (
          <div className={styles.summaryRowMuted}>{t("common.loading")}</div>
        )}

        {!isLoading && !summary && (
          <div className={styles.summaryInfo}>
            <p>{t("cashbox.powderBatches.summary.empty")}</p>
          </div>
        )}

        {!isLoading && summary && (
          <>
            <div className={styles.summaryCardsGrid}>
              <div className={styles.summaryCard}>
                <span className={styles.summaryCardLabel}>
                  {t("cashbox.powderBatches.summary.totalPowderKg")}
                </span>
                <strong className={styles.summaryCardValue}>
                  {summary.totalPowderKg}
                </strong>
                <small className={styles.summaryCardUnit}>
                  {t("cashbox.powderBatches.summary.units.kg")}
                </small>
              </div>

              <div className={styles.summaryCard}>
                <span className={styles.summaryCardLabel}>
                  {t("cashbox.powderBatches.summary.batchCount")}
                </span>
                <strong className={styles.summaryCardValue}>
                  {summary.batchCount}
                </strong>
                <small className={styles.summaryCardUnit}>
                  {t("cashbox.powderBatches.summary.units.batches")}
                </small>
              </div>
            </div>

            <div className={styles.summaryDivider} />

            <div className={styles.summaryMetalsSection}>
              <h4 className={styles.summaryMetalsTitle}>
                {t("cashbox.powderBatches.summary.metalsTitle")}
              </h4>
              <div className={styles.summaryMetalsList}>
                <div className={styles.summaryMetalRow}>
                  <div className={styles.summaryMetalInfo}>
                    <span className={styles.summaryMetalSymbol}>Pt</span>
                    <span className={styles.summaryMetalName}>
                      {formatValue(summary.avgPtPricePerKg, 0)} AMD
                    </span>
                  </div>
                  <strong className={styles.summaryMetalValue}>
                    {summary.ptTotal_g}{" "}
                    {t("cashbox.powderBatches.summary.units.g")}
                  </strong>
                </div>

                <div className={styles.summaryMetalRow}>
                  <div className={styles.summaryMetalInfo}>
                    <span className={styles.summaryMetalSymbol}>Pd</span>
                    <span className={styles.summaryMetalName}>
                      {formatValue(summary.avgPdPricePerKg, 0)} AMD
                    </span>
                  </div>
                  <strong className={styles.summaryMetalValue}>
                    {summary.pdTotal_g}{" "}
                    {t("cashbox.powderBatches.summary.units.g")}
                  </strong>
                </div>

                <div className={styles.summaryMetalRow}>
                  <div className={styles.summaryMetalInfo}>
                    <span className={styles.summaryMetalSymbol}>Rh</span>
                    <span className={styles.summaryMetalName}>
                      {formatValue(summary.avgRhPricePerKg, 0)} AMD
                    </span>
                  </div>
                  <strong className={styles.summaryMetalValue}>
                    {summary.rhTotal_g}{" "}
                    {t("cashbox.powderBatches.summary.units.g")}
                  </strong>
                </div>

                <div className={styles.summaryMetalRow}>
                  <div className={styles.summaryMetalInfo}>
                    <span className={styles.summaryMetalSymbol}>%</span>
                    <span className={styles.summaryMetalName}>
                      {t("cashbox.powderBatches.columns.avgCustomerPercent")}
                    </span>
                  </div>
                  <strong className={styles.summaryMetalValue}>
                    {summary.avgCustomerPercent}%
                  </strong>
                </div>

                <div className={styles.summaryMetalRow}>
                  <div className={styles.summaryMetalInfo}>
                    <span className={styles.summaryMetalSymbol}>FX</span>
                    <span className={styles.summaryMetalName}>
                      {t("cashbox.powderBatches.columns.avgFxRateToAmd")}
                    </span>
                  </div>
                  <strong className={styles.summaryMetalValue}>
                    {formatValue(summary.avgFxRateToAmd, 2)}
                  </strong>
                </div>
              </div>
            </div>

            <div className={styles.summaryDivider} />
          </>
        )}
      </div>
    </Dropdown>
  );
};
