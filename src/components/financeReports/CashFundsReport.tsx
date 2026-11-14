import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Banknote, Landmark, RefreshCw, Wallet, WalletCards } from "lucide-react";

import { Select } from "@/ui-kit";
import { getCashFundsReport } from "@/services/financeReports";
import { getCashRegisters } from "@/services/settings/cash/registers";
import { getShops } from "@/services/settings/shop";
import type {
  CashFundsReportDto,
  CashFundsReportParams,
} from "@/types/financeReports";
import type { CashRegister, CashRegisterListResponse } from "@/types/cash";
import type { Shop } from "@/types/settings";
import { getApiErrorMessage } from "@/utils";
import { FinanceReportState } from "./FinanceReportState";
import styles from "./CashFundsReport.module.css";

const normalizeRegisters = (
  response: CashRegisterListResponse,
): CashRegister[] => Array.isArray(response) ? response : response.items;

const formatUtcDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return `${new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date)} UTC`;
};

export const CashFundsReport = () => {
  const { t } = useTranslation();
  const [shops, setShops] = useState<Shop[]>([]);
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [filtersError, setFiltersError] = useState<string | null>(null);
  const [filtersRetry, setFiltersRetry] = useState(0);
  const [shopId, setShopId] = useState("");
  const [cashRegisterId, setCashRegisterId] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [report, setReport] = useState<CashFundsReportDto | null>(null);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportError, setReportError] = useState<string | null>(null);

  const filteredRegisters = useMemo(() => {
    const selectedShopId = Number(shopId);
    return selectedShopId > 0
      ? registers.filter((register) => register.shopId === selectedShopId)
      : registers;
  }, [registers, shopId]);

  useEffect(() => {
    let isCurrent = true;
    setFiltersLoading(true);
    setFiltersError(null);

    Promise.all([getShops(), getCashRegisters()])
      .then(([shopResponse, registerResponse]) => {
        if (!isCurrent) return;
        setShops(shopResponse);
        setRegisters(normalizeRegisters(registerResponse));
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setFiltersError(
          getApiErrorMessage(error, t("financeReports.cashFunds.filtersLoadFailed")),
        );
      })
      .finally(() => {
        if (isCurrent) setFiltersLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [filtersRetry, t]);

  useEffect(() => {
    let isCurrent = true;
    const params: CashFundsReportParams = {
      shopId: shopId ? Number(shopId) : undefined,
      cashRegisterId: cashRegisterId ? Number(cashRegisterId) : undefined,
    };

    setReport(null);
    setReportError(null);
    setReportLoading(true);

    getCashFundsReport(params)
      .then((response) => {
        if (isCurrent) setReport(response);
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setReportError(
            getApiErrorMessage(error, t("financeReports.cashFunds.loadFailed")),
          );
        }
      })
      .finally(() => {
        if (isCurrent) setReportLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [cashRegisterId, refreshKey, shopId, t]);

  const formatMoney = (value: number) =>
    `${new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }).format(value)} AMD`;

  const handleShopChange = (nextShopId: string) => {
    setShopId(nextShopId);
    if (!nextShopId) return;

    const selectedShopId = Number(nextShopId);
    const selectedRegister = registers.find(
      (register) => register.id === Number(cashRegisterId),
    );
    if (selectedRegister && selectedRegister.shopId !== selectedShopId) {
      setCashRegisterId("");
    }
  };

  const clearFilters = () => {
    setShopId("");
    setCashRegisterId("");
  };

  const retryReport = () => setRefreshKey((current) => current + 1);

  return (
    <div className={styles.panel}>
      <header className={styles.reportHeading}>
        <span className={styles.reportHeadingIcon} aria-hidden="true">
          <WalletCards size={19} />
        </span>
        <div>
          <h1>{t("financeReports.cashFunds.title")}</h1>
          <p>{t("financeReports.cashFunds.description")}</p>
        </div>
      </header>
      <section className={styles.filtersCard} aria-label={t("financeReports.cashFunds.filtersTitle")}>
        <div className={styles.filters}>
          <Select
            label={t("financeReports.filters.shop")}
            value={shopId}
            onChange={(event) => handleShopChange(event.target.value)}
            disabled={filtersLoading}
          >
            <option value="">{t("financeReports.cashFunds.allShops")}</option>
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>{shop.code}</option>
            ))}
          </Select>
          <Select
            label={t("financeReports.cashFunds.cashRegister")}
            value={cashRegisterId}
            onChange={(event) => setCashRegisterId(event.target.value)}
            disabled={filtersLoading}
          >
            <option value="">{t("financeReports.cashFunds.allRegisters")}</option>
            {filteredRegisters.map((register) => (
              <option key={register.id} value={register.id}>
                {register.code} · {shops.find((shop) => shop.id === register.shopId)?.code ?? "—"}
              </option>
            ))}
          </Select>
          <div className={styles.filterActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={clearFilters}
              disabled={!shopId && !cashRegisterId}
            >
              {t("financeReports.cashFunds.clearFilters")}
            </button>
            <button
              type="button"
              className={styles.refreshButton}
              onClick={retryReport}
              disabled={reportLoading}
            >
              <RefreshCw size={15} aria-hidden="true" />
              {t("financeReports.cashFunds.refresh")}
            </button>
          </div>
        </div>
        {filtersError && (
          <div className={styles.inlineError} role="alert">
            <span>{filtersError}</span>
            <button
              type="button"
              onClick={() => setFiltersRetry((current) => current + 1)}
            >
              {t("financeReports.cashFunds.retryFilters")}
            </button>
          </div>
        )}
      </section>

      {reportLoading ? (
        <FinanceReportState loading label={t("common.loading")} />
      ) : reportError ? (
        <div className={styles.errorState} role="alert">
          <p>{reportError}</p>
          <button type="button" className={styles.refreshButton} onClick={retryReport}>
            <RefreshCw size={15} aria-hidden="true" />
            {t("financeReports.cashFunds.retry")}
          </button>
        </div>
      ) : report ? (
        <>
          <div className={styles.reportMeta}>
            <span>{t("financeReports.cashFunds.asOf", { time: formatUtcDate(report.asOfUtc) })}</span>
          </div>

          <div className={styles.summaryGrid}>
            <article className={`${styles.summaryCard} ${styles.cashSummary}`}>
              <span className={styles.summaryIcon} aria-hidden="true"><Banknote size={21} /></span>
              <span className={styles.summaryLabel}>{t("financeReports.cashFunds.totalCash")}</span>
              <strong>{formatMoney(report.totalCashBalanceAmd)}</strong>
            </article>
            <article className={`${styles.summaryCard} ${styles.nonCashSummary}`}>
              <span className={styles.summaryIcon} aria-hidden="true"><Landmark size={21} /></span>
              <span className={styles.summaryLabel}>{t("financeReports.cashFunds.totalNonCash")}</span>
              <strong>{formatMoney(report.totalNonCashBalanceAmd)}</strong>
            </article>
          </div>

          {!shopId && !cashRegisterId && report.unassignedNonCashBalanceAmd !== 0 && (
            <div className={styles.unassignedBalance}>
              <Wallet size={16} aria-hidden="true" />
              <span>{t("financeReports.cashFunds.unassignedNonCash")}</span>
              <strong>{formatMoney(report.unassignedNonCashBalanceAmd)}</strong>
            </div>
          )}

          <section className={styles.registerSection}>
            <header className={styles.registerHeader}>
              <div>
                <h2>{t("financeReports.cashFunds.breakdownTitle")}</h2>
                <span>{t("financeReports.cashFunds.registerCount", { count: report.registerCount })}</span>
              </div>
            </header>
            {report.registers.length === 0 ? (
              <div className={styles.emptyState}>{t("financeReports.cashFunds.noRegisters")}</div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope="col">{t("financeReports.cashFunds.shopCode")}</th>
                      <th scope="col">{t("financeReports.cashFunds.registerCode")}</th>
                      <th scope="col">{t("financeReports.cashFunds.cashBalance")}</th>
                      <th scope="col">{t("financeReports.cashFunds.nonCashBalance")}</th>
                      <th scope="col">{t("financeReports.cashFunds.status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.registers.map((register) => (
                      <tr key={register.cashRegisterId}>
                        <td>{register.shopCode}</td>
                        <td>{register.cashRegisterCode}</td>
                        <td>{formatMoney(register.cashBalanceAmd)}</td>
                        <td>{formatMoney(register.nonCashBalanceAmd)}</td>
                        <td>
                          <span className={register.isActive ? styles.activeStatus : styles.inactiveStatus}>
                            {register.isActive
                              ? t("financeReports.cashFunds.active")
                              : t("financeReports.cashFunds.inactive")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
};
