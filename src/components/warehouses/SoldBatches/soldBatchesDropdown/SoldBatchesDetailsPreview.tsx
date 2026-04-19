import { type FC, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { DollarSign } from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchSalesLotsPreviewById } from "@/store/slices/warehouses/salesLotsSlice";

import type { PowderSale } from "@/types/warehouses/salesLots";
import type { LotPreviewValues } from "@/types/warehouses/salesLots";

import styles from "./SoldBatchesDetailsPreview.module.css";

interface Props {
  lot: PowderSale;
  cashRegisterId: number;
}

type PreviewKey = keyof LotPreviewValues;

export const SoldBatchesDetailsPreview: FC<Props> = ({
  lot,
  cashRegisterId,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { dropdownPreviewData, isLoading } = useAppSelector(
    (state) => state.salesLots,
  );

  useEffect(() => {
    dispatch(
      fetchSalesLotsPreviewById({
        id: lot.salesLotId,
        cashRegisterId,
      }),
    );
  }, [dispatch, lot.salesLotId, cashRegisterId]);

  const data = dropdownPreviewData;

  if (isLoading || !data) {
    return <div className={styles.loading}>{t("common.loading")}</div>;
  }

  const fields = Object.keys(data.before || {}) as PreviewKey[];

  const isPriceField = (key: string) =>
    key.includes("Price") || key === "usdRate";

  const renderRow = (key: PreviewKey) => {
    const beforeVal = data.before?.[key];
    const afterVal = data.after?.[key];

    const changed = String(beforeVal) !== String(afterVal);
    const showDollar = isPriceField(key);

    return (
      <div className={styles.row} key={key}>
        <div className={styles.label}>
          {t(`warehouses.soldBatches.dropdown.${key}`)}
        </div>

        <div className={`${styles.valueWrap} ${changed ? styles.changed : ""}`}>
          {showDollar && <DollarSign size={12} className={styles.icon} />}

          <span className={styles.before}>{beforeVal ?? "-"}</span>
          <span className={styles.arrow}>→</span>
          <span className={styles.after}>{afterVal ?? "-"}</span>
        </div>
      </div>
    );
  };

  const renderObject = (
    obj: Partial<LotPreviewValues> | null | undefined,
  ) => {
    if (!obj) return null;

    return (Object.entries(obj) as [
      keyof LotPreviewValues,
      LotPreviewValues[keyof LotPreviewValues],
    ][]).map(([key, value]) => {
      const showDollar = isPriceField(key as string);

      return (
        <div className={styles.kv} key={key}>
          <span>{t(`warehouses.soldBatches.dropdown.${key}`)}</span>

          <strong>
            {showDollar && <DollarSign size={12} className={styles.icon} />}{" "}
            {value ?? "-"}
          </strong>
        </div>
      );
    });
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        {t("warehouses.soldBatches.dropdown.saleId")}:{" "}
        <strong>{data.saleId}</strong>
      </div>

      <div className={styles.grid3}>
        <div className={styles.card}>
          <h4>{t("warehouses.soldBatches.dropdown.comparison")}</h4>

          <div className={styles.grid}>
            {data.diffs && data.diffs.length > 0 ? (
              fields.map(renderRow)
            ) : (
              <div className={styles.noDiffs}>
                {t("warehouses.soldBatches.dropdown.noDifferences")}
              </div>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <h4>{t("warehouses.soldBatches.dropdown.original")}</h4>
          {renderObject(data.before)}
        </div>

        <div className={styles.card}>
          <h4>{t("warehouses.soldBatches.dropdown.current")}</h4>
          {renderObject(data.after)}
        </div>
      </div>
    </div>
  );
};