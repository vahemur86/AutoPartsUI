import type { FC } from "react";

interface Props {
  data: {
    totalPowderKg?: number;
    totalCostAmd?: number;

    avgPtPerKg_g?: number;
    avgPdPerKg_g?: number;
    avgRhPerKg_g?: number;
  };
  t: (key: string) => string;
  styles: Record<string, string>;
}

export const FilteredBatchSummaryCard: FC<Props> = ({ data, t, styles }) => {
  return (
    <div className={styles.totalsGrid}>
      <div className={styles.totalCard}>
        <span>{t("cashbox.batches.columns.weight")}</span>
        <strong>{data.totalPowderKg ?? 0} kg</strong>
      </div>

      <div className={styles.totalCard}>
        <span>{t("cashbox.batches.details.pt")}</span>
        <strong>{data.avgPtPerKg_g ?? 0} g</strong>
      </div>

      <div className={styles.totalCard}>
        <span>{t("cashbox.batches.details.pd")}</span>
        <strong>{data.avgPdPerKg_g ?? 0} g</strong>
      </div>

      <div className={styles.totalCard}>
        <span>{t("cashbox.batches.details.rh")}</span>
        <strong>{data.avgRhPerKg_g ?? 0} g</strong>
      </div>

      <div className={styles.totalCard}>
        <span>{t("cashbox.batches.details.cost")}</span>
        <strong>{(data.totalCostAmd ?? 0).toLocaleString()} AMD</strong>
      </div>
    </div>
  );
};
