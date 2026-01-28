import { useState, type FC, type RefObject } from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Button, Dropdown, DatePicker } from "@/ui-kit";

// styles
import styles from "./FilterBatchesDropdown.module.css";

interface FilterBatchesDropdownProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  onOpenChange: (open: boolean) => void;
  onSave: (filters: { fromDate: string | null; toDate: string | null }) => void;
}

export const FilterBatchesDropdown: FC<FilterBatchesDropdownProps> = ({
  open,
  anchorRef,
  onOpenChange,
  onSave,
}) => {
  const { t } = useTranslation();

  const [tempValues, setTempValues] = useState<{
    fromDate: Date | null;
    toDate: Date | null;
  }>({
    fromDate: null,
    toDate: null,
  });

  const handleApply = () => {
    onSave({
      fromDate: tempValues.fromDate ? tempValues.fromDate.toISOString() : null,
      toDate: tempValues.toDate ? tempValues.toDate.toISOString() : null,
    });
    onOpenChange(false);
  };

  const handleReset = () => {
    setTempValues({ fromDate: null, toDate: null });
    onSave({ fromDate: null, toDate: null });
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
          <div className={styles.colLeft}>
            <div className={styles.datePickerWrapper}>
              <label className={styles.label}>
                {t("cashbox.zReports.filters.fromDate")}
              </label>
              <DatePicker
                selected={tempValues.fromDate}
                onChange={(date: Date | null) =>
                  setTempValues((p) => ({ ...p, fromDate: date }))
                }
                dateFormat="MM/dd/yyyy"
                placeholderText={t("cashbox.zReports.filters.selectFromDate")}
                isClearable
                showTimeSelect={false}
              />
            </div>
          </div>
          <div className={styles.colRight}>
            <div className={styles.datePickerWrapper}>
              <label className={styles.label}>
                {t("cashbox.zReports.filters.toDate")}
              </label>
              <DatePicker
                selected={tempValues.toDate}
                onChange={(date: Date | null) =>
                  setTempValues((p) => ({ ...p, toDate: date }))
                }
                dateFormat="MM/dd/yyyy"
                placeholderText={t("cashbox.zReports.filters.selectToDate")}
                isClearable
                showTimeSelect={false}
                minDate={tempValues.fromDate || undefined}
              />
            </div>
          </div>
        </div>

        <div className={styles.primaryActions}>
          <Button variant="secondary" size="medium" onClick={handleReset}>
            {t("common.reset")}
          </Button>
          <Button variant="primary" size="medium" onClick={handleApply}>
            {t("common.save")}
          </Button>
        </div>
      </div>
    </Dropdown>
  );
};
