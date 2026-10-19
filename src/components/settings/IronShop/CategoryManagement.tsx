import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  CircleCheck,
  CircleDollarSign,
  CircleX,
  Layers3,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  Tags,
  Trash2,
} from "lucide-react";
import {
  Button,
  ConfirmationModal,
  IconButton,
  MultiSelect,
  Select,
  TextField,
} from "@/ui-kit";
import type { CustomerType } from "@/types/settings";
import type {
  IronCategory,
  IronCategoryPayload,
  IronType,
} from "@/types/ironCarShop";
import {
  addIronCategoryPrice,
  createIronCategory,
  deleteIronCategory,
  deleteIronCategoryPrice,
  getIronCategories,
  updateIronCategory,
} from "@/services/ironCarShop";
import { getApiErrorMessage } from "@/utils";
import styles from "./CategoryManagement.module.css";

interface BrandOption {
  id: number;
  code: string;
}

export interface BrandIronPriceItem {
  id: number;
  dictBrandId: number;
  dictBrandCode: string;
  ironTypeId: number;
  ironTypeName: string;
  customerTypeId: number;
  customerTypeName: string;
  pricePerKg: number;
  recalculateSteps?: Array<{ stepNumber: number; pricePerKg: number }>;
  recalculateStepCount?: number;
}

interface BrandPricePayload {
  brandId: number;
  ironTypeId: number;
  prices: Array<{ customerTypeId: number; pricePerKg: number }>;
}

interface CategoryManagementProps {
  mode: "categories" | "prices";
  brands: BrandOption[];
  ironTypes: Array<IronType & { isActive?: boolean }>;
  customerTypes: CustomerType[];
  brandPrices: BrandIronPriceItem[];
  cashRegisterId: number;
  onCreateBrandPrice: (payload: BrandPricePayload) => Promise<boolean>;
  onDeleteBrandPrice: (priceId: number) => void;
}

interface CategoryForm {
  code: string;
  name: string;
  dictBrandIds: string[];
}

type PendingAction =
  | { kind: "delete" | "deactivate"; category: IronCategory }
  | { kind: "delete-price"; category: IronCategory; priceId: number };

const emptyCategoryForm: CategoryForm = {
  code: "",
  name: "",
  dictBrandIds: [],
};

export const CategoryManagement = ({
  mode,
  brands,
  ironTypes,
  customerTypes,
  brandPrices,
  cashRegisterId,
  onCreateBrandPrice,
  onDeleteBrandPrice,
}: CategoryManagementProps) => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<IronCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isMutatingPrice, setIsMutatingPrice] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyCategoryForm);
  const [priceForm, setPriceForm] = useState({
    ironTypeId: "",
    customerTypeId: "",
    pricePerKg: "",
  });
  const [brandPriceForm, setBrandPriceForm] = useState({
    brandId: "",
    ironTypeId: "",
    prices: {} as Record<number, string>,
  });
  const [isSavingBrandPrice, setIsSavingBrandPrice] = useState(false);
  const [pricingMode, setPricingMode] = useState<"category" | "individual">("category");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const loadCategories = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await getIronCategories(cashRegisterId);
      setCategories(result);
      setSelectedCategoryId((current) =>
        current != null && result.some((item) => item.id === current)
          ? current
          : result[0]?.id ?? null,
      );
    } catch (error) {
      const message = getApiErrorMessage(error, t("ironManagement.categories.loadFailed"));
      setLoadError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
    // The page lifetime and assigned register are stable while this screen is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cashRegisterId]);

  const visibleCategories = useMemo(
    () => mode === "prices" ? categories.filter((category) => category.isActive) : categories,
    [categories, mode],
  );
  const selectedCategory = useMemo(
    () => visibleCategories.find((item) => item.id === selectedCategoryId) ?? visibleCategories[0] ?? null,
    [visibleCategories, selectedCategoryId],
  );

  const brandOptions = useMemo(
    () => brands.map((brand) => ({ value: String(brand.id), label: brand.code })),
    [brands],
  );
  const uncategorizedBrands = useMemo(() => {
    const categorizedBrandIds = new Set(
      categories
        .filter((category) => category.isActive)
        .flatMap((category) => category.brands.map((brand) => brand.dictBrandId)),
    );
    return brands.filter((brand) => !categorizedBrandIds.has(brand.id));
  }, [brands, categories]);
  const uncategorizedBrandIds = useMemo(
    () => new Set(uncategorizedBrands.map((brand) => brand.id)),
    [uncategorizedBrands],
  );
  const uncategorizedBrandPrices = useMemo(
    () => brandPrices.filter((price) => uncategorizedBrandIds.has(price.dictBrandId)),
    [brandPrices, uncategorizedBrandIds],
  );

  const resetForm = () => {
    setEditingCategoryId(null);
    setForm(emptyCategoryForm);
  };

  const startEdit = (category: IronCategory) => {
    setSelectedCategoryId(category.id);
    setEditingCategoryId(category.id);
    setForm({
      code: category.code,
      name: category.name,
      dictBrandIds: category.brands.map((brand) => String(brand.dictBrandId)),
    });
  };

  const handleSaveCategory = async () => {
    const code = form.code.trim();
    const name = form.name.trim();
    const dictBrandIds = form.dictBrandIds.map(Number).filter(Number.isFinite);

    if (!code || !name || dictBrandIds.length === 0) {
      toast.error(t("ironManagement.categories.validationRequired"));
      return;
    }

    const payload: IronCategoryPayload = { code, name, dictBrandIds };
    const editing = categories.find((item) => item.id === editingCategoryId);
    setIsSaving(true);
    try {
      const saved = editing
        ? await updateIronCategory(
            editing.id,
            { ...payload, isActive: editing.isActive },
            cashRegisterId,
          )
        : await createIronCategory(payload, cashRegisterId);
      toast.success(
        t(
          editing
            ? "ironManagement.categories.updated"
            : "ironManagement.categories.created",
        ),
      );
      await loadCategories();
      setSelectedCategoryId(saved.id);
      resetForm();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("ironManagement.categories.saveFailed")));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePrice = async () => {
    if (!selectedCategory) return;
    const ironTypeId = Number(priceForm.ironTypeId);
    const customerTypeId = Number(priceForm.customerTypeId);
    const pricePerKg = Number(priceForm.pricePerKg);
    if (!ironTypeId || !customerTypeId || !Number.isFinite(pricePerKg) || pricePerKg <= 0) {
      toast.error(t("ironManagement.categories.priceRequired"));
      return;
    }

    setIsMutatingPrice(true);
    try {
      await addIronCategoryPrice(
        selectedCategory.id,
        { ironTypeId, customerTypeId, pricePerKg },
        cashRegisterId,
      );
      setPriceForm({ ironTypeId: "", customerTypeId: "", pricePerKg: "" });
      toast.success(t("ironManagement.categories.priceCreated"));
      await loadCategories();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("ironManagement.categories.saveFailed")));
    } finally {
      setIsMutatingPrice(false);
    }
  };

  const handleSaveBrandPrice = async () => {
    const brandId = Number(brandPriceForm.brandId);
    const ironTypeId = Number(brandPriceForm.ironTypeId);
    if (!brandId) {
      toast.error(t("ironManagement.form.selectBrand", "Select brand"));
      return;
    }
    if (!ironTypeId) {
      toast.error(t("ironManagement.error.selectIronType", "Select iron type"));
      return;
    }

    const entries = Object.entries(brandPriceForm.prices)
      .filter(([, value]) => value.trim())
      .map(([customerTypeId, value]) => ({
        customerTypeId: Number(customerTypeId),
        pricePerKg: Number(value),
      }));
    if (entries.some((entry) => !Number.isFinite(entry.pricePerKg) || entry.pricePerKg <= 0)) {
      toast.error(t("ironManagement.error.pricePerKgGreaterThanZero", "Price per kg must be greater than zero"));
      return;
    }
    if (entries.length === 0) {
      toast.error(t("ironManagement.error.selectAtLeastOnePrice", "Please enter at least one price"));
      return;
    }

    setIsSavingBrandPrice(true);
    try {
      const saved = await onCreateBrandPrice({ brandId, ironTypeId, prices: entries });
      if (saved) {
        setBrandPriceForm({ brandId: "", ironTypeId: "", prices: {} });
      }
    } finally {
      setIsSavingBrandPrice(false);
    }
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    setIsSaving(true);
    try {
      if (pendingAction.kind === "delete-price") {
        await deleteIronCategoryPrice(
          pendingAction.category.id,
          pendingAction.priceId,
          cashRegisterId,
        );
        toast.success(t("ironManagement.categories.priceDeleted"));
      } else if (pendingAction.kind === "delete") {
        await deleteIronCategory(pendingAction.category.id, cashRegisterId);
        toast.success(t("ironManagement.categories.deleted"));
      } else {
        const category = pendingAction.category;
        await updateIronCategory(
          category.id,
          {
            code: category.code,
            name: category.name,
            isActive: false,
            dictBrandIds: category.brands.map((brand) => brand.dictBrandId),
          },
          cashRegisterId,
        );
        toast.success(t("ironManagement.categories.deactivated"));
      }
      setPendingAction(null);
      if (editingCategoryId === pendingAction.category.id) resetForm();
      await loadCategories();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("ironManagement.categories.saveFailed")));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (category: IronCategory) => {
    if (category.isActive) {
      setPendingAction({ kind: "deactivate", category });
      return;
    }
    setIsSaving(true);
    try {
      await updateIronCategory(
        category.id,
        {
          code: category.code,
          name: category.name,
          isActive: true,
          dictBrandIds: category.brands.map((brand) => brand.dictBrandId),
        },
        cashRegisterId,
      );
      toast.success(t("ironManagement.categories.activated"));
      await loadCategories();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("ironManagement.categories.saveFailed")));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className={styles.categoryWorkspace} aria-label={t(mode === "categories" ? "ironManagement.categories.title" : "ironManagement.pricing.title")}>
      <header className={styles.categoryHeader}>
        <div className={styles.categoryHeading}>
          <span className={styles.categoryHeaderIcon} aria-hidden="true"><Tags size={19} /></span>
          <div>
            <h3>{t(mode === "categories" ? "ironManagement.categories.title" : "ironManagement.pricing.title")}</h3>
            <p>{t(mode === "categories" ? "ironManagement.categories.description" : "ironManagement.pricing.description")}</p>
          </div>
        </div>
        <span className={styles.categoryCount}>{categories.length}</span>
      </header>

      {isLoading && categories.length === 0 ? (
        <div className={styles.categoryLoading} role="status">
          <LoaderCircle size={18} /> {t("ironManagement.loading")}
        </div>
      ) : loadError && categories.length === 0 ? (
        <div className={styles.categoryLoadError} role="alert">
          <span>{loadError}</span>
          <Button variant="secondary" size="small" onClick={() => void loadCategories()}>
            {t("ironManagement.categories.retry")}
          </Button>
        </div>
      ) : (
        <>
        {mode === "prices" && (
          <div className={styles.pricingModes} role="tablist" aria-label={t("ironManagement.pricing.modesLabel")}>
            <button
              type="button"
              role="tab"
              aria-selected={pricingMode === "category"}
              className={`${styles.pricingMode} ${pricingMode === "category" ? styles.pricingModeActive : ""}`}
              onClick={() => setPricingMode("category")}
            >
              <Layers3 size={15} aria-hidden="true" />
              {t("ironManagement.pricing.categoryMode")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={pricingMode === "individual"}
              className={`${styles.pricingMode} ${pricingMode === "individual" ? styles.pricingModeActive : ""}`}
              onClick={() => setPricingMode("individual")}
            >
              <CircleDollarSign size={15} aria-hidden="true" />
              {t("ironManagement.pricing.individualMode")}
            </button>
          </div>
        )}

        {(mode === "categories" || pricingMode === "category") && (
        <div className={styles.categoryLayout}>
          <section className={styles.categoryListPanel} aria-label={t("ironManagement.categories.listTitle")}>
            <div className={styles.categoryListHeader}>
              <h4>{t(mode === "categories" ? "ironManagement.categories.listTitle" : "ironManagement.pricing.chooseCategory")}</h4>
            </div>
            {visibleCategories.length === 0 ? (
              <div className={styles.categoryEmpty}>
                <Layers3 size={23} aria-hidden="true" />
                <strong>{t(mode === "prices" ? "ironManagement.pricing.noActiveCategories" : "ironManagement.categories.emptyTitle")}</strong>
                <span>{mode === "prices" ? t("ironManagement.pricing.noActiveCategoriesHint") : t("ironManagement.categories.emptyDescription")}</span>
              </div>
            ) : (
              <div className={styles.categoryList}>
                {visibleCategories.map((category) => (
                  <article
                    key={category.id}
                    className={`${styles.categoryCard} ${selectedCategoryId === category.id ? styles.categoryCardSelected : ""}`}
                  >
                    <button
                      type="button"
                      className={styles.categoryCardSelect}
                      onClick={() => setSelectedCategoryId(category.id)}
                    >
                      <span className={styles.categoryCardTop}>
                        <span className={styles.categoryCode}>{category.code}</span>
                        <span className={`${styles.categoryStatus} ${category.isActive ? styles.statusActive : styles.statusInactive}`}>
                          {category.isActive ? <CircleCheck size={12} /> : <CircleX size={12} />}
                          {category.isActive ? t("common.active") : t("common.inactive")}
                        </span>
                      </span>
                      <strong>{category.name}</strong>
                      <span className={styles.categoryBrands}>
                        {category.brands.map((brand) => brand.dictBrandCode).join(" · ") || "—"}
                      </span>
                    </button>
                    {mode === "categories" && <div className={styles.categoryCardActions}>
                      <IconButton
                        size="small"
                        variant="secondary"
                        icon={<Pencil size={14} />}
                        ariaLabel={`${t("common.edit")}: ${category.name}`}
                        title={t("common.edit")}
                        onClick={() => startEdit(category)}
                      />
                      <IconButton
                        size="small"
                        variant="secondary"
                        icon={category.isActive ? <CircleX size={14} /> : <CircleCheck size={14} />}
                        ariaLabel={`${category.isActive ? t("ironManagement.categories.deactivate") : t("ironManagement.categories.activate")}: ${category.name}`}
                        title={category.isActive ? t("ironManagement.categories.deactivate") : t("ironManagement.categories.activate")}
                        onClick={() => void handleToggleActive(category)}
                        disabled={isSaving}
                      />
                      <IconButton
                        size="small"
                        variant="secondary"
                        className={styles.categoryDelete}
                        icon={<Trash2 size={14} />}
                        ariaLabel={`${t("common.delete")}: ${category.name}`}
                        title={t("common.delete")}
                        onClick={() => setPendingAction({ kind: "delete", category })}
                      />
                    </div>}
                  </article>
                ))}
              </div>
            )}
          </section>

          <div className={styles.categoryDetailsColumn}>
            {mode === "categories" ? (
            <section className={styles.categoryFormPanel}>
              <div className={styles.categoryPanelTitle}>
                <span className={styles.categoryPanelIcon}><Layers3 size={16} /></span>
                <div>
                  <h4>{editingCategoryId ? t("ironManagement.categories.editTitle") : t("ironManagement.categories.createTitle")}</h4>
                  <p>{t("ironManagement.categories.formHint")}</p>
                </div>
              </div>
              <div className={styles.categoryFormGrid}>
                <TextField
                  label={t("ironManagement.categories.code")}
                  value={form.code}
                  onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                  placeholder="FOREIGN_CARS"
                />
                <TextField
                  label={t("ironManagement.categories.name")}
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder={t("ironManagement.categories.namePlaceholder")}
                />
                <MultiSelect
                  className={styles.brandMultiSelect}
                  label={t("ironManagement.categories.brands")}
                  options={brandOptions}
                  value={form.dictBrandIds}
                  onChange={(dictBrandIds) => setForm((current) => ({ ...current, dictBrandIds }))}
                  searchable
                  searchPlaceholder={t("common.search")}
                  placeholder={t("ironManagement.categories.selectBrands")}
                  renderValue={(selected) => t("ironManagement.categories.selectedBrands", { count: selected.length })}
                />
              </div>
              <footer className={styles.categoryFormActions}>
                {editingCategoryId && (
                  <Button variant="secondary" size="medium" onClick={resetForm}>
                    {t("common.cancel")}
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="medium"
                  onClick={() => void handleSaveCategory()}
                  disabled={isSaving}
                >
                  {isSaving ? <LoaderCircle size={15} /> : <Plus size={15} />}
                  {editingCategoryId ? t("common.save") : t("ironManagement.categories.createCategory")}
                </Button>
              </footer>
            </section>
            ) : (
            <section className={styles.categoryPricePanel}>
              <div className={styles.categoryPanelTitle}>
                <span className={styles.categoryPanelIcon}><CircleCheck size={16} /></span>
                <div>
                  <h4>{t("ironManagement.categories.pricesTitle")}</h4>
                  <p>{selectedCategory?.name ?? t("ironManagement.categories.selectCategoryForPrices")}</p>
                </div>
              </div>
              {!selectedCategory ? (
                <div className={styles.categoryPriceEmpty}>{t("ironManagement.categories.selectCategoryForPrices")}</div>
              ) : (
                <>
                  <p className={styles.selectedCategoryHint}>
                    <strong>{selectedCategory.name}</strong>
                    <span>{selectedCategory.brands.map((brand) => brand.dictBrandCode).join(" · ")}</span>
                  </p>
                  <div className={styles.categoryPriceForm}>
                    <Select
                      label={t("ironManagement.columns.ironType")}
                      value={priceForm.ironTypeId}
                      onChange={(event) => setPriceForm((current) => ({ ...current, ironTypeId: event.target.value }))}
                    >
                      <option value="">{t("ironManagement.form.selectIronType")}</option>
                      {ironTypes.filter((item) => item.isActive !== false).map((item) => (
                        <option key={item.id} value={item.id}>{item.name || item.code}</option>
                      ))}
                    </Select>
                    <Select
                      label={t("ironManagement.form.customerType")}
                      value={priceForm.customerTypeId}
                      onChange={(event) => setPriceForm((current) => ({ ...current, customerTypeId: event.target.value }))}
                    >
                      <option value="">{t("ironManagement.form.selectCustomerType")}</option>
                      {customerTypes.filter((item) => item.isActive).map((item) => (
                        <option key={item.id} value={item.id}>{item.code}</option>
                      ))}
                    </Select>
                    <TextField
                      type="number"
                      min="0"
                      label={t("ironManagement.form.pricePerKg")}
                      value={priceForm.pricePerKg}
                      onChange={(event) => setPriceForm((current) => ({ ...current, pricePerKg: event.target.value }))}
                      placeholder="0"
                    />
                    <Button
                      variant="primary"
                      size="medium"
                      onClick={() => void handleSavePrice()}
                      disabled={isMutatingPrice || !selectedCategory.isActive}
                    >
                      {isMutatingPrice ? <LoaderCircle size={15} /> : <Plus size={15} />}
                      {t("ironManagement.categories.addPrice")}
                    </Button>
                  </div>
                  {selectedCategory.prices.length === 0 ? (
                    <div className={styles.categoryPriceEmpty}>{t("ironManagement.categories.noPrices")}</div>
                  ) : (
                    <div className={styles.categoryPriceList}>
                      {selectedCategory.prices.map((price) => {
                        const ironType = ironTypes.find((item) => item.id === price.ironTypeId);
                        const customerType = customerTypes.find((item) => item.id === price.customerTypeId);
                        return (
                          <div key={price.id} className={styles.categoryPriceRow}>
                            <span className={styles.categoryPriceIdentity}>
                              <strong>{ironType?.name || ironType?.code || `#${price.ironTypeId}`}</strong>
                              <small>{customerType?.code || `#${price.customerTypeId}`}</small>
                            </span>
                            <strong className={styles.categoryPriceValue}>
                              {price.pricePerKg.toLocaleString()} <small>AMD/kg</small>
                            </strong>
                            <IconButton
                              size="small"
                              variant="secondary"
                              className={styles.categoryDelete}
                              icon={<Trash2 size={14} />}
                              ariaLabel={`${t("common.delete")}: ${ironType?.name || ironType?.code || price.ironTypeId} / ${customerType?.code || price.customerTypeId}`}
                              title={t("common.delete")}
                              onClick={() => setPendingAction({ kind: "delete-price", category: selectedCategory, priceId: price.id })}
                              disabled={isMutatingPrice}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </section>
            )}
          </div>
        </div>
        )}
        {mode === "prices" && pricingMode === "individual" && (
        <section className={styles.categoryFallbackPanel}>
          <header className={styles.categoryFallbackHeader}>
            <div className={styles.categoryPanelTitle}>
              <span className={styles.categoryPanelIcon} aria-hidden="true"><CircleDollarSign size={16} /></span>
              <div>
                <h4>{t("ironManagement.categories.fallbackPricesTitle")}</h4>
                <p>{t("ironManagement.categories.fallbackPricesDescription")}</p>
              </div>
            </div>
            <span className={styles.categoryCount}>{uncategorizedBrands.length}</span>
          </header>

          {uncategorizedBrands.length === 0 ? (
            <div className={styles.categoryPriceEmpty}>{t("ironManagement.categories.allBrandsCategorized")}</div>
          ) : (
            <>
              <div className={styles.categoryFallbackSelectors}>
                <Select
                  label={t("ironManagement.columns.brand")}
                  value={brandPriceForm.brandId}
                  searchable
                  searchPlaceholder={t("common.search")}
                  onChange={(event) => setBrandPriceForm((current) => ({ ...current, brandId: event.target.value }))}
                >
                  <option value="">{t("ironManagement.form.selectBrand")}</option>
                  {uncategorizedBrands.map((brand) => <option key={brand.id} value={brand.id}>{brand.code}</option>)}
                </Select>
                <Select
                  label={t("ironManagement.columns.ironType")}
                  value={brandPriceForm.ironTypeId}
                  searchable
                  searchPlaceholder={t("common.search")}
                  onChange={(event) => setBrandPriceForm((current) => ({ ...current, ironTypeId: event.target.value }))}
                >
                  <option value="">{t("ironManagement.form.selectIronType")}</option>
                  {ironTypes.map((ironType) => <option key={ironType.id} value={ironType.id}>{ironType.name || ironType.code}</option>)}
                </Select>
              </div>

              <div className={styles.categoryFallbackCustomerPrices}>
                <h5>{t("ironManagement.pricesByCustomerType")}</h5>
                {customerTypes.length > 0 ? (
                  <div className={styles.categoryFallbackCustomerGrid}>
                    {customerTypes.map((customerType) => (
                      <TextField
                        key={customerType.id}
                        type="number"
                        min="0"
                        label={`${customerType.code} · ${t("ironManagement.form.pricePerKg")}`}
                        placeholder="0.00"
                        value={brandPriceForm.prices[customerType.id] || ""}
                        onChange={(event) => setBrandPriceForm((current) => ({
                          ...current,
                          prices: { ...current.prices, [customerType.id]: event.target.value },
                        }))}
                      />
                    ))}
                  </div>
                ) : (
                  <span className={styles.categoryPriceEmpty}>{t("common.loading")}</span>
                )}
              </div>
              <footer className={styles.categoryFallbackActions}>
                <Button
                  variant="secondary"
                  size="medium"
                  onClick={() => setBrandPriceForm({ brandId: "", ironTypeId: "", prices: {} })}
                >
                  <RotateCcw size={15} aria-hidden="true" />
                  {t("common.reset")}
                </Button>
                <Button
                  variant="primary"
                  size="medium"
                  onClick={() => void handleSaveBrandPrice()}
                  disabled={isSavingBrandPrice || customerTypes.length === 0}
                >
                  {isSavingBrandPrice ? <LoaderCircle size={15} /> : <Plus size={15} />}
                  {t("ironManagement.addPrice")}
                </Button>
              </footer>

              <div className={styles.categoryFallbackList}>
                <h5>{t("ironManagement.categories.fallbackPriceListTitle")}</h5>
                {uncategorizedBrandPrices.length > 0 ? (
                  <div className={styles.categoryPriceList}>
                    {uncategorizedBrandPrices.map((price) => {
                      const brand = brands.find((item) => item.id === price.dictBrandId);
                      const ironType = ironTypes.find((item) => item.id === price.ironTypeId);
                      const customerType = customerTypes.find((item) => item.id === price.customerTypeId);
                      return (
                        <div key={price.id} className={styles.categoryPriceRow}>
                          <span className={styles.categoryPriceIdentity}>
                            <strong>{brand?.code || price.dictBrandCode}</strong>
                            <small>{ironType?.name || ironType?.code || price.ironTypeName} · {customerType?.code || price.customerTypeName}</small>
                          </span>
                          <strong className={styles.categoryPriceValue}>
                            {price.pricePerKg.toLocaleString()} <small>AMD/kg</small>
                          </strong>
                          <IconButton
                            size="small"
                            variant="secondary"
                            className={styles.categoryDelete}
                            icon={<Trash2 size={14} />}
                            ariaLabel={`${t("common.delete")}: ${brand?.code || price.dictBrandCode} / ${ironType?.name || price.ironTypeName}`}
                            title={t("common.delete")}
                            onClick={() => onDeleteBrandPrice(price.id)}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={styles.categoryPriceEmpty}>{t("ironManagement.categories.noFallbackPrices")}</div>
                )}
              </div>
            </>
          )}
        </section>
        )}
        </>
      )}

      {pendingAction && (
        <ConfirmationModal
          open
          preventClose
          onOpenChange={(open) => !open && setPendingAction(null)}
          title={t(
            pendingAction.kind === "delete-price"
              ? "ironManagement.categories.deletePriceTitle"
              : pendingAction.kind === "deactivate"
                ? "ironManagement.categories.deactivateTitle"
                : "ironManagement.categories.deleteTitle",
          )}
          description={t(
            pendingAction.kind === "delete-price"
              ? "ironManagement.categories.deletePriceConfirm"
              : pendingAction.kind === "deactivate"
                ? "ironManagement.categories.deactivateConfirm"
                : "ironManagement.categories.deleteConfirm",
            { name: pendingAction.category.name },
          )}
          confirmText={t(pendingAction.kind === "deactivate" ? "ironManagement.categories.deactivate" : "common.delete")}
          confirmLoading={isSaving}
          onConfirm={() => void confirmAction()}
        />
      )}
    </section>
  );
};