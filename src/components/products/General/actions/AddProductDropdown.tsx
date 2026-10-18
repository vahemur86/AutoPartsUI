import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Check, CircleAlert, CircleCheck, Car, LoaderCircle, PackagePlus, Plus, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchBrands,
  fetchCategories,
  fetchUnitTypes,
  fetchBoxSizes,
} from "@/store/slices/productSettingsSlice";

// ui-kit
import { Button, Switch, Select } from "@/ui-kit";

// types
import type { ProductFormData } from "../types";

// styles
import styles from "./AddProductDropdown.module.css";

export interface AddProductDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ProductFormData) => Promise<void>;
}

type ProductRowStatus = "ready" | "creating" | "created" | "failed";

interface ProductEntryRow {
  id: number;
  productKey: string;
  sku: string;
  status: ProductRowStatus;
  error?: string;
}

const createEntryRow = (id: number): ProductEntryRow => ({
  id,
  productKey: "",
  sku: "",
  status: "ready",
});

export const AddProductDropdown = ({
  open,
  onOpenChange,
  onSave,
}: AddProductDropdownProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { brands, categories, unitTypes, boxSizes, fetchedData } =
    useAppSelector((state) => state.productSettings);

  const [rows, setRows] = useState<ProductEntryRow[]>([createEntryRow(1)]);
  const nextRowId = useRef(2);
  const [brand, setBrand] = useState("");
  const [selectedCategoryPath, setSelectedCategoryPath] = useState<number[]>([]);
  const [unitType, setUnitType] = useState("");
  const [boxSize, setBoxSize] = useState("");
  const [vehicleDependent, setVehicleDependent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const pendingRows = rows.filter((row) => row.status !== "created");
  const hasMissingRowValues = pendingRows.some(
    (row) => !row.productKey.trim() || !row.sku.trim(),
  );
  const hasDuplicateCodes = new Set(
    rows.map((row) => row.productKey.trim().toLocaleLowerCase()).filter(Boolean),
  ).size !== rows.filter((row) => row.productKey.trim()).length;
  const hasDuplicateSkus = new Set(
    rows.map((row) => row.sku.trim().toLocaleLowerCase()).filter(Boolean),
  ).size !== rows.filter((row) => row.sku.trim()).length;
  const hasDuplicateValues = hasDuplicateCodes || hasDuplicateSkus;

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

  const sharedFieldsValid =
    !!brand && !!selectedCategoryId && !!unitType && !!boxSize;

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
      setRows([createEntryRow(1)]);
      nextRowId.current = 2;
      setBrand("");
      setSelectedCategoryPath([]);
      setUnitType("");
      setBoxSize("");
      setVehicleDependent(false);
      setHasTriedSubmit(false);
    }
  }, [open]);

  const handleSaveClick = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasTriedSubmit(true);
    if (!sharedFieldsValid || hasMissingRowValues || hasDuplicateValues || !pendingRows.length) return;

    setIsSubmitting(true);
    let createdCount = 0;
    let failedCount = 0;
    try {
      for (const row of pendingRows) {
        setRows((current) =>
          current.map((item) =>
            item.id === row.id ? { ...item, status: "creating", error: undefined } : item,
          ),
        );

        try {
          await onSave({
            productKey: row.productKey.trim(),
            sku: row.sku.trim(),
            brand: parseInt(brand, 10),
            category: parseInt(selectedCategoryId, 10),
            unitType: parseInt(unitType, 10),
            boxSize: parseInt(boxSize, 10),
            vehicleDependent,
          });
          createdCount += 1;
          setRows((current) =>
            current.map((item) =>
              item.id === row.id ? { ...item, status: "created", error: undefined } : item,
            ),
          );
        } catch (error: unknown) {
          failedCount += 1;
          setRows((current) =>
            current.map((item) =>
              item.id === row.id
                ? {
                    ...item,
                    status: "failed",
                    error: error instanceof Error ? error.message : t("products.bulk.rowFailed"),
                  }
                : item,
            ),
          );
        }
      }

      if (createdCount > 0) {
        toast.success(t("products.success.productsCreated", { count: createdCount }));
      }
      if (failedCount > 0) {
        toast.error(t("products.error.bulkCreateFailed", { count: failedCount }));
      } else {
        setRows([createEntryRow(nextRowId.current++)]);
        setHasTriedSubmit(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateRow = (id: number, updates: Partial<ProductEntryRow>) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...updates, status: "ready", error: undefined } : row)),
    );
  };

  const addRow = () => {
    setRows((current) => [...current, createEntryRow(nextRowId.current++)]);
  };

  const removeRow = (id: number) => {
    setRows((current) => current.filter((row) => row.id !== id || row.status === "created"));
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

      <form className={styles.quickAddForm} onSubmit={handleSaveClick} noValidate>
        <div className={styles.quickAddFields}>
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

        <section className={styles.bulkEntries} aria-labelledby="product-bulk-entries-title">
          <div className={styles.bulkEntriesHeader}>
            <div>
              <h3 id="product-bulk-entries-title">{t("products.bulk.title")}</h3>
              <p>{t("products.bulk.description")}</p>
            </div>
            <Button type="button" variant="secondary" onClick={addRow} disabled={isSubmitting}>
              <Plus size={14} aria-hidden="true" />
              {t("products.bulk.addRow")}
            </Button>
          </div>

          <div className={styles.bulkTableWrap}>
            <table className={styles.bulkTable}>
              <thead>
                <tr>
                  <th scope="col">{t("products.form.productKey")}</th>
                  <th scope="col">{t("products.form.sku")}</th>
                  <th scope="col">{t("products.bulk.status")}</th>
                  <th scope="col"><span className={styles.visuallyHidden}>{t("common.actions")}</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <label className={styles.visuallyHidden} htmlFor={`product-code-${row.id}`}>
                        {t("products.form.productKey")}
                      </label>
                      <input
                        id={`product-code-${row.id}`}
                        className={styles.bulkInput}
                        value={row.productKey}
                        onChange={(event) => updateRow(row.id, { productKey: event.target.value })}
                        placeholder={t("products.form.type")}
                        required
                        disabled={isSubmitting || row.status === "created"}
                        aria-invalid={hasTriedSubmit && !row.productKey.trim() && row.status !== "created"}
                      />
                    </td>
                    <td>
                      <label className={styles.visuallyHidden} htmlFor={`product-sku-${row.id}`}>
                        {t("products.form.sku")}
                      </label>
                      <input
                        id={`product-sku-${row.id}`}
                        className={styles.bulkInput}
                        value={row.sku}
                        onChange={(event) => updateRow(row.id, { sku: event.target.value })}
                        placeholder={t("products.form.type")}
                        required
                        disabled={isSubmitting || row.status === "created"}
                        aria-invalid={hasTriedSubmit && !row.sku.trim() && row.status !== "created"}
                      />
                    </td>
                    <td>
                      <span
                        className={`${styles.bulkStatus} ${row.status === "created" ? styles.bulkStatusCreated : ""} ${row.status === "failed" ? styles.bulkStatusFailed : ""} ${row.status === "creating" ? styles.bulkStatusCreating : ""}`}
                        title={row.error}
                      >
                        {row.status === "created" ? <CircleCheck size={14} aria-hidden="true" /> : null}
                        {row.status === "failed" ? <CircleAlert size={14} aria-hidden="true" /> : null}
                        {row.status === "creating" ? <LoaderCircle className={styles.bulkSpinner} size={14} aria-hidden="true" /> : null}
                        {t(`products.bulk.rowStatus.${row.status}`)}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.removeBulkRow}
                        onClick={() => removeRow(row.id)}
                        disabled={isSubmitting || row.status === "created" || rows.length === 1}
                        aria-label={t("products.bulk.removeRow")}
                        title={t("products.bulk.removeRow")}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasTriedSubmit && hasDuplicateValues && (
            <p className={styles.bulkValidation} role="alert">{t("products.bulk.duplicateValues")}</p>
          )}
          {hasTriedSubmit && !sharedFieldsValid && (
            <p className={styles.bulkValidation} role="alert">{t("products.bulk.requiredSharedFields")}</p>
          )}
        </section>

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
              disabled={isSubmitting || !pendingRows.length}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? <LoaderCircle className={styles.bulkSpinner} size={15} /> : <Check size={15} />}
              {isSubmitting
                ? t("products.bulk.creating", { count: pendingRows.length })
                : rows.some((row) => row.status === "failed")
                  ? t("products.bulk.retryFailed")
                  : t("products.bulk.create", { count: pendingRows.length })}
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
};
