import {
  useState,
  useMemo,
  type FC,
  type RefObject,
  type KeyboardEvent,
} from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Button, Dropdown, DatePicker, TextField } from "@/ui-kit";

// styles
import styles from "./FilterIronPurchasesDropdown.module.css";

interface FilterIronPurchasesDropdownProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  onOpenChange: (open: boolean) => void;
  onSave: (filters: {
    fromDate: string | null;
    toDate: string | null;
    productId: number | null;
    operatorUserId: number | null;
    cashRegisterId: number | null;
  }) => void;
}

export const FilterIronPurchasesDropdown: FC<
  FilterIronPurchasesDropdownProps
> = ({ open, anchorRef, onOpenChange, onSave }) => {
  const { t } = useTranslation();

  const [tempValues, setTempValues] = useState({
    fromDate: null as Date | null,
    toDate: null as Date | null,
    productId: null as number | null,
    operatorUserId: null as number | null,
    cashRegisterId: null as number | null,
  });

  const isFiltersEmpty = useMemo(() => {
    return (
      !tempValues.fromDate &&
      !tempValues.toDate &&
      !tempValues.productId &&
      !tempValues.operatorUserId &&
      !tempValues.cashRegisterId
    );
  }, [tempValues]);

  const handleIntegerOnlyKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (["e", "E", ".", ","].includes(e.key)) {
      e.preventDefault();
    }
  };

  const toSafeISO = (date: Date | null) => {
    if (!date) return null;
    const safeDate = new Date(date);
    safeDate.setHours(12, 0, 0, 0);
    return safeDate.toISOString();
  };

  const handleApply = () => {
    if (isFiltersEmpty) return;
    onSave({
      fromDate: toSafeISO(tempValues.fromDate),
      toDate: toSafeISO(tempValues.toDate),
      productId: tempValues.productId,
      operatorUserId: tempValues.operatorUserId,
      cashRegisterId: tempValues.cashRegisterId,
    });
    onOpenChange(false);
  };

  const handleReset = () => {
    if (isFiltersEmpty) return;
    const emptyState = {
      fromDate: null,
      toDate: null,
      productId: null,
      operatorUserId: null,
      cashRegisterId: null,
    };
    setTempValues(emptyState);
    onSave(emptyState);
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
        <div className={styles.dateRow}>
          <div className={styles.fieldWrapper}>
            <label className={styles.label}>
              {t("reports.filters.fromUtc")}
            </label>
            <DatePicker
              selected={tempValues.fromDate}
              onChange={(date) =>
                setTempValues((p) => ({ ...p, fromDate: date }))
              }
              placeholderText={t("reports.filters.selectDate")}
              isClearable
            />
          </div>
          <div className={styles.fieldWrapper}>
            <label className={styles.label}>{t("reports.filters.toUtc")}</label>
            <DatePicker
              selected={tempValues.toDate}
              onChange={(date) =>
                setTempValues((p) => ({ ...p, toDate: date }))
              }
              placeholderText={t("reports.filters.selectDate")}
              minDate={tempValues.fromDate || undefined}
              isClearable
            />
          </div>
        </div>

        <div className={styles.fieldWrapper}>
          <TextField
            label={t("reports.filters.operatorUserId")}
            type="number"
            value={tempValues.operatorUserId ?? ""}
            onKeyDown={handleIntegerOnlyKeyDown}
            onChange={(e) => {
              const val = e.target.value;
              setTempValues((p) => ({
                ...p,
                operatorUserId: val ? Math.floor(Number(val)) : null,
              }));
            }}
          />
        </div>

        <div className={styles.fieldWrapper}>
          <TextField
            label={t("reports.filters.cashRegisterId")}
            type="number"
            value={tempValues.cashRegisterId ?? ""}
            onKeyDown={handleIntegerOnlyKeyDown}
            onChange={(e) => {
              const val = e.target.value;
              setTempValues((p) => ({
                ...p,
                cashRegisterId: val ? Math.floor(Number(val)) : null,
              }));
            }}
          />
        </div>

        <div className={styles.fieldWrapper}>
          <TextField
            label={t("reports.ironProducts.columns.productId")}
            type="number"
            value={tempValues.productId ?? ""}
            onKeyDown={handleIntegerOnlyKeyDown}
            onChange={(e) => {
              const val = e.target.value;
              setTempValues((p) => ({
                ...p,
                productId: val ? Math.floor(Number(val)) : null,
              }));
            }}
          />
        </div>

        <div className={styles.primaryActions}>
          <Button
            variant="secondary"
            onClick={handleReset}
            disabled={isFiltersEmpty}
          >
            {t("common.reset")}
          </Button>

          <Button
            variant="primary"
            onClick={handleApply}
            disabled={isFiltersEmpty}
          >
            {t("common.save")}
          </Button>
        </div>
      </div>
    </Dropdown>
  );
};
