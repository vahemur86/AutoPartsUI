import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchBrands,
  fetchCategories,
  fetchUnitTypes,
  fetchBoxSizes,
} from "@/store/slices/productSettingsSlice";
import styles from "./AddProductDropdown.module.css";
import { Button, Switch, TextField, Select, Dropdown } from "@/ui-kit";

export interface AddProductDropdownProps {
  open: boolean;
  anchorRef?: React.RefObject<HTMLElement>;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
}

export const AddProductDropdown = ({
  open,
  anchorRef,
  onOpenChange,
  onSave,
}: AddProductDropdownProps) => {
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
    if (open) {
      setProductKey("");
      setSku("");
      setBrand("");
      setCategory("");
      setUnitType("");
      setBoxSize("");
      setVehicleDependent(false);
    }
  }, [open]);

  const handleSaveClick = () => {
    if (
      !productKey.trim() ||
      !sku.trim() ||
      !brand ||
      !category ||
      !unitType ||
      !boxSize
    ) {
      return;
    }
    onSave({
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

  return (
    <Dropdown
      open={open}
      onOpenChange={onOpenChange}
      anchorRef={anchorRef}
      align="start"
      side="left"
      title="Add Product"
    >
      {/* Desktop header */}
      <div className={styles.header}>
        <span className={styles.title}>Add New Product</span>
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
