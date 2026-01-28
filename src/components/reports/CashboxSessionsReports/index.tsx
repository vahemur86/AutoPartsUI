import { type FC, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { DataTable, Select, Button, DatePicker } from "@/ui-kit";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchCashboxReport,
  clearSelection,
} from "@/store/slices/cash/cashboxSessionsSlice";
import { fetchShops } from "@/store/slices/shopsSlice";
import { fetchCashRegisters } from "@/store/slices/cash/registersSlice";

// columns
import { getCashboxReportColumns } from "./columns";

// utils
import { getApiErrorMessage } from "@/utils";
import { checkIsToday } from "@/utils/checkIsToday.utils";

// styles
import styles from "./CashboxReport.module.css";

export const CashboxSessionsReports: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { cashboxReport } = useAppSelector((state) => state.cashboxSessions);
  const { shops } = useAppSelector((state) => state.shops);
  const { cashRegisters } = useAppSelector((state) => state.cashRegisters);

  const [selectedShopId, setSelectedShopId] = useState<number | "">("");
  const [selectedRegisterId, setSelectedRegisterId] = useState<number | "">("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [shopError, setShopError] = useState(false);
  const [registerError, setRegisterError] = useState(false);

  useEffect(() => {
    if (!shops.length) {
      dispatch(fetchShops()).catch(() => {
        toast.error(
          t("shops.error.failedToFetch", {
            defaultValue: "Failed to load shops",
          }),
        );
      });
    }

    if (!cashRegisters.length) {
      dispatch(fetchCashRegisters(undefined)).catch((error) => {
        toast.error(
          getApiErrorMessage(
            error,
            t("cashRegisters.error.failedToFetch", {
              defaultValue: "Failed to load cash registers",
            }),
          ),
        );
      });
    }

    return () => {
      dispatch(clearSelection());
    };
  }, [cashRegisters.length, dispatch, shops.length, t]);

  const handleShopChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value ? Number(event.target.value) : "";
    setSelectedShopId(value);
    setSelectedRegisterId("");
    setShopError(false);
    setRegisterError(false);
  };

  const handleRegisterChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value ? Number(event.target.value) : "";
    setSelectedRegisterId(value);
    setRegisterError(false);
  };

  const handleResetFilters = () => {
    setSelectedShopId("");
    setSelectedRegisterId("");
    setSelectedDate(null);
    setShopError(false);
    setRegisterError(false);
    dispatch(clearSelection());
  };

  const handleLoadReport = () => {
    let hasError = false;

    if (selectedShopId === "") {
      setShopError(true);
      hasError = true;
    }

    if (selectedRegisterId === "") {
      setRegisterError(true);
      hasError = true;
    }

    if (hasError) return;

    const dateParam =
      selectedDate != null
        ? new Date(
            Date.UTC(
              selectedDate.getFullYear(),
              selectedDate.getMonth(),
              selectedDate.getDate(),
            ),
          )
            .toISOString()
            .split("T")[0]
        : undefined;

    dispatch(
      fetchCashboxReport({
        cashRegisterId: selectedRegisterId as number,
        date: dateParam,
      }),
    )
      .unwrap()
      .catch((error) => {
        toast.error(
          getApiErrorMessage(
            error,
            t("cashbox.errors.failedToFetchCashboxReport"),
          ),
        );
      });
  };

  const columns = useMemo(() => getCashboxReportColumns(), []);

  const tableData = useMemo(() => {
    return cashboxReport ? [cashboxReport] : [];
  }, [cashboxReport]);

  return (
    <div className={styles.cashboxReportWrapper}>
      <header className={styles.header}>
        <h1>{t("cashbox.cashboxReport.title")}</h1>
      </header>

      <div className={styles.filters}>
        <div className={styles.filtersContent}>
          <Select
            label={t("cashbox.cashboxReport.shopLabel", {
              defaultValue: "Shop",
            })}
            value={selectedShopId === "" ? "" : String(selectedShopId)}
            onChange={handleShopChange}
            placeholder={t("cashbox.cashboxReport.selectShop", {
              defaultValue: "Select shop",
            })}
            error={shopError}
            helperText={
              shopError
                ? t("cashbox.cashboxReport.validation.shopRequired", {
                    defaultValue: "Please select a shop",
                  })
                : ""
            }
          >
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.code}
              </option>
            ))}
          </Select>

          <Select
            label={t("cashbox.cashboxReport.registerLabel", {
              defaultValue: "Cash register",
            })}
            value={selectedRegisterId === "" ? "" : String(selectedRegisterId)}
            onChange={handleRegisterChange}
            placeholder={t("cashbox.cashboxReport.selectRegister", {
              defaultValue: "Select cash register",
            })}
            disabled={selectedShopId === ""}
            error={registerError}
            helperText={
              registerError
                ? t("cashbox.cashboxReport.validation.registerRequired", {
                    defaultValue: "Please select a cash register",
                  })
                : ""
            }
          >
            {cashRegisters
              .filter(
                (register) =>
                  selectedShopId !== "" && register.shopId === selectedShopId,
              )
              .map((register) => (
                <option key={register.id} value={register.id}>
                  {register.code}
                </option>
              ))}
          </Select>
        </div>

        <div className={styles.actionsRow}>
          <div className={styles.dateFilter}>
            <label className={styles.dateLabel}>
              {t("cashbox.cashboxReport.dateLabel", { defaultValue: "Date" })}
            </label>
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date | null) => setSelectedDate(date)}
              dateFormat="MM/dd/yyyy"
              placeholderText={t(
                "cashbox.cashboxReport.selectDatePlaceholder",
                { defaultValue: "Select date (optional)" },
              )}
              isClearable
              showTimeSelect={false}
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
            />
          </div>

          <div className={styles.actionsButtons}>
            <Button variant="secondary" onClick={handleResetFilters}>
              {t("common.reset")}
            </Button>
            <Button variant="primary" onClick={handleLoadReport}>
              {t("cashbox.cashboxReport.load", {
                defaultValue: "Load report",
              })}
            </Button>
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <DataTable
          columns={columns}
          data={tableData}
          pageSize={1}
          manualPagination={false}
          getRowClassName={(row) =>
            checkIsToday(row.date) ? styles.todayRow : ""
          }
        />
      </div>
    </div>
  );
};
