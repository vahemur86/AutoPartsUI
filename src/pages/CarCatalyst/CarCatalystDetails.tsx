import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { ArrowLeft, ChevronDown, Search, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Button, IconButton, Select, TextField } from "@/ui-kit";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

import {
  fetchCarCatalysts,
  fetchCarCatalystById,
  clearSelectedCarCatalyst,
  clearCarCatalystSearch,
} from "@/store/slices/carCatalystSlice";

import { calculateSalesLotThunk } from "@/store/slices/warehouses/salesLotsSlice";

import {
  getVehicleDefinitions,
  getVehicleModels,
} from "@/services/settings/vehicles";

import { getCashRegisterId } from "@/utils";

import type { CarCatalyst, VehicleDefinition } from "@/types/settings";
import type {
  SalesLotsCalculatorRequest,
  SalesLotsCalculatorResponse,
} from "@/types/warehouses/salesLots";

import styles from "./CarCatalystDetails.module.css";

type TabType = "code" | "vehicle";

type CalculatorResultLike =
  | SalesLotsCalculatorResponse
  | number
  | Record<string, unknown>;

type CatalystBucket = NonNullable<CarCatalyst["buckets"]>[number];

const getNumberValue = (value: unknown) => {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
};

const getSafeNumber = (value: unknown) => {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
};

const getOfferField = (
  offer: CalculatorResultLike | null | undefined,
  key: string,
) => {
  if (!offer || typeof offer !== "object") return undefined;

  return (offer as Record<string, unknown>)[key];
};

const getCustomerOfferAmd = (
  offer?: CalculatorResultLike | null,
): number | null => {
  if (!offer || typeof offer !== "object") return null;

  const customerOfferAmd = getNumberValue(
    getOfferField(offer, "customerOfferAmd"),
  );

  if (customerOfferAmd !== null) return customerOfferAmd;

  const nestedKeys = ["data", "calculation", "calculatorResult", "offerResult"];

  for (const key of nestedKeys) {
    const nestedValue = getOfferField(offer, key);

    if (nestedValue && typeof nestedValue === "object") {
      const nestedCustomerOfferAmd = getCustomerOfferAmd(
        nestedValue as CalculatorResultLike,
      );

      if (nestedCustomerOfferAmd !== null) return nestedCustomerOfferAmd;
    }
  }

  return null;
};

const getOfferCurrency = (offer?: CalculatorResultLike | null) => {
  if (!offer || typeof offer !== "object") return "AMD";

  const currency =
    getOfferField(offer, "currencyCode") ?? getOfferField(offer, "currency");

  if (currency) return String(currency);

  if (
    getOfferField(offer, "customerOfferAmd") !== undefined ||
    getOfferField(offer, "finalBaseAmd") !== undefined ||
    getOfferField(offer, "kitcoAmd") !== undefined ||
    getOfferField(offer, "profitAmd") !== undefined
  ) {
    return "AMD";
  }

  const nestedKeys = ["data", "calculation", "calculatorResult", "offerResult"];

  for (const key of nestedKeys) {
    const nestedValue = getOfferField(offer, key);

    if (nestedValue && typeof nestedValue === "object") {
      return getOfferCurrency(nestedValue as CalculatorResultLike);
    }
  }

  return "AMD";
};

export const CarCatalystDetails = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const cashRegisterId = getCashRegisterId();
  const carCatalystId = Number(searchParams.get("carCatalystId"));

  const { list, selected, isLoading } = useAppSelector(
    (state) => state.carCatalyst,
  );

  const [activeTab, setActiveTab] = useState<TabType>("code");
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);

  const [definitions, setDefinitions] = useState<VehicleDefinition | null>(
    null,
  );

  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);

  const [modelsByBrandId, setModelsByBrandId] = useState<Record<number, any[]>>(
    {},
  );

  const modelsByBrandIdRef = useRef<Record<number, any[]>>({});

  const [code, setCode] = useState("");

  const [brandId, setBrandId] = useState<number | "">("");
  const [modelId, setModelId] = useState<number | "">("");
  const [year, setYear] = useState<number | "">("");
  const [countryId, setCountryId] = useState<number | "">("");

  const [bucketOffers, setBucketOffers] = useState<
    Record<string, CalculatorResultLike>
  >({});

  const [calculatingBucketKey, setCalculatingBucketKey] = useState<
    string | null
  >(null);

  const getBucketKey = useCallback(
    (catalystId: number, bucket: CatalystBucket, index: number) =>
      `${catalystId}-${bucket.code}-${index}`,
    [],
  );

  const buildBucketCalculatorRequest = useCallback(
    (bucket: CatalystBucket): SalesLotsCalculatorRequest => {
      return {
        cashRegisterId,

        // IMPORTANT:
        // Do not send items: [...]
        // Backend expects these fields directly.
        pt_g: getSafeNumber(bucket.pt_g),
        pd_g: getSafeNumber(bucket.pd_g),
        rh_g: getSafeNumber(bucket.rh_g),
        powderKg: getSafeNumber(bucket.weightKg),
      } as unknown as SalesLotsCalculatorRequest;
    },
    [cashRegisterId],
  );

  const calculateBucketOffer = useCallback(
    async (bucketKey: string, bucket: CatalystBucket) => {
      setCalculatingBucketKey(bucketKey);

      try {
        const result = await dispatch(
          calculateSalesLotThunk(buildBucketCalculatorRequest(bucket)),
        ).unwrap();

        setBucketOffers((prev) => ({
          ...prev,
          [bucketKey]: result as CalculatorResultLike,
        }));
      } catch {
        toast.error(t("carCatalyst.details.offer.error"));
      } finally {
        setCalculatingBucketKey(null);
      }
    },
    [buildBucketCalculatorRequest, dispatch, t],
  );

  const loadModelsForBrand = useCallback(async (id: number) => {
    const cachedModels = modelsByBrandIdRef.current[id];

    if (cachedModels) {
      return cachedModels;
    }

    const data = await getVehicleModels(id);
    const safeData = data || [];

    modelsByBrandIdRef.current = {
      ...modelsByBrandIdRef.current,
      [id]: safeData,
    };

    setModelsByBrandId(modelsByBrandIdRef.current);

    return safeData;
  }, []);

  const loadModelsForResults = useCallback(
    async (results: CarCatalyst[]) => {
      const brandIds = Array.from(
        new Set(
          results
            .map((item) => item.brandId)
            .filter((id): id is number => Boolean(id)),
        ),
      );

      await Promise.all(brandIds.map((id) => loadModelsForBrand(id)));
    },
    [loadModelsForBrand],
  );

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getVehicleDefinitions();
        setDefinitions(data);
        setBrands(data.brands || []);
      } catch {
        toast.error(t("carCatalyst.errors.loading"));
      }
    };

    load();

    return () => {
      dispatch(clearSelectedCarCatalyst());
    };
  }, [dispatch, t]);

  useEffect(() => {
    if (!carCatalystId) return;

    const loadCreatedCatalyst = async () => {
      setExpandedItemId(carCatalystId);

      try {
        const result = await dispatch(
          fetchCarCatalystById({
            id: carCatalystId,
            cashRegisterId,
          }),
        ).unwrap();

        await loadModelsForBrand(result.brandId);
      } catch {
        toast.error(t("common.error"));
      }
    };

    loadCreatedCatalyst();
  }, [carCatalystId, cashRegisterId, dispatch, loadModelsForBrand, t]);

  useEffect(() => {
    if (!selected?.brandId) return;

    const loadModelsForSelectedBrand = async () => {
      try {
        await loadModelsForBrand(selected.brandId);
      } catch {
        toast.error(t("carCatalyst.errors.loading"));
      }
    };

    loadModelsForSelectedBrand();
  }, [selected?.brandId, loadModelsForBrand, t]);

  const displayedList = useMemo(() => {
    if (!selected) return list;

    const existsInList = list.some((item) => item.id === selected.id);

    if (existsInList) {
      return list;
    }

    return [selected, ...list];
  }, [list, selected]);

  const selectedTotals = useMemo(() => {
    if (!selected) {
      return {
        weight: 0,
        pt: 0,
        pd: 0,
        rh: 0,
      };
    }

    return (selected.buckets ?? []).reduce(
      (acc, item) => {
        acc.weight += item.weightKg || 0;
        acc.pt += item.pt_g || 0;
        acc.pd += item.pd_g || 0;
        acc.rh += item.rh_g || 0;

        return acc;
      },
      {
        weight: 0,
        pt: 0,
        pd: 0,
        rh: 0,
      },
    );
  }, [selected]);

  const handleBrandChange = async (value: string) => {
    const id = value === "" ? "" : Number(value);

    setBrandId(id);
    setModelId("");

    if (!id) {
      setModels([]);
      return;
    }

    try {
      const data = await loadModelsForBrand(id);
      setModels(data || []);
    } catch {
      toast.error(t("carCatalyst.errors.loading"));
    }
  };

  const clearFilters = () => {
    setCode("");
    setBrandId("");
    setModelId("");
    setYear("");
    setCountryId("");
    setModels([]);
    setExpandedItemId(null);
    setBucketOffers({});
    setCalculatingBucketKey(null);

    dispatch(clearCarCatalystSearch());
  };

  const searchByCode = async () => {
    if (!code.trim()) {
      toast.error(t("carCatalyst.errors.required"));
      return;
    }

    setExpandedItemId(null);
    setBucketOffers({});
    setCalculatingBucketKey(null);
    dispatch(clearSelectedCarCatalyst());

    try {
      const results = await dispatch(
        fetchCarCatalysts({
          params: {
            code: code.trim(),
          },
          cashRegisterId,
        }),
      ).unwrap();

      await loadModelsForResults(results);
    } catch {
      toast.error(t("common.error"));
    }
  };

  const searchByVehicle = async () => {
    if (!brandId || !modelId || !year || !countryId) {
      toast.error(t("carCatalyst.errors.required"));
      return;
    }

    setExpandedItemId(null);
    setBucketOffers({});
    setCalculatingBucketKey(null);
    dispatch(clearSelectedCarCatalyst());

    try {
      const results = await dispatch(
        fetchCarCatalysts({
          params: {
            brandId: Number(brandId),
            modelId: Number(modelId),
            year: Number(year),
            countryId: Number(countryId),
          },
          cashRegisterId,
        }),
      ).unwrap();

      await loadModelsForResults(results);
    } catch {
      toast.error(t("common.error"));
    }
  };

  const toggleCatalystDetails = async (id: number) => {
    if (expandedItemId === id) {
      setExpandedItemId(null);
      dispatch(clearSelectedCarCatalyst());
      return;
    }

    setExpandedItemId(id);

    try {
      const result = await dispatch(
        fetchCarCatalystById({
          id,
          cashRegisterId,
        }),
      ).unwrap();

      await loadModelsForBrand(result.brandId);
    } catch {
      toast.error(t("common.error"));
    }
  };

  const getBrandName = (id: number) => {
    return (
      brands.find((item) => item.id === id)?.name ||
      t("carCatalyst.details.fallback.brand", { id })
    );
  };

  const getModelName = (brandIdValue: number, modelIdValue: number) => {
    return (
      modelsByBrandId[brandIdValue]?.find((item) => item.id === modelIdValue)
        ?.name ||
      modelsByBrandIdRef.current[brandIdValue]?.find(
        (item) => item.id === modelIdValue,
      )?.name ||
      models.find((item) => item.id === modelIdValue)?.name ||
      t("carCatalyst.details.fallback.model", { id: modelIdValue })
    );
  };

  const getCountryName = (id: number) => {
    return (
      definitions?.markets?.find((item) => item.id === id)?.name ||
      t("carCatalyst.details.fallback.country", { id })
    );
  };

  const renderSelectedBuckets = () => {
    if (!selected) return null;

    return (
      <div className={styles.dropdownContent}>
        <div className={styles.totalBox}>
          <div>
            <span>{t("carCatalyst.details.summary.totalWeight")}</span>
            <strong>{selectedTotals.weight.toFixed(3)} kg</strong>
          </div>

          <div>
            <span>{t("carCatalyst.details.summary.totalPt")}</span>
            <strong>{selectedTotals.pt.toFixed(2)} g</strong>
          </div>

          <div>
            <span>{t("carCatalyst.details.summary.totalPd")}</span>
            <strong>{selectedTotals.pd.toFixed(2)} g</strong>
          </div>

          <div>
            <span>{t("carCatalyst.details.summary.totalRh")}</span>
            <strong>{selectedTotals.rh.toFixed(2)} g</strong>
          </div>
        </div>

        <div className={styles.converterList}>
          {(selected.buckets ?? []).map((bucket, index) => {
            const bucketKey = getBucketKey(selected.id, bucket, index);
            const bucketOffer = bucketOffers[bucketKey];
            const customerOfferAmd = getCustomerOfferAmd(bucketOffer);
            const isCalculating = calculatingBucketKey === bucketKey;

            return (
              <div key={bucketKey} className={styles.bucketCard}>
                <div className={styles.bucketTop}>
                  <strong
                    className={
                      bucket.side === 1 ? styles.frontCode : styles.rearCode
                    }
                  >
                    {bucket.code}
                  </strong>

                  <span>
                    {bucket.side === 1
                      ? t("carCatalyst.details.sides.front")
                      : t("carCatalyst.details.sides.rear")}
                  </span>
                </div>

                <div className={styles.bucketGrid}>
                  <span>{t("carCatalyst.details.summary.weight")}</span>
                  <strong>{bucket.weightKg} kg</strong>

                  <span>{t("carCatalyst.details.summary.pt")}</span>
                  <strong>{bucket.pt_g} g</strong>

                  <span>{t("carCatalyst.details.summary.pd")}</span>
                  <strong>{bucket.pd_g} g</strong>

                  <span>{t("carCatalyst.details.summary.rh")}</span>
                  <strong>{bucket.rh_g} g</strong>
                </div>

                <div className={styles.bucketCalculation}>
                  <button
                    type="button"
                    className={styles.bucketCalculateButton}
                    onClick={() => calculateBucketOffer(bucketKey, bucket)}
                    disabled={Boolean(calculatingBucketKey)}
                  >
                    {isCalculating
                      ? t("carCatalyst.details.offer.calculating")
                      : t("carCatalyst.details.offer.calculate")}
                  </button>

                  <div className={styles.bucketCalculationResult}>
                    <span>{t("carCatalyst.details.offer.title")}</span>

                    <strong>
                      {customerOfferAmd !== null
                        ? `${customerOfferAmd.toFixed(2)} AMD`
                        : t("carCatalyst.details.offer.notAvailable")}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}

          {(selected.buckets ?? []).length === 0 && (
            <div className={styles.emptyState}>
              {t("carCatalyst.details.summary.emptyBuckets")}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <IconButton
            size="large"
            onClick={() => navigate(-1)}
            icon={<ArrowLeft size={18} />}
            ariaLabel={t("carCatalyst.details.actions.back")}
          />

          <div>
            <h2 className={styles.title}>{t("carCatalyst.details.title")}</h2>

            <p className={styles.subtitle}>
              {t("carCatalyst.details.subtitle")}
            </p>
          </div>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <aside className={styles.leftPanel}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tabButton} ${
                activeTab === "code" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("code")}
            >
              {t("carCatalyst.details.tabs.code")}
            </button>

            <button
              type="button"
              className={`${styles.tabButton} ${
                activeTab === "vehicle" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("vehicle")}
            >
              {t("carCatalyst.details.tabs.vehicle")}
            </button>
          </div>

          {activeTab === "code" && (
            <div className={styles.searchCard}>
              <h3 className={styles.cardTitle}>
                {t("carCatalyst.details.codeSearch.title")}
              </h3>

              <TextField
                label={t("carCatalyst.details.codeSearch.label")}
                value={code}
                placeholder={t("carCatalyst.details.codeSearch.placeholder")}
                onChange={(e) => setCode(e.target.value)}
              />

              <div className={styles.searchActions}>
                <Button
                  variant="primary"
                  size="small"
                  onClick={searchByCode}
                  disabled={isLoading}
                >
                  <Search size={16} />
                  {t("carCatalyst.details.actions.search")}
                </Button>

                <IconButton
                  size="medium"
                  variant="secondary400"
                  onClick={clearFilters}
                  icon={<X size={16} />}
                  ariaLabel={t("carCatalyst.details.actions.deleteFilters")}
                />
              </div>
            </div>
          )}

          {activeTab === "vehicle" && (
            <div className={styles.searchCard}>
              <h3 className={styles.cardTitle}>
                {t("carCatalyst.details.vehicleSearch.title")}
              </h3>

              <Select
                label={t("carCatalyst.fields.brand")}
                value={brandId}
                onChange={(e) => handleBrandChange(e.target.value)}
              >
                <option value="">{t("carCatalyst.fields.selectBrand")}</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name || brand.code}
                  </option>
                ))}
              </Select>

              <Select
                label={t("carCatalyst.fields.model")}
                value={modelId}
                onChange={(e) =>
                  setModelId(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
              >
                <option value="">{t("carCatalyst.fields.selectModel")}</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name || model.code}
                  </option>
                ))}
              </Select>

              <TextField
                label={t("carCatalyst.fields.year")}
                type="text"
                inputMode="numeric"
                value={year}
                onChange={(e) =>
                  setYear(
                    e.target.value === ""
                      ? ""
                      : Number(e.target.value.replace(/[^0-9]/g, "")),
                  )
                }
              />

              <Select
                label={t("carCatalyst.fields.country")}
                value={countryId}
                onChange={(e) =>
                  setCountryId(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
              >
                <option value="">
                  {t("carCatalyst.fields.selectCountry")}
                </option>

                {definitions?.markets?.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </Select>

              <div className={styles.searchActions}>
                <Button
                  variant="primary"
                  size="small"
                  onClick={searchByVehicle}
                  disabled={isLoading}
                >
                  <Search size={16} />
                  {t("carCatalyst.details.actions.searchVehicles")}
                </Button>

                <IconButton
                  size="medium"
                  variant="secondary400"
                  onClick={clearFilters}
                  icon={<X size={16} />}
                  ariaLabel={t("carCatalyst.details.actions.deleteFilters")}
                />
              </div>
            </div>
          )}
        </aside>

        <main className={styles.resultsPanel}>
          <div className={styles.resultsHeader}>
            <div>
              <h3 className={styles.cardTitle}>
                {t("carCatalyst.details.results.title")}
              </h3>

              <p className={styles.resultCount}>
                {t("carCatalyst.details.results.foundCount", {
                  count: displayedList.length,
                })}
              </p>
            </div>
          </div>

          <div className={styles.resultList}>
            {displayedList.map((item) => {
              const isExpanded = expandedItemId === item.id;

              const bucketCount =
                selected?.id === item.id
                  ? (selected.buckets?.length ?? 0)
                  : (item.buckets?.length ?? 0);

              return (
                <div
                  key={item.id}
                  className={`${styles.resultCardWrapper} ${
                    isExpanded ? styles.selectedCard : ""
                  }`}
                >
                  <button
                    type="button"
                    className={styles.resultCard}
                    onClick={() => toggleCatalystDetails(item.id)}
                  >
                    <div className={styles.resultInfo}>
                      <h4>
                        {getBrandName(item.brandId)} /{" "}
                        {getModelName(item.brandId, item.modelId)}
                      </h4>

                      <p>
                        {item.year} • {getCountryName(item.country)} •{" "}
                        {t("carCatalyst.details.results.engine")}{" "}
                        {item.engineVolume}
                      </p>

                      <span className={styles.bucketCount}>
                        {t("carCatalyst.details.results.converterCount", {
                          count: bucketCount,
                        })}
                      </span>
                    </div>

                    <ChevronDown
                      size={20}
                      className={`${styles.chevronIcon} ${
                        isExpanded ? styles.chevronOpen : ""
                      }`}
                    />
                  </button>

                  {isExpanded &&
                    selected?.id === item.id &&
                    renderSelectedBuckets()}
                </div>
              );
            })}

            {!isLoading && displayedList.length === 0 && (
              <div className={styles.emptyState}>
                {t("carCatalyst.details.results.empty")}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
