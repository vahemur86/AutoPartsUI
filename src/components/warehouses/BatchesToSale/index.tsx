import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import {
  DataTable,
  Select,
  ConfirmationModal,
  TextField,
  Button,
} from "@/ui-kit";

// components
import { getSalesLotColumns } from "./columns";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchSalesLots,
  processLotSale,
  fetchSalesLotsSellForm,
  recalculateSalesLot,
} from "@/store/slices/warehouses/salesLotsSlice";
import { fetchWarehouses } from "@/store/slices/warehousesSlice";

// utils
import { getApiErrorMessage, getCashRegisterId, checkIsToday } from "@/utils";

// constants
import { CURRENCIES } from "@/constants/settings";

// types
import type { BaseLot } from "@/types/warehouses/salesLots";

// styles
import styles from "./BatchesToSale.module.css";
import { DollarSign } from "lucide-react";

const PAGE_SIZE = 10;

export const BatchesToSale = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const {
    lots,
    isLoading,
    error,
    totalItems,
    selectedFormDetails,
    lastRecalculationResult,
  } = useAppSelector((state) => state.salesLots);

  const { warehouses } = useAppSelector((state) => state.warehouses);

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(
    null,
  );
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [lotToSell, setLotToSell] = useState<BaseLot | null>(null);
  const [isProcessingSale, setIsProcessingSale] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [showRecalcResult, setShowRecalcResult] = useState(false);

  const [sellForm, setSellForm] = useState({
    currencyCode: "USD",
    oldRevenue: 0,
    ptPrice: 0,
    pdPrice: 0,
    rhPrice: 0,
    powderKg: 0,
    pt_g: 0,
    pd_g: 0,
    rh_g: 0,
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

  useEffect(() => {
    if (selectedFormDetails) {
      setSellForm((prev) => ({
        ...prev,
        ptPrice: selectedFormDetails.ptPrice,
        pdPrice: selectedFormDetails.pdPrice,
        rhPrice: selectedFormDetails.rhPrice,
        powderKg: selectedFormDetails.powderKg,
        pt_g: selectedFormDetails.pt_g,
        pd_g: selectedFormDetails.pd_g,
        rh_g: selectedFormDetails.rh_g,
        oldRevenue: selectedFormDetails.revenueAmd,
      }));
    }
  }, [selectedFormDetails]);

  const handleRecalculate = async () => {
    if (!lotToSell) return;

    try {
      setIsRecalculating(true);

      await dispatch(
        recalculateSalesLot({
          id: lotToSell.id,
          cashRegisterId,
          body: {
            ...sellForm,
          },
        }),
      ).unwrap();

      setShowRecalcResult(true);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          t("warehouses.batchesToSale.error.failedToRecalculate"),
        ),
      );
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleOpenSellModal = (lot: BaseLot) => {
    setLotToSell(lot);
    setIsSellModalOpen(true);

    setShowRecalcResult(false);

    dispatch(
      fetchSalesLotsSellForm({
        id: lot.id,
        cashRegisterId,
      }),
    );
  };

  const handleCloseSellModal = () => {
    if (isProcessingSale) return;

    setIsSellModalOpen(false);
    setLotToSell(null);

    setShowRecalcResult(false);

    setSellForm({
      currencyCode: "USD",
      oldRevenue: 0,
      ptPrice: 0,
      pdPrice: 0,
      rhPrice: 0,
      powderKg: 0,
      pt_g: 0,
      pd_g: 0,
      rh_g: 0,
    });
  };

  const handleSellFieldChange = (
    field: keyof typeof sellForm,
    value: string | number,
  ) => {
    setSellForm((prev) => ({
      ...prev,
      [field]: typeof prev[field] === "number" ? Number(value) : value,
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
            ...sellForm,
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
            <div className={styles.saleFormRow}>
              <TextField
                label={t("warehouses.batchesToSale.fields.powderKg")}
                type="number"
                value={String(sellForm.powderKg)}
                onChange={(e) =>
                  handleSellFieldChange("powderKg", e.target.value)
                }
              />
              <TextField
                label={t("warehouses.batchesToSale.fields.pt_g")}
                type="number"
                value={String(sellForm.pt_g)}
                onChange={(e) => handleSellFieldChange("pt_g", e.target.value)}
              />
              <TextField
                label={t("warehouses.batchesToSale.fields.pd_g")}
                type="number"
                value={String(sellForm.pd_g)}
                onChange={(e) => handleSellFieldChange("pd_g", e.target.value)}
              />
              <TextField
                label={t("warehouses.batchesToSale.fields.rh_g")}
                type="number"
                value={String(sellForm.rh_g)}
                onChange={(e) => handleSellFieldChange("rh_g", e.target.value)}
              />
              <TextField
                label={t("warehouses.batchesToSale.fields.ptPrice")}
                icon={<DollarSign size={16} />}
                type="number"
                value={String(sellForm.ptPrice)}
                onChange={(e) =>
                  handleSellFieldChange("ptPrice", e.target.value)
                }
              />
              <TextField
                label={t("warehouses.batchesToSale.fields.pdPrice")}
                icon={<DollarSign size={16} />}
                type="number"
                value={String(sellForm.pdPrice)}
                onChange={(e) =>
                  handleSellFieldChange("pdPrice", e.target.value)
                }
              />
              <TextField
                label={t("warehouses.batchesToSale.fields.rhPrice")}
                icon={<DollarSign size={16} />}
                type="number"
                value={String(sellForm.rhPrice)}
                onChange={(e) =>
                  handleSellFieldChange("rhPrice", e.target.value)
                }
              />
            </div>

            <div className={styles.saleFormRow}>
              <TextField
                label={t("warehouses.batchesToSale.fields.usdRate")}
                value={String(selectedFormDetails?.usdRate ?? "")}
                disabled
              />
              <TextField
                label={t("warehouses.batchesToSale.fields.revenueAmd")}
                value={String(selectedFormDetails?.revenueAmd ?? "")}
                disabled
              />
            </div>

            <div className={styles.recalculateSection}>
              <Button
                type="button"
                onClick={handleRecalculate}
                disabled={isRecalculating}
                className={styles.recalculateButton}
              >
                {isRecalculating
                  ? t("warehouses.batchesToSale.recalculate.loading")
                  : t("warehouses.batchesToSale.recalculate.button")}
              </Button>

              {showRecalcResult && lastRecalculationResult !== null && (
                <div className={styles.recalculationResult}>
                  {t("warehouses.batchesToSale.recalculate.resultLabel")}:{" "}
                  <strong>
                    {sellForm.currencyCode === "USD"
                      ? (
                          lastRecalculationResult /
                          (selectedFormDetails?.usdRate || 1)
                        ).toFixed(2)
                      : lastRecalculationResult}{" "}
                    {sellForm.currencyCode === "USD"
                      ? "$"
                      : sellForm.currencyCode === "AMD"
                        ? "֏"
                        : ""}
                  </strong>
                </div>
              )}
            </div>

            <Select
              label={t("warehouses.batchesToSale.saleForm.currencyCode")}
              value={sellForm.currencyCode}
              onChange={(e) =>
                handleSellFieldChange("currencyCode", e.target.value)
              }
            >
              {CURRENCIES.filter(
                (currency) =>
                  currency.value === "AMD" || currency.value === "USD",
              ).map((currency) => (
                <option key={currency.value} value={currency.value}>
                  {currency.label}
                </option>
              ))}
            </Select>
          </div>
        </ConfirmationModal>
      )}
    </div>
  );
};
