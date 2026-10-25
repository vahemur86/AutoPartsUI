import { type FC, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  History,
  LoaderCircle,
  Sparkles,
} from "lucide-react";

import { useAppDispatch } from "@/store/hooks";
import { fetchSalesLotsPreviewById } from "@/store/slices/warehouses/salesLotsSlice";

import type {
  GetLotPreviewResponse,
  PowderSale,
} from "@/types/warehouses/salesLots";

import styles from "./SoldBatchesDetailsPreview.module.css";

interface Props {
  lot: PowderSale;
  cashRegisterId: number;
}

export const SoldBatchesDetailsPreview: FC<Props> = ({
  lot,
  cashRegisterId,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [snapshot, setSnapshot] = useState<GetLotPreviewResponse | null>(null);
  const [requestState, setRequestState] = useState<
    "loading" | "ready" | "noSnapshots" | "error"
  >("loading");
  const [requestError, setRequestError] = useState("");

  useEffect(() => {
    let isCurrentRequest = true;
    setRequestState("loading");
    setRequestError("");
    setSnapshot(null);

    dispatch(fetchSalesLotsPreviewById({ id: lot.id, cashRegisterId }))
      .unwrap()
      .then((result) => {
        if (!isCurrentRequest) return;
        setSnapshot(result);
        setRequestState("ready");
      })
      .catch((error: unknown) => {
        if (!isCurrentRequest) return;
        const message = typeof error === "string" ? error : "";
        if (message.toLowerCase().includes("snapshots not found")) {
          setRequestState("noSnapshots");
          return;
        }
        setRequestError(message);
        setRequestState("error");
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [dispatch, lot.id, cashRegisterId]);

  const data = snapshot;
  const fieldKeys: Record<string, string> = {
    PowderKg: "powderKg",
    powderKg: "powderKg",
    Pt_g: "pt_g",
    pt_g: "pt_g",
    Pd_g: "pd_g",
    pd_g: "pd_g",
    Rh_g: "rh_g",
    rh_g: "rh_g",
    PtPrice: "ptPrice",
    ptPrice: "ptPrice",
    PdPrice: "pdPrice",
    pdPrice: "pdPrice",
    RhPrice: "rhPrice",
    rhPrice: "rhPrice",
    UsdRate: "usdRate",
    USD_Rate: "usdRate",
    usdRate: "usdRate",
    RevenueAmd: "revenueAmd",
    revenueAmd: "revenueAmd",
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatValue = (value: string | number) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue)
      ? numericValue.toLocaleString(undefined, { maximumFractionDigits: 3 })
      : value;
  };

  const fieldLabel = (field: string) => {
    const key = fieldKeys[field];
    return key ? t(`warehouses.soldBatches.dropdown.${key}`) : field;
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.saleIdentity}>
          <span className={styles.saleIdIcon} aria-hidden="true">
            <CircleDollarSign size={16} />
          </span>
          <span className={styles.saleIdLabel}>
            {t("warehouses.soldBatches.dropdown.saleId")}
            <strong>#{lot.salesLotId}</strong>
          </span>
        </div>
        {lot.hasSpecialCustomerLots && (
          <span className={styles.specialBadge}>
            <Sparkles size={13} aria-hidden="true" />
            {t("warehouses.totalBatches.lotType.specialShort")}
          </span>
        )}
        <span className={styles.createdAt}>
          <CalendarDays size={14} aria-hidden="true" />
          {formatDate(lot.createdAt)}
        </span>
      </div>

      {requestState === "loading" && (
        <div className={styles.stateMessage} role="status" aria-live="polite">
          <LoaderCircle size={18} className={styles.spinner} aria-hidden="true" />
          <span>{t("common.loading")}</span>
        </div>
      )}

      {requestState === "noSnapshots" && (
        <div className={`${styles.stateMessage} ${styles.noSnapshots}`} role="status">
          <BadgeCheck size={20} aria-hidden="true" />
          <span>{t("warehouses.soldBatches.dropdown.noSnapshots")}</span>
        </div>
      )}

      {requestState === "error" && (
        <div className={`${styles.stateMessage} ${styles.errorMessage}`} role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{requestError || t("warehouses.soldBatches.errors.failedToFetchChanges")}</span>
        </div>
      )}

      {requestState === "ready" && data && (
        <section className={styles.changesPanel}>
          <div className={styles.changesHeading}>
            <div className={styles.changesTitle}>
              <History size={17} aria-hidden="true" />
              <h4>{t("warehouses.soldBatches.dropdown.comparison")}</h4>
            </div>
            <span className={styles.changeCount}>
              {t("warehouses.soldBatches.dropdown.changeCount", { count: data.diffs.length })}
            </span>
          </div>

          {data.diffs.length === 0 ? (
            <div className={styles.noDiffs}>
              <BadgeCheck size={18} aria-hidden="true" />
              <span>{t("warehouses.soldBatches.dropdown.noDifferences")}</span>
            </div>
          ) : (
            <>
              <div className={styles.diffHeader}>
                <span>{t("warehouses.soldBatches.dropdown.field")}</span>
                <span>{t("warehouses.soldBatches.dropdown.original")}</span>
                <span aria-hidden="true" />
                <span>{t("warehouses.soldBatches.dropdown.current")}</span>
              </div>
              <div className={styles.diffList}>
                {data.diffs.map((diff) => (
                  <div className={styles.diffRow} key={diff.field}>
                    <span className={styles.diffLabel}>{fieldLabel(diff.field)}</span>
                    <span className={styles.oldValue}>{formatValue(diff.oldValue)}</span>
                    <ArrowRight size={14} className={styles.diffArrow} aria-hidden="true" />
                    <strong className={styles.newValue}>{formatValue(diff.newValue)}</strong>
                  </div>
                ))}
              </div>
            </>
          )}

          <details className={styles.snapshotDetails}>
            <summary>
              <Clock3 size={14} aria-hidden="true" />
              {t("warehouses.soldBatches.dropdown.snapshotDetails")}
            </summary>
            <div className={styles.snapshotGrid}>
              <section className={styles.snapshotColumn}>
                <span>{t("warehouses.soldBatches.dropdown.original")}</span>
                {Object.entries(data.before).map(([field, value]) => (
                  <div className={styles.snapshotRow} key={field}>
                    <span>{fieldLabel(field)}</span>
                    <strong>{formatValue(value)}</strong>
                  </div>
                ))}
              </section>
              <section className={styles.snapshotColumn}>
                <span>{t("warehouses.soldBatches.dropdown.current")}</span>
                {Object.entries(data.after).map(([field, value]) => (
                  <div className={styles.snapshotRow} key={field}>
                    <span>{fieldLabel(field)}</span>
                    <strong>{formatValue(value)}</strong>
                  </div>
                ))}
              </section>
            </div>
          </details>
        </section>
      )}
    </div>
  );
};