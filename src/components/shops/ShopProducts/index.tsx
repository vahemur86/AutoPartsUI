import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Row } from "@tanstack/react-table";

// ui-kit
import { DataTable, Select } from "@/ui-kit";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchShops } from "@/store/slices/shopsSlice";
import { fetchShopProducts } from "@/store/slices/shops/productsSlice";

// utils
import { getCashRegisterId } from "@/utils";

// columns
import { getShopProductColumns } from "./columns";

// styles
import styles from "./ShopProducts.module.css";

export const ShopProducts = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { shops, isLoading: isLoadingShops } = useAppSelector(
    (state) => state.shops,
  );
  const { items: shopProducts, isLoading: isLoadingProducts } = useAppSelector(
    (state) => state.shopProducts,
  );

  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);

  const cashRegisterId = useMemo(() => getCashRegisterId(), []);

  useEffect(() => {
    dispatch(fetchShops());
  }, [dispatch]);

  useEffect(() => {
    if (shops.length > 0 && selectedShopId === null) {
      setSelectedShopId(shops[0].id);
    }
  }, [shops, selectedShopId]);

  useEffect(() => {
    if (selectedShopId) {
      dispatch(
        fetchShopProducts({
          shopId: selectedShopId,
          cashRegisterId,
        }),
      );
    }
  }, [dispatch, selectedShopId, cashRegisterId]);

  const handleShopChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const shopId = Number(e.target.value);
      setSelectedShopId(shopId || null);
    },
    [],
  );

  const handleProductClick = useCallback((row: Row<(typeof shopProducts)[number]>) => {
    row.toggleExpanded(!row.getIsExpanded());
  }, []);

  const getProductCode = useCallback((item: (typeof shopProducts)[number]): string => {
    return item.product?.code || "-";
  }, []);

  const columns = useMemo(
    () =>
      getShopProductColumns({
        onProductClick: handleProductClick,
        getProductCode,
      }),
    [handleProductClick, getProductCode],
  );

  const renderProductDetails = useCallback(
    ({ row }: { row: Row<(typeof shopProducts)[number]> }) => {
      const product = row.original.product;

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
            <span className={styles.detailsValue}>{product.sku || "-"}</span>
          </div>
          <div className={styles.detailsRow}>
            <span className={styles.detailsLabel}>{t("products.columns.brand")}</span>
            <span className={styles.detailsValue}>{product.brandName || "-"}</span>
          </div>
          <div className={styles.detailsRow}>
            <span className={styles.detailsLabel}>{t("products.columns.category")}</span>
            <span className={styles.detailsValue}>{product.categoryName || "-"}</span>
          </div>
          <div className={styles.detailsRow}>
            <span className={styles.detailsLabel}>{t("products.columns.unitType")}</span>
            <span className={styles.detailsValue}>{product.unitTypeName || "-"}</span>
          </div>
          <div className={styles.detailsRow}>
            <span className={styles.detailsLabel}>{t("products.columns.boxSize")}</span>
            <span className={styles.detailsValue}>{product.boxSizeName || "-"}</span>
          </div>
          <div className={styles.detailsRow}>
            <span className={styles.detailsLabel}>{t("products.columns.vehicleDependent")}</span>
            <span className={styles.detailsValue}>
              {product.vehicleDependent ? t("common.yes") : t("common.no")}
            </span>
          </div>
        </div>
      );
    },
    [t],
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.tableHeader}>
        <h3 className={styles.tableTitle}>{t("shops.products.title")}</h3>
        <div className={styles.headerActions}>
          <div className={styles.shopSelector}>
            <Select
              label={t("shops.products.shop")}
              placeholder={t("shops.products.selectShop")}
              value={selectedShopId?.toString() || ""}
              onChange={handleShopChange}
              disabled={isLoadingShops}
            >
              <option value="">{t("shops.products.selectShop")}</option>
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.code}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {isLoadingProducts && shopProducts.length === 0 ? (
        <div className={styles.contentContainer}>
          <p>{t("shops.products.loading")}</p>
        </div>
      ) : !selectedShopId ? (
        <div className={styles.contentContainer}>
          <p>{t("shops.products.selectShop")}</p>
        </div>
      ) : shopProducts.length === 0 ? (
        <div className={styles.contentContainer}>
          <p>{t("shops.products.emptyState")}</p>
        </div>
      ) : (
        <DataTable
          data={shopProducts}
          columns={columns}
          pageSize={10}
          freezeHeader
          renderSubComponent={renderProductDetails}
        />
      )}
    </div>
  );
};
