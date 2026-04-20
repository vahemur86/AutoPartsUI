import { useState, useEffect, type FC, type RefObject } from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Button, Dropdown, DatePicker, TextField, Select } from "@/ui-kit";

// types
import type { CustomerType } from "@/types/settings";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCustomerNames } from "@/store/slices/customersSlice";
import { Search } from "lucide-react";

// styles
import styles from "./FilterBatchesDropdown.module.css";

export interface BatchReportFilters {
  fromDate: string | null;
  toDate: string | null;
  superClientId: number | null;
  clientPhone: string | null;
  clientTypeId: number | null;
  supplierClientId?: number | null;
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
  supplierClientId: null,
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
  const dispatch = useAppDispatch();

  const customerNames = useAppSelector((s) => s.customers.names);

  const [showDropdown, setShowDropdown] = useState(false);

  const [selectedClient, setSelectedClient] = useState<{
    id: number | null;
    displayName: string;
  }>({
    id: null,
    displayName: "",
  });

  const [tempValues, setTempValues] = useState<{
    fromDate: Date | null;
    toDate: Date | null;
    superClientId: string;
    clientPhone: string;
    clientTypeId: string;
    supplierClientId: number | null;
  }>({
    fromDate: null,
    toDate: null,
    superClientId: "",
    clientPhone: "",
    clientTypeId: "",
    supplierClientId: null,
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
        supplierClientId: initialFilters.supplierClientId ?? null,
      });

      setSelectedClient({
        id: initialFilters.supplierClientId ?? null,
        displayName: "",
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
      supplierClientId: tempValues.supplierClientId,
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
      supplierClientId: null,
    });

    setSelectedClient({
      id: null,
      displayName: "",
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
                isClearable
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
                isClearable
              />
            </div>
          </div>
        </div>

        <div className={styles.inputWrapper}>
          <label className={styles.label}>
            {t("cashbox.batches.filters.clientName")}
          </label>

          <div className={styles.searchInputWrapper}>
            <TextField
              value={selectedClient.displayName}
              onChange={(e) => {
                setSelectedClient({
                  id: null,
                  displayName: e.target.value,
                });

                setTempValues((p) => ({
                  ...p,
                  supplierClientId: null,
                }));
              }}
              placeholder="Search client..."
            />

            <button
              type="button"
              className={styles.searchIconBtn}
              onClick={() => {
                dispatch(
                  fetchCustomerNames({
                    search: selectedClient.displayName,
                  }),
                );
                setShowDropdown(true);
              }}
            >
              <Search size={16} />
            </button>
          </div>

          {showDropdown && customerNames.length > 0 && (
            <div className={styles.suggestions}>
              {customerNames.map((c) => (
                <div
                  key={c.id}
                  className={styles.suggestionItem}
                  onClick={() => {
                    setSelectedClient({
                      id: c.id,
                      displayName: c.displayName,
                    });

                    setTempValues((p) => ({
                      ...p,
                      supplierClientId: c.id,
                      superClientId: "",
                    }));

                    setShowDropdown(false);
                  }}
                >
                  <div>{c.displayName}</div>
                  <small>{c.phone}</small>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.filtersRow}>
          <div className={styles.inputWrapper}>
            <TextField
              label={t("cashbox.batches.filters.clientPhone")}
              value={tempValues.clientPhone}
              onChange={(e) =>
                setTempValues((p) => ({
                  ...p,
                  clientPhone: e.target.value,
                }))
              }
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
          <Button variant="secondary" onClick={handleReset}>
            {t("common.reset")}
          </Button>
          <Button variant="primary" onClick={handleApply}>
            {t("common.save")}
          </Button>
        </div>
      </div>
    </Dropdown>
  );
};
