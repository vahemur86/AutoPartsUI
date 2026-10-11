import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Barcode, Car, Hash, PackageSearch, Pencil, X } from "lucide-react";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchBrands,
  fetchCategories,
  fetchUnitTypes,
  fetchBoxSizes,
} from "@/store/slices/productSettingsSlice";

// ui-kit
import { Button, Switch, TextField, Select } from "@/ui-kit";
import { FormDrawer } from "@/components/common/FormDrawer";

// tyoes
import type { Product } from "@/types/products";
import type { ProductFormData } from "../types";

// styles
import styles from "./AddProductDropdown.module.css";

export interface EditProductDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ProductFormData) => void | Promise<void>;
  product: Product | null;
}

export const EditProductDropdown = ({
  open,
  onOpenChange,
  onSave,
  product,
}: EditProductDropdownProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { brands, categories, unitTypes, boxSizes, fetchedData } =
    useAppSelector((state) => state.productSettings);

  const [productKey, setProductKey] = useState("");
  const [sku, setSku] = useState("");
  const [brand, setBrand] = useState("");
  const [selectedCategoryPath, setSelectedCategoryPath] = useState<number[]>([]);
  const [unitType, setUnitType] = useState("");
  const [boxSize, setBoxSize] = useState("");
  const [vehicleDependent, setVehicleDependent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedCategories = useMemo(
    () =>
      [...categories].sort(
        (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
      ),
    [categories],
  );

  const activeCategories = useMemo(
    () => sortedCategories.filter((item) => item.isActive !== false),
    [sortedCategories],
  );

  const categoryLevels = useMemo(() => {
    const levels: Array<Array<{ id: number; name: string }>> = [];
    let parentId: number | null = null;
    let levelIndex = 0;

    while (true) {
      const options = activeCategories
        .filter((item) => Number(item.parentCategoryId ?? 0) === Number(parentId ?? 0))
        .map((item) => ({
          id: Number(item.id),
          name: String(item.name || item.code || `#${item.id}`),
        }));

      if (!options.length) break;
      levels.push(options);

      const selectedId = Number(selectedCategoryPath[levelIndex] || 0);
      if (!selectedId || !options.some((item) => item.id === selectedId)) break;

      parentId = selectedId;
      levelIndex += 1;
    }

    return levels;
  }, [activeCategories, selectedCategoryPath]);

  const selectedCategoryId = useMemo(() => {
    if (!selectedCategoryPath.length) return "";
    const lastSelectedId = selectedCategoryPath[selectedCategoryPath.length - 1];
    const hasActiveChildren = activeCategories.some(
      (item) => Number(item.parentCategoryId || 0) === lastSelectedId,
    );

    return hasActiveChildren ? "" : String(lastSelectedId);
  }, [activeCategories, selectedCategoryPath]);

  useEffect(() => {
    if (open) {
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
    }
  }, [open, dispatch, fetchedData]);

  useEffect(() => {
    if (open && product) {
      setProductKey(product.code);
      setSku(product.sku);
      setBrand(product.brandId.toString());
      setUnitType(product.unitTypeId.toString());
      setBoxSize(product.boxSizeId.toString());
      setVehicleDependent(product.vehicleDependent);
    }
  }, [open, product]);

  useEffect(() => {
    if (!open || !product || sortedCategories.length === 0) return;

    const categoryById = new Map(sortedCategories.map((item) => [Number(item.id), item]));
    const selected = categoryById.get(Number(product.categoryId));
    if (!selected) {
      setSelectedCategoryPath([]);
      return;
    }

    const path: number[] = [];
    const visited = new Set<number>();
    let current: (typeof selected) | undefined = selected;

    while (current && !visited.has(Number(current.id))) {
      const currentId = Number(current.id);
      visited.add(currentId);
      path.unshift(currentId);
      const parentId: number | null | undefined = current.parentCategoryId;
      current = parentId == null ? undefined : categoryById.get(Number(parentId));
    }

    setSelectedCategoryPath(path);
  }, [open, product, sortedCategories]);

  const handleSaveClick = async () => {
    if (
      !productKey.trim() ||
      !sku.trim() ||
      !product ||
      !brand ||
      !selectedCategoryId ||
      !unitType ||
      !boxSize
    ) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave({
        id: product.id,
        productKey: productKey.trim(),
        sku: sku.trim(),
        brand: parseInt(brand),
        category: parseInt(selectedCategoryId),
        unitType: parseInt(unitType),
        boxSize: parseInt(boxSize),
        vehicleDependent,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) return null;

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      eyebrow={t("header.productCatalog")}
      title={t("products.form.editProduct")}
      titleId="product-edit-title"
      closeLabel={t("common.close")}
      icon={<Pencil size={20} />}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            <X size={15} />{t("common.cancel")}
          </Button>
          <Button
            className={styles.productPrimaryButton}
            onClick={() => void handleSaveClick()}
            disabled={isSubmitting || !productKey.trim() || !sku.trim() || !brand || !selectedCategoryId || !unitType || !boxSize}
          >
            <PackageSearch size={15} />{isSubmitting ? t("common.saving") : t("common.save")}
          </Button>
        </>
      }
    >
      <div className={styles.productForm}>
        <div className={styles.productFields}>
          <TextField
            label={t("products.form.productKey")}
            value={productKey}
            onChange={(e) => setProductKey(e.target.value)}
            placeholder={t("products.form.type")}
            icon={<Hash size={15} />}
            disabled={isSubmitting}
          />
          <TextField
            label={t("products.form.sku")}
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder={t("products.form.type")}
            icon={<Barcode size={15} />}
            disabled={isSubmitting}
          />
          <Select
            label={t("products.form.brand")}
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder={t("products.form.select")}
            disabled={isSubmitting}
          >
            <option value="">{t("products.form.select")}</option>
            {brands.map((brandItem) => (
              <option key={brandItem.id} value={brandItem.id}>
                {brandItem.code}
              </option>
            ))}
          </Select>
          {categoryLevels.map((options, levelIndex) => (
            <Select
              key={`category-level-${levelIndex}`}
              label={t(levelIndex === 0 ? "products.form.rootCategory" : "products.form.childCategory")}
              value={String(selectedCategoryPath[levelIndex] || "")}
              onChange={(e) => {
                const value = Number(e.target.value || 0);
                setSelectedCategoryPath((previous) => {
                  const next = previous.slice(0, levelIndex);
                  if (value) next.push(value);
                  return next;
                });
              }}
              placeholder={t("products.form.select")}
              disabled={isSubmitting}
            >
              <option value="">{t("products.form.select")}</option>
              {options.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          ))}
          <Select
            label={t("products.form.unitType")}
            value={unitType}
            onChange={(e) => setUnitType(e.target.value)}
            placeholder={t("products.form.select")}
            disabled={isSubmitting}
          >
            <option value="">{t("products.form.select")}</option>
            {unitTypes.map((unitTypeItem) => (
              <option key={unitTypeItem.id} value={unitTypeItem.id}>
                {unitTypeItem.code}
              </option>
            ))}
          </Select>
          <Select
            label={t("products.form.boxSize")}
            value={boxSize}
            onChange={(e) => setBoxSize(e.target.value)}
            placeholder={t("products.form.select")}
            disabled={isSubmitting}
          >
            <option value="">{t("products.form.select")}</option>
            {boxSizes.map((boxSizeItem) => (
              <option key={boxSizeItem.id} value={boxSizeItem.id}>
                {boxSizeItem.code}
              </option>
            ))}
          </Select>
        </div>

        <div className={styles.vehicleDependentField}>
          <Car size={15} aria-hidden="true" />
          <Switch
            checked={vehicleDependent}
            onCheckedChange={setVehicleDependent}
            label={t("products.form.vehicleDependent")}
            disabled={isSubmitting}
          />
        </div>
      </div>
    </FormDrawer>
  );
};
