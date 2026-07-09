import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ColumnDef, Row } from "@tanstack/react-table";

// ui-kit
import { DataTable, Select } from "@/ui-kit";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchWarehouses } from "@/store/slices/warehousesSlice";
import { fetchWarehouseProducts } from "@/store/slices/warehouses/productsSlice";
import { fetchProducts } from "@/store/slices/productsSlice";

// types
import type { Product } from "@/types/products";
import type { WarehouseProductItem } from "@/types/warehouses/warehouseProduct";

// utils
import { getCashRegisterId } from "@/utils";

// columns
import { getWarehouseProductColumns } from "./columns";

// styles
import styles from "./WarehouseProducts.module.css";

export const WarehouseProducts = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { warehouses, isLoading: isLoadingWarehouses } = useAppSelector(
    (state) => state.warehouses,
  );
  const {
    items: warehouseProducts,
    isLoading: isLoadingProducts,
  } = useAppSelector((state) => state.warehouseProducts);
  const { products } = useAppSelector((state) => state.products);

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(
    null,
  );

  const cashRegisterId = useMemo(() => getCashRegisterId(), []);

  useEffect(() => {
    dispatch(fetchWarehouses());
    dispatch(fetchProducts());
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
    }
  }, [dispatch, selectedWarehouseId, cashRegisterId]);

  const handleWarehouseChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const warehouseId = Number(e.target.value);
      setSelectedWarehouseId(warehouseId || null);
    },
    [],
  );

  const handleProductClick = useCallback(
    (row: Row<WarehouseProductItem>) => {
      row.toggleExpanded(!row.getIsExpanded());
    },
    [],
  );

  const getProductCodeById = useCallback(
    (productId: number): string => {
      const product = products.find((item) => item.id === productId);
      return product?.code || "-";
    },
    [products],
  );

  const columns = useMemo<ColumnDef<WarehouseProductItem, any>[]>(
    () =>
      getWarehouseProductColumns({
        onProductClick: handleProductClick,
        getProductCode: getProductCodeById,
      }),
    [handleProductClick, getProductCodeById],
  );

  const getSkuValue = (product: Product | undefined): string => {
    if (!product) return "-";
    return product.sku || "-";
  };

  const getBrandValue = (product: Product | undefined): string => {
    if (!product) return "-";
    return product.brandName || product.brand?.code || "-";
  };

  const getCategoryValue = (product: Product | undefined): string => {
    if (!product) return "-";
    return product.categoryName || product.category?.code || "-";
  };

  const getUnitTypeValue = (product: Product | undefined): string => {
    if (!product) return "-";
    return product.unitTypeName || product.unitType?.code || "-";
  };

  const getBoxSizeValue = (product: Product | undefined): string => {
    if (!product) return "-";
    return product.boxSizeName || product.boxSize?.code || "-";
  };

  const renderProductDetails = useCallback(
    ({ row }: { row: Row<WarehouseProductItem> }) => {
      const product = products.find((item) => item.id === row.original.productId);

      if (!product) {
        return <div className={styles.detailsEmpty}>{t("common.noData")}</div>;
      }

      return (
        <div className={styles.detailsGrid}>
          <div className={styles.detailsRow}>
            <span className={styles.detailsLabel}>ID</span>
            <span className={styles.detailsValue}>#{product.id}</span>
          </div>
          <div className={styles.detailsRow}>
            <span className={styles.detailsLabel}>{t("products.columns.sku")}</span>
            <span className={styles.detailsValue}>{getSkuValue(product)}</span>
          </div>
          <div className={styles.detailsRow}>
            <span className={styles.detailsLabel}>{t("products.columns.brand")}</span>
            <span className={styles.detailsValue}>{getBrandValue(product)}</span>
          </div>
          <div className={styles.detailsRow}>
            <span className={styles.detailsLabel}>
              {t("products.columns.category")}
            </span>
            <span className={styles.detailsValue}>{getCategoryValue(product)}</span>
          </div>
          <div className={styles.detailsRow}>
            <span className={styles.detailsLabel}>
              {t("products.columns.unitType")}
            </span>
            <span className={styles.detailsValue}>{getUnitTypeValue(product)}</span>
          </div>
          <div className={styles.detailsRow}>
            <span className={styles.detailsLabel}>{t("products.columns.boxSize")}</span>
            <span className={styles.detailsValue}>{getBoxSizeValue(product)}</span>
          </div>
          <div className={styles.detailsRow}>
            <span className={styles.detailsLabel}>
              {t("products.columns.vehicleDependent")}
            </span>
            <span className={styles.detailsValue}>
              {product.vehicleDependent ? t("common.yes") : t("common.no")}
            </span>
          </div>
        </div>
      );
    },
    [products, t],
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
        <div className={styles.tableSkeleton} aria-busy="true" aria-live="polite">
          <div className={styles.tableSkeletonHeader}>
            <div className={`${styles.skeletonLine} ${styles.skeletonLineWide}`} />
            <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
          </div>
          <div className={styles.tableSkeletonRows}>
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className={styles.tableSkeletonRow}>
                <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
                <div className={`${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
                <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
              </div>
            ))}
          </div>
        </div>
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
        renderSubComponent={renderProductDetails}
      />
    );
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {t("warehouses.navigation.products")}
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


