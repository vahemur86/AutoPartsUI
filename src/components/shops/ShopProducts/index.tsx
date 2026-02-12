import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

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

  const columns = useMemo(() => getShopProductColumns(), []);

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
        />
      )}
    </div>
  );
};
