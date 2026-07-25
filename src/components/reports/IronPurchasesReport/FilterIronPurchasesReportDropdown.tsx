import {
  type FC,
  type KeyboardEvent,
  type RefObject,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { Button, DatePicker, Dropdown, TextField } from "@/ui-kit";

import styles from "./FilterIronPurchasesReportDropdown.module.css";

interface FilterIronPurchasesReportDropdownProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  onOpenChange: (open: boolean) => void;
  onSave: (filters: {
    from: string | null;
    to: string | null;
    dictBrandId: number | null;
    ironTypeId: number | null;
    operatorUserId: number | null;
    sessionId: number | null;
    customerPhone: string | null;
  }) => void;
}

export const FilterIronPurchasesReportDropdown: FC<
  FilterIronPurchasesReportDropdownProps
> = ({ open, anchorRef, onOpenChange, onSave }) => {
  const { t } = useTranslation();

  const [tempValues, setTempValues] = useState({
    from: null as Date | null,
    to: null as Date | null,
    dictBrandId: null as number | null,
    ironTypeId: null as number | null,
    operatorUserId: null as number | null,
    sessionId: null as number | null,
    customerPhone: null as string | null,
  });

  const isFiltersEmpty = useMemo(
    () =>
      !tempValues.from &&
      !tempValues.to &&
      !tempValues.dictBrandId &&
      !tempValues.ironTypeId &&
      !tempValues.operatorUserId &&
      !tempValues.sessionId &&
      !tempValues.customerPhone,
    [tempValues],
  );

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
      from: toSafeISO(tempValues.from),
      to: toSafeISO(tempValues.to),
      dictBrandId: tempValues.dictBrandId,
      ironTypeId: tempValues.ironTypeId,
      operatorUserId: tempValues.operatorUserId,
      sessionId: tempValues.sessionId,
      customerPhone: tempValues.customerPhone,
    });
    onOpenChange(false);
  };

  const handleReset = () => {
    if (isFiltersEmpty) return;

    const emptyState = {
      from: null,
      to: null,
      dictBrandId: null,
      ironTypeId: null,
      operatorUserId: null,
      sessionId: null,
      customerPhone: null,
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
            <label className={styles.label}>{t("reports.filters.fromUtc")}</label>
            <DatePicker
              selected={tempValues.from}
              onChange={(date) => setTempValues((prev) => ({ ...prev, from: date }))}
              placeholderText={t("reports.filters.selectDate")}
              isClearable
            />
          </div>
          <div className={styles.fieldWrapper}>
            <label className={styles.label}>{t("reports.filters.toUtc")}</label>
            <DatePicker
              selected={tempValues.to}
              onChange={(date) => setTempValues((prev) => ({ ...prev, to: date }))}
              placeholderText={t("reports.filters.selectDate")}
              minDate={tempValues.from || undefined}
              isClearable
            />
          </div>
        </div>

        <div className={styles.fieldWrapper}>
          <TextField
            label={t("reports.ironPurchases.filters.dictBrandId")}
            type="number"
            value={tempValues.dictBrandId ?? ""}
            onKeyDown={handleIntegerOnlyKeyDown}
            onChange={(e) => {
              const value = e.target.value;
              setTempValues((prev) => ({
                ...prev,
                dictBrandId: value ? Math.floor(Number(value)) : null,
              }));
            }}
          />
        </div>

        <div className={styles.fieldWrapper}>
          <TextField
            label={t("reports.ironPurchases.filters.ironTypeId")}
            type="number"
            value={tempValues.ironTypeId ?? ""}
            onKeyDown={handleIntegerOnlyKeyDown}
            onChange={(e) => {
              const value = e.target.value;
              setTempValues((prev) => ({
                ...prev,
                ironTypeId: value ? Math.floor(Number(value)) : null,
              }));
            }}
          />
        </div>

        <div className={styles.fieldWrapper}>
          <TextField
            label={t("reports.ironPurchases.filters.operatorUserId")}
            type="number"
            value={tempValues.operatorUserId ?? ""}
            onKeyDown={handleIntegerOnlyKeyDown}
            onChange={(e) => {
              const value = e.target.value;
              setTempValues((prev) => ({
                ...prev,
                operatorUserId: value ? Math.floor(Number(value)) : null,
              }));
            }}
          />
        </div>

        <div className={styles.fieldWrapper}>
          <TextField
            label={t("reports.ironPurchases.filters.sessionId")}
            type="number"
            value={tempValues.sessionId ?? ""}
            onKeyDown={handleIntegerOnlyKeyDown}
            onChange={(e) => {
              const value = e.target.value;
              setTempValues((prev) => ({
                ...prev,
                sessionId: value ? Math.floor(Number(value)) : null,
              }));
            }}
          />
        </div>

        <div className={styles.fieldWrapper}>
          <TextField
            label={t("reports.ironPurchases.filters.customerPhone")}
            type="text"
            value={tempValues.customerPhone ?? ""}
            onChange={(e) =>
              setTempValues((prev) => ({
                ...prev,
                customerPhone: e.target.value || null,
              }))
            }
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
