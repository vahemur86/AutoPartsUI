import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  type RefObject,
} from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchIronProducts,
  changeProductPrice,
} from "@/store/slices/adminProductsSlice";

// ui-kit
import { DataTable } from "@/ui-kit";

// components
import { EditPriceDropdown } from "./actions/EditPriceDropdown";
import { getIronProductColumns } from "./columns";

// utils
import { getApiErrorMessage } from "@/utils";

// types
import type { IronProduct } from "@/store/slices/adminProductsSlice";

// styles
import styles from "../General/Products.module.css";
import contentStyles from "../General/Content.module.css";

export const IronProducts = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();

  const { ironProducts } = useAppSelector((state) => state.adminProducts);

  const [isEditing, setIsEditing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<IronProduct | null>(
    null,
  );
  const [anchorRef, setAnchorRef] = useState<
    RefObject<HTMLElement> | undefined
  >(undefined);

  const currentLang = i18n.language;

  useEffect(() => {
    dispatch(fetchIronProducts({ lang: currentLang }));
  }, [dispatch, currentLang]);

  const handleEditClick = useCallback(
    (product: IronProduct, buttonRef: RefObject<HTMLElement>) => {
      setSelectedProduct(product);
      setAnchorRef(buttonRef);
      setIsEditing(true);
    },
    [],
  );

  const handleSavePrice = useCallback(
    async (newPrice: number) => {
      if (!selectedProduct) return;

      try {
        await dispatch(
          changeProductPrice({
            productId: selectedProduct.id,
            payload: {
              productId: selectedProduct.id,
              unitPrice: newPrice,
            },
          }),
        ).unwrap();

        toast.success(t("products.success.priceUpdated"));

        dispatch(fetchIronProducts({ lang: currentLang }));
        setIsEditing(false);
      } catch (error) {
        toast.error(
          getApiErrorMessage(error, t("products.error.failedToUpdatePrice")),
        );
      }
    },
    [dispatch, selectedProduct, t, currentLang],
  );

  const columns = useMemo(
    () => getIronProductColumns({ onEdit: handleEditClick }),
    [handleEditClick],
  );

  return (
    <div className={styles.productsWrapper}>
      <div className={contentStyles.productsContent}>
        <DataTable columns={columns} data={ironProducts} pageSize={10} />
      </div>

      <EditPriceDropdown
        open={isEditing}
        anchorRef={anchorRef}
        onOpenChange={setIsEditing}
        onSave={handleSavePrice}
        currentPrice={selectedProduct?.unitPrice ?? 0}
      />
    </div>
  );
};
