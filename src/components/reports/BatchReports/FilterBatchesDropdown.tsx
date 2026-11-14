import { useState, useEffect, type FC } from "react";
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
  X,
} from "lucide-react";
import {
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

// ui-kit
import { Button, DatePicker, TextField, Select } from "@/ui-kit";
import { FormDrawer } from "@/components/common/FormDrawer";
import { CountryPhoneInput } from "@/components/common";

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
  clientName: string | null;
  superClientId: number | null;
  clientPhone: string | null;
  clientTypeId: number | null;
  supplierClientId?: number | null;
}

interface FilterBatchesDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (filters: BatchReportFilters) => void;
  initialFilters?: BatchReportFilters;
  customerTypes: CustomerType[];
}

const defaultFilters: BatchReportFilters = {
  fromDate: null,
  toDate: null,
  clientName: null,
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

const getPhoneCountry = (phone: string | null): CountryCode => {
  const trimmedPhone = phone?.trim();
  return trimmedPhone
    ? parsePhoneNumberFromString(trimmedPhone, "AM")?.country ?? "AM"
    : "AM";
};

export const FilterBatchesDropdown: FC<FilterBatchesDropdownProps> = ({
  open,
  onOpenChange,
  onSave,
  initialFilters,
  customerTypes = [],
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const customerNames = useAppSelector((s) => s.customers.names);

  const [showDropdown, setShowDropdown] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>("AM");

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
      setPhoneCountry(getPhoneCountry(initialFilters.clientPhone));

      setSelectedClient({
        id: initialFilters.supplierClientId ?? null,
        displayName: initialFilters.clientName ?? "",
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
      clientName: selectedClient.displayName.trim() || null,
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
    setPhoneCountry("AM");
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
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      eyebrow={t("cashbox.batches.filters.filterHint")}
      title={t("common.filters")}
      titleId="batch-reports-filters-title"
      closeLabel={t("common.close")}
      icon={<SlidersHorizontal size={18} />}
      footer={(
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
      )}
    >
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
              <CountryPhoneInput
                phone={tempValues.clientPhone}
                selectedCountry={phoneCountry}
                onCountryChange={(country) => {
                  const oldDialCode = `+${getCountryCallingCode(phoneCountry)}`;
                  const newDialCode = `+${getCountryCallingCode(country)}`;
                  const localPhone = tempValues.clientPhone.startsWith(oldDialCode)
                    ? tempValues.clientPhone.slice(oldDialCode.length)
                    : tempValues.clientPhone;
                  setPhoneCountry(country);
                  setTempValues((previous) => ({
                    ...previous,
                    clientPhone: localPhone.trim()
                      ? `${newDialCode}${localPhone}`.trim()
                      : "",
                  }));
                }}
                onPhoneChange={(clientPhone) =>
                  setTempValues((previous) => ({ ...previous, clientPhone }))
                }
                containerClassName={styles.phoneNumberField}
                preservePhoneFormat
              />
            </div>

            <div className={styles.inputWrapper}>
              <div className={styles.typeLabelRow}>
                <label className={styles.labelWithIcon}>
                  <UsersRound size={14} aria-hidden="true" />
                  <span>{t("cashbox.batches.filters.customerType")}</span>
                </label>
                {tempValues.clientTypeId && (
                  <button
                    type="button"
                    className={styles.clearTypeButton}
                    onClick={() =>
                      setTempValues((previous) => ({
                        ...previous,
                        clientTypeId: "",
                      }))
                    }
                    aria-label={t("common.reset")}
                    title={t("common.reset")}
                  >
                    <X size={13} aria-hidden="true" />
                  </button>
                )}
              </div>
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

      </div>
    </FormDrawer>
  );
};
