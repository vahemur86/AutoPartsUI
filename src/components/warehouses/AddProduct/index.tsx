import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { DataTable, Select } from "@/ui-kit";

// components
import { getProductColumns } from "./columns";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchWarehouses,
  addProductToWarehouse,
} from "@/store/slices/warehousesSlice";
import { fetchProducts } from "@/store/slices/productsSlice";

// utils
import { getCashRegisterId, getApiErrorMessage } from "@/utils";

// styles
import styles from "./AddProduct.module.css";

interface ProductInputs {
  originalPrice: string;
  salePrice: string;
  quantity: string;
}

export const AddProduct = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { products, isLoading: isLoadingProducts } = useAppSelector(
    (state) => state.products,
  );
  const { warehouses, isLoading: isLoadingWarehouses } = useAppSelector(
    (state) => state.warehouses,
  );

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(
    null,
  );
  const [productInputs, setProductInputs] = useState<
    Record<number, ProductInputs>
  >({});

  const cashRegisterId = useMemo(() => getCashRegisterId(), []);

  const productInputsRef = useRef(productInputs);
  const focusedInputRef = useRef<{
    productId: number;
    field: keyof ProductInputs;
  } | null>(null);

  useEffect(() => {
    productInputsRef.current = productInputs;
  }, [productInputs]);

  useEffect(() => {
    dispatch(fetchWarehouses());
    dispatch(fetchProducts());
  }, [dispatch]);

  useEffect(() => {
    if (warehouses.length > 0 && selectedWarehouseId === null) {
      setSelectedWarehouseId(warehouses[0].id);
    }
  }, [warehouses, selectedWarehouseId]);

  const handleInputChange = useCallback(
    (productId: number, field: keyof ProductInputs, value: string) => {
      setProductInputs((prev) => ({
        ...prev,
        [productId]: {
          originalPrice: prev[productId]?.originalPrice || "",
          salePrice: prev[productId]?.salePrice || "",
          quantity: prev[productId]?.quantity || "",
          [field]: value,
        },
      }));
    },
    [],
  );

  const validateInputs = (inputs: ProductInputs | undefined): boolean => {
    if (!inputs) return false;

    const originalPrice = parseFloat(inputs.originalPrice);
    const salePrice = parseFloat(inputs.salePrice);
    const quantity = parseFloat(inputs.quantity);

    return !!(
      originalPrice &&
      salePrice &&
      quantity &&
      quantity > 0 &&
      !isNaN(originalPrice) &&
      !isNaN(salePrice) &&
      !isNaN(quantity)
    );
  };

  const handleAdd = useCallback(
    async (productId: number) => {
      if (!selectedWarehouseId) {
        toast.error(t("warehouses.form.selectWarehouse"));
        return;
      }

      const inputs = productInputsRef.current[productId];
      if (!validateInputs(inputs)) {
        toast.error(t("warehouses.addProduct.error.invalidInputs"));
        return;
      }

      try {
        const originalPrice = parseFloat(inputs.originalPrice);
        const salePrice = parseFloat(inputs.salePrice);
        const quantity = parseFloat(inputs.quantity);

        await dispatch(
          addProductToWarehouse({
            warehouseId: selectedWarehouseId,
            productId,
            originalPrice,
            salePrice,
            quantity,
            cashRegisterId,
          }),
        ).unwrap();

        const productCode =
          products.find((p) => p.id === productId)?.code || productId;

        toast.success(
          t("warehouses.addProduct.success.productAdded", {
            code: productCode,
          }),
        );

        setProductInputs((prev) => {
          const { [productId]: _, ...rest } = prev;
          return rest;
        });
      } catch (error) {
        toast.error(
          getApiErrorMessage(
            error,
            t("warehouses.addProduct.error.failedToAdd"),
          ),
        );
      }
    },
    [selectedWarehouseId, cashRegisterId, dispatch, t, products],
  );

  const columns = useMemo(
    () =>
      getProductColumns({
        onInputChange: handleInputChange,
        onAdd: handleAdd,
        productInputs,
        focusedInputRef,
        isLoading: isLoadingWarehouses,
      }),
    [handleInputChange, handleAdd, productInputs, isLoadingWarehouses],
  );

  const handleWarehouseChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const warehouseId = Number(e.target.value);
      setSelectedWarehouseId(warehouseId || null);
      setProductInputs({});
    },
    [],
  );

  const renderContent = () => {
    if (!selectedWarehouseId) {
      return (
        <div className={styles.emptyState}>
          {t("warehouses.form.selectWarehouse")}
        </div>
      );
    }

    if (isLoadingProducts) {
      return (
        <div className={styles.loading}>
          {t("warehouses.addProduct.loading")}
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <div className={styles.emptyState}>
          {t("warehouses.addProduct.emptyState")}
        </div>
      );
    }

    return (
      <DataTable
        data={products}
        columns={columns}
        pageSize={10}
        frozenConfig={{
          right: ["actions"],
        }}
      />
    );
  };

  return (
    <div className={styles.addProductWrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {t("warehouses.navigation.addProduct")}
        </h2>
        <div className={styles.warehouseSelector}>
          <Select
            label={t("warehouses.form.warehouse")}
            placeholder={t("warehouses.form.selectWarehouse")}
            value={selectedWarehouseId?.toString() || ""}
            onChange={handleWarehouseChange}
            disabled={isLoadingWarehouses}
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

      <div className={styles.tableSection}>{renderContent()}</div>
    </div>
  );
};
