import { useState, useEffect, type FC, type RefObject } from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Button, Dropdown, DatePicker, TextField, Select } from "@/ui-kit";

// types
import type { CustomerType } from "@/types/settings";

// styles
import styles from "./FilterBatchesDropdown.module.css";

export interface BatchReportFilters {
  fromDate: string | null;
  toDate: string | null;
  superClientId: number | null;
  clientPhone: string | null;
  clientTypeId: number | null;
}

interface FilterBatchesDropdownProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  onOpenChange: (open: boolean) => void;
  onSave: (filters: BatchReportFilters) => void;
  initialFilters?: BatchReportFilters;
  customerTypes: CustomerType[];
}

const defaultFilters: BatchReportFilters = {
  fromDate: null,
  toDate: null,
  superClientId: null,
  clientPhone: null,
  clientTypeId: null,
};

const parseDate = (iso: string | null): Date | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
};

export const FilterBatchesDropdown: FC<FilterBatchesDropdownProps> = ({
  open,
  anchorRef,
  onOpenChange,
  onSave,
  initialFilters,
  customerTypes = [],
}) => {
  const { t } = useTranslation();

  const [tempValues, setTempValues] = useState<{
    fromDate: Date | null;
    toDate: Date | null;
    superClientId: string;
    clientPhone: string;
    clientTypeId: string;
  }>({
    fromDate: null,
    toDate: null,
    superClientId: "",
    clientPhone: "",
    clientTypeId: "",
  });

  useEffect(() => {
    if (open && initialFilters) {
      setTempValues({
        fromDate: parseDate(initialFilters.fromDate),
        toDate: parseDate(initialFilters.toDate),
        superClientId:
          initialFilters.superClientId != null
            ? String(initialFilters.superClientId)
            : "",
        clientPhone: initialFilters.clientPhone ?? "",
        clientTypeId:
          initialFilters.clientTypeId != null
            ? String(initialFilters.clientTypeId)
            : "",
      });
    }
  }, [open, initialFilters]);

  const toSafeISO = (date: Date | null) => {
    if (!date) return null;
    const safeDate = new Date(date);
    safeDate.setHours(12, 0, 0, 0);
    return safeDate.toISOString();
  };

  const handleApply = () => {
    const superClientIdNum =
      tempValues.superClientId.trim() === ""
        ? null
        : Number(tempValues.superClientId);

    const clientTypeIdNum =
      tempValues.clientTypeId.trim() === ""
        ? null
        : Number(tempValues.clientTypeId);

    onSave({
      fromDate: toSafeISO(tempValues.fromDate),
      toDate: toSafeISO(tempValues.toDate),
      superClientId:
        superClientIdNum != null && !Number.isNaN(superClientIdNum)
          ? superClientIdNum
          : null,
      clientPhone: tempValues.clientPhone.trim() || null,
      clientTypeId:
        clientTypeIdNum != null && !Number.isNaN(clientTypeIdNum)
          ? clientTypeIdNum
          : null,
    });

    onOpenChange(false);
  };

  const handleReset = () => {
    setTempValues({
      fromDate: null,
      toDate: null,
      superClientId: "",
      clientPhone: "",
      clientTypeId: "",
    });
    onSave(defaultFilters);
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
                {t("cashbox.batches.filters.fromDate")}
              </label>
              <DatePicker
                selected={tempValues.fromDate}
                onChange={(date: Date | null) =>
                  setTempValues((p) => ({ ...p, fromDate: date }))
                }
                dateFormat="MM/dd/yyyy"
                placeholderText={t("cashbox.batches.filters.selectFromDate")}
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
                {t("cashbox.batches.filters.toDate")}
              </label>
              <DatePicker
                selected={tempValues.toDate}
                onChange={(date: Date | null) =>
                  setTempValues((p) => ({ ...p, toDate: date }))
                }
                dateFormat="MM/dd/yyyy"
                placeholderText={t("cashbox.batches.filters.selectToDate")}
                isClearable
                showTimeSelect={false}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                minDate={tempValues.fromDate || undefined}
              />
            </div>
          </div>
        </div>

        <div className={styles.filtersRow}>
          <div className={styles.inputWrapper}>
            <TextField
              label={t("cashbox.batches.filters.superClientId")}
              value={tempValues.superClientId}
              onChange={(e) =>
                setTempValues((p) => ({ ...p, superClientId: e.target.value }))
              }
              placeholder={t(
                "cashbox.batches.filters.placeholderSuperClientId",
              )}
            />
          </div>
          <div className={styles.inputWrapper}>
            <TextField
              label={t("cashbox.batches.filters.clientPhone")}
              value={tempValues.clientPhone}
              onChange={(e) =>
                setTempValues((p) => ({ ...p, clientPhone: e.target.value }))
              }
              placeholder={t("cashbox.batches.filters.placeholderClientPhone")}
            />
          </div>
          <div className={styles.inputWrapper}>
            <Select
              label={t("cashbox.batches.filters.customerType")}
              value={tempValues.clientTypeId}
              onChange={(e) =>
                setTempValues((p) => ({
                  ...p,
                  clientTypeId: e.target.value,
                }))
              }
              placeholder={t("cashbox.batches.filters.selectCustomerType")}
            >
              <option value="">
                {t("cashbox.batches.filters.selectCustomerType")}
              </option>
              {customerTypes.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.code}
                </option>
              ))}
            </Select>
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
