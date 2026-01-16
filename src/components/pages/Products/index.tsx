import { useState, useRef, useCallback, type RefObject } from "react";
import { toast } from "react-toastify";
import { useAppDispatch } from "@/store/hooks";
import {
  addProduct,
  updateProductInStore,
  fetchProducts,
} from "@/store/slices/productsSlice";
import productIcon from "@/assets/icons/Vector (3).svg";
import { Plus } from "lucide-react";
import { IconButton } from "@/ui-kit";
import { SectionHeader } from "@/components/common/SectionHeader";
import { AddProductDropdown } from "./ProductActions/AddProductDropdown";
import { EditProductDropdown } from "./ProductActions/EditProductDropdown";
import { ProductsContent } from "./ProductsContent";
import type { Product } from "@/types.ts/products";
import styles from "./Products.module.css";

export const Products = () => {
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

  const handleAddButtonClick = useCallback(
    (buttonRef: RefObject<HTMLElement>) => {
      if (buttonRef.current) {
        setAddButtonRef(buttonRef);
        setIsAddingProduct(true);
      }
    },
    []
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
    async (data: any) => {
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
          })
        ).unwrap();
        toast.success("Product created successfully");
        dispatch(fetchProducts());
        handleCloseAddDropdown();
      } catch (error: any) {
        toast.error(error || "Failed to create product");
      }
    },
    [dispatch, handleCloseAddDropdown]
  );

  const handleEditProduct = useCallback(
    (product: Product, buttonRef: RefObject<HTMLElement>) => {
      setEditingProduct(product);
      setEditButtonRef(buttonRef);
      setIsEditingProduct(true);
    },
    []
  );

  const handleUpdateProduct = useCallback(
    async (data: any) => {
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
          })
        ).unwrap();
        toast.success("Product updated successfully");
        dispatch(fetchProducts());
        handleCloseEditDropdown();
      } catch (error: any) {
        toast.error(error || "Failed to update product");
      }
    },
    [dispatch, editingProduct, handleCloseEditDropdown]
  );

  const buttonWrapperRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <SectionHeader
        title="Products"
        icon={<img src={productIcon} alt="Products icon" />}
        actions={
          <div className={styles.languagesHeader}>
            <div className={styles.addButtonWrapper} ref={buttonWrapperRef}>
              <IconButton
                variant="primary"
                size="small"
                icon={<Plus size={12} color="#0e0f11" />}
                ariaLabel="Add New"
                onClick={() =>
                  handleAddButtonClick(
                    buttonWrapperRef as RefObject<HTMLElement>
                  )
                }
              />
              <span className={styles.addButtonText}>Add New</span>
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
