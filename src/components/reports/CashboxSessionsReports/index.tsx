import { type FC, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { DataTable, Select, Button } from "@/ui-kit";

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
  };

  const handleRegisterChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value ? Number(event.target.value) : "";
    setSelectedRegisterId(value);
  };

  const handleResetFilters = () => {
    setSelectedShopId("");
    setSelectedRegisterId("");
    dispatch(clearSelection());
  };

  const handleLoadReport = () => {
    if (selectedRegisterId === "") return;

    dispatch(
      fetchCashboxReport({
        cashRegisterId: selectedRegisterId as number,
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
          <Button variant="secondary" size="small" onClick={handleResetFilters}>
            {t("common.reset")}
          </Button>
          <Button variant="primary" onClick={handleLoadReport}>
            {t("cashbox.cashboxReport.load", {
              defaultValue: "Load report",
            })}
          </Button>
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
