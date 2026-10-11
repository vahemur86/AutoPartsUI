import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Barcode, Car, Hash, PackagePlus, X } from "lucide-react";

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

// types
import type { ProductFormData } from "../types";

// styles
import styles from "./AddProductDropdown.module.css";

export interface AddProductDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ProductFormData) => Promise<boolean>;
}

export const AddProductDropdown = ({
  open,
  onOpenChange,
  onSave,
}: AddProductDropdownProps) => {
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
  const productKeyRef = useRef<HTMLInputElement>(null);

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

      if (!options.length) {
        break;
      }

      levels.push(options);

      const selectedId = Number(selectedCategoryPath[levelIndex] || 0);
      if (!selectedId || !options.some((item) => item.id === selectedId)) {
        break;
      }

      parentId = selectedId;
      levelIndex += 1;
    }

    return levels;
  }, [activeCategories, selectedCategoryPath]);

  const selectedCategoryId = useMemo(() => {
    if (!selectedCategoryPath.length) return "";
    const lastSelectedId = Number(selectedCategoryPath[selectedCategoryPath.length - 1] || 0);
    if (!lastSelectedId) return "";

    const hasActiveChildren = activeCategories.some(
      (item) => Number(item.parentCategoryId || 0) === lastSelectedId,
    );

    return hasActiveChildren ? "" : String(lastSelectedId);
  }, [selectedCategoryPath, activeCategories]);

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
      setSelectedCategoryPath([]);
      setUnitType("");
      setBoxSize("");
      setVehicleDependent(false);
    }
  }, [open]);

  const handleSaveClick = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !productKey.trim() ||
      !sku.trim() ||
      !brand ||
      !selectedCategoryId ||
      !unitType ||
      !boxSize
    ) {
      return;
    }
    setIsSubmitting(true);
    try {
      const saved = await onSave({
        productKey: productKey.trim(),
        sku: sku.trim(),
        brand: parseInt(brand),
        category: parseInt(selectedCategoryId),
        unitType: parseInt(unitType),
        boxSize: parseInt(boxSize),
        vehicleDependent,
      });
      if (!saved) return;

      setProductKey("");
      setSku("");
      setBrand("");
      setSelectedCategoryPath([]);
      setUnitType("");
      setBoxSize("");
      setVehicleDependent(false);
      window.requestAnimationFrame(() => productKeyRef.current?.focus());
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <section className={styles.quickAddPanel} aria-labelledby="product-quick-add-title">
      <header className={styles.quickAddHeader}>
        <div className={styles.quickAddHeading}>
          <span className={styles.quickAddIcon} aria-hidden="true">
            <PackagePlus size={18} />
          </span>
          <h2 id="product-quick-add-title">{t("products.form.addNewProduct")}</h2>
        </div>
        <button
          type="button"
          className={styles.quickAddClose}
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
          aria-label={t("common.close")}
          title={t("common.close")}
        >
          <X size={18} />
        </button>
      </header>

      <form className={styles.quickAddForm} onSubmit={handleSaveClick}>
        <div className={styles.quickAddFields}>
          <TextField
            ref={productKeyRef}
            label={t("products.form.productKey")}
            value={productKey}
            onChange={(e) => setProductKey(e.target.value)}
            placeholder={t("products.form.type")}
            icon={<Hash size={15} />}
            disabled={isSubmitting}
            required
          />
          <TextField
            label={t("products.form.sku")}
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder={t("products.form.type")}
            icon={<Barcode size={15} />}
            disabled={isSubmitting}
            required
          />
          <Select
            label={t("products.form.brand")}
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder={t("products.form.select")}
            disabled={isSubmitting}
            required
            dropdownMaxHeight={200}
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
              label={
                levelIndex === 0
                  ? t("products.form.rootCategory")
                  : t("products.form.categoryLevel", { level: levelIndex + 1 })
              }
              value={String(selectedCategoryPath[levelIndex] || "")}
              onChange={(e) => {
                const nextId = Number(e.target.value) || 0;
                setSelectedCategoryPath((prev) => {
                  const next = prev.slice(0, levelIndex);
                  if (nextId > 0) {
                    next[levelIndex] = nextId;
                  }
                  return next;
                });
              }}
              placeholder={t("products.form.select")}
              disabled={isSubmitting}
              required
              dropdownMaxHeight={200}
            >
              <option value="">{t("products.form.select")}</option>
              {options.map((categoryItem) => (
                <option key={categoryItem.id} value={categoryItem.id}>
                  {categoryItem.name}
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
            required
            dropdownMaxHeight={200}
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
            required
            dropdownMaxHeight={200}
          >
            <option value="">{t("products.form.select")}</option>
            {boxSizes.map((boxSizeItem) => (
              <option key={boxSizeItem.id} value={boxSizeItem.id}>
                {boxSizeItem.code}
              </option>
            ))}
          </Select>
        </div>

        <div className={styles.quickAddFooter}>
          <div className={styles.vehicleDependentField}>
            <Car size={15} aria-hidden="true" />
            <Switch
              checked={vehicleDependent}
              onCheckedChange={setVehicleDependent}
              label={t("products.form.vehicleDependent")}
              disabled={isSubmitting}
            />
          </div>
          <div className={styles.quickAddActions}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              <X size={15} />{t("common.cancel")}
            </Button>
            <Button
              type="submit"
              className={styles.productPrimaryButton}
              disabled={isSubmitting || !productKey.trim() || !sku.trim() || !brand || !selectedCategoryId || !unitType || !boxSize}
            >
              <PackagePlus size={15} />{isSubmitting ? t("common.saving") : t("products.form.saveAndAddNext")}
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
};
