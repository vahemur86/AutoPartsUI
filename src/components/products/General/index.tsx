import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

// stores
import { useAppDispatch } from "@/store/hooks";
import {
  updateProductInStore,
  fetchProducts,
} from "@/store/slices/productsSlice";

// components
import { EditProductDropdown } from "./actions/EditProductDropdown";
import { ProductsContent } from "./Content";

// utils
import { getErrorMessage } from "@/utils";

// types
import type { Product } from "@/types/products";
import type { ProductFormData } from "./types";

// styles
import styles from "./Products.module.css";

export const GeneralProducts = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleCloseEditDropdown = useCallback(() => {
    setIsEditingProduct(false);
    setEditingProduct(null);
  }, []);

  const handleEditProduct = useCallback(
    (product: Product) => {
      setEditingProduct(product);
      setIsEditingProduct(true);
    },
    [],
  );

  const handleUpdateProduct = useCallback(
    async (data: ProductFormData) => {
      if (!editingProduct) return;

      try {
        await dispatch(
          updateProductInStore({
            id: editingProduct.id,
            code: data.productKey,
            sku: data.sku,
            brandId: data.brand,
            categoryId: data.category,
            unitTypeId: data.unitType,
            boxSizeId: data.boxSize,
            vehicleDependent: data.vehicleDependent,
          }),
        ).unwrap();

        toast.success(t("products.success.productUpdated"));
        dispatch(fetchProducts());
        handleCloseEditDropdown();
      } catch (error: unknown) {
        console.error(error);
        toast.error(getErrorMessage(error, t("products.error.failedToUpdate")));
      }
    },
    [dispatch, editingProduct, handleCloseEditDropdown, t],
  );

  return (
    <div className={styles.productsWrapper}>
      <ProductsContent onEdit={handleEditProduct} />

      <EditProductDropdown
        open={isEditingProduct}
        onOpenChange={handleCloseEditDropdown}
        onSave={handleUpdateProduct}
        product={editingProduct}
      />
    </div>
  );
};
