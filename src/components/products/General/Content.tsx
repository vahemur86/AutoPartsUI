import { useEffect, useRef, useCallback, useMemo, type RefObject } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

// hooks
import { useIsMobile } from "@/hooks/isMobile";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchProducts, removeProduct } from "@/store/slices/productsSlice";
import {
  fetchBrands,
  fetchCategories,
  fetchUnitTypes,
  fetchBoxSizes,
} from "@/store/slices/productSettingsSlice";

// ui-kit
import { DataTable } from "@/ui-kit";

// types
import type { Product } from "@/types/products";

// components
import { getProductColumns } from "./columns";

// utils
import { getErrorMessage } from "@/utils";

// styles
import styles from "./Content.module.css";

interface ProductsContentProps {
  onEdit: (product: Product, buttonRef: RefObject<HTMLElement>) => void;
}

export const ProductsContent = ({ onEdit }: ProductsContentProps) => {
  const { t } = useTranslation();
  const { mounted } = useIsMobile();
  const dispatch = useAppDispatch();
  const { products, isLoading } = useAppSelector((state) => state.products);
  const { brands, categories, unitTypes, boxSizes, fetchedData } =
    useAppSelector((state) => state.productSettings);
  const fetchInitiatedRef = useRef(false);

  useEffect(() => {
    if (fetchInitiatedRef.current) return;
    fetchInitiatedRef.current = true;

    dispatch(fetchProducts());

    if (!fetchedData.brands) {
      dispatch(fetchBrands());
    }
    if (!fetchedData.categories) {
      dispatch(fetchCategories());
    }
    if (!fetchedData.unitTypes) {
      dispatch(fetchUnitTypes());
    }
    if (!fetchedData.boxSizes) {
      dispatch(fetchBoxSizes());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const handleDelete = useCallback(
    async (productId: number) => {
      try {
        await dispatch(removeProduct(productId)).unwrap();
        toast.success(t("products.success.productDeleted"));
        dispatch(fetchProducts());
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, t("products.error.failedToDelete")));
      }
    },
    [dispatch, t],
  );

  const columns = useMemo(
    () =>
      getProductColumns({
        brands,
        categories,
        unitTypes,
        boxSizes,
        onEdit,
        onDelete: handleDelete,
      }),
    [brands, categories, unitTypes, boxSizes, onEdit, handleDelete],
  );

  if (isLoading && products.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <p>{t("products.loading")}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <p>{t("products.emptyState")}</p>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className={styles.loadingContainer}>
        <p>{t("products.loadingGeneric")}</p>
      </div>
    );
  }

  return (
    <div className={styles.productsContent}>
      <DataTable data={products} columns={columns} pageSize={10} />
    </div>
  );
};
