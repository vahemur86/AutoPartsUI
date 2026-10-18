import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { createPortal } from "react-dom";
import { Button, ConfirmationModal, IconButton, TextField, Select } from "@/ui-kit";
import { getApiErrorMessage, getCashRegisterId, getHeaders, mapI18nCodeToApiCode } from "@/utils";
import i18n from "i18next";
import api from "@/services";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCustomerTypes } from "@/store/slices/customerTypesSlice";
import {
  CircleCheck,
  CircleX,
  CircleDollarSign,
  Filter,
  Layers3,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  Tags,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import styles from "./IronShop.module.css";

const IRON_SHOP_BASE_PATH = "/admin/iron-shop";

interface IronTypeItem {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  translations?: Record<string, string>;
}

interface BrandItem {
  id: number;
  code: string;
}

interface BrandIronPriceItem {
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

const initialIronTypeForm = {
  code: "",
  translations: { en: "", hy: "", ru: "" },
  isActive: true,
};

const initialPriceForm = {
  autoBrandId: "",
  ironTypeId: "",
  prices: {} as Record<number, string>, // customerTypeId -> price
};

const initialRecalculationStepForm = {
  autoBrandId: "",
  ironTypeId: "",
  pricePerKg: "",
};

export const IronShopSettings = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const cashRegisterId = useMemo(() => getCashRegisterId(), []);
  const { customerTypes } = useAppSelector((state) => state.customerTypes);
  const [ironTypes, setIronTypes] = useState<IronTypeItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [prices, setPrices] = useState<BrandIronPriceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [selectedIronTypeId, setSelectedIronTypeId] = useState<string>("");
  const [form, setForm] = useState(initialIronTypeForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [typeDrawerOpen, setTypeDrawerOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    kind: "ironType" | "price";
    id: number;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [priceForm, setPriceForm] = useState(initialPriceForm);
  const [recalculationStepForm, setRecalculationStepForm] = useState(initialRecalculationStepForm);
  const [activeTab, setActiveTab] = useState<
    "iron-types" | "prices" | "recalculation"
  >("iron-types");
  const activeIronTypeCount = useMemo(
    () => ironTypes.filter((item) => item.isActive).length,
    [ironTypes],
  );

  useEffect(() => {
    if (!typeDrawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeTypeDrawer();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [typeDrawerOpen]);

  const customerTypeMap = useMemo(
    () => Object.fromEntries(customerTypes.map((type) => [type.id, type.code])),
    [customerTypes],
  );

  const resetIronTypeForm = () => {
    setForm(initialIronTypeForm);
    setEditingId(null);
  };

  const closeTypeDrawer = () => {
    setTypeDrawerOpen(false);
    resetIronTypeForm();
  };

  const resetPriceForm = () => {
    setPriceForm(initialPriceForm);
  };

  const resetRecalculationStepForm = () => {
    setRecalculationStepForm(initialRecalculationStepForm);
  };

  const getApiLang = () => {
    const currentLang =
      i18n.resolvedLanguage ||
      i18n.language ||
      localStorage.getItem("i18nextLng") ||
      "en";
    return mapI18nCodeToApiCode(currentLang);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const lang = getApiLang();
      const [ironTypesRes, brandsRes] = await Promise.all([
        api.get(`${IRON_SHOP_BASE_PATH}/iron-types`, { params: { lang }, headers: { ...getHeaders(cashRegisterId) } }),
        api.get(`${IRON_SHOP_BASE_PATH}/brands`, { params: { lang }, headers: { ...getHeaders(cashRegisterId) } }),
      ]);
      setIronTypes(Array.isArray(ironTypesRes.data) ? ironTypesRes.data : []);
      setBrands(Array.isArray(brandsRes.data) ? brandsRes.data : []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("common.error")));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    void dispatch(fetchCustomerTypes());
  }, [cashRegisterId, dispatch]);

  const loadPrices = async (brandId?: number, ironTypeId?: number) => {
    try {
      const lang = getApiLang();
      const params: Record<string, string | number> = { lang };
      if (brandId) params.brandId = brandId;
      if (ironTypeId) params.ironTypeId = ironTypeId;
      const response = await api.get(`${IRON_SHOP_BASE_PATH}/brand-iron-prices/all`, { params, headers: { ...getHeaders(cashRegisterId) } });
      setPrices(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("common.error")));
    }
  };

  useEffect(() => {
    if (activeTab !== "prices") {
      return;
    }

    const brandFilter = Number(selectedBrandId || 0) || undefined;
    const ironTypeFilter = Number(selectedIronTypeId || 0) || undefined;
    void loadPrices(brandFilter, ironTypeFilter);
  }, [activeTab, selectedBrandId, selectedIronTypeId]);

  const handleOpenCreateIronType = () => {
    resetIronTypeForm();
    setTypeDrawerOpen(true);
  };

  const getTranslationFieldKey = (langCode: string) =>
    langCode === "am" ? "hy" : langCode;

  const handleEditIronType = (item: IronTypeItem) => {
    const currentLang =
      i18n.resolvedLanguage ||
      i18n.language ||
      localStorage.getItem("i18nextLng") ||
      "en";
    const currentField = getTranslationFieldKey(currentLang);

    const initialTranslations = {
      en: item.translations?.en ?? "",
      hy: item.translations?.hy ?? "",
      ru: item.translations?.ru ?? "",
    };

    if (!item.translations || !Object.values(item.translations).some(Boolean)) {
      initialTranslations[currentField as keyof typeof initialTranslations] =
        item.name || item.code || "";
    }

    setEditingId(item.id);
    setForm({
      code: item.code,
      translations: initialTranslations,
      isActive: item.isActive,
    });
    setTypeDrawerOpen(true);
  };

  const submitIronType = async () => {
    const trimmedCode = form.code.trim();
    const trimmedTranslations = {
      en: form.translations.en.trim(),
      hy: form.translations.hy.trim(),
      ru: form.translations.ru.trim(),
    };

    if (!trimmedCode) {
      toast.error(t("ironManagement.error.codeRequired", "Code is required"));
      return;
    }

    if (!Object.values(trimmedTranslations).some(Boolean)) {
      toast.error(
        t("ironManagement.error.translationRequired", "At least one translation is required"),
      );
      return;
    }

    try {
      const lang = getApiLang();
      const payload = {
        code: trimmedCode,
        translations: trimmedTranslations,
        isActive: form.isActive,
      };
      if (editingId) {
        await api.put(`${IRON_SHOP_BASE_PATH}/iron-types/${editingId}`, payload, { params: { lang }, headers: { ...getHeaders(cashRegisterId) } });
        toast.success(t("ironManagement.success.ironTypeUpdated"));
      } else {
        await api.post(`${IRON_SHOP_BASE_PATH}/iron-types`, payload, { params: { lang }, headers: { ...getHeaders(cashRegisterId) } });
        toast.success(t("ironManagement.success.ironTypeCreated"));
      }
      resetIronTypeForm();
      setTypeDrawerOpen(false);
      void loadData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("ironManagement.error.failedToUpdateIronType")));
    }
  };

  const deleteIronType = (id: number) => {
    setPendingDelete({ kind: "ironType", id });
  };

  const submitPrice = async () => {
    const autoBrandId = Number(priceForm.autoBrandId);
    if (!autoBrandId) {
      toast.error(t("ironManagement.form.selectBrand", "Select brand"));
      return;
    }

    const ironTypeId = Number(priceForm.ironTypeId);
    if (!ironTypeId) {
      toast.error(t("ironManagement.error.selectIronType"));
      return;
    }

    // Collect prices for all customer types
    const prices: Array<{ CustomerTypeId: number; PricePerKg: number }> = [];
    for (const customerType of customerTypes) {
      const priceStr = priceForm.prices[customerType.id];
      if (priceStr && priceStr.trim()) {
        const price = Number(priceStr);
        if (Number.isNaN(price) || price <= 0) {
          toast.error(
            t(
              "ironManagement.error.pricePerKgGreaterThanZero",
              "Price per kg must be greater than zero",
            ),
          );
          return;
        }
        prices.push({
          CustomerTypeId: customerType.id,
          PricePerKg: price,
        });
      }
    }

    if (prices.length === 0) {
      toast.error(t("ironManagement.error.selectAtLeastOnePrice", "Please enter price for at least one customer type"));
      return;
    }

    try {
      const lang = getApiLang();
      const payload = {
        AutoBrandId: autoBrandId,
        IronTypeId: ironTypeId,
        Prices: prices,
      };

      await api.post(
        `${IRON_SHOP_BASE_PATH}/brand-iron-prices`,
        payload,
        { params: { lang }, headers: { ...getHeaders(cashRegisterId) } },
      );
      toast.success(t("ironManagement.success.basePriceCreated", "Base prices created successfully"));
      resetPriceForm();
      void loadPrices(Number(selectedBrandId || 0) || undefined, Number(selectedIronTypeId || 0) || undefined);
    } catch (error) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError?.response?.status === 409) {
        toast.error(t("ironManagement.error.basePriceAlreadyExists", "Base price already exists for this Brand + Iron Type + Customer Type combination"));
      } else {
        toast.error(getApiErrorMessage(error, t("ironManagement.error.failedToCreateIronPrice")));
      }
    }
  };

  const submitRecalculationStep = async () => {
    const autoBrandId = Number(recalculationStepForm.autoBrandId);
    if (!autoBrandId) {
      toast.error(t("ironManagement.form.selectBrand", "Select brand"));
      return;
    }

    const ironTypeId = Number(recalculationStepForm.ironTypeId);
    if (!ironTypeId) {
      toast.error(t("ironManagement.error.selectIronType"));
      return;
    }

    const pricePerKg = Number(recalculationStepForm.pricePerKg);
    if (!recalculationStepForm.pricePerKg || Number.isNaN(pricePerKg) || pricePerKg <= 0) {
      toast.error(
        t(
          "ironManagement.error.pricePerKgGreaterThanZero",
          "Price per kg must be greater than zero",
        ),
      );
      return;
    }

    try {
      const lang = getApiLang();
      await api.post(
        `${IRON_SHOP_BASE_PATH}/admin/recalculate-step`,
        {
          dictBrandId: autoBrandId,
          ironTypeId,
          customerTypeId: 1, // Standard customer only
          pricePerKg,
        },
        {
          params: { lang },
          headers: { ...getHeaders(cashRegisterId) },
        },
      );
      toast.success(t("ironManagement.success.recalculationStepAdded", "Recalculation step added successfully"));
      resetRecalculationStepForm();
      void loadPrices(Number(selectedBrandId || 0) || undefined, Number(selectedIronTypeId || 0) || undefined);
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("ironManagement.error.failedToCreateRecalculationStep", "Failed to add recalculation step")));
    }
  };

  const deletePrice = (id: number) => {
    setPendingDelete({ kind: "price", id });
  };

  const confirmPendingDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      const lang = getApiLang();
      if (pendingDelete.kind === "ironType") {
        await api.delete(`${IRON_SHOP_BASE_PATH}/iron-types/${pendingDelete.id}`, { params: { lang }, headers: { ...getHeaders(cashRegisterId) } });
        toast.success(t("ironManagement.success.ironTypeUpdated"));
        await loadData();
      } else {
        await api.delete(`${IRON_SHOP_BASE_PATH}/brand-iron-prices/${pendingDelete.id}`, { params: { lang }, headers: { ...getHeaders(cashRegisterId) } });
        toast.success(t("ironManagement.success.ironPriceDeleted", "Price deleted successfully"));
        await loadPrices(Number(selectedBrandId || 0) || undefined, Number(selectedIronTypeId || 0) || undefined);
      }
      setPendingDelete(null);
    } catch (error) {
      const fallback = pendingDelete.kind === "ironType"
        ? t("ironManagement.error.failedToUpdateIronType")
        : t("ironManagement.error.failedToDeleteIronPrice", "Failed to delete iron price");
      toast.error(getApiErrorMessage(error, fallback));
    } finally {
      setIsDeleting(false);
    }
  };

  const getCustomerTypeLabel = (item: BrandIronPriceItem) => {
    const backendName = item.customerTypeName?.trim();
    if (backendName && !/^\d+$/.test(backendName)) {
      return backendName;
    }

    const code = customerTypeMap[item.customerTypeId];
    if (code && !/^\d+$/.test(code)) {
      return code;
    }

    return t("ironManagement.unknownCustomerType", "Unknown customer type");
  };

  const groupedPriceRules = useMemo(() => {
    const groups = new Map<
      string,
      { brandCode: string; ironTypeName: string; items: BrandIronPriceItem[] }
    >();

    prices.forEach((item) => {
      const key = `${item.dictBrandId}-${item.ironTypeId}`;
      const group = groups.get(key) ?? {
        brandCode: item.dictBrandCode,
        ironTypeName: item.ironTypeName,
        items: [],
      };
      group.items.push(item);
      groups.set(key, group);
    });

    return Array.from(groups.entries()).map(([key, group]) => ({ key, ...group }));
  }, [prices]);

  return (
    <div className={styles.ironShop}>
      <header className={styles.workspaceHeader}>
        <div className={styles.workspaceHeading}>
          <span className={styles.workspaceIcon} aria-hidden="true">
            <Wrench size={20} />
          </span>
          <div>
            <span className={styles.workspaceEyebrow}>
              {t("ironManagement.section.ironTypes")} · {t("ironManagement.section.priceRules")}
            </span>
            <h2>{t("ironManagement.title", "Iron Shop Settings")}</h2>
            <p>{t("ironManagement.workspaceHint", "Define iron types first, then configure their pricing rules.")}</p>
          </div>
        </div>
        <div className={styles.workspaceMetrics}>
          <div className={styles.metric}>
            <span>{t("ironManagement.tabs.ironTypes", "Iron Types")}</span>
            <strong>{ironTypes.length}</strong>
          </div>
          <div className={styles.metricDivider} />
          <div className={styles.metric}>
            <span>{t("common.active")}</span>
            <strong>{activeIronTypeCount}</strong>
          </div>
        </div>
      </header>

      <div className={styles.workflowTabs} role="tablist" aria-label={t("ironManagement.ariaLabels.ironManagementSections")}>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "iron-types"}
          aria-controls="iron-types-panel"
          className={`${styles.workflowTab} ${activeTab === "iron-types" ? styles.workflowTabActive : ""}`}
          onClick={() => setActiveTab("iron-types")}
        >
          <Layers3 size={17} aria-hidden="true" />
          <span>{t("ironManagement.tabs.ironTypes", "Iron Types")}</span>
          <span className={styles.workflowStep}>01</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "prices"}
          aria-controls="price-rules-panel"
          className={`${styles.workflowTab} ${activeTab === "prices" ? styles.workflowTabActive : ""}`}
          onClick={() => setActiveTab("prices")}
        >
          <Tags size={17} aria-hidden="true" />
          <span>{t("ironManagement.tabs.priceRules", "Price Rules")}</span>
          <span className={styles.workflowStep}>02</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "recalculation"}
          aria-controls="recalculation-panel"
          className={`${styles.workflowTab} ${activeTab === "recalculation" ? styles.workflowTabActive : ""}`}
          onClick={() => setActiveTab("recalculation")}
        >
          <Wrench size={17} aria-hidden="true" />
          <span>{t("ironManagement.tabs.recalculationSteps", "Recalculation Steps")}</span>
          <span className={styles.workflowStep}>03</span>
        </button>
      </div>

      {loading && (
        <div className={styles.loadingState} role="status" aria-live="polite">
          <LoaderCircle size={18} aria-hidden="true" />
          {t("ironManagement.loading")}
        </div>
      )}

      {activeTab === "iron-types" ? (
        <section id="iron-types-panel" role="tabpanel" className={styles.workspacePanel}>
          <header className={styles.panelHeader}>
            <div className={styles.panelTitleGroup}>
              <span className={styles.panelIcon} aria-hidden="true"><Layers3 size={17} /></span>
              <div>
                <h3>{t("ironManagement.section.ironTypes", "Iron Types")}</h3>
                <p>{t("ironManagement.ironTypesHint", "Create the iron types that will be used in brand pricing rules.")}</p>
              </div>
            </div>
            <Button variant="primary" size="medium" onClick={handleOpenCreateIronType}>
              <Plus size={16} aria-hidden="true" />
              {t("ironManagement.addIronType")}
            </Button>
          </header>
          {ironTypes.length === 0 && !loading ? (
            <div className={styles.emptyState}>
              <Layers3 size={22} aria-hidden="true" />
              <strong>{t("ironManagement.ironTypesEmpty", "No iron types yet")}</strong>
              <span>{t("ironManagement.ironTypesHint", "Create the iron types that will be used in brand pricing rules.")}</span>
            </div>
          ) : (
            <div className={styles.ironTypeGrid}>
              {ironTypes.map((item) => (
                <article key={item.id} className={styles.ironTypeCard}>
                  <div className={styles.ironTypeIdentity}>
                    <span className={styles.ironTypeBadge} aria-hidden="true">
                      <Layers3 size={17} />
                    </span>
                    <div className={styles.ironTypeCopy}>
                      <strong>{item.name || item.code}</strong>
                      <span>{item.code} · #{item.id}</span>
                    </div>
                    <span className={`${styles.typeStatus} ${item.isActive ? styles.typeStatusActive : styles.typeStatusInactive}`}>
                      {item.isActive ? <CircleCheck size={13} aria-hidden="true" /> : <CircleX size={13} aria-hidden="true" />}
                      {item.isActive ? t("common.active") : t("common.inactive")}
                    </span>
                  </div>
                  <div className={styles.ironTypeActions}>
                    <IconButton
                      size="small"
                      variant="secondary"
                      icon={<Pencil size={14} />}
                      ariaLabel={`${t("common.edit")}: ${item.name || item.code}`}
                      title={t("common.edit")}
                      onClick={() => handleEditIronType(item)}
                    />
                    <IconButton
                      size="small"
                      variant="secondary"
                      className={styles.deleteRuleButton}
                      icon={<Trash2 size={14} />}
                      ariaLabel={`${t("common.delete")}: ${item.name || item.code}`}
                      title={t("common.delete")}
                      onClick={() => void deleteIronType(item.id)}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : (
        <div
          id={activeTab === "recalculation" ? "recalculation-panel" : "price-rules-panel"}
          role="tabpanel"
          className={styles.priceWorkspace}
        >
          <section className={styles.workspacePanel}>
            <header className={styles.panelHeader}>
              <div className={styles.panelTitleGroup}>
                <span className={styles.panelIcon} aria-hidden="true"><Filter size={17} /></span>
                <div>
                  <h3>{t("ironManagement.section.priceRules", "Price Rules")}</h3>
                  <p>{t("ironManagement.priceRulesHint", "Filter by brand and iron type to review configured prices.")}</p>
                </div>
              </div>
              <span className={styles.ruleCount}>{prices.length}</span>
            </header>
            <div className={styles.filterToolbar}>
              <Select
                label={t("ironManagement.columns.brand")}
                value={selectedBrandId}
                searchable
                searchPlaceholder={t("common.search")}
                onChange={(e) => setSelectedBrandId(e.target.value)}
              >
                <option value="">{t("common.all", "All brands")}</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>{brand.code}</option>
                ))}
              </Select>
              <Select
                label={t("ironManagement.columns.ironType")}
                value={selectedIronTypeId}
                searchable
                searchPlaceholder={t("common.search")}
                onChange={(e) => setSelectedIronTypeId(e.target.value)}
              >
                <option value="">{t("common.all", "All iron types")}</option>
                {ironTypes.map((ironType) => (
                  <option key={ironType.id} value={ironType.id}>{ironType.name || ironType.code}</option>
                ))}
              </Select>
              <Button
                variant="secondary"
                size="medium"
                className={styles.resetFilters}
                onClick={() => { setSelectedBrandId(""); setSelectedIronTypeId(""); }}
              >
                <RotateCcw size={15} aria-hidden="true" />
                {t("common.reset")}
              </Button>
            </div>
            {groupedPriceRules.length ? (
              <div className={styles.priceRuleGrid}>
                {groupedPriceRules.map((group) => (
                  <article key={group.key} className={styles.priceRuleCard}>
                    <header className={styles.priceRuleHeader}>
                      <div>
                        <span>{group.brandCode || "—"}</span>
                        <strong>{group.ironTypeName || "—"}</strong>
                      </div>
                      <span className={styles.customerCount}>{group.items.length}</span>
                    </header>
                    <div className={styles.priceRuleRows}>
                      {group.items.map((item) => {
                        const steps = item.recalculateSteps || [];
                        const stepCount = item.recalculateStepCount ?? steps.length;

                        return (
                          <div key={item.id} className={styles.priceRuleRow}>
                            <span className={styles.customerTypeTag}>
                              {getCustomerTypeLabel(item)}
                            </span>
                            <strong className={styles.rulePrice}>
                              {item.pricePerKg.toLocaleString()}
                              <small>AMD/kg</small>
                            </strong>
                            <span className={styles.stepCount}>
                              {stepCount > 0 ? stepCount : "—"}
                            </span>
                            <div className={styles.stepPriceList}>
                              {steps.length ? steps.map((step) => (
                                <span key={step.stepNumber}>
                                  {t("ironManagement.recalculateStepLabel", "Step {{step}}:", {
                                    step: step.stepNumber,
                                  })} {step.pricePerKg.toLocaleString()}
                                </span>
                              )) : (
                                <span className={styles.noSteps}>
                                  {t("ironManagement.noRecalculateSteps", "No steps")}
                                </span>
                              )}
                            </div>
                            <Button
                              variant="danger"
                              size="small"
                              className={styles.deleteRuleButton}
                              aria-label={`${t("common.delete")}: ${group.brandCode} / ${group.ironTypeName} / ${getCustomerTypeLabel(item)}`}
                              title={t("common.delete")}
                              onClick={() => void deletePrice(item.id)}
                            >
                              <Trash2 size={14} aria-hidden="true" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.emptyPriceRules}>
                <Tags size={21} aria-hidden="true" />
                <span>{t("ironManagement.noPricesYet", "No prices yet. Add a pricing rule below.")}</span>
              </div>
            )}
          </section>

          <div className={styles.priceFormWorkspace}>
            {activeTab === "prices" ? (
            <section id="iron-base-price-panel" role="tabpanel" className={styles.ruleFormCard}>
              <header className={styles.formCardHeader}>
                <span className={styles.formIcon} aria-hidden="true"><CircleDollarSign size={18} /></span>
                <div>
                  <h3>{t("ironManagement.addPrice", "Create Base Price")}</h3>
                  <p>{t("ironManagement.note.basePriceHint", "Select brand and iron type, then input prices for all customer types")}</p>
                </div>
              </header>
              <div className={styles.formFields}>
                <Select
                  label={t("ironManagement.columns.brand")}
                  value={priceForm.autoBrandId}
                  searchable
                  searchPlaceholder={t("common.search")}
                  onChange={(e) => setPriceForm((prev) => ({ ...prev, autoBrandId: e.target.value }))}
                >
                  <option value="">{t("ironManagement.form.selectBrand", "Select brand")}</option>
                  {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.code}</option>)}
                </Select>
                <Select
                  label={t("ironManagement.columns.ironType")}
                  value={priceForm.ironTypeId}
                  searchable
                  searchPlaceholder={t("common.search")}
                  onChange={(e) => setPriceForm((prev) => ({ ...prev, ironTypeId: e.target.value }))}
                >
                  <option value="">{t("ironManagement.form.selectIronType", "Select iron type")}</option>
                  {ironTypes.map((ironType) => <option key={ironType.id} value={ironType.id}>{ironType.name || ironType.code}</option>)}
                </Select>
              </div>

              <div className={styles.customerPrices}>
                <h4>{t("ironManagement.pricesByCustomerType", "Prices by Customer Type")}</h4>
                {customerTypes.length > 0 ? (
                  <div className={styles.customerPriceGrid}>
                    {customerTypes.map((customerType) => (
                      <TextField
                        key={customerType.id}
                        type="number"
                        label={`${customerType.code} · ${t("ironManagement.form.pricePerKg", "Price Per Kg")}`}
                        placeholder="0.00"
                        value={priceForm.prices[customerType.id] || ""}
                        onChange={(e) => setPriceForm((prev) => ({
                          ...prev,
                          prices: { ...prev.prices, [customerType.id]: e.target.value },
                        }))}
                      />
                    ))}
                  </div>
                ) : (
                  <span className={styles.mutedState}>{t("common.loading", "Loading...")}</span>
                )}
              </div>

              <footer className={styles.formActions}>
                <Button variant="secondary" size="medium" onClick={resetPriceForm}>
                  <RotateCcw size={15} aria-hidden="true" />
                  {t("common.reset")}
                </Button>
                <Button variant="primary" size="medium" onClick={() => void submitPrice()}>
                  <Plus size={16} aria-hidden="true" />
                  {t("ironManagement.addPrice", "Create Base Price")}
                </Button>
              </footer>
            </section>
            ) : (
            <section id="iron-recalculation-panel" role="tabpanel" className={styles.ruleFormCard}>
              <header className={styles.formCardHeader}>
                <span className={styles.formIcon} aria-hidden="true"><Wrench size={18} /></span>
                <div>
                  <h3>{t("ironManagement.addRecalculationStep", "Add Recalculation Step")}</h3>
                  <p>{t("ironManagement.note.recalculationStepHint", "Select brand and iron type, then add step prices for Standard customers (Step 1, Step 2, etc.)")}</p>
                </div>
              </header>
              <div className={styles.formFields}>
                <Select
                  label={t("ironManagement.columns.brand")}
                  value={recalculationStepForm.autoBrandId}
                  searchable
                  searchPlaceholder={t("common.search")}
                  onChange={(e) => setRecalculationStepForm((prev) => ({ ...prev, autoBrandId: e.target.value }))}
                >
                  <option value="">{t("ironManagement.form.selectBrand", "Select brand")}</option>
                  {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.code}</option>)}
                </Select>
                <Select
                  label={t("ironManagement.columns.ironType")}
                  value={recalculationStepForm.ironTypeId}
                  searchable
                  searchPlaceholder={t("common.search")}
                  onChange={(e) => setRecalculationStepForm((prev) => ({ ...prev, ironTypeId: e.target.value }))}
                >
                  <option value="">{t("ironManagement.form.selectIronType", "Select iron type")}</option>
                  {ironTypes.map((ironType) => <option key={ironType.id} value={ironType.id}>{ironType.name || ironType.code}</option>)}
                </Select>
                <TextField
                  type="number"
                  label={t("ironManagement.form.pricePerKg", "Price Per Kg")}
                  placeholder="0.00"
                  value={recalculationStepForm.pricePerKg}
                  onChange={(e) => setRecalculationStepForm((prev) => ({ ...prev, pricePerKg: e.target.value }))}
                />
              </div>
              <footer className={styles.formActions}>
                <Button variant="secondary" size="medium" onClick={resetRecalculationStepForm}>
                  <RotateCcw size={15} aria-hidden="true" />
                  {t("common.reset")}
                </Button>
                <Button variant="primary" size="medium" onClick={() => void submitRecalculationStep()}>
                  <Plus size={16} aria-hidden="true" />
                  {t("ironManagement.addRecalculationStep", "Add Step")}
                </Button>
              </footer>
            </section>
            )}
          </div>
        </div>
      )}

      {typeDrawerOpen && createPortal(
        <div className={styles.typeDrawerBackdrop} onMouseDown={closeTypeDrawer}>
          <aside
            className={styles.typeDrawer}
            role="dialog"
            aria-modal="true"
            aria-labelledby="iron-type-drawer-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className={styles.typeDrawerHeader}>
              <span className={styles.typeDrawerIcon} aria-hidden="true">
                <Layers3 size={20} />
              </span>
              <div>
                <span className={styles.drawerEyebrow}>{t("ironManagement.tabs.ironTypes")}</span>
                <h2 id="iron-type-drawer-title">
                  {editingId
                    ? t("ironManagement.editIronType", "Edit Iron Type")
                    : t("ironManagement.addIronType", "Add Iron Type")}
                </h2>
              </div>
              <button
                type="button"
                className={styles.typeDrawerClose}
                onClick={closeTypeDrawer}
                aria-label={t("common.close")}
                title={t("common.close")}
              >
                <X size={18} />
              </button>
            </header>
            <div className={styles.typeDrawerBody}>
              <TextField
                label={t("ironManagement.form.code", "Code")}
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
              />
              <TextField
                label={t("ironManagement.form.en", "EN")}
                value={form.translations.en}
                onChange={(e) => setForm((prev) => ({
                  ...prev,
                  translations: { ...prev.translations, en: e.target.value },
                }))}
              />
              <TextField
                label={t("ironManagement.form.hy", "HY")}
                value={form.translations.hy}
                onChange={(e) => setForm((prev) => ({
                  ...prev,
                  translations: { ...prev.translations, hy: e.target.value },
                }))}
              />
              <TextField
                label={t("ironManagement.form.ru", "RU")}
                value={form.translations.ru}
                onChange={(e) => setForm((prev) => ({
                  ...prev,
                  translations: { ...prev.translations, ru: e.target.value },
                }))}
              />
              <Select
                label={t("ironManagement.form.status", "Status")}
                value={form.isActive ? "true" : "false"}
                onChange={(e) => setForm((prev) => ({
                  ...prev,
                  isActive: e.target.value === "true",
                }))}
              >
                <option value="true">{t("common.active")}</option>
                <option value="false">{t("common.inactive")}</option>
              </Select>
            </div>
            <footer className={styles.typeDrawerFooter}>
              <Button variant="secondary" size="medium" onClick={closeTypeDrawer}>
                {t("common.cancel")}
              </Button>
              <Button variant="primary" size="medium" onClick={() => void submitIronType()}>
                {t("common.save")}
              </Button>
            </footer>
          </aside>
        </div>,
        document.body,
      )}

      <ConfirmationModal
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={pendingDelete?.kind === "ironType"
          ? t("ironManagement.confirmation.deleteIronTypeTitle")
          : t("ironManagement.confirmation.deletePriceTitle")}
        description={pendingDelete?.kind === "ironType"
          ? t("ironManagement.confirmation.deleteIronTypeDescription")
          : t("ironManagement.confirmation.deletePriceDescription")}
        confirmText={isDeleting ? t("common.loading") : t("common.delete")}
        cancelText={t("common.cancel")}
        confirmLoading={isDeleting}
        onConfirm={() => void confirmPendingDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};
