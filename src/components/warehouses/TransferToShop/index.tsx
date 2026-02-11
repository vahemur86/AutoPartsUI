import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { DataTable, Select, Button } from "@/ui-kit";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchWarehouses } from "@/store/slices/warehousesSlice";
import { transferProduct } from "@/store/slices/warehousesSlice";
import { fetchShops } from "@/store/slices/shopsSlice";
import { fetchWarehouseProducts } from "@/store/slices/warehouses/productsSlice";

// utils
import { getCashRegisterId, getApiErrorMessage } from "@/utils";

// columns
import { getTransferToShopColumns } from "./columns";

// styles
import styles from "./TransferToShop.module.css";

export const TransferToShop = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { warehouses, isLoading: isLoadingWarehouses } = useAppSelector(
    (state) => state.warehouses,
  );
  const { shops, isLoading: isLoadingShops } = useAppSelector(
    (state) => state.shops,
  );
  const { items: warehouseProducts, isLoading: isLoadingProducts } =
    useAppSelector((state) => state.warehouseProducts);

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(
    null,
  );
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(
    new Set(),
  );
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [isTransferring, setIsTransferring] = useState(false);

  const focusedInputRef = useRef<{
    productId: number;
  } | null>(null);

  const cashRegisterId = useMemo(() => getCashRegisterId(), []);

  useEffect(() => {
    dispatch(fetchWarehouses());
    dispatch(fetchShops());
  }, [dispatch]);

  useEffect(() => {
    if (warehouses.length > 0 && selectedWarehouseId === null) {
      setSelectedWarehouseId(warehouses[0].id);
    }
  }, [warehouses, selectedWarehouseId]);

  useEffect(() => {
    if (selectedWarehouseId) {
      dispatch(
        fetchWarehouseProducts({
          warehouseId: selectedWarehouseId,
          cashRegisterId,
        }),
      );
      // Reset selections when warehouse changes
      setSelectedProducts(new Set());
      setQuantities({});
    }
  }, [dispatch, selectedWarehouseId, cashRegisterId]);

  const handleWarehouseChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const warehouseId = Number(e.target.value);
      setSelectedWarehouseId(warehouseId || null);
      setSelectedProducts(new Set());
      setQuantities({});
    },
    [],
  );

  const handleShopChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const shopId = Number(e.target.value);
      setSelectedShopId(shopId || null);
    },
    [],
  );

  const handleToggleSelect = useCallback(
    (productId: number) => {
      setSelectedProducts((prev) => {
        const newSet = new Set(prev);

        if (newSet.has(productId)) {
          newSet.delete(productId);
        } else {
          newSet.add(productId);
          // Set default quantity to 1 if not already set, but allow user to edit it
          if (!quantities[productId]) {
            setQuantities((prevQuantities) => ({
              ...prevQuantities,
              [productId]: "1",
            }));
          }
        }
        return newSet;
      });
    },
    [quantities],
  );

  const handleQuantityChange = useCallback(
    (productId: number, quantity: string) => {
      setQuantities((prev) => ({
        ...prev,
        [productId]: quantity,
      }));
    },
    [],
  );

  const handleTransfer = useCallback(async () => {
    if (
      !selectedWarehouseId ||
      !selectedShopId ||
      selectedProducts.size === 0
    ) {
      toast.error(t("warehouses.transfer.validationError"));
      return;
    }

    const productsToTransfer: Array<{
      productId: number;
      transferQuantity: number;
    }> = [];

    for (const productId of selectedProducts) {
      const product = warehouseProducts.find((p) => p.id === productId);
      if (!product) {
        continue;
      }

      const quantityStr = quantities[productId] || "1";
      const numQuantity = Number(quantityStr);

      if (!quantityStr || numQuantity <= 0 || numQuantity > product.quantity) {
        toast.error(
          t("warehouses.transfer.invalidQuantity", {
            defaultValue: `Invalid quantity for product #${product.productId}. Maximum available: ${product.quantity}`,
            productId: product.productId,
            max: product.quantity,
          }),
        );
        return;
      }

      productsToTransfer.push({
        productId,
        transferQuantity: numQuantity,
      });
    }

    if (productsToTransfer.length === 0) {
      toast.error(t("warehouses.transfer.noValidProducts"));
      return;
    }

    setIsTransferring(true);

    try {
      const transferPromises = productsToTransfer.map(
        ({ productId, transferQuantity }) => {
          const product = warehouseProducts.find((p) => p.id === productId);

          if (!product) {
            return Promise.reject(new Error("Product not found"));
          }

          return dispatch(
            transferProduct({
              warehouseId: selectedWarehouseId,
              shopId: selectedShopId,
              productId: product.productId,
              quantity: transferQuantity,
              cashRegisterId,
            }),
          ).unwrap();
        },
      );

      await Promise.all(transferPromises);

      toast.success(t("warehouses.transfer.success"));

      setSelectedProducts(new Set());
      setQuantities({});

      if (selectedWarehouseId) {
        dispatch(
          fetchWarehouseProducts({
            warehouseId: selectedWarehouseId,
            cashRegisterId,
          }),
        );
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("warehouses.transfer.error")));
    } finally {
      setIsTransferring(false);
    }
  }, [
    selectedWarehouseId,
    selectedShopId,
    selectedProducts,
    quantities,
    warehouseProducts,
    cashRegisterId,
    dispatch,
    t,
  ]);

  const columns = useMemo(
    () =>
      getTransferToShopColumns({
        selectedProducts,
        quantities,
        onToggleSelect: handleToggleSelect,
        onQuantityChange: handleQuantityChange,
        maxQuantity: (productId: number) => {
          const product = warehouseProducts.find((p) => p.id === productId);
          return product?.quantity || 0;
        },
        focusedInputRef,
      }),
    [
      selectedProducts,
      quantities,
      handleToggleSelect,
      handleQuantityChange,
      warehouseProducts,
    ],
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
        <div className={styles.loading}>{t("warehouses.products.loading")}</div>
      );
    }

    if (warehouseProducts.length === 0) {
      return (
        <div className={styles.emptyState}>
          {t("warehouses.products.emptyState")}
        </div>
      );
    }

    return (
      <DataTable
        data={warehouseProducts}
        columns={columns}
        pageSize={10}
        freezeHeader
      />
    );
  };

  const canTransfer =
    selectedWarehouseId &&
    selectedShopId &&
    selectedProducts.size > 0 &&
    !isTransferring;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {t("warehouses.navigation.transferToShop")}
        </h2>
        <div className={styles.selectors}>
          <div className={styles.selector}>
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
          <div className={styles.selector}>
            <Select
              label={t("warehouses.transfer.shop")}
              placeholder={t("warehouses.transfer.selectShop")}
              value={selectedShopId?.toString() || ""}
              onChange={handleShopChange}
              disabled={isLoadingShops}
            >
              <option value="">{t("warehouses.transfer.selectShop")}</option>
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.code}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <div className={styles.tableSection}>{renderContent()}</div>

      <div className={styles.transferSection}>
        <Button
          variant="primary"
          size="medium"
          onClick={handleTransfer}
          disabled={!canTransfer}
        >
          {isTransferring
            ? t("warehouses.transfer.transferring")
            : t("warehouses.transfer.transfer")}
        </Button>
      </div>
    </div>
  );
};
