import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router-dom";

// stores
import { useAppDispatch } from "@/store/hooks";
import { addProduct } from "@/store/slices/productsSlice";

// icons
import { ClipboardList, Plus } from "lucide-react";

// components
import { SectionHeader } from "@/components/common";
import { AddProductDropdown } from "@/components/products/General/actions/AddProductDropdown";

// ui-kit
import { Button } from "@/ui-kit";

// types
import type { ProductFormData } from "@/components/products/General/types";

// styles
import styles from "@/components/products/General/Products.module.css";

export const Products = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const [isAddingProduct, setIsAddingProduct] = useState(false);

  const handleCloseAddDropdown = useCallback(() => {
    setIsAddingProduct(false);
  }, []);

  const handleSaveProduct = useCallback(
    async (data: ProductFormData): Promise<void> => {
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
    },
    [dispatch],
  );

  return (
    <>
      <SectionHeader
        title={t("header.productCatalog")}
        icon={<ClipboardList size={17} />}
        appearance="warehouse"
        actions={
          <div className={styles.languagesHeader}>
            <Button className={styles.addButton} onClick={() => setIsAddingProduct(true)}>
              <Plus size={16} />
              {t("products.quickAdd")}
            </Button>
          </div>
        }
      />

      <AddProductDropdown
        open={isAddingProduct}
        onOpenChange={handleCloseAddDropdown}
        onSave={handleSaveProduct}
      />

      <Outlet />
    </>
  );
};
