import { useEffect, useMemo, useState, type RefObject } from "react";
import { useTranslation } from "react-i18next";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchBrands,
  fetchCategories,
  fetchUnitTypes,
  fetchBoxSizes,
} from "@/store/slices/productSettingsSlice";

// ui-kit
import { Button, Switch, TextField, Select, Dropdown } from "@/ui-kit";

// tyoes
import type { Product } from "@/types/products";
import type { ProductFormData } from "../types";

// styles
import styles from "./AddProductDropdown.module.css";

export interface EditProductDropdownProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement>;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ProductFormData) => void;
  product: Product | null;
}

export const EditProductDropdown = ({
  open,
  anchorRef,
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
  const [rootCategoryId, setRootCategoryId] = useState("");
  const [childCategoryId, setChildCategoryId] = useState("");
  const [unitType, setUnitType] = useState("");
  const [boxSize, setBoxSize] = useState("");
  const [vehicleDependent, setVehicleDependent] = useState(false);

  const sortedCategories = useMemo(
    () =>
      [...categories].sort(
        (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
      ),
    [categories],
  );

  const rootCategories = useMemo(
    () =>
      sortedCategories.filter(
        (item) => (item.parentCategoryId ?? null) === null && item.isActive !== false,
      ),
    [sortedCategories],
  );

  const childCategories = useMemo(() => {
    if (!rootCategoryId) return [];
    const rootId = Number(rootCategoryId);
    return sortedCategories.filter(
      (item) => item.parentCategoryId === rootId && item.isActive !== false,
    );
  }, [rootCategoryId, sortedCategories]);

  const selectedCategoryId = childCategoryId || rootCategoryId;

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

    const selected = sortedCategories.find((item) => item.id === product.categoryId);
    if (!selected) {
      setRootCategoryId("");
      setChildCategoryId("");
      return;
    }

    if ((selected.parentCategoryId ?? null) === null) {
      setRootCategoryId(String(selected.id));
      setChildCategoryId("");
      return;
    }

    setRootCategoryId(String(selected.parentCategoryId));
    setChildCategoryId(String(selected.id));
  }, [open, product, sortedCategories]);

  const handleSaveClick = () => {
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
    onSave({
      id: product.id,
      productKey: productKey.trim(),
      sku: sku.trim(),
      brand: parseInt(brand),
      category: parseInt(selectedCategoryId),
      unitType: parseInt(unitType),
      boxSize: parseInt(boxSize),
      vehicleDependent,
    });
    onOpenChange(false);
  };

  if (!product) return null;

  return (
    <Dropdown
      open={open}
      onOpenChange={onOpenChange}
      anchorRef={anchorRef}
      align="start"
      side="left"
      title={t("products.form.editProduct")}
    >
      {/* Desktop header */}
      <div className={styles.header}>
        <span className={styles.title}>{t("products.form.editProduct")}</span>
      </div>

      <div className={styles.content}>
        <div className={styles.fields}>
          <TextField
            label={t("products.form.productKey")}
            value={productKey}
            onChange={(e) => setProductKey(e.target.value)}
            placeholder={t("products.form.type")}
          />
          <TextField
            label={t("products.form.sku")}
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder={t("products.form.type")}
          />
          <Select
            label={t("products.form.brand")}
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder={t("products.form.select")}
          >
            <option value="">{t("products.form.select")}</option>
            {brands.map((brandItem) => (
              <option key={brandItem.id} value={brandItem.id}>
                {brandItem.code}
              </option>
            ))}
          </Select>
          <Select
            label={t("products.form.rootCategory")}
            value={rootCategoryId}
            onChange={(e) => {
              setRootCategoryId(e.target.value);
              setChildCategoryId("");
            }}
            placeholder={t("products.form.select")}
          >
            <option value="">{t("products.form.select")}</option>
            {rootCategories.map((categoryItem) => (
              <option key={categoryItem.id} value={categoryItem.id}>
                {categoryItem.name || categoryItem.code}
              </option>
            ))}
          </Select>

          {rootCategoryId && childCategories.length > 0 && (
            <Select
              label={t("products.form.childCategory")}
              value={childCategoryId}
              onChange={(e) => setChildCategoryId(e.target.value)}
              placeholder={t("products.form.select")}
            >
              <option value="">{t("products.form.select")}</option>
              {childCategories.map((categoryItem) => (
                <option key={categoryItem.id} value={categoryItem.id}>
                  {categoryItem.name || categoryItem.code}
                </option>
              ))}
            </Select>
          )}
          <Select
            label={t("products.form.unitType")}
            value={unitType}
            onChange={(e) => setUnitType(e.target.value)}
            placeholder={t("products.form.select")}
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
          >
            <option value="">{t("products.form.select")}</option>
            {boxSizes.map((boxSizeItem) => (
              <option key={boxSizeItem.id} value={boxSizeItem.id}>
                {boxSizeItem.code}
              </option>
            ))}
          </Select>
        </div>

        <Switch
          checked={vehicleDependent}
          onCheckedChange={setVehicleDependent}
          label={t("products.form.vehicleDependent")}
        />

        <div className={styles.actionswithoutDelete}>
          <div className={styles.primaryActions}>
            <Button
              variant="secondary"
              size="medium"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button variant="primary" size="medium" onClick={handleSaveClick}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      </div>
    </Dropdown>
  );
};
