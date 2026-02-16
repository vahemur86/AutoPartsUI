import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { DataTable, Select, TextField, ConfirmationModal } from "@/ui-kit";

// components
import { getSalesLotColumns } from "./columns";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchSalesLots,
  processLotSale,
} from "@/store/slices/warehouses/salesLotsSlice";
import { fetchWarehouses } from "@/store/slices/warehousesSlice";

// utils
import { checkIsToday } from "@/utils/checkIsToday.utils";
import { getApiErrorMessage, getCashRegisterId } from "@/utils";

// types
import type { BaseLot } from "@/types/warehouses/salesLots";

// styles
import styles from "./BatchesToSale.module.css";

const PAGE_SIZE = 10;

export const BatchesToSale = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { lots, isLoading, error, totalItems } = useAppSelector(
    (state) => state.salesLots,
  );
  const { warehouses } = useAppSelector((state) => state.warehouses);

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(
    null,
  );
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [lotToSell, setLotToSell] = useState<BaseLot | null>(null);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [sellForm, setSellForm] = useState({
    currencyCode: "USD",
  });

  const cashRegisterId = useMemo(() => getCashRegisterId(), []);

  useEffect(() => {
    dispatch(fetchWarehouses());
  }, [dispatch]);

  useEffect(() => {
    if (warehouses.length > 0 && selectedWarehouseId === null) {
      setSelectedWarehouseId(warehouses[0].id);
    }
  }, [warehouses, selectedWarehouseId]);

  useEffect(() => {
    if (selectedWarehouseId) {
      dispatch(
        fetchSalesLots({
          warehouseId: selectedWarehouseId,
          // status: 1, // Status 1 typically means "available for sale"
          // page: currentPageIndex + 1,
          // pageSize: PAGE_SIZE,
          cashRegisterId,
        }),
      );
    }
  }, [selectedWarehouseId, cashRegisterId, currentPageIndex, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleOpenSellModal = (lot: BaseLot) => {
    setLotToSell(lot);
    setIsSellModalOpen(true);
  };

  const handleCloseSellModal = () => {
    if (isProcessingSale) return;
    setIsSellModalOpen(false);
    setLotToSell(null);
  };

  const handleSellFieldChange = (field: "currencyCode", value: string) => {
    setSellForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleConfirmSale = async () => {
    if (!lotToSell) return;

    const { currencyCode } = sellForm;

    if (!currencyCode) {
      toast.error(t("warehouses.batchesToSale.error.currencyRequired"));
      return;
    }

    try {
      setIsProcessingSale(true);

      await dispatch(
        processLotSale({
          id: lotToSell.id,
          cashRegisterId,
          body: {
            currencyCode,
          },
        }),
      ).unwrap();

      toast.success(t("warehouses.batchesToSale.success.saleCompleted"));
      setIsSellModalOpen(false);
      setLotToSell(null);

      if (selectedWarehouseId) {
        dispatch(
          fetchSalesLots({
            warehouseId: selectedWarehouseId,
            cashRegisterId,
          }),
        );
      }
    } catch (error) {
      const errorMessage = getApiErrorMessage(
        error,
        t("warehouses.batchesToSale.error.failedToSell"),
      );
      toast.error(errorMessage);
    } finally {
      setIsProcessingSale(false);
    }
  };

  const columns = useMemo(
    () =>
      getSalesLotColumns({
        onSell: handleOpenSellModal,
      }),
    [],
  );

  const handleWarehouseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const warehouseId = Number(e.target.value);
    setSelectedWarehouseId(warehouseId || null);
    setCurrentPageIndex(0);
  };

  const handlePaginationChange = (pageIndex: number) => {
    setCurrentPageIndex(pageIndex);
  };

  const pageCount = Math.ceil(totalItems / PAGE_SIZE);

  return (
    <div className={styles.batchesToSaleWrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {t("warehouses.navigation.batchesToSale")}
        </h2>
        <div className={styles.warehouseSelector}>
          <Select
            label={t("warehouses.form.warehouse")}
            placeholder={t("warehouses.form.selectWarehouse")}
            value={selectedWarehouseId ? selectedWarehouseId.toString() : ""}
            onChange={handleWarehouseChange}
            disabled={isLoading}
          >
            <option value="">{t("warehouses.form.selectWarehouse")}</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.code}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className={styles.tableSection}>
        {!selectedWarehouseId ? (
          <div className={styles.emptyState}>
            {t("warehouses.form.selectWarehouse")}
          </div>
        ) : isLoading ? (
          <div className={styles.loading}>
            {t("warehouses.batchesToSale.loading")}
          </div>
        ) : lots.length === 0 ? (
          <div className={styles.emptyState}>
            {t("warehouses.batchesToSale.emptyState")}
          </div>
        ) : (
          <DataTable
            data={lots}
            columns={columns}
            pageSize={PAGE_SIZE}
            manualPagination={true}
            pageCount={pageCount}
            pageIndex={currentPageIndex}
            frozenConfig={{
              right: ["actions"],
            }}
            getRowClassName={(row) =>
              checkIsToday(row.createdAt) ? styles.todayRow : ""
            }
            onPaginationChange={handlePaginationChange}
          />
        )}
      </div>

      {isSellModalOpen && (
        <ConfirmationModal
          open={isSellModalOpen}
          onOpenChange={(open) => {
            if (!open) handleCloseSellModal();
          }}
          title={t("warehouses.batchesToSale.saleModal.title")}
          description={t("warehouses.batchesToSale.saleModal.description", {
            id: lotToSell?.id,
          })}
          confirmText={t("warehouses.batchesToSale.saleModal.confirm")}
          cancelText={t("common.cancel")}
          onConfirm={handleConfirmSale}
          onCancel={handleCloseSellModal}
          confirmDisabled={isProcessingSale}
          confirmLoading={isProcessingSale}
        >
          <div className={styles.saleForm}>
            <TextField
              label={t("warehouses.batchesToSale.saleForm.currencyCode")}
              value={sellForm.currencyCode}
              onChange={(e) =>
                handleSellFieldChange("currencyCode", e.target.value)
              }
            />
          </div>
        </ConfirmationModal>
      )}
    </div>
  );
};
