import { type FC, type RefObject } from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Dropdown } from "@/ui-kit";

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
}

export const PowderBatchesSummaryDropdown: FC<
  PowderBatchesSummaryDropdownProps
> = ({ open, anchorRef, onOpenChange, summary, isLoading }) => {
  const { t } = useTranslation();

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
                      {t("cashbox.powderBatches.summary.metals.pt")}
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
                      {t("cashbox.powderBatches.summary.metals.pd")}
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
                      {t("cashbox.powderBatches.summary.metals.rh")}
                    </span>
                  </div>
                  <strong className={styles.summaryMetalValue}>
                    {summary.rhTotal_g}{" "}
                    {t("cashbox.powderBatches.summary.units.g")}
                  </strong>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Dropdown>
  );
};
