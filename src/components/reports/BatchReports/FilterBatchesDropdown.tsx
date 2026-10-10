import { useState, useEffect, type FC, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import {
  CalendarDays,
  Check,
  Info,
  Phone,
  RotateCcw,
  Search,
  SlidersHorizontal,
  UserRound,
  UsersRound,
} from "lucide-react";

// ui-kit
import { Button, Dropdown, DatePicker, TextField, Select } from "@/ui-kit";

// types
import type { CustomerType } from "@/types/settings";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCustomerNames } from "@/store/slices/customersSlice";

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
        <span className={styles.headerIcon} aria-hidden="true">
          <SlidersHorizontal size={17} />
        </span>
        <div className={styles.headerCopy}>
          <span className={styles.title}>{t("common.filters")}</span>
          <span className={styles.headerHint}>{t("cashbox.batches.filters.filterHint")}</span>
        </div>
      </div>

      <div className={styles.content}>
        <section className={styles.filterSection}>
          <div className={styles.sectionHeading}>
            <CalendarDays size={15} aria-hidden="true" />
            <span>{t("cashbox.batches.filters.dateRange")}</span>
          </div>
          <div className={styles.grid}>
            <div className={styles.datePickerWrapper}>
              <label className={styles.label}>{t("cashbox.batches.filters.fromDate")}</label>
              <DatePicker
                selected={tempValues.fromDate}
                onChange={(date: Date | null) =>
                  setTempValues((previous) => ({ ...previous, fromDate: date }))
                }
                dateFormat="MM/dd/yyyy"
                placeholder={t("cashbox.batches.filters.selectFromDate")}
                isClearable
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
              />
            </div>

            <div className={styles.datePickerWrapper}>
              <label className={styles.label}>{t("cashbox.batches.filters.toDate")}</label>
              <DatePicker
                selected={tempValues.toDate}
                onChange={(date: Date | null) =>
                  setTempValues((previous) => ({ ...previous, toDate: date }))
                }
                dateFormat="MM/dd/yyyy"
                placeholder={t("cashbox.batches.filters.selectToDate")}
                isClearable
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                minDate={tempValues.fromDate || undefined}
              />
            </div>
          </div>
        </section>

        <section className={styles.filterSection}>
          <div className={styles.sectionHeading}>
            <UsersRound size={15} aria-hidden="true" />
            <span>{t("cashbox.batches.filters.customerCriteria")}</span>
          </div>

          <div className={styles.inputWrapper}>
            <label className={styles.labelWithIcon}>
              <UserRound size={14} aria-hidden="true" />
              <span>{t("cashbox.batches.filters.specialCustomer")}</span>
              <span
                className={styles.tooltipIcon}
                title={t("cashbox.batches.filters.specialCustomerTooltip")}
              >
                <Info size={13} />
              </span>
            </label>

            <div className={styles.searchInputWrapper}>
              <TextField
                value={selectedClient.displayName}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    dispatch(
                      fetchCustomerNames({
                        search: selectedClient.displayName,
                      }),
                    );
                    setShowDropdown(true);
                  }
                }}
                onChange={(e) => {
                  setSelectedClient({
                    id: null,
                    displayName: e.target.value,
                  });

                  setTempValues((previous) => ({
                    ...previous,
                    supplierClientId: null,
                  }));
                }}
                placeholder={t("cashbox.batches.filters.searchClient")}
              />

              <button
                type="button"
                className={styles.searchIconBtn}
                aria-label={t("common.search")}
                title={t("common.search")}
                onClick={() => {
                  dispatch(
                    fetchCustomerNames({
                      search: selectedClient.displayName,
                    }),
                  );
                  setShowDropdown(true);
                }}
              >
                <Search size={15} />
              </button>
            </div>

            {showDropdown && customerNames.length > 0 && (
              <div className={styles.suggestions}>
                {customerNames.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    className={styles.suggestionItem}
                    onClick={() => {
                      setSelectedClient({
                        id: client.id,
                        displayName: client.displayName,
                      });

                      setTempValues((previous) => ({
                        ...previous,
                        supplierClientId: client.id,
                        superClientId: "",
                      }));

                      setShowDropdown(false);
                    }}
                  >
                    <span className={styles.suggestionName}>
                      {client.displayName}
                      {tempValues.supplierClientId === client.id && (
                        <Check size={14} aria-hidden="true" />
                      )}
                    </span>
                    <small>{client.phone}</small>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.filtersRow}>
            <div className={styles.inputWrapper}>
              <label className={styles.labelWithIcon}>
                <Phone size={14} aria-hidden="true" />
                <span>{t("cashbox.batches.filters.clientPhone")}</span>
              </label>
              <TextField
                value={tempValues.clientPhone}
                onChange={(e) =>
                  setTempValues((previous) => ({
                    ...previous,
                    clientPhone: e.target.value,
                  }))
                }
                placeholder={t("cashbox.batches.filters.placeholderClientPhone")}
              />
            </div>

            <div className={styles.inputWrapper}>
              <label className={styles.labelWithIcon}>
                <UsersRound size={14} aria-hidden="true" />
                <span>{t("cashbox.batches.filters.customerType")}</span>
              </label>
              <Select
                value={tempValues.clientTypeId}
                onChange={(e) =>
                  setTempValues((previous) => ({
                    ...previous,
                    clientTypeId: e.target.value,
                  }))
                }
                placeholder={t("cashbox.batches.filters.selectCustomerType")}
              >
                {customerTypes.map((customerType) => (
                  <option key={customerType.id} value={customerType.id}>
                    {customerType.code}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </section>

        <div className={styles.primaryActions}>
          <Button
            variant="secondary"
            className={styles.neutralButton}
            onClick={handleReset}
          >
            <RotateCcw size={15} aria-hidden="true" />
            {t("common.reset")}
          </Button>
          <Button
            variant="primary"
            className={styles.primaryButton}
            onClick={handleApply}
          >
            <Check size={15} aria-hidden="true" />
            {t("common.save")}
          </Button>
        </div>
      </div>
    </Dropdown>
  );
};
