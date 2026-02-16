import { useState, useRef, useCallback, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// stores
import { useAppDispatch } from "@/store/hooks";
import { addProduct, fetchProducts } from "@/store/slices/productsSlice";
import { fetchIronProducts } from "@/store/slices/adminProductsSlice";

// icons
import { FileCheck, BarChart3, ClipboardList, Plus } from "lucide-react";

// components
import { ModuleLayout, type NavItem } from "@/components/common";
import { AddProductDropdown } from "@/components/products/General/actions/AddProductDropdown";

// ui-kit
import { IconButton } from "@/ui-kit";

// utils
import { getErrorMessage } from "@/utils";

// types
import type { ProductFormData } from "@/components/products/General/types";

// styles
import styles from "@/components/products/General/Products.module.css";

export const Products = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const currentLang = i18n.language;

  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [addButtonRef, setAddButtonRef] = useState<
    RefObject<HTMLElement> | undefined
  >(undefined);
  const buttonWrapperRef = useRef<HTMLDivElement>(null);

  const navigationItems: NavItem[] = [
    {
      path: "/products-list",
      label: t("products.navigation.products"),
      icon: FileCheck,
      showCheckmark: true,
    },
    {
      path: "/iron-products",
      label: t("products.navigation.ironProducts"),
      icon: BarChart3,
      showCheckmark: true,
    },
  ];

  const handleCloseAddDropdown = useCallback(() => {
    setIsAddingProduct(false);
    setAddButtonRef(undefined);
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
        dispatch(fetchIronProducts({ lang: currentLang }));

        handleCloseAddDropdown();
      } catch (error: unknown) {
        console.error(error);
        toast.error(getErrorMessage(error, t("products.error.failedToCreate")));
      }
    },
    [dispatch, handleCloseAddDropdown, t, currentLang],
  );

  return (
    <>
      <ModuleLayout
        basePath="/products"
        navigationItems={navigationItems}
        defaultTitle={t("header.products")}
        defaultIcon={ClipboardList}
        actions={
          <div className={styles.languagesHeader}>
            <div className={styles.addButtonWrapper} ref={buttonWrapperRef}>
              <IconButton
                variant="primary"
                size="small"
                icon={<Plus size={12} color="#0e0f11" />}
                ariaLabel={t("products.addNew")}
                onClick={() => {
                  setAddButtonRef(buttonWrapperRef as RefObject<HTMLElement>);
                  setIsAddingProduct(true);
                }}
              />
              <span className={styles.addButtonText}>
                {t("products.addNew")}
              </span>
            </div>
          </div>
        }
      />

      <AddProductDropdown
        open={isAddingProduct}
        anchorRef={addButtonRef}
        onOpenChange={handleCloseAddDropdown}
        onSave={handleSaveProduct}
      />
    </>
  );
};
