import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Button, DataTable, TextField, Select, Modal, Tab, TabGroup } from "@/ui-kit";
import { getApiErrorMessage, getCashRegisterId, getHeaders, mapI18nCodeToApiCode } from "@/utils";
import i18n from "i18next";
import api from "@/services";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCustomerTypes } from "@/store/slices/customerTypesSlice";
import type { ColumnDef } from "@tanstack/react-table";

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
  const [modalOpen, setModalOpen] = useState(false);
  const [priceForm, setPriceForm] = useState(initialPriceForm);
  const [recalculationStepForm, setRecalculationStepForm] = useState(initialRecalculationStepForm);
  const [activeTab, setActiveTab] = useState<"iron-types" | "prices">("iron-types");

  const customerTypeMap = useMemo(
    () => Object.fromEntries(customerTypes.map((type) => [type.id, type.code])),
    [customerTypes],
  );

  const resetIronTypeForm = () => {
    setForm(initialIronTypeForm);
    setEditingId(null);
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
    setModalOpen(true);
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
    setModalOpen(true);
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
      setModalOpen(false);
      void loadData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("ironManagement.error.failedToUpdateIronType")));
    }
  };

  const deleteIronType = async (id: number) => {
    const confirmed = window.confirm(t("ironManagement.confirmation.deleteDescription") || "Are you sure you want to delete this iron type?");
    if (!confirmed) return;

    try {
      const lang = getApiLang();
      await api.delete(`${IRON_SHOP_BASE_PATH}/iron-types/${id}`, { params: { lang }, headers: { ...getHeaders(cashRegisterId) } });
      toast.success(t("ironManagement.success.ironTypeUpdated"));
      void loadData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("ironManagement.error.failedToUpdateIronType")));
    }
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
      const axiosError = error as any;
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

  const deletePrice = async (id: number) => {
    const confirmed = window.confirm(
      t("ironManagement.confirmation.deletePriceDescription", "Delete this price entry?"),
    );
    if (!confirmed) return;

    try {
      const lang = getApiLang();
      await api.delete(`${IRON_SHOP_BASE_PATH}/brand-iron-prices/${id}`, { params: { lang }, headers: { ...getHeaders(cashRegisterId) } });
      toast.success(t("ironManagement.success.ironPriceDeleted", "Price deleted successfully"));
      void loadPrices(Number(selectedBrandId || 0) || undefined, Number(selectedIronTypeId || 0) || undefined);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          t("ironManagement.error.failedToDeleteIronPrice", "Failed to delete iron price"),
        ),
      );
    }
  };

  const ironTypeColumns: ColumnDef<IronTypeItem, unknown>[] = [
    { accessorKey: "id", header: t("ironManagement.columns.id") },
    { accessorKey: "code", header: t("ironManagement.form.code") },
    {
      accessorKey: "name",
      header: t("ironManagement.columns.name"),
      cell: ({ row }) => row.original.name || row.original.code,
    },
    {
      accessorKey: "isActive",
      header: t("common.active"),
      cell: ({ getValue }) => (getValue() ? t("common.yes") : t("common.no")),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="secondary" size="small" onClick={() => handleEditIronType(row.original)}>
            {t("common.edit")}
          </Button>
          <Button variant="danger" size="small" onClick={() => void deleteIronType(row.original.id)}>
            {t("common.delete")}
          </Button>
        </div>
      ),
    },
  ];

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

  const priceColumns: ColumnDef<BrandIronPriceItem, unknown>[] = [
    {
      accessorKey: "dictBrandCode",
      header: t("ironManagement.columns.brand"),
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      accessorKey: "ironTypeName",
      header: t("ironManagement.columns.ironType"),
      cell: ({ getValue }) => getValue() || "-",
    },
    {
      id: "customerType",
      header: t("ironManagement.columns.customerType"),
      cell: ({ row }) => getCustomerTypeLabel(row.original),
    },
    {
      accessorKey: "pricePerKg",
      header: t("ironManagement.columns.pricePerKg"),
      cell: ({ getValue }) => {
        const value = getValue();
        return typeof value === "number"
          ? value.toLocaleString()
          : value || "-";
      },
    },
    {
      id: "recalculateStepCount",
      header: t("ironManagement.columns.recalculateStepCount", "Recalc steps"),
      cell: ({ row }) => {
        const steps = row.original.recalculateSteps || [];
        const count = row.original.recalculateStepCount ?? steps.length;
        return count > 0 ? (
          <span
            style={{
              display: "inline-flex",
              minWidth: 30,
              justifyContent: "center",
              padding: "4px 10px",
              borderRadius: 9999,
              background: "#eef2ff",
              color: "#4338ca",
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            {count}
          </span>
        ) : (
          <span style={{ color: "#6b7280" }}>-</span>
        );
      },
    },
    {
      id: "recalculateSteps",
      header: t("ironManagement.columns.recalculateSteps", "Recalc step prices"),
      cell: ({ row }) => {
        const steps = row.original.recalculateSteps || [];
        return steps.length > 0 ? (
          <div style={{ display: "grid", gap: 6 }}>
            {steps.map((step) => (
              <div
                key={step.stepNumber}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px",
                  borderRadius: 12,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ color: "#374151", fontWeight: 600 }}>
                  {t("ironManagement.recalculateStepLabel", "Step {{step}}:", {
                    step: step.stepNumber,
                  })}
                </span>
                <span style={{ color: "#111827" }}>
                  {step.pricePerKg.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <span style={{ color: "#6b7280" }}>
            {t("ironManagement.noRecalculateSteps", "No steps")}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: t("common.actions"),
      cell: ({ row }) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="danger" size="small" onClick={() => void deletePrice(row.original.id)}>
            {t("common.delete")}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <h3>{t("ironManagement.title", "Iron Shop Settings")}</h3>
        {activeTab === "iron-types" ? (
          <Button variant="primary" size="medium" onClick={handleOpenCreateIronType}>
            {t("ironManagement.addIronType")}
          </Button>
        ) : null}
      </div>

      {loading ? <div>{t("ironManagement.loading")}</div> : null}

      <TabGroup variant="segmented">
        <Tab
          active={activeTab === "iron-types"}
          text={t("ironManagement.tabs.ironTypes", "Iron Types")}
          onClick={() => setActiveTab("iron-types")}
        />
        <Tab
          active={activeTab === "prices"}
          text={t("ironManagement.tabs.priceRules", "Price Rules")}
          onClick={() => setActiveTab("prices")}
        />
      </TabGroup>

      {activeTab === "iron-types" ? (
        <div style={{ display: "grid", gap: 12, border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
          <h4>{t("ironManagement.section.ironTypes", "Iron Types")}</h4>
          <DataTable data={ironTypes} columns={ironTypeColumns} pageSize={10} />
        </div>
      ) : null}


      {activeTab === "prices" ? (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gap: 12, border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
            <h4>{t("ironManagement.section.priceRules", "Price Rules")}</h4>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Select value={selectedBrandId} onChange={(e) => setSelectedBrandId(e.target.value)}>
                <option value="">{t("common.all", "All brands")}</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.code}
                  </option>
                ))}
              </Select>
              <Select value={selectedIronTypeId} onChange={(e) => setSelectedIronTypeId(e.target.value)}>
                <option value="">{t("common.all", "All iron types")}</option>
                {ironTypes.map((ironType) => (
                  <option key={ironType.id} value={ironType.id}>
                    {ironType.name || ironType.code}
                  </option>
                ))}
              </Select>
              <Button variant="secondary" size="small" onClick={() => { setSelectedBrandId(""); setSelectedIronTypeId(""); }}>
                {t("common.reset")}
              </Button>
            </div>
            <DataTable data={prices} columns={priceColumns} pageSize={10} />
          </div>

          <div style={{ display: "grid", gap: 12, border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
            <h4>{t("ironManagement.addPrice", "Create Base Price")}</h4>
            <p style={{ color: "#6b7280", fontSize: 14 }}>
              {t("ironManagement.note.basePriceHint", "Select brand and iron type, then input prices for all customer types")}
            </p>
            <Select value={priceForm.autoBrandId} onChange={(e) => setPriceForm((prev) => ({ ...prev, autoBrandId: e.target.value }))}>
              <option value="">{t("ironManagement.form.selectBrand", "Select brand")}</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.code}
                </option>
              ))}
            </Select>
            <Select value={priceForm.ironTypeId} onChange={(e) => setPriceForm((prev) => ({ ...prev, ironTypeId: e.target.value }))}>
              <option value="">{t("ironManagement.form.selectIronType", "Select iron type")}</option>
              {ironTypes.map((ironType) => (
                <option key={ironType.id} value={ironType.id}>
                  {ironType.name || ironType.code}
                </option>
              ))}
            </Select>
            
            <div style={{ display: "grid", gap: 12, padding: 12, background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", margin: 0 }}>
                {t("ironManagement.pricesByCustomerType", "Prices by Customer Type")}
              </p>
              {customerTypes && customerTypes.length > 0 ? (
                <div style={{ display: "grid", gap: 10 }}>
                  {customerTypes.map((customerType) => (
                    <div key={customerType.id} style={{ display: "grid", gap: 4 }}>
                      <label style={{ fontSize: 12, fontWeight: 500, color: "#1f2937" }}>
                        {customerType.code} - {t("ironManagement.form.pricePerKg", "Price Per Kg")}
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={priceForm.prices[customerType.id] || ""}
                        onChange={(e) =>
                          setPriceForm((prev) => ({
                            ...prev,
                            prices: {
                              ...prev.prices,
                              [customerType.id]: e.target.value,
                            },
                          }))
                        }
                        style={{
                          padding: "8px 12px",
                          border: "1px solid #d1d5db",
                          borderRadius: 6,
                          fontSize: 14,
                          fontFamily: "inherit",
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: "#9ca3af", fontSize: 13, padding: "8px 0" }}>
                  {t("common.loading", "Loading...")}
                </div>
              )}
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <Button variant="secondary" size="medium" onClick={() => resetPriceForm()}>
                  {t("common.reset")}
                </Button>
                <Button variant="primary" size="medium" onClick={() => void submitPrice()}>
                  {t("ironManagement.addPrice", "Create Base Price")}
                </Button>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 12, border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
            <h4>{t("ironManagement.addRecalculationStep", "Add Recalculation Step (Standard Customer)")}</h4>
            <p style={{ color: "#6b7280", fontSize: 14 }}>
              {t("ironManagement.note.recalculationStepHint", "Select brand and iron type, then add step prices for Standard customers (Step 1, Step 2, etc.)")}
            </p>
            <Select value={recalculationStepForm.autoBrandId} onChange={(e) => setRecalculationStepForm((prev) => ({ ...prev, autoBrandId: e.target.value }))}>
              <option value="">{t("ironManagement.form.selectBrand", "Select brand")}</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.code}
                </option>
              ))}
            </Select>
            <Select value={recalculationStepForm.ironTypeId} onChange={(e) => setRecalculationStepForm((prev) => ({ ...prev, ironTypeId: e.target.value }))}>
              <option value="">{t("ironManagement.form.selectIronType", "Select iron type")}</option>
              {ironTypes.map((ironType) => (
                <option key={ironType.id} value={ironType.id}>
                  {ironType.name || ironType.code}
                </option>
              ))}
            </Select>
            <TextField
              label={t("ironManagement.form.pricePerKg", "Price Per Kg")}
              value={recalculationStepForm.pricePerKg}
              onChange={(e) => setRecalculationStepForm((prev) => ({ ...prev, pricePerKg: e.target.value }))}
            />
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <Button variant="secondary" size="medium" onClick={() => resetRecalculationStepForm()}>
                  {t("common.reset")}
                </Button>
                <Button variant="primary" size="medium" onClick={() => void submitRecalculationStep()}>
                  {t("ironManagement.addRecalculationStep", "Add Step")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <Modal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) resetIronTypeForm();
        }}
        title={
          editingId
            ? t("ironManagement.editIronType", "Edit Iron Type")
            : t("ironManagement.addIronType", "Add Iron Type")
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <TextField
            label={t("ironManagement.form.code", "Code")}
            value={form.code}
            onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
          />
          <TextField
            label={t("ironManagement.form.en", "EN")}
            value={form.translations.en}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                translations: { ...prev.translations, en: e.target.value },
              }))
            }
          />
          <TextField
            label={t("ironManagement.form.hy", "HY")}
            value={form.translations.hy}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                translations: { ...prev.translations, hy: e.target.value },
              }))
            }
          />
          <TextField
            label={t("ironManagement.form.ru", "RU")}
            value={form.translations.ru}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                translations: { ...prev.translations, ru: e.target.value },
              }))
            }
          />
          <Select
            value={form.isActive ? "true" : "false"}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                isActive: e.target.value === "true",
              }))
            }
          >
            <option value="true">{t("common.active")}</option>
            <option value="false">{t("common.inactive")}</option>
          </Select>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button variant="secondary" size="medium" onClick={() => setModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" size="medium" onClick={() => void submitIronType()}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
