import { useState, useRef, useCallback, type RefObject } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

// stores
import { useAppDispatch } from "@/store/hooks";
import {
  addProduct,
  updateProductInStore,
  fetchProducts,
} from "@/store/slices/productsSlice";

// icons
import productIcon from "@/assets/icons/Vector (3).svg";
import { Plus } from "lucide-react";

// ui-kit
import { IconButton } from "@/ui-kit";

// components
import { SectionHeader } from "@/components/common";
import { AddProductDropdown } from "./ProductActions/AddProductDropdown";
import { EditProductDropdown } from "./ProductActions/EditProductDropdown";
import { ProductsContent } from "./ProductsContent";

// utils
import { getErrorMessage } from "@/utils";

// types
import type { Product } from "@/types/products";
import type { ProductFormData } from "./types";

// styles
import styles from "./Products.module.css";

export const Products = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [addButtonRef, setAddButtonRef] = useState<
    RefObject<HTMLElement> | undefined
  >(undefined);

  const [editButtonRef, setEditButtonRef] = useState<
    RefObject<HTMLElement> | undefined
  >(undefined);

  const buttonWrapperRef = useRef<HTMLDivElement>(null);

  const handleAddButtonClick = useCallback(
    (buttonRef: RefObject<HTMLElement>) => {
      if (buttonRef.current) {
        setAddButtonRef(buttonRef);
        setIsAddingProduct(true);
      }
    },
    [],
  );

  const handleCloseAddDropdown = useCallback(() => {
    setIsAddingProduct(false);
    setAddButtonRef(undefined);
  }, []);

  const handleCloseEditDropdown = useCallback(() => {
    setIsEditingProduct(false);
    setEditingProduct(null);
    setEditButtonRef(undefined);
  }, []);

  const handleSaveProduct = useCallback(
    async (data: ProductFormData) => {
      try {
        await dispatch(
          addProduct({
            code: data.productKey,
            sku: data.sku,
            brandId: data.brand,
            categoryId: data.category,
            unitTypeId: data.unitType,
            boxSizeId: data.boxSize,
            vehicleDependent: data.vehicleDependent,
          }),
        ).unwrap();

        toast.success(t("products.success.productCreated"));
        dispatch(fetchProducts());
        handleCloseAddDropdown();
      } catch (error: unknown) {
        console.error(error);
        toast.error(getErrorMessage(error, t("products.error.failedToCreate")));
      }
    },
    [dispatch, handleCloseAddDropdown],
  );

  const handleEditProduct = useCallback(
    (product: Product, buttonRef: RefObject<HTMLElement>) => {
      setEditingProduct(product);
      setEditButtonRef(buttonRef);
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
    [dispatch, editingProduct, handleCloseEditDropdown],
  );

  return (
    <>
      <SectionHeader
        title={t("header.products")}
        icon={<img src={productIcon} alt={t("products.iconAlt")} />}
        actions={
          <div className={styles.languagesHeader}>
            <div className={styles.addButtonWrapper} ref={buttonWrapperRef}>
              <IconButton
                variant="primary"
                size="small"
                icon={<Plus size={12} color="#0e0f11" />}
                ariaLabel={t("products.addNew")}
                onClick={() =>
                  handleAddButtonClick(
                    buttonWrapperRef as RefObject<HTMLElement>,
                  )
                }
              />
              <span className={styles.addButtonText}>{t("products.addNew")}</span>
            </div>
          </div>
        }
      />

      <div className={styles.productsContainer}>
        <ProductsContent onEdit={handleEditProduct} />

        <AddProductDropdown
          open={isAddingProduct}
          anchorRef={addButtonRef}
          onOpenChange={handleCloseAddDropdown}
          onSave={handleSaveProduct}
        />

        <EditProductDropdown
          open={isEditingProduct}
          anchorRef={editButtonRef}
          onOpenChange={handleCloseEditDropdown}
          onSave={handleUpdateProduct}
          product={editingProduct}
        />
      </div>
    </>
  );
};
