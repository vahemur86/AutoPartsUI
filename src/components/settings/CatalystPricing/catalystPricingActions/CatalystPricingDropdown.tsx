import { useState, useEffect, type RefObject } from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Button, Dropdown, TextField } from "@/ui-kit";

// types
import type { CatalystPricing } from "@/types/settings";

// styles
import styles from "./CatalystPricingDropdown.module.css";

interface CatalystPricingDropdownProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  initialData?: CatalystPricing | null;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CatalystPricing) => void;
}

export const CatalystPricingDropdown = ({
  open,
  anchorRef,
  initialData,
  isLoading = false,
  onOpenChange,
  onSave,
}: CatalystPricingDropdownProps) => {
  const { t } = useTranslation();

  const [ptReducePercent, setPtReducePercent] = useState("");
  const [pdReducePercent, setPdReducePercent] = useState("");
  const [rhReducePercent, setRhReducePercent] = useState("");
  const [transportCost1, setTransportCost1] = useState("");
  const [transportCost2, setTransportCost2] = useState("");
  const [commissionPercent, setCommissionPercent] = useState("");

  const [margins, setMargins] = useState<CatalystPricing["customerMargins"]>(
    []
  );

  const isEditMode = !!initialData;

  useEffect(() => {
    if (open && initialData) {
      setPtReducePercent(String(initialData.ptReducePercent));
      setPdReducePercent(String(initialData.pdReducePercent));
      setRhReducePercent(String(initialData.rhReducePercent));
      setTransportCost1(String(initialData.transportCost1UsdPerKg));
      setTransportCost2(String(initialData.transportCost2UsdPerKg));
      setCommissionPercent(String(initialData.commissionPercent));

      setMargins(initialData.customerMargins ?? []);
    }
  }, [open, initialData]);

  const numPt = parseFloat(ptReducePercent);
  const numPd = parseFloat(pdReducePercent);
  const numRh = parseFloat(rhReducePercent);
  const numT1 = parseFloat(transportCost1);
  const numT2 = parseFloat(transportCost2);
  const numCommission = parseFloat(commissionPercent);

  const isValid =
    !isNaN(numPt) &&
    !isNaN(numPd) &&
    !isNaN(numRh) &&
    !isNaN(numT1) &&
    !isNaN(numT2) &&
    !isNaN(numCommission) &&
    numPt >= 0 &&
    numPt <= 100 &&
    numPd >= 0 &&
    numPd <= 100 &&
    numRh >= 0 &&
    numRh <= 100 &&
    numCommission >= 0 &&
    numCommission <= 100;

  const updateMargin = (id: number, value: string) => {
    const num = parseFloat(value);

    setMargins((prev) =>
      prev.map((m) =>
        m.customerTypeId === id
          ? {
              ...m,
              profitMarginPercent: isNaN(num) ? 0 : num,
            }
          : m
      )
    );
  };

  const handleSaveClick = () => {
    if (!isValid || !initialData) return;

    onSave({
      id: initialData.id,
      ptReducePercent: numPt,
      pdReducePercent: numPd,
      rhReducePercent: numRh,
      transportCost1UsdPerKg: numT1,
      transportCost2UsdPerKg: numT2,
      commissionPercent: numCommission,
      customerMargins: margins,
    });
  };

  const titleText = isEditMode ? t("common.update") : t("common.save");

  return (
    <Dropdown
      open={open}
      onOpenChange={onOpenChange}
      anchorRef={anchorRef}
      align="start"
      side="left"
      title={titleText}
    >
      <div className={styles.header}>
        <span className={styles.title}>{titleText}</span>
      </div>

      <div className={styles.content}>
        <div className={styles.grid}>
          <TextField
            label={t("catalystPricing.columns.ptReducePercent")}
            type="number"
            value={ptReducePercent}
            onChange={(e) => setPtReducePercent(e.target.value)}
            disabled={isLoading}
          />

          <TextField
            label={t("catalystPricing.columns.pdReducePercent")}
            type="number"
            value={pdReducePercent}
            onChange={(e) => setPdReducePercent(e.target.value)}
            disabled={isLoading}
          />

          <TextField
            label={t("catalystPricing.columns.rhReducePercent")}
            type="number"
            value={rhReducePercent}
            onChange={(e) => setRhReducePercent(e.target.value)}
            disabled={isLoading}
          />

          <TextField
            label={t("catalystPricing.columns.transportCost1UsdPerKg")}
            type="number"
            value={transportCost1}
            onChange={(e) => setTransportCost1(e.target.value)}
            disabled={isLoading}
          />

          <TextField
            label={t("catalystPricing.columns.transportCost2UsdPerKg")}
            type="number"
            value={transportCost2}
            onChange={(e) => setTransportCost2(e.target.value)}
            disabled={isLoading}
          />

          <TextField
            label={t("catalystPricing.columns.commissionPercent")}
            type="number"
            value={commissionPercent}
            onChange={(e) => setCommissionPercent(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className={styles.marginsSection}>
          <div className={styles.marginsTitle}>
            {t("catalystPricing.columns.customerMargins")}
          </div>

          <div className={styles.marginsGrid}>
            {margins.map((m) => {
              const value = m.profitMarginPercent;

              return (
                <div key={m.customerTypeId} className={styles.marginCard}>
                  <div className={styles.marginHeader}>
                    <div className={styles.marginName}>
                      {m.customerTypeCode}
                    </div>

                    <div
                      className={`${styles.marginBadge} ${
                        value === 0
                          ? styles.low
                          : value < 20
                          ? styles.medium
                          : styles.high
                      }`}
                    >
                      {value}%
                    </div>
                  </div>

                  <div className={styles.marginBar}>
                    <div
                      className={styles.marginFill}
                      style={{ width: `${Math.min(value, 100)}%` }}
                    />
                  </div>

                  <div className={styles.marginEdit}>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={value}
                      onChange={(e) =>
                        updateMargin(m.customerTypeId, e.target.value)
                      }
                      className={styles.marginInput}
                    />
                    <span>%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.actionswithoutDelete}>
          <div className={styles.primaryActions}>
            <Button
              variant="secondary"
              size="medium"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t("common.cancel")}
            </Button>

            <Button
              variant="primary"
              size="medium"
              onClick={handleSaveClick}
              disabled={isLoading}
            >
              {isEditMode ? t("common.update") : t("common.save")}
            </Button>
          </div>
        </div>
      </div>
    </Dropdown>
  );
};