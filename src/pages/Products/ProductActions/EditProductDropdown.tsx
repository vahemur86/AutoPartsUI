import { useEffect, useState, type RefObject } from "react";

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
  const dispatch = useAppDispatch();
  const { brands, categories, unitTypes, boxSizes, fetchedData } =
    useAppSelector((state) => state.productSettings);

  const [productKey, setProductKey] = useState("");
  const [sku, setSku] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [unitType, setUnitType] = useState("");
  const [boxSize, setBoxSize] = useState("");
  const [vehicleDependent, setVehicleDependent] = useState(false);

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
      setCategory(product.categoryId.toString());
      setUnitType(product.unitTypeId.toString());
      setBoxSize(product.boxSizeId.toString());
      setVehicleDependent(product.vehicleDependent);
    }
  }, [open, product]);

  const handleSaveClick = () => {
    if (
      !productKey.trim() ||
      !sku.trim() ||
      !product ||
      !brand ||
      !category ||
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
      category: parseInt(category),
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
      title="Edit Product"
    >
      {/* Desktop header */}
      <div className={styles.header}>
        <span className={styles.title}>Edit Product</span>
      </div>

      <div className={styles.content}>
        <div className={styles.fields}>
          <TextField
            label="Product Key"
            value={productKey}
            onChange={(e) => setProductKey(e.target.value)}
            placeholder="Type"
          />
          <TextField
            label="SKU"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="Type"
          />
          <Select
            label="Brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Select"
          >
            <option value="">Select</option>
            {brands.map((brandItem) => (
              <option key={brandItem.id} value={brandItem.id}>
                {brandItem.code}
              </option>
            ))}
          </Select>
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Select"
          >
            <option value="">Select</option>
            {categories.map((categoryItem) => (
              <option key={categoryItem.id} value={categoryItem.id}>
                {categoryItem.code}
              </option>
            ))}
          </Select>
          <Select
            label="Unit Type"
            value={unitType}
            onChange={(e) => setUnitType(e.target.value)}
            placeholder="Select"
          >
            <option value="">Select</option>
            {unitTypes.map((unitTypeItem) => (
              <option key={unitTypeItem.id} value={unitTypeItem.id}>
                {unitTypeItem.code}
              </option>
            ))}
          </Select>
          <Select
            label="Box size"
            value={boxSize}
            onChange={(e) => setBoxSize(e.target.value)}
            placeholder="Select"
          >
            <option value="">Select</option>
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
          label="Vehicle Dependent"
        />

        <div className={styles.actionswithoutDelete}>
          <div className={styles.primaryActions}>
            <Button
              variant="secondary"
              size="medium"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="medium" onClick={handleSaveClick}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </Dropdown>
  );
};
