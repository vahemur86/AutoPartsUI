import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowRight,
  Boxes,
  Check,
  ChevronLeft,
  ChevronRight,
  Database,
  FilePlus2,
  Fuel,
  Gauge,
  Layers3,
  LoaderCircle,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  X,
  Wrench,
} from "lucide-react";

import { Button, TextField } from "@/ui-kit";
import { useAppSelector } from "@/store/hooks";
import {
  createDictionaryItem,
  createModelsBulk,
  createVehicleDefinition,
  createVehicleDefinitionsBulk,
  deleteDictionaryItem,
  getDictionaryItems,
  getVehicleAdminLookups,
  getVehicleDefinitionsPage,
  getVehicleModelsForBrand,
  normalizeVehiclePage,
  updateDictionaryItem,
} from "@/services/vehicleAdmin";
import type {
  ModelBulkResult,
  VehicleAdminLookups,
  VehicleBulkPayload,
  VehicleBulkResult,
  VehicleDefinitionFilters,
  VehicleDefinitionPayload,
  VehicleDefinitionRecord,
  VehicleDictionaryItem,
  VehicleDictionaryKey,
} from "@/types/vehicleAdmin";

import styles from "./VehicleAdmin.module.css";

const dictionaryDefinitions: Array<{
  key: VehicleDictionaryKey;
  lookupKey: keyof VehicleAdminLookups;
  route: string;
  icon: typeof Database;
  labelKey: string;
}> = [
  { key: "brands", lookupKey: "brands", route: "brands", icon: Database, labelKey: "brands" },
  { key: "models", lookupKey: "models", route: "models", icon: Boxes, labelKey: "models" },
  { key: "engines", lookupKey: "engines", route: "engines", icon: Gauge, labelKey: "engines" },
  { key: "fuel-types", lookupKey: "fuelTypes", route: "fuel-types", icon: Fuel, labelKey: "fuelTypes" },
  { key: "drive-types", lookupKey: "driveTypes", route: "drive-types", icon: Wrench, labelKey: "driveTypes" },
  { key: "vehicle-markets", lookupKey: "markets", route: "markets", icon: Layers3, labelKey: "markets" },
  { key: "trim-names", lookupKey: "trimNames", route: "trims", icon: Settings2, labelKey: "trims" },
];

type FormMode = "single" | "bulk";
type VehicleField =
  | "trimNameIds"
  | "fuelTypeIds"
  | "engineIds"
  | "marketIds"
  | "driveTypeIds";

const emptyLookups: VehicleAdminLookups = {
  brands: [],
  models: [],
  trimNames: [],
  fuelTypes: [],
  engines: [],
  driveTypes: [],
  markets: [],
};

const getCode = (item?: VehicleDictionaryItem & { name?: string }) =>
  item?.name || item?.code || "—";

const uniqueCodes = (raw: string) => {
  const seen = new Set<string>();
  return raw
    .split(/[\n,;]+/)
    .map((code) => code.trim())
    .filter((code) => {
      if (!code) return false;
      const normalized = code.toLocaleLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
};

const dictionaryPaths: Record<string, VehicleDictionaryKey> = {
  brands: "brands",
  models: "models",
  engines: "engines",
  "fuel-types": "fuel-types",
  "drive-types": "drive-types",
  markets: "vehicle-markets",
  trims: "trim-names",
};

export const VehicleAdminPage = () => {
  const { t, i18n } = useTranslation();
  const { dictionary } = useParams();
  const { pathname } = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const currentPath = dictionaryPaths[dictionary ?? ""] ?? "brands";
  const isDefinitionsPage = pathname.endsWith("/vehicle-definitions");
  const currentDictionary =
    dictionaryDefinitions.find((item) => item.key === currentPath) ??
    dictionaryDefinitions[0];
  const [lookups, setLookups] = useState<VehicleAdminLookups>(emptyLookups);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [modelsForSelectedBrand, setModelsForSelectedBrand] =
    useState<VehicleAdminLookups["models"]>([]);
  const [modelsForFilterBrand, setModelsForFilterBrand] =
    useState<VehicleAdminLookups["models"]>([]);
  const [items, setItems] = useState<VehicleDictionaryItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState<number | "">("");
  const [codeInput, setCodeInput] = useState("");
  const [editing, setEditing] = useState<VehicleDictionaryItem | null>(null);
  const [isSavingDictionary, setIsSavingDictionary] = useState(false);
  const [modelBulkResult, setModelBulkResult] = useState<ModelBulkResult | null>(null);

  const [mode, setMode] = useState<FormMode>("bulk");
  const [filters, setFilters] = useState<VehicleDefinitionFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<VehicleDefinitionFilters>({
    page: 1,
    pageSize: 20,
  });
  const [vehicleRows, setVehicleRows] = useState<VehicleDefinitionRecord[]>([]);
  const [vehicleTotal, setVehicleTotal] = useState(0);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [vehicleForm, setVehicleForm] = useState<VehicleDefinitionPayload>({
    brandId: 0,
    modelId: 0,
    trimNameId: 0,
    fuelTypeId: 0,
    engineId: 0,
    marketId: 0,
    driveTypeId: 0,
    horsePower: 0,
    year: new Date().getFullYear(),
  });
  const [bulkSelections, setBulkSelections] = useState<Record<VehicleField, number[]>>({
    trimNameIds: [],
    fuelTypeIds: [],
    engineIds: [],
    marketIds: [],
    driveTypeIds: [],
  });
  const [bulkHorsePower, setBulkHorsePower] = useState("");
  const [bulkYear, setBulkYear] = useState(String(new Date().getFullYear()));
  const [bulkPreviewRows, setBulkPreviewRows] = useState<VehicleDefinitionRecord[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkResult, setBulkResult] = useState<VehicleBulkResult | null>(null);

  const loadLookups = useCallback(async () => {
    setLookupLoading(true);
    try {
      const response = await getVehicleAdminLookups(i18n.resolvedLanguage || i18n.language);
      setLookups({
        brands: response.brands ?? [],
        models: response.models ?? [],
        trimNames: response.trimNames ?? [],
        fuelTypes: response.fuelTypes ?? [],
        engines: response.engines ?? [],
        driveTypes: response.driveTypes ?? [],
        markets: response.markets ?? [],
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("vehicleAdmin.errors.lookupLoad"));
    } finally {
      setLookupLoading(false);
    }
  }, [i18n.language, i18n.resolvedLanguage, t]);

  const loadDictionaryItems = useCallback(async () => {
    if (isDefinitionsPage) return;
    setItemsLoading(true);
    try {
      setItems(
        await getDictionaryItems(
          currentPath,
          currentPath === "models" && brandFilter
            ? Number(brandFilter)
            : undefined,
        ),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("vehicleAdmin.errors.listLoad"));
    } finally {
      setItemsLoading(false);
    }
  }, [brandFilter, currentPath, isDefinitionsPage, t]);

  useEffect(() => {
    void loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    setSearch("");
    setCodeInput("");
    setEditing(null);
    setModelBulkResult(null);
    setBrandFilter("");
  }, [currentPath]);

  useEffect(() => {
    void loadDictionaryItems();
  }, [loadDictionaryItems]);

  const loadVehicles = useCallback(async (requestedFilters: VehicleDefinitionFilters) => {
    setVehicleLoading(true);
    try {
      const response = await getVehicleDefinitionsPage(requestedFilters);
      const page = normalizeVehiclePage(response);
      setVehicleRows(page.results);
      setVehicleTotal(page.totalItems);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("vehicleAdmin.errors.vehicleLoad"));
    } finally {
      setVehicleLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isDefinitionsPage) void loadVehicles(appliedFilters);
  }, [appliedFilters, isDefinitionsPage, loadVehicles]);

  useEffect(() => {
    const selectedBrandId = isDefinitionsPage
      ? vehicleForm.brandId
      : Number(brandFilter);
    if (!selectedBrandId) {
      setModelsForSelectedBrand([]);
      return;
    }
    let cancelled = false;
    void getVehicleModelsForBrand(
      selectedBrandId,
      i18n.resolvedLanguage || i18n.language,
    )
      .then((models) => {
        if (!cancelled) setModelsForSelectedBrand(models);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : t("vehicleAdmin.errors.modelsLoad"),
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [
    brandFilter,
    i18n.language,
    i18n.resolvedLanguage,
    isDefinitionsPage,
    t,
    vehicleForm.brandId,
  ]);

  useEffect(() => {
    if (!isDefinitionsPage || !filters.brandId) {
      setModelsForFilterBrand([]);
      return;
    }
    let cancelled = false;
    void getVehicleModelsForBrand(
      filters.brandId,
      i18n.resolvedLanguage || i18n.language,
    )
      .then((models) => {
        if (!cancelled) setModelsForFilterBrand(models);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : t("vehicleAdmin.errors.modelsLoad"),
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [filters.brandId, i18n.language, i18n.resolvedLanguage, isDefinitionsPage, t]);

  const normalizedCodes = useMemo(() => uniqueCodes(codeInput), [codeInput]);
  const filteredItems = useMemo(
    () =>
      items.filter(
        (item) =>
          item.code.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()) &&
          (currentPath !== "models" ||
            !brandFilter ||
            item.brandId === Number(brandFilter)),
      ),
    [brandFilter, currentPath, items, search],
  );

  const invalidateAndReload = async () => {
    await Promise.all([loadLookups(), loadDictionaryItems()]);
  };

  const saveDictionaryItem = async () => {
    const code = codeInput.trim();
    if (!code) {
      toast.error(t("vehicleAdmin.errors.codeRequired"));
      return;
    }
    if (
      items.some(
        (item) =>
          item.code.trim().toLocaleLowerCase() === code.toLocaleLowerCase() &&
          item.id !== editing?.id &&
          (currentPath !== "models" || item.brandId === Number(brandFilter)),
      )
    ) {
      toast.error(t("vehicleAdmin.errors.duplicateCode"));
      return;
    }
    if (currentPath === "models" && !brandFilter) {
      toast.error(t("vehicleAdmin.errors.brandRequired"));
      return;
    }
    setIsSavingDictionary(true);
    try {
      const payload = {
        code,
        ...(currentPath === "models" ? { brandId: Number(brandFilter) } : {}),
      };
      if (editing) {
        await updateDictionaryItem(currentPath, editing.id, payload);
      } else {
        await createDictionaryItem(currentPath, payload);
      }
      setCodeInput("");
      setEditing(null);
      toast.success(t(editing ? "vehicleAdmin.success.updated" : "vehicleAdmin.success.created"));
      await invalidateAndReload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("vehicleAdmin.errors.saveFailed"));
    } finally {
      setIsSavingDictionary(false);
    }
  };

  const saveModelsBulk = async () => {
    if (!brandFilter) {
      toast.error(t("vehicleAdmin.errors.brandRequired"));
      return;
    }
    if (!normalizedCodes.length) {
      toast.error(t("vehicleAdmin.errors.codeRequired"));
      return;
    }
    setIsSavingDictionary(true);
    setModelBulkResult(null);
    try {
      const result = await createModelsBulk(Number(brandFilter), normalizedCodes);
      setModelBulkResult({
        created: result.created ?? [],
        skipped: result.skipped ?? [],
      });
      toast.success(t("vehicleAdmin.success.modelsCreated", { count: result.created?.length ?? 0 }));
      await invalidateAndReload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("vehicleAdmin.errors.saveFailed"));
    } finally {
      setIsSavingDictionary(false);
    }
  };

  const setFilter = (key: keyof VehicleDefinitionFilters, value: string) => {
    setFilters((current) => ({
      ...current,
      [key]: value === "" ? undefined : Number(value),
      ...(key === "brandId" ? { modelId: undefined } : {}),
    }));
  };

  const applyFilters = () =>
    setAppliedFilters({ ...filters, page: 1, pageSize: 20 });

  const setVehicleValue = (
    key: keyof VehicleDefinitionPayload,
    value: string,
  ) => {
    setVehicleForm((current) => ({
      ...current,
      [key]: value === "" ? 0 : Number(value),
      ...(key === "brandId" ? { modelId: 0 } : {}),
    }));
  };

  const toggleBulkValue = (key: VehicleField, id: number) => {
    setBulkSelections((current) => ({
      ...current,
      [key]: current[key].includes(id)
        ? current[key].filter((value) => value !== id)
        : [...current[key], id],
    }));
    setBulkResult(null);
  };

  const combinationsCount = Object.values(bulkSelections).reduce(
    (total, values) => total * values.length,
    1,
  );

  const loadBulkPreview = async () => {
    if (
      !vehicleForm.brandId ||
      !vehicleForm.modelId ||
      Object.values(bulkSelections).some((values) => values.length === 0) ||
      Number(bulkHorsePower) <= 0 ||
      Number(bulkYear) <= 0
    ) {
      setBulkPreviewRows([]);
      return;
    }
    try {
      const firstPage = normalizeVehiclePage(await getVehicleDefinitionsPage({
        brandId: vehicleForm.brandId,
        modelId: vehicleForm.modelId,
        page: 1,
        pageSize: 1000,
      }));
      const rows = [...firstPage.results];
      const pageSize = firstPage.pageSize || firstPage.results.length;
      const totalPages = pageSize
        ? Math.ceil(firstPage.totalItems / pageSize)
        : 1;
      for (let page = 2; page <= totalPages; page += 1) {
        const nextPage = normalizeVehiclePage(await getVehicleDefinitionsPage({
          brandId: vehicleForm.brandId,
          modelId: vehicleForm.modelId,
          page,
          pageSize,
        }));
        rows.push(...nextPage.results);
      }
      setBulkPreviewRows(rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("vehicleAdmin.errors.previewLoad"));
    }
  };

  useEffect(() => {
    if (!isDefinitionsPage || mode !== "bulk") return;
    const timer = window.setTimeout(() => void loadBulkPreview(), 250);
    return () => window.clearTimeout(timer);
  // loadBulkPreview reads state values used as explicit dependencies below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isDefinitionsPage,
    mode,
    vehicleForm.brandId,
    vehicleForm.modelId,
    bulkHorsePower,
    bulkYear,
    bulkSelections,
  ]);

  const matchingExisting = useMemo(() => {
    const keys = new Set(bulkPreviewRows.map((item) =>
      [
        item.trimNameId,
        item.fuelTypeId,
        item.engineId,
        item.marketId,
        item.driveTypeId,
        item.horsePower,
        item.year,
      ].join(":"),
    ));
    let existing = 0;
    for (const trimId of bulkSelections.trimNameIds) {
      for (const fuelId of bulkSelections.fuelTypeIds) {
        for (const engineId of bulkSelections.engineIds) {
          for (const marketId of bulkSelections.marketIds) {
            for (const driveId of bulkSelections.driveTypeIds) {
              if (
                keys.has(
                  [
                    trimId,
                    fuelId,
                    engineId,
                    marketId,
                    driveId,
                    Number(bulkHorsePower),
                    Number(bulkYear),
                  ].join(":"),
                )
              ) existing += 1;
            }
          }
        }
      }
    }
    return existing;
  }, [bulkHorsePower, bulkPreviewRows, bulkSelections, bulkYear]);

  const submitSingleVehicle = async () => {
    if (
      !vehicleForm.brandId ||
      !vehicleForm.modelId ||
      !vehicleForm.trimNameId ||
      !vehicleForm.fuelTypeId ||
      !vehicleForm.engineId ||
      !vehicleForm.marketId ||
      !vehicleForm.driveTypeId ||
      vehicleForm.year <= 0 ||
      vehicleForm.horsePower < 1 ||
      vehicleForm.horsePower > 3000
    ) {
      toast.error(t("vehicleAdmin.errors.completeVehicle"));
      return;
    }
    setBulkSaving(true);
    try {
      await createVehicleDefinition(vehicleForm);
      toast.success(t("vehicleAdmin.success.vehicleCreated"));
      await loadVehicles(appliedFilters);
      setVehicleForm((current) => ({
        ...current,
        modelId: 0,
        trimNameId: 0,
        fuelTypeId: 0,
        engineId: 0,
        marketId: 0,
        driveTypeId: 0,
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("vehicleAdmin.errors.saveFailed"));
    } finally {
      setBulkSaving(false);
    }
  };

  const submitBulkVehicles = async () => {
    if (
      !vehicleForm.brandId ||
      !vehicleForm.modelId ||
      Object.values(bulkSelections).some((values) => values.length === 0) ||
      Number(bulkYear) <= 0 ||
      Number(bulkHorsePower) < 1 ||
      Number(bulkHorsePower) > 3000
    ) {
      toast.error(t("vehicleAdmin.errors.completeBulk"));
      return;
    }
    const payload: VehicleBulkPayload = {
      brandId: vehicleForm.brandId,
      modelId: vehicleForm.modelId,
      ...bulkSelections,
      horsePower: Number(bulkHorsePower),
      year: Number(bulkYear),
    };
    setBulkSaving(true);
    setBulkResult(null);
    try {
      const result = await createVehicleDefinitionsBulk(payload);
      setBulkResult(result);
      toast.success(t("vehicleAdmin.success.bulkFinished", {
        created: result.created,
        skipped: result.skipped,
      }));
      await loadVehicles(appliedFilters);
      setVehicleForm((current) => ({
        ...current,
        brandId: 0,
        modelId: 0,
      }));
      setBulkSelections({
        trimNameIds: [],
        fuelTypeIds: [],
        engineIds: [],
        marketIds: [],
        driveTypeIds: [],
      });
      setBulkHorsePower("");
      setBulkYear(String(new Date().getFullYear()));
      setBulkPreviewRows([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("vehicleAdmin.errors.saveFailed"));
    } finally {
      setBulkSaving(false);
    }
  };

  const getVehicleFieldName = (item: VehicleDefinitionRecord, field: string) => {
    const lookup = item[field as keyof VehicleDefinitionRecord];
    if (lookup && typeof lookup === "object" && "name" in lookup) {
      return String(lookup.name || lookup.code || "—");
    }
    if (lookup && typeof lookup === "object" && "code" in lookup) {
      return String(lookup.code || "—");
    }
    const nameFields: Record<string, string> = {
      brand: "brandName",
      model: "modelName",
      trimName: "trimNameCode",
      fuelType: "fuelTypeName",
      engine: "engineName",
      market: "marketName",
      driveType: "driveTypeName",
    };
    const name = item[nameFields[field] as keyof VehicleDefinitionRecord];
    return typeof name === "string" ? name : "—";
  };

  const labelForDictionary = (labelKey: string) =>
    t(`vehicleAdmin.dictionary.${labelKey}`);
  const lookupOptions = (
    key: keyof VehicleAdminLookups,
    brandId?: number,
  ) => {
    if (key === "models" && brandId) {
      return isDefinitionsPage && brandId === filters.brandId
        ? modelsForFilterBrand
        : modelsForSelectedBrand;
    }
    return lookups[key].filter(
      (item) =>
        key !== "models" ||
        !brandId ||
        !item.brandId ||
        item.brandId === brandId,
    );
  };

  const selectOptions = (
    label: string,
    options: Array<VehicleDictionaryItem & { name: string }>,
    value: number | undefined,
    onChange: (value: string) => void,
    disabled = false,
  ) => (
    <label className={styles.field}>
      <span>{label}</span>
      <select
        value={value || ""}
        disabled={disabled || lookupLoading}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">
          {options.length
            ? t("vehicleAdmin.actions.select")
            : t("vehicleAdmin.empty.noValues")}
        </option>
        {options.map((item) => (
          <option key={item.id} value={item.id}>
            {getCode(item)}
          </option>
        ))}
      </select>
    </label>
  );

  const renderMultiSelect = (
    title: string,
    key: VehicleField,
    options: Array<VehicleDictionaryItem & { name: string }>,
  ) => (
    <fieldset className={styles.multiSelect}>
      <legend>
        {title}
        <span>{bulkSelections[key].length}</span>
      </legend>
      {!options.length ? (
        <p className={styles.noOptions}>{t("vehicleAdmin.empty.noValues")}</p>
      ) : (
        <div className={styles.checkGrid}>
          {options.map((item) => {
            const checked = bulkSelections[key].includes(item.id);
            return (
              <label
                className={`${styles.checkOption} ${checked ? styles.checkOptionSelected : ""}`}
                key={item.id}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleBulkValue(key, item.id)}
                />
                <span className={styles.customCheck}>
                  {checked && <Check size={12} aria-hidden="true" />}
                </span>
                <span>{getCode(item)}</span>
              </label>
            );
          })}
        </div>
      )}
    </fieldset>
  );

  const totalPages = Math.max(1, Math.ceil(vehicleTotal / 20));
  const canManage = ["admin", "superadmin"].includes(
    user?.role?.toLocaleLowerCase() ?? "",
  );
  if (!canManage) return null;

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroIcon}>
          <Database size={24} aria-hidden="true" />
        </div>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>{t("vehicleAdmin.eyebrow")}</span>
          <h1>{t("vehicleAdmin.title")}</h1>
          <p>{t("vehicleAdmin.subtitle")}</p>
        </div>
        <div className={styles.heroStatus}>
          <ShieldCheck size={16} aria-hidden="true" />
          {t("vehicleAdmin.adminOnly")}
        </div>
      </header>

      <nav className={styles.workflow} aria-label={t("vehicleAdmin.workflow.title")}>
        <div className={styles.workflowHeading}>
          <span>{t("vehicleAdmin.workflow.title")}</span>
          <span>{t("vehicleAdmin.workflow.hint")}</span>
        </div>
        <div className={styles.workflowSteps}>
          {dictionaryDefinitions.map((entry, index) => {
            const Icon = entry.icon;
            const active = !isDefinitionsPage && currentPath === entry.key;
            return (
              <Link
                key={entry.key}
                to={`/admin/vehicle-dictionaries/${entry.route}`}
                className={`${styles.workflowStep} ${active ? styles.workflowStepActive : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <span className={styles.stepNumber}>{index + 1}</span>
                <Icon size={15} aria-hidden="true" />
                <span>{labelForDictionary(entry.labelKey)}</span>
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
            );
          })}
          <Link
            to="/admin/vehicle-definitions"
            className={`${styles.workflowStep} ${isDefinitionsPage ? styles.workflowStepActive : ""}`}
            aria-current={isDefinitionsPage ? "page" : undefined}
          >
            <span className={styles.stepNumber}>8</span>
            <FilePlus2 size={15} aria-hidden="true" />
            <span>{t("vehicleAdmin.workflow.definitions")}</span>
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
      </nav>

      {!isDefinitionsPage ? (
        <section className={styles.workspace}>
          <div className={styles.panelHeader}>
            <div className={styles.panelHeading}>
              <span className={styles.panelIcon}>
                {(() => {
                  const Icon = currentDictionary.icon;
                  return <Icon size={19} aria-hidden="true" />;
                })()}
              </span>
              <div>
                <h2>{t("vehicleAdmin.dictionary.manageTitle", {
                  name: labelForDictionary(currentDictionary.labelKey),
                })}</h2>
                <p>{t("vehicleAdmin.dictionary.manageHint")}</p>
              </div>
            </div>
            <span className={styles.totalPill}>
              {t("vehicleAdmin.dictionary.itemCount", { count: filteredItems.length })}
            </span>
          </div>

          {currentPath === "models" && (
            <section className={styles.brandContext}>
              <div className={styles.brandContextTitle}>
                <Database size={17} aria-hidden="true" />
                <div>
                  <strong>{t("vehicleAdmin.models.chooseBrand")}</strong>
                  <span>{t("vehicleAdmin.models.brandDependency")}</span>
                </div>
              </div>
              {selectOptions(
                t("vehicleAdmin.fields.brand"),
                lookups.brands,
                brandFilter === "" ? undefined : Number(brandFilter),
                (value) => {
                  setBrandFilter(value ? Number(value) : "");
                  setModelBulkResult(null);
                },
              )}
            </section>
          )}

          {currentPath === "models" ? (
            <div className={styles.modelsLayout}>
              <section className={styles.editorCard}>
                <div className={styles.editorHeading}>
                  <span className={styles.editorIcon}><Plus size={16} /></span>
                  <div>
                    <h3>{t("vehicleAdmin.models.bulkTitle")}</h3>
                    <p>{t("vehicleAdmin.models.bulkHint")}</p>
                  </div>
                </div>
                <label className={styles.textareaField}>
                  <span>{t("vehicleAdmin.models.codesLabel")}</span>
                  <textarea
                    value={codeInput}
                    onChange={(event) => {
                      setCodeInput(event.target.value);
                      setModelBulkResult(null);
                    }}
                    placeholder={"E60\nE90\nX5"}
                    rows={8}
                    disabled={!brandFilter || isSavingDictionary}
                  />
                </label>
                <div className={styles.bulkPreview}>
                  <span className={styles.previewCounter}>
                    <Boxes size={15} aria-hidden="true" />
                    <strong>{normalizedCodes.length}</strong>
                    {t("vehicleAdmin.models.uniqueModels")}
                  </span>
                  <span className={styles.previewNote}>
                    {t("vehicleAdmin.models.duplicatesRemoved")}
                  </span>
                </div>
                <Button
                  variant="primary"
                  size="medium"
                  disabled={!brandFilter || !normalizedCodes.length || isSavingDictionary}
                  onClick={saveModelsBulk}
                >
                  {isSavingDictionary ? <LoaderCircle className={styles.spin} size={16} /> : <Plus size={16} />}
                  {isSavingDictionary
                    ? t("vehicleAdmin.actions.saving")
                    : t("vehicleAdmin.models.saveAll")}
                </Button>
                {!lookups.brands.length && (
                  <Link to="/admin/vehicle-dictionaries/brands" className={styles.inlineAdd}>
                    {t("vehicleAdmin.empty.addBrandFirst")} <ArrowRight size={14} />
                  </Link>
                )}
              </section>
              <section className={styles.listCard}>
                <div className={styles.listHeading}>
                  <div>
                    <h3>{t("vehicleAdmin.models.existingModels")}</h3>
                    <p>{t("vehicleAdmin.models.existingHint")}</p>
                  </div>
                  <span>{filteredItems.length}</span>
                </div>
                <div className={styles.searchField}>
                  <Search size={16} aria-hidden="true" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t("vehicleAdmin.actions.searchCode")}
                    aria-label={t("vehicleAdmin.actions.searchCode")}
                  />
                  {search && <button type="button" onClick={() => setSearch("")} aria-label={t("common.clear")}><X size={14} /></button>}
                </div>
                {itemsLoading ? (
                  <div className={styles.empty}><LoaderCircle className={styles.spin} />{t("common.loading")}</div>
                ) : !brandFilter ? (
                  <div className={styles.empty}><Database size={20} />{t("vehicleAdmin.empty.chooseBrand")}</div>
                ) : !filteredItems.length ? (
                  <div className={styles.empty}><Boxes size={20} />{t("vehicleAdmin.empty.noModels")}</div>
                ) : (
                  <div className={styles.codeList}>
                    {filteredItems.map((item) => (
                      <div className={styles.codeItem} key={item.id}>
                        <span>{item.code}</span>
                        <span className={styles.codeItemActions}>
                          <button type="button" onClick={() => {
                            setEditing(item);
                            setCodeInput(item.code);
                          }} aria-label={`${t("common.edit")} ${item.code}`}>{t("common.edit")}</button>
                          <button type="button" className={styles.deleteText} onClick={async () => {
                            if (!window.confirm(t("vehicleAdmin.actions.confirmDelete", { code: item.code }))) return;
                            try {
                              await deleteDictionaryItem(currentPath, item.id);
                              toast.success(t("vehicleAdmin.success.deleted"));
                              await invalidateAndReload();
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : t("vehicleAdmin.errors.deleteFailed"));
                            }
                          }} aria-label={`${t("common.delete")} ${item.code}`}><Trash2 size={14} /></button>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
              {modelBulkResult && (
                <section className={styles.bulkResults}>
                  <div className={styles.resultSummary}>
                    <span className={styles.createdStat}><Check size={15} />{t("vehicleAdmin.results.created", { count: modelBulkResult.created.length })}</span>
                    <span className={styles.skippedStat}>{t("vehicleAdmin.results.skipped", { count: modelBulkResult.skipped.length })}</span>
                  </div>
                  {modelBulkResult.skipped.map((item, index) => (
                    <p key={`${item.code}-${index}`}><strong>{item.code}</strong> — {item.reason}</p>
                  ))}
                </section>
              )}
            </div>
          ) : (
            <div className={styles.dictionaryLayout}>
              <section className={styles.editorCard}>
                <div className={styles.editorHeading}>
                  <span className={styles.editorIcon}>{editing ? <Settings2 size={16} /> : <Plus size={16} />}</span>
                  <div>
                    <h3>{t(editing ? "vehicleAdmin.dictionary.editItem" : "vehicleAdmin.dictionary.addItem")}</h3>
                    <p>{t("vehicleAdmin.dictionary.codeUniqueHint")}</p>
                  </div>
                </div>
                <TextField
                  label={t("vehicleAdmin.fields.code")}
                  value={codeInput}
                  onChange={(event) => setCodeInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void saveDictionaryItem();
                  }}
                  placeholder={t("vehicleAdmin.fields.codePlaceholder")}
                  disabled={isSavingDictionary}
                />
                <div className={styles.editorActions}>
                  {editing && <Button variant="secondary" size="medium" onClick={() => {
                    setEditing(null);
                    setCodeInput("");
                  }}>{t("common.cancel")}</Button>}
                  <Button
                    variant="primary"
                    size="medium"
                    disabled={isSavingDictionary || !codeInput.trim()}
                    onClick={saveDictionaryItem}
                  >
                    {isSavingDictionary ? <LoaderCircle className={styles.spin} size={16} /> : <Plus size={16} />}
                    {t(editing ? "vehicleAdmin.actions.update" : "vehicleAdmin.actions.add")}
                  </Button>
                </div>
                <div className={styles.apiNote}>
                  <ShieldCheck size={15} aria-hidden="true" />
                  <span>{t("vehicleAdmin.dictionary.caseInsensitive")}</span>
                </div>
                <div className={`${styles.bulkDisabled} ${styles.bulkDisabledBox}`}>
                  <Boxes size={17} aria-hidden="true" />
                  <div>
                    <strong>{t("vehicleAdmin.dictionary.bulkDisabled")}</strong>
                    <span>{t("vehicleAdmin.dictionary.bulkDisabledHint")}</span>
                  </div>
                </div>
                {currentPath === "brands" && (
                  <Link to="/admin/vehicle-dictionaries/models" className={styles.inlineAdd}>
                    {t("vehicleAdmin.workflow.nextModels")} <ArrowRight size={14} />
                  </Link>
                )}
              </section>
              <section className={styles.listCard}>
                <div className={styles.listHeading}>
                  <div>
                    <h3>{t("vehicleAdmin.dictionary.listTitle", { name: labelForDictionary(currentDictionary.labelKey) })}</h3>
                    <p>{t("vehicleAdmin.dictionary.listHint")}</p>
                  </div>
                  <span>{filteredItems.length}</span>
                </div>
                <div className={styles.searchField}>
                  <Search size={16} aria-hidden="true" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("vehicleAdmin.actions.searchCode")} />
                </div>
                {itemsLoading ? (
                  <div className={styles.empty}><LoaderCircle className={styles.spin} />{t("common.loading")}</div>
                ) : !filteredItems.length ? (
                  <div className={styles.empty}><Database size={20} />{t("vehicleAdmin.empty.noEntries")}</div>
                ) : (
                  <div className={styles.dictionaryTable}>
                    <div className={styles.tableHead}><span>{t("vehicleAdmin.fields.code")}</span><span>{t("common.actions")}</span></div>
                    {filteredItems.map((item) => (
                      <div className={styles.tableRow} key={item.id}>
                        <span className={styles.codeTag}>{item.code}</span>
                        <span className={styles.rowActions}>
                          <button type="button" onClick={() => {
                            setEditing(item);
                            setCodeInput(item.code);
                          }}>{t("common.edit")}</button>
                          <button type="button" className={styles.deleteText} onClick={async () => {
                            if (!window.confirm(t("vehicleAdmin.actions.confirmDelete", { code: item.code }))) return;
                            try {
                              await deleteDictionaryItem(currentPath, item.id);
                              toast.success(t("vehicleAdmin.success.deleted"));
                              await invalidateAndReload();
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : t("vehicleAdmin.errors.deleteFailed"));
                            }
                          }}><Trash2 size={14} /><span>{t("common.delete")}</span></button>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </section>
      ) : (
        <section className={styles.definitionsWorkspace}>
          <div className={styles.panelHeader}>
            <div className={styles.panelHeading}>
              <span className={styles.panelIcon}><FilePlus2 size={19} /></span>
              <div>
                <h2>{t("vehicleAdmin.definitions.title")}</h2>
                <p>{t("vehicleAdmin.definitions.subtitle")}</p>
              </div>
            </div>
            <span className={styles.totalPill}><Database size={14} />{t("vehicleAdmin.definitions.count", { count: vehicleTotal })}</span>
          </div>

          <div className={styles.definitionsGrid}>
            <section className={styles.filtersCard}>
              <div className={styles.cardTitle}>
                <Search size={17} />
                <h3>{t("vehicleAdmin.definitions.filters")}</h3>
              </div>
              <div className={styles.filterGrid}>
                {selectOptions(t("vehicleAdmin.fields.brand"), lookups.brands, filters.brandId, (value) => setFilter("brandId", value))}
                {selectOptions(t("vehicleAdmin.fields.model"), lookupOptions("models", filters.brandId), filters.modelId, (value) => setFilter("modelId", value), !filters.brandId)}
                {selectOptions(t("vehicleAdmin.fields.trim"), lookups.trimNames, filters.trimNameId, (value) => setFilter("trimNameId", value))}
                {selectOptions(t("vehicleAdmin.fields.fuelType"), lookups.fuelTypes, filters.fuelTypeId, (value) => setFilter("fuelTypeId", value))}
                {selectOptions(t("vehicleAdmin.fields.engine"), lookups.engines, filters.engineId, (value) => setFilter("engineId", value))}
                {selectOptions(t("vehicleAdmin.fields.driveType"), lookups.driveTypes, filters.driveTypeId, (value) => setFilter("driveTypeId", value))}
                {selectOptions(t("vehicleAdmin.fields.market"), lookups.markets, filters.marketId, (value) => setFilter("marketId", value))}
                <TextField label={t("vehicleAdmin.fields.year")} type="number" value={filters.year ?? ""} onChange={(e) => setFilter("year", e.target.value)} />
                <TextField label={t("vehicleAdmin.fields.hpMin")} type="number" value={filters.hpMin ?? ""} onChange={(e) => setFilter("hpMin", e.target.value)} />
                <TextField label={t("vehicleAdmin.fields.hpMax")} type="number" value={filters.hpMax ?? ""} onChange={(e) => setFilter("hpMax", e.target.value)} />
              </div>
              <div className={styles.filterActions}>
                <Button variant="primary" size="small" onClick={applyFilters}><Search size={15} />{t("vehicleAdmin.actions.applyFilters")}</Button>
                <button type="button" className={styles.resetButton} onClick={() => {
                  setFilters({});
                  setAppliedFilters({ page: 1, pageSize: 20 });
                }}>{t("vehicleAdmin.actions.reset")}</button>
              </div>
            </section>

            <section className={styles.createCard}>
              <div className={styles.cardTitle}>
                <Plus size={17} />
                <h3>{t("vehicleAdmin.definitions.addTitle")}</h3>
              </div>
              <div className={styles.modeSwitch}>
                <button className={mode === "bulk" ? styles.modeActive : ""} onClick={() => setMode("bulk")} type="button"><Boxes size={15} />{t("vehicleAdmin.definitions.bulkMode")}</button>
                <button className={mode === "single" ? styles.modeActive : ""} onClick={() => setMode("single")} type="button"><FilePlus2 size={15} />{t("vehicleAdmin.definitions.singleMode")}</button>
              </div>

              <div className={styles.formGrid}>
                {selectOptions(t("vehicleAdmin.fields.brand"), lookups.brands, vehicleForm.brandId, (value) => setVehicleValue("brandId", value))}
                {selectOptions(t("vehicleAdmin.fields.model"), lookupOptions("models", vehicleForm.brandId), vehicleForm.modelId, (value) => setVehicleValue("modelId", value), !vehicleForm.brandId)}
              </div>
              {!lookups.brands.length && (
                <Link to="/admin/vehicle-dictionaries/brands" className={styles.dependencyNote}>{t("vehicleAdmin.empty.addBrandFirst")} <ArrowRight size={14} /></Link>
              )}
              {vehicleForm.brandId && !lookupOptions("models", vehicleForm.brandId).length && (
                <Link to="/admin/vehicle-dictionaries/models" className={styles.dependencyNote}>{t("vehicleAdmin.empty.addModel")} <ArrowRight size={14} /></Link>
              )}

              {mode === "bulk" ? (
                <>
                  <div className={styles.bulkSelectGrid}>
                    {renderMultiSelect(t("vehicleAdmin.fields.trims"), "trimNameIds", lookups.trimNames)}
                    {renderMultiSelect(t("vehicleAdmin.fields.fuelTypes"), "fuelTypeIds", lookups.fuelTypes)}
                    {renderMultiSelect(t("vehicleAdmin.fields.engines"), "engineIds", lookups.engines)}
                    {renderMultiSelect(t("vehicleAdmin.fields.markets"), "marketIds", lookups.markets)}
                    {renderMultiSelect(t("vehicleAdmin.fields.driveTypes"), "driveTypeIds", lookups.driveTypes)}
                  </div>
                  <div className={styles.formGrid}>
                    <TextField label={t("vehicleAdmin.fields.horsePower")} type="number" min="1" max="3000" value={bulkHorsePower} onChange={(e) => setBulkHorsePower(e.target.value)} />
                    <TextField label={t("vehicleAdmin.fields.year")} type="number" min="1" value={bulkYear} onChange={(e) => setBulkYear(e.target.value)} />
                  </div>
                  <div className={styles.combinationPreview}>
                    <div><span>{t("vehicleAdmin.preview.selected")}</span><strong>{combinationsCount}</strong></div>
                    <div><span>{t("vehicleAdmin.preview.existing")}</span><strong>{matchingExisting}</strong></div>
                    <div><span>{t("vehicleAdmin.preview.willCreate")}</span><strong>{Math.max(0, combinationsCount - matchingExisting)}</strong></div>
                  </div>
                  <Button variant="primary" size="medium" disabled={bulkSaving || !vehicleForm.brandId || !vehicleForm.modelId} onClick={submitBulkVehicles}>
                    {bulkSaving ? <LoaderCircle className={styles.spin} size={16} /> : <Boxes size={16} />}
                    {bulkSaving ? t("vehicleAdmin.actions.saving") : t("vehicleAdmin.definitions.createCombinations", { count: combinationsCount })}
                  </Button>
                </>
              ) : (
                <>
                  <div className={styles.formGrid}>
                    {selectOptions(t("vehicleAdmin.fields.trim"), lookups.trimNames, vehicleForm.trimNameId, (value) => setVehicleValue("trimNameId", value))}
                    {selectOptions(t("vehicleAdmin.fields.fuelType"), lookups.fuelTypes, vehicleForm.fuelTypeId, (value) => setVehicleValue("fuelTypeId", value))}
                    {selectOptions(t("vehicleAdmin.fields.engine"), lookups.engines, vehicleForm.engineId, (value) => setVehicleValue("engineId", value))}
                    {selectOptions(t("vehicleAdmin.fields.market"), lookups.markets, vehicleForm.marketId, (value) => setVehicleValue("marketId", value))}
                    {selectOptions(t("vehicleAdmin.fields.driveType"), lookups.driveTypes, vehicleForm.driveTypeId, (value) => setVehicleValue("driveTypeId", value))}
                    <TextField label={t("vehicleAdmin.fields.horsePower")} type="number" min="1" max="3000" value={vehicleForm.horsePower || ""} onChange={(e) => setVehicleValue("horsePower", e.target.value)} />
                    <TextField label={t("vehicleAdmin.fields.year")} type="number" min="1" value={vehicleForm.year || ""} onChange={(e) => setVehicleValue("year", e.target.value)} />
                  </div>
                  <Button variant="primary" size="medium" disabled={bulkSaving} onClick={submitSingleVehicle}>
                    {bulkSaving ? <LoaderCircle className={styles.spin} size={16} /> : <Plus size={16} />}
                    {bulkSaving ? t("vehicleAdmin.actions.saving") : t("vehicleAdmin.definitions.createSingle")}
                  </Button>
                </>
              )}

              {bulkResult && (
                <div className={styles.bulkResults}>
                  <div className={styles.resultSummary}>
                    <span className={styles.createdStat}><Check size={15} />{t("vehicleAdmin.results.created", { count: bulkResult.created })}</span>
                    <span className={styles.skippedStat}>{t("vehicleAdmin.results.skipped", { count: bulkResult.skipped })}</span>
                  </div>
                  {bulkResult.items.filter((item) => item.status === "error").map((item, index) => (
                    <p className={styles.errorResult} key={index}>
                      {t("vehicleAdmin.results.combination", {
                        trim: getCode(lookups.trimNames.find((option) => option.id === item.trimNameId)),
                        fuel: getCode(lookups.fuelTypes.find((option) => option.id === item.fuelTypeId)),
                        engine: getCode(lookups.engines.find((option) => option.id === item.engineId)),
                      })}: {item.reason || t("vehicleAdmin.errors.unknown")}
                    </p>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className={styles.vehicleListCard}>
            <div className={styles.listHeading}>
              <div>
                <h3>{t("vehicleAdmin.definitions.listTitle")}</h3>
                <p>{t("vehicleAdmin.definitions.listHint")}</p>
              </div>
              <span>{t("vehicleAdmin.definitions.count", { count: vehicleTotal })}</span>
            </div>
            {vehicleLoading ? (
              <div className={styles.empty}><LoaderCircle className={styles.spin} />{t("common.loading")}</div>
            ) : vehicleRows.length === 0 ? (
              <div className={styles.empty}><Database size={20} />{t("vehicleAdmin.empty.noVehicles")}</div>
            ) : (
              <div className={styles.vehicleTableScroll}>
                <table className={styles.vehicleTable}>
                  <thead>
                    <tr>
                      {["brand", "model", "trimName", "fuelType", "engine", "market", "horsePower", "driveType", "year"].map((field) => (
                        <th key={field}>{t(`vehicleAdmin.fields.${field}`)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vehicleRows.map((item) => (
                      <tr key={item.id}>
                        <td>{getVehicleFieldName(item, "brand")}</td>
                        <td>{getVehicleFieldName(item, "model")}</td>
                        <td>{getVehicleFieldName(item, "trimName")}</td>
                        <td>{getVehicleFieldName(item, "fuelType")}</td>
                        <td>{getVehicleFieldName(item, "engine")}</td>
                        <td>{getVehicleFieldName(item, "market")}</td>
                        <td>{item.horsePower}</td>
                        <td>{getVehicleFieldName(item, "driveType")}</td>
                        <td>{item.year}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className={styles.pagination}>
              <span>{t("vehicleAdmin.definitions.page", {
                page: appliedFilters.page ?? 1,
                pages: totalPages,
              })}</span>
              <div>
                <button
                  type="button"
                  disabled={(appliedFilters.page ?? 1) <= 1}
                  onClick={() => setAppliedFilters((current) => ({ ...current, page: (current.page ?? 1) - 1 }))}
                  aria-label={t("vehicleAdmin.actions.previousPage")}
                ><ChevronLeft size={17} /></button>
                <button
                  type="button"
                  disabled={(appliedFilters.page ?? 1) >= totalPages}
                  onClick={() => setAppliedFilters((current) => ({ ...current, page: (current.page ?? 1) + 1 }))}
                  aria-label={t("vehicleAdmin.actions.nextPage")}
                ><ChevronRight size={17} /></button>
              </div>
            </div>
          </section>
        </section>
      )}
    </main>
  );
};
