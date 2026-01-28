import { useState, type FC, type RefObject } from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Button, TextField, Dropdown, DatePicker } from "@/ui-kit";

// types
import type { GetPowderBatchesParams } from "@/types/cash";

// styles
import styles from "./FilterPowderBatchesDropdown.module.css";

interface FilterPowderBatchesDropdownProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  onOpenChange: (open: boolean) => void;
  onSave: (filters: Partial<GetPowderBatchesParams>) => void;
}

export const FilterPowderBatchesDropdown: FC<
  FilterPowderBatchesDropdownProps
> = ({ open, anchorRef, onOpenChange, onSave }) => {
  const { t } = useTranslation();

  const [tempValues, setTempValues] = useState<{
    fromDate: Date | null;
    toDate: Date | null;
    cashRegisterId: string;
  }>({
    fromDate: null,
    toDate: null,
    cashRegisterId: "",
  });

  const handleApply = () => {
    const filters: Partial<GetPowderBatchesParams> = {};

    if (tempValues.fromDate) {
      filters.fromDate = tempValues.fromDate.toISOString();
    }
    if (tempValues.toDate) {
      filters.toDate = tempValues.toDate.toISOString();
    }
    if (tempValues.cashRegisterId) {
      filters.cashRegisterId = Number(tempValues.cashRegisterId);
    }

    onSave(filters);
    onOpenChange(false);
  };

  const handleReset = () => {
    setTempValues({
      fromDate: null,
      toDate: null,
      cashRegisterId: "",
    });
    onSave({});
    onOpenChange(false);
  };

  return (
    <Dropdown
      open={open}
      onOpenChange={onOpenChange}
      anchorRef={anchorRef}
      align="start"
      side="left"
      title={t("common.filters")}
      contentClassName={styles.dropdownContentOverride}
    >
      <div className={styles.header}>
        <span className={styles.title}>{t("common.filters")}</span>
      </div>

      <div className={styles.content}>
        <div className={styles.grid}>
          {/* From Date & To Date */}
          <div className={styles.colLeft}>
            <div className={styles.datePickerWrapper}>
              <label className={styles.label}>
                {t("cashbox.powderBatches.filters.fromDate")}
              </label>
              <DatePicker
                selected={tempValues.fromDate}
                onChange={(date: Date | null) => {
                  setTempValues((p) => ({ ...p, fromDate: date }));
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
              />
            </div>
          </div>
          <div className={styles.colRight}>
            <div className={styles.datePickerWrapper}>
              <label className={styles.label}>
                {t("cashbox.powderBatches.filters.toDate")}
              </label>
              <DatePicker
                selected={tempValues.toDate}
                onChange={(date: Date | null) => {
                  setTempValues((p) => ({ ...p, toDate: date }));
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
                minDate={tempValues.fromDate || undefined}
              />
            </div>
          </div>

          {/* Cash Register ID */}
          <div className={styles.fullRow}>
            <TextField
              label={t("cashbox.powderBatches.filters.cashRegisterId")}
              value={tempValues.cashRegisterId}
              onChange={(e) =>
                setTempValues((p) => ({
                  ...p,
                  cashRegisterId: e.target.value,
                }))
              }
              placeholder={t(
                "cashbox.powderBatches.filters.enterCashRegisterId",
              )}
              type="number"
            />
          </div>
        </div>

        <div className={styles.actionswithoutDelete}>
          <div className={styles.primaryActions}>
            <Button variant="secondary" size="medium" onClick={handleReset}>
              {t("common.reset")}
            </Button>
            <Button variant="primary" size="medium" onClick={handleApply}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      </div>
    </Dropdown>
  );
};
