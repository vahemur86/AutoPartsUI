import { useState, type FC } from "react";
import { useTranslation } from "react-i18next";
import { Check, RotateCcw } from "lucide-react";

// ui-kit
import { Button, DatePicker } from "@/ui-kit";

// styles
import styles from "./FilterZReportsDropdown.module.css";

interface FilterZReportsDropdownProps {
  onSave: (filters: { fromDate: string | null; toDate: string | null }) => void;
}

export const FilterZReportsDropdown: FC<FilterZReportsDropdownProps> = ({
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

  const toSafeISO = (date: Date | null) => {
    if (!date) return null;
    const safeDate = new Date(date);
    safeDate.setHours(12, 0, 0, 0);
    return safeDate.toISOString();
  };

  const handleApply = () => {
    onSave({
      fromDate: toSafeISO(tempValues.fromDate),
      toDate: toSafeISO(tempValues.toDate),
    });
  };

  const handleReset = () => {
    setTempValues({ fromDate: null, toDate: null });
    onSave({ fromDate: null, toDate: null });
  };

  return (
    <section className={styles.filters} aria-label={t("common.filters")}>
      <div className={styles.datePickerWrapper}>
        <label className={styles.label}>
          {t("cashbox.zReports.filters.fromDate")}
        </label>
        <DatePicker
          selected={tempValues.fromDate}
          onChange={(date: Date | null) =>
            setTempValues((previous) => ({ ...previous, fromDate: date }))
          }
          dateFormat="MM/dd/yyyy"
          placeholder={t("cashbox.zReports.filters.selectFromDate")}
          isClearable
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
        />
      </div>
      <div className={styles.datePickerWrapper}>
        <label className={styles.label}>
          {t("cashbox.zReports.filters.toDate")}
        </label>
        <DatePicker
          selected={tempValues.toDate}
          onChange={(date: Date | null) =>
            setTempValues((previous) => ({ ...previous, toDate: date }))
          }
          dateFormat="MM/dd/yyyy"
          placeholder={t("cashbox.zReports.filters.selectToDate")}
          isClearable
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          minDate={tempValues.fromDate || undefined}
        />
      </div>
      <div className={styles.actions}>
        <Button
          variant="secondary"
          size="medium"
          className={styles.neutralButton}
          onClick={handleReset}
        >
          <RotateCcw size={15} aria-hidden="true" />
          {t("common.reset")}
        </Button>
        <Button
          variant="primary"
          size="medium"
          className={styles.primaryButton}
          onClick={handleApply}
        >
          <Check size={15} aria-hidden="true" />
          {t("common.apply")}
        </Button>
      </div>
    </section>
  );
};
