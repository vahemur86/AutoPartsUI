import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Row } from "@tanstack/react-table";
import { Boxes, CircleDollarSign, PackageSearch, Search, Store } from "lucide-react";
import { useMinimumLoadingDuration } from "@/hooks/useMinimumLoadingDuration";

// ui-kit
import { DataTable, Select, TextField } from "@/ui-kit";

// store
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchShops } from "@/store/slices/shopsSlice";
import { fetchShopProducts, resetShopProductsState } from "@/store/slices/shops/productsSlice";

// utils
import { getCashRegisterId } from "@/utils";

// columns
import { getShopProductColumns } from "./columns";

// styles
import styles from "./ShopProducts.module.css";

export const ShopProducts = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();

  const { shops, isLoading: isLoadingShops } = useAppSelector(
    (state) => state.shops,
  );
  const { items: shopProducts, isLoading: isLoadingProducts } = useAppSelector(
    (state) => state.shopProducts,
  );
  const showTableSkeleton = useMinimumLoadingDuration(
    isLoadingProducts && shopProducts.length === 0,
  );

  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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
      setSearchTerm("");
      dispatch(resetShopProductsState());
      setSelectedShopId(shopId || null);
    },
    [dispatch],
  );

  const selectedShop = useMemo(
    () => shops.find((shop) => shop.id === selectedShopId) ?? null,
    [shops, selectedShopId],
  );

  const filteredShopProducts = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase();
    if (!query) return shopProducts;

    return shopProducts.filter((item) =>
      [
        item.product?.code,
        item.product?.sku,
        item.product?.brandName,
        item.product?.categoryName,
        item.product?.unitTypeName,
      ]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase().includes(query)),
    );
  }, [shopProducts, searchTerm]);

  const inventorySummary = useMemo(
    () => ({
      stockLines: shopProducts.length,
      totalUnits: shopProducts.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      saleValue: shopProducts.reduce(
        (sum, item) => sum + Number(item.quantity || 0) * Number(item.salePrice || 0),
        0,
      ),
    }),
    [shopProducts],
  );

  const formatMoney = useCallback(
    (value: number) =>
      new Intl.NumberFormat(i18n.language, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value),
    [i18n.language],
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
      <section className={styles.inventoryOverview}>
        <div className={styles.inventoryHeader}>
          <div className={styles.inventoryTitle}>
            <span className={styles.inventoryEyebrow}><Store size={14} />{t("shops.products.shop")}</span>
            <h2>{t("shops.products.title")}</h2>
            <p>{selectedShop ? t("shops.products.inventoryFor", { shop: selectedShop.code }) : t("shops.products.selectShopHint")}</p>
          </div>
          <div className={styles.shopSelector}>
            <Select
              label={t("shops.products.shop")}
              placeholder={t("shops.products.selectShop")}
              value={selectedShopId?.toString() || ""}
              onChange={handleShopChange}
              disabled={isLoadingShops || shops.length === 0}
            >
              <option value="">{t("shops.products.selectShop")}</option>
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>{shop.code}</option>
              ))}
            </Select>
          </div>
        </div>

        {selectedShopId && (
          <>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryTile}>
                <span className={styles.summaryIcon}><PackageSearch size={17} /></span>
                <div><span>{t("shops.products.stockLines")}</span><strong>{inventorySummary.stockLines}</strong></div>
              </div>
              <div className={styles.summaryTile}>
                <span className={styles.summaryIcon}><Boxes size={17} /></span>
                <div><span>{t("shops.products.totalUnits")}</span><strong>{formatMoney(inventorySummary.totalUnits)}</strong></div>
              </div>
              <div className={styles.summaryTile}>
                <span className={styles.summaryIcon}><CircleDollarSign size={17} /></span>
                <div><span>{t("shops.products.saleValue")}</span><strong>{formatMoney(inventorySummary.saleValue)} AMD</strong></div>
              </div>
            </div>

            <div className={styles.productToolbar}>
              <TextField
                label={t("shops.products.search")}
                placeholder={t("shops.products.searchPlaceholder")}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                icon={<Search size={15} />}
              />
              <span className={styles.resultCount}>
                {t("shops.products.resultCount", { shown: filteredShopProducts.length, total: shopProducts.length })}
              </span>
            </div>
          </>
        )}
      </section>

      {showTableSkeleton ? (
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
      ) : !selectedShopId ? (
        <div className={styles.emptyState}>
          <Store size={22} aria-hidden="true" />
          <p>{t("shops.products.selectShop")}</p>
        </div>
      ) : shopProducts.length === 0 ? (
        <div className={styles.emptyState}>
          <PackageSearch size={22} aria-hidden="true" />
          <p>{t("shops.products.emptyState")}</p>
        </div>
      ) : filteredShopProducts.length === 0 ? (
        <div className={styles.emptyState}>
          <Search size={22} aria-hidden="true" />
          <p>{t("shops.products.noMatches")}</p>
        </div>
      ) : (
        <section className={styles.tableShell}>
          <DataTable
            data={filteredShopProducts}
            columns={columns}
            pageSize={10}
            freezeHeader
            renderSubComponent={renderProductDetails}
          />
        </section>
      )}
    </div>
  );
};
