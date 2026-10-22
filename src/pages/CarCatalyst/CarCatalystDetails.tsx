import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Boxes,
  CarFront,
  ChevronDown,
  Hash,
  LoaderCircle,
  MapPin,
  Package,
  Search,
  X,
  Pencil,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Button, Select, TextField } from "@/ui-kit";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import actionStyles from "@/pages/ReferralPersons/ReferralActions.module.css";

import {
  fetchCarCatalysts,
  fetchCarCatalystById,
  clearSelectedCarCatalyst,
  clearCarCatalystSearch,
} from "@/store/slices/carCatalystSlice";

import { calculateSalesLotThunk } from "@/store/slices/warehouses/salesLotsSlice";
import { fetchTags } from "@/store/slices/tagsSlice";

import {
  getVehicleDefinitions,
  getVehicleModels,
} from "@/services/settings/vehicles";

import { getCashRegisterId } from "@/utils";

import type {
  CarCatalyst,
  CarCatalystSearchParams,
  VehicleDefinition,
} from "@/types/settings";
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

const getBucketCompositionTotals = (bucket: CatalystBucket) => {
  const compositions = Array.isArray(bucket.compositions)
    ? bucket.compositions.filter(Boolean)
    : [];

  if (compositions.length > 0) {
    return compositions.reduce(
      (acc, composition) => ({
        weight:
          acc.weight +
          getSafeNumber(composition.weightKg) * (bucket.quantity ?? 1),
        pt: acc.pt + getSafeNumber(composition.pt_g) * (bucket.quantity ?? 1),
        pd: acc.pd + getSafeNumber(composition.pd_g) * (bucket.quantity ?? 1),
        rh: acc.rh + getSafeNumber(composition.rh_g) * (bucket.quantity ?? 1),
      }),
      {
        weight: 0,
        pt: 0,
        pd: 0,
        rh: 0,
      },
    );
  }

  return {
    weight: getSafeNumber(bucket.weightKg),
    pt: getSafeNumber(bucket.pt_g),
    pd: getSafeNumber(bucket.pd_g),
    rh: getSafeNumber(bucket.rh_g),
  };
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

  const { tags } = useAppSelector((state) => state.tags);
  const [brands, setBrands] = useState<VehicleDefinition["brands"]>([]);
  const [models, setModels] = useState<VehicleDefinition["models"]>([]);

  const [modelsByBrandId, setModelsByBrandId] = useState<
    Record<number, VehicleDefinition["models"]>
  >({});

  const modelsByBrandIdRef = useRef<Record<number, VehicleDefinition["models"]>>({});

  const [code, setCode] = useState("");

  const [brandId, setBrandId] = useState<number | "">("");
  const [modelId, setModelId] = useState<number | "">("");
 const [fromYear, setFromYear] = useState<number | "">("");
const [toYear, setToYear] = useState<number | "">("");
  const [countryId, setCountryId] = useState<number | "">("");
  const [engineId, setEngineId] = useState<number | "">("");
  const [fuelTypeId, setFuelTypeId] = useState<number | "">("");
  const [driveTypeId, setDriveTypeId] = useState<number | "">("");
  const [birkaId, setBirkaId] = useState<number | "">("");
  const [trimName, setTrimName] = useState("");

  const currentYear = new Date().getFullYear();

const years = useMemo(
  () => Array.from({ length: currentYear - 1970 + 1 }, (_, i) => currentYear - i),
  [currentYear],
);

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
      const totals = getBucketCompositionTotals(bucket);

      return {
        cashRegisterId,

        // IMPORTANT:
        // Do not send items: [...]
        // Backend expects these fields directly.
        pt_g: totals.pt,
        pd_g: totals.pd,
        rh_g: totals.rh,
        powderKg: totals.weight,
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

    if (tags.length === 0) {
      dispatch(fetchTags());
    }

    return () => {
      dispatch(clearSelectedCarCatalyst());
    };
  }, [dispatch, t, tags.length]);

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

  const getPriceBreakdownTotals = useCallback(
    (item?: CarCatalyst | null) => {
      const buckets = item?.buckets ?? [];
      let ceramicPrice = 0;
      let filterPrice = 0;
      let hasCeramic = false;
      let hasFilter = false;
      let hasIron = false;

      for (const [index, bucket] of buckets.entries()) {
        const offer = bucketOffers[getBucketKey(item!.id, bucket, index)];
        const customerOfferAmd = getCustomerOfferAmd(offer);

        if (customerOfferAmd === null) continue;

        const compositionTypes = (bucket.compositions ?? []).map(
          (composition) => composition.type,
        );

        const hasCeramicComposition = compositionTypes.includes(0);
        const hasFilterComposition = compositionTypes.includes(2);
        const hasDieselComposition = compositionTypes.includes(3);

        const ceramicEnabled =
          item?.hasCeramic != null
            ? item.hasCeramic
            : hasCeramicComposition;
        const filterEnabled =
          item?.hasFilter != null
            ? item.hasFilter
            : hasFilterComposition;
        const dieselEnabled =
          item?.hasDiesel != null
            ? item.hasDiesel
            : hasDieselComposition;

        if (ceramicEnabled) {
          hasCeramic = true;
          ceramicPrice += customerOfferAmd;
        }

        if (filterEnabled) {
          hasFilter = true;
          filterPrice += customerOfferAmd;
        }

        if (dieselEnabled) {
          hasFilter = true;
          filterPrice += customerOfferAmd;
        }
      }

      const ironPrice = getSafeNumber(item?.totalIronPrice);
      hasIron = ironPrice > 0;

      return {
        weight: getSafeNumber(item?.totalWeightKg),
        pt: getSafeNumber(item?.totalPt_g ?? item?.averagePt_g),
        pd: getSafeNumber(item?.totalPd_g ?? item?.averagePd_g),
        rh: getSafeNumber(item?.totalRh_g ?? item?.averageRh_g),
        ceramicPrice,
        filterPrice,
        ironPrice,
        totalPrice: ceramicPrice + filterPrice + ironPrice,
        hasCeramic,
        hasFilter,
        hasIron,
      };
    },
    [bucketOffers, getBucketKey],
  );

  const selectedTotals = useMemo(() => {
    if (!selected) {
      return {
        weight: 0,
        pt: 0,
        pd: 0,
        rh: 0,
        ceramicPrice: 0,
        ironPrice: 0,
        filterPrice: 0,
        totalPrice: 0,
        hasCeramic: false,
        hasFilter: false,
        hasIron: false,
      };
    }

    return getPriceBreakdownTotals(selected);
  }, [getPriceBreakdownTotals, selected]);

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
    setFromYear("");
    setToYear("");
    setCountryId("");
    setEngineId("");
    setFuelTypeId("");
    setDriveTypeId("");
    setBirkaId("");
    setTrimName("");
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
  const hasAnyFilter =
    (typeof brandId === "number" && brandId > 0) ||
    (typeof modelId === "number" && modelId > 0) ||
    (typeof countryId === "number" && countryId > 0) ||
    (typeof engineId === "number" && engineId > 0) ||
    (typeof fuelTypeId === "number" && fuelTypeId > 0) ||
    (typeof driveTypeId === "number" && driveTypeId > 0) ||
    (typeof birkaId === "number" && birkaId > 0) ||
    trimName.trim() !== "" ||
    fromYear !== "" ||
    toYear !== "";

  if (!hasAnyFilter) {
    toast.error(t("carCatalyst.errors.required"));
    return;
  }

  const from = typeof fromYear === "number" ? fromYear : undefined;
  const to = typeof toYear === "number" ? toYear : undefined;

  if (from && to && from > to) {
    toast.error(t("carCatalyst.errors.invalidYearRange"));
    return;
  }

  const params: CarCatalystSearchParams = {};

  if (from) params.fromYear = from;
  if (to) params.toYear = to;

  if (typeof brandId === "number" && brandId > 0) {
    params.brandId = brandId;
  }

  if (typeof modelId === "number" && modelId > 0) {
    params.modelId = modelId;
  }

  if (typeof countryId === "number" && countryId > 0) {
    params.countryId = countryId;
  }
  if (typeof engineId === "number" && engineId > 0) {
    params.engineId = engineId;
  }
  if (typeof fuelTypeId === "number" && fuelTypeId > 0) {
    params.fuelTypeId = fuelTypeId;
  }
  if (typeof driveTypeId === "number" && driveTypeId > 0) {
    params.driveTypeId = driveTypeId;
  }
  if (typeof birkaId === "number" && birkaId > 0) {
    params.birkaId = birkaId;
  }
  if (trimName.trim()) params.trimName = trimName.trim();

  setExpandedItemId(null);
  setBucketOffers({});
  setCalculatingBucketKey(null);
  dispatch(clearSelectedCarCatalyst());

  try {
    const results = await dispatch(
      fetchCarCatalysts({
        params,
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

  const getBirkaName = (id?: number) => {
    if (!id) return undefined;
    return (
      tags.find((item) => item.id === id)?.name ||
      t("carCatalyst.details.fallback.birka", { id })
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

  const getLookupName = (
    items: Array<{ id: number; name: string }> | undefined,
    id: number | undefined,
  ) => {
    if (!id) return t("carCatalyst.details.fallback.unknown");
    return (
      items?.find((item) => item.id === id)?.name ??
      t("carCatalyst.details.fallback.unknown")
    );
  };

  useEffect(() => {
    if (!selected || expandedItemId !== selected.id) return;

    const pendingBuckets = (selected.buckets ?? [])
      .map((bucket, index) => ({
        bucket,
        key: getBucketKey(selected.id, bucket, index),
      }))
      .filter(({ key }) => bucketOffers[key] === undefined);

    if (pendingBuckets.length === 0) return;

    const calculateAll = async () => {
      for (const { key, bucket } of pendingBuckets) {
        await calculateBucketOffer(key, bucket);
      }
    };

    void calculateAll();
  }, [selected, expandedItemId, bucketOffers, calculateBucketOffer, getBucketKey]);

  const renderSelectedBuckets = () => {
    if (!selected) return null;

    return (
      <div className={styles.dropdownContent}>
        <div className={styles.detailActions}>
          <Button
            size="small"
            variant="secondary"
            className={`${actionStyles.referralButton} ${actionStyles.referralNeutral}`}
            onClick={() => navigate(`/car-catalyst?editId=${selected.id}`)}
          >
            <Pencil size={14} aria-hidden="true" />
            {t("carCatalyst.actions.edit")}
          </Button>
          <span>{t("carCatalyst.details.variantSelectionHint")}</span>
        </div>
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

          {selectedTotals.hasCeramic && (
            <div className={styles.priceCardCeramic}>
              <span>{t("carCatalyst.details.summary.ceramicPrice")}</span>
              <strong>{selectedTotals.ceramicPrice.toFixed(2)} AMD</strong>
            </div>
          )}

          {selectedTotals.hasIron && (
            <div className={styles.priceCardIron}>
              <span>{t("carCatalyst.details.summary.ironPrice")}</span>
              <strong>{selectedTotals.ironPrice.toFixed(2)} AMD</strong>
            </div>
          )}

          {selectedTotals.hasFilter && (
            <div className={styles.priceCardFilter}>
              <span>{t("carCatalyst.details.summary.filterPrice")}</span>
              <strong>{selectedTotals.filterPrice.toFixed(2)} AMD</strong>
            </div>
          )}

          <div className={styles.priceCardTotal}>
            <span>{t("carCatalyst.details.summary.totalPrice")}</span>
            <strong>{selectedTotals.totalPrice.toFixed(2)} AMD</strong>
          </div>
        </div>

        <div className={styles.converterList}>
          {(selected.buckets ?? []).map((bucket, index) => {
            const bucketKey = getBucketKey(selected.id, bucket, index);
            const bucketOffer = bucketOffers[bucketKey];
            const customerOfferAmd = getCustomerOfferAmd(bucketOffer);
            const isCalculating = calculatingBucketKey === bucketKey;
            const bucketTotals = getBucketCompositionTotals(bucket);

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

                  <span className={styles.bucketPlacement}>
                    <span>
                      <MapPin size={13} aria-hidden="true" />
                      {t(
                        bucket.side === 1
                          ? "carCatalyst.sections.frontPosition"
                          : "carCatalyst.sections.rearPosition",
                        { position: bucket.positionIndex ?? 1 },
                      )}
                    </span>
                    <span>
                      <Package size={13} aria-hidden="true" />
                      {t("carCatalyst.table.unitsCount", {
                        count: bucket.quantity ?? 1,
                      })}
                    </span>
                  </span>
                </div>

                <div className={styles.bucketGrid}>
                  <span>{t("carCatalyst.details.summary.weight")}</span>
                  <strong>{bucketTotals.weight.toFixed(3)} kg</strong>

                  <span>{t("carCatalyst.details.summary.pt")}</span>
                  <strong>{bucketTotals.pt.toFixed(2)} g</strong>

                  <span>{t("carCatalyst.details.summary.pd")}</span>
                  <strong>{bucketTotals.pd.toFixed(2)} g</strong>

                  <span>{t("carCatalyst.details.summary.rh")}</span>
                  <strong>{bucketTotals.rh.toFixed(2)} g</strong>
                </div>

                <div className={styles.compositionList}>
                  {(bucket.compositions ?? []).length > 0 ? (
                    (bucket.compositions ?? []).map((composition, compositionIndex) => (
                      <div key={`${bucketKey}-${compositionIndex}`} className={styles.compositionItem}>
                        <div className={styles.compositionHeader}>
                          <strong>{composition.code || t("carCatalyst.table.compositionCode")}</strong>
                          <span>
                            {composition.type === 0
                              ? t("carCatalyst.table.compositionTypes.ceramic")
                              : composition.type === 1
                                ? t("carCatalyst.table.compositionTypes.iron")
                                : composition.type === 2
                                  ? t("carCatalyst.table.compositionTypes.filter")
                                  : t("carCatalyst.table.compositionTypes.diesel")}
                          </span>
                        </div>
                        <div className={styles.compositionMeta}>
                          <span>{t("carCatalyst.table.weight")}: {getSafeNumber(composition.weightKg).toFixed(3)} kg</span>
                          {composition.type !== 1 && (
                            <>
                              <span>{t("carCatalyst.table.pt")}: {getSafeNumber(composition.pt_g).toFixed(2)} g</span>
                              <span>{t("carCatalyst.table.pd")}: {getSafeNumber(composition.pd_g).toFixed(2)} g</span>
                              <span>{t("carCatalyst.table.rh")}: {getSafeNumber(composition.rh_g).toFixed(2)} g</span>
                            </>
                          )}
                          {getSafeNumber(composition.pricePerKg) > 0 && (
                            <span>{t("carCatalyst.table.pricePerKg")}: {getSafeNumber(composition.pricePerKg).toFixed(2)} AMD/kg</span>
                          )}
                          {getSafeNumber(composition.totalPrice) > 0 && (
                            <span>{t("carCatalyst.details.summary.totalPrice")}: {getSafeNumber(composition.totalPrice).toFixed(2)} AMD</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.fallbackComposition}>
                      <span>{t("carCatalyst.table.weight")}: {bucketTotals.weight.toFixed(3)} kg</span>
                      <span>{t("carCatalyst.table.pt")}: {bucketTotals.pt.toFixed(2)} g</span>
                      <span>{t("carCatalyst.table.pd")}: {bucketTotals.pd.toFixed(2)} g</span>
                      <span>{t("carCatalyst.table.rh")}: {bucketTotals.rh.toFixed(2)} g</span>
                    </div>
                  )}
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
          <button
            type="button"
            className={styles.detailIconAction}
            onClick={() => navigate(-1)}
            aria-label={t("carCatalyst.details.actions.back")}
            title={t("carCatalyst.details.actions.back")}
          >
            <ArrowLeft size={17} aria-hidden="true" />
          </button>

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
          <div className={styles.tabs} role="tablist" aria-label={t("carCatalyst.details.searchModes")}>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "code"}
              className={`${styles.tabButton} ${
                activeTab === "code" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("code")}
            >
              <Hash size={15} aria-hidden="true" />
              {t("carCatalyst.details.tabs.code")}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "vehicle"}
              className={`${styles.tabButton} ${
                activeTab === "vehicle" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("vehicle")}
            >
              <CarFront size={15} aria-hidden="true" />
              {t("carCatalyst.details.tabs.vehicle")}
            </button>
          </div>

          {activeTab === "code" && (
            <div className={styles.searchCard}>
              <div className={styles.searchModeHeading}>
                <Hash size={17} aria-hidden="true" />
                <h3 className={styles.cardTitle}>
                  {t("carCatalyst.details.codeSearch.title")}
                </h3>
              </div>

              <TextField
                label={t("carCatalyst.details.codeSearch.label")}
                value={code}
                placeholder={t("carCatalyst.details.codeSearch.placeholder")}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void searchByCode();
                  }
                }}
              />

              <div className={styles.searchActions}>
                <Button
                  variant="primary"
                  size="medium"
                  className={`${actionStyles.referralButton} ${actionStyles.referralPrimary}`}
                  onClick={searchByCode}
                  disabled={isLoading}
                >
                  <Search size={16} aria-hidden="true" />
                  {t("carCatalyst.details.actions.search")}
                </Button>

                <button
                  type="button"
                  className={styles.detailIconAction}
                  onClick={clearFilters}
                  aria-label={t("carCatalyst.details.actions.deleteFilters")}
                  title={t("carCatalyst.details.actions.deleteFilters")}
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {activeTab === "vehicle" && (
            <div className={styles.searchCard}>
              <div className={styles.searchModeHeading}>
                <CarFront size={17} aria-hidden="true" />
                <h3 className={styles.cardTitle}>
                  {t("carCatalyst.details.vehicleSearch.title")}
                </h3>
              </div>

              <Select
                label={t("carCatalyst.fields.brand")}
                value={brandId}
                searchable
                searchPlaceholder={t("common.search")}
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
                searchable
                searchPlaceholder={t("common.search")}
                disabled={!brandId}
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

        <div className={styles.yearRange}>
  <Select
    label={t("carCatalyst.fields.fromYear")}
    value={fromYear}
    searchable
    searchPlaceholder={t("common.search")}
    onChange={(e) =>
      setFromYear(e.target.value ? Number(e.target.value) : "")
    }
  >
    <option value="">{t("carCatalyst.fields.fromYear")}</option>
    {years.map((y) => (
      <option key={y} value={y}>
        {y}
      </option>
    ))}
  </Select>

  <Select
    label={t("carCatalyst.fields.toYear")}
    value={toYear}
    searchable
    searchPlaceholder={t("common.search")}
    onChange={(e) =>
      setToYear(e.target.value ? Number(e.target.value) : "")
    }
  >
    <option value="">{t("carCatalyst.fields.toYear")}</option>
    {years.map((y) => (
      <option key={y} value={y}>
        {y}
      </option>
    ))}
  </Select>
  
</div>

              <Select
                label={t("carCatalyst.fields.country")}
                value={countryId}
                searchable
                searchPlaceholder={t("common.search")}
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

              <Select
                label={t("carCatalyst.fields.engineVariant")}
                value={engineId}
                searchable
                searchPlaceholder={t("common.search")}
                onChange={(e) =>
                  setEngineId(e.target.value ? Number(e.target.value) : "")
                }
              >
                <option value="">{t("carCatalyst.fields.selectEngine")}</option>
                {definitions?.engines?.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </Select>

              <Select
                label={t("carCatalyst.fields.fuelType")}
                value={fuelTypeId}
                searchable
                searchPlaceholder={t("common.search")}
                onChange={(e) =>
                  setFuelTypeId(e.target.value ? Number(e.target.value) : "")
                }
              >
                <option value="">{t("carCatalyst.fields.selectFuelType")}</option>
                {definitions?.fuelTypes?.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </Select>

              <Select
                label={t("carCatalyst.fields.driveType")}
                value={driveTypeId}
                searchable
                searchPlaceholder={t("common.search")}
                onChange={(e) =>
                  setDriveTypeId(e.target.value ? Number(e.target.value) : "")
                }
              >
                <option value="">{t("carCatalyst.fields.selectDriveType")}</option>
                {definitions?.driveTypes?.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </Select>

              <Select
                label={t("carCatalyst.fields.birka")}
                value={birkaId}
                searchable
                searchPlaceholder={t("common.search")}
                onChange={(e) =>
                  setBirkaId(e.target.value ? Number(e.target.value) : "")
                }
              >
                <option value="">{t("carCatalyst.fields.selectBirka")}</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>{tag.name}</option>
                ))}
              </Select>

              <TextField
                label={t("carCatalyst.fields.trimName")}
                value={trimName}
                onChange={(e) => setTrimName(e.target.value)}
              />

              <div className={styles.searchActions}>
                <Button
                  variant="primary"
                  size="medium"
                  className={`${actionStyles.referralButton} ${actionStyles.referralPrimary}`}
                  onClick={searchByVehicle}
                  disabled={isLoading}
                >
                  <Search size={16} aria-hidden="true" />
                  {t("carCatalyst.details.actions.searchVehicles")}
                </Button>

                <button
                  type="button"
                  className={styles.detailIconAction}
                  onClick={clearFilters}
                  aria-label={t("carCatalyst.details.actions.deleteFilters")}
                  title={t("carCatalyst.details.actions.deleteFilters")}
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </aside>

        <main className={styles.resultsPanel}>
          <div className={styles.resultsHeader}>
            <div>
              <div className={styles.resultsTitle}>
                <Search size={17} aria-hidden="true" />
                <h3 className={styles.cardTitle}>
                  {t("carCatalyst.details.results.title")}
                </h3>
              </div>

              <p className={styles.resultCount}>
                {t("carCatalyst.details.results.foundCount", {
                  count: displayedList.length,
                })}
              </p>
              {displayedList.length > 1 && (
                <p className={styles.variantHint}>
                  {t("carCatalyst.details.variantSelectionHint")}
                </p>
              )}
            </div>

            <div className={styles.resultsSummaryChip}>
              <span>
                <Boxes size={13} aria-hidden="true" />
                {displayedList.reduce((total, item) => total + (item.buckets?.length ?? 0), 0)} {t("carCatalyst.details.results.bucketsSummary")}
              </span>
              <span>
                <Boxes size={13} aria-hidden="true" />
                {displayedList.reduce((total, item) => total + ((item.buckets ?? []).reduce((bucketTotal, bucket) => bucketTotal + (Array.isArray(bucket.compositions) ? bucket.compositions.filter(Boolean).length : 0), 0)), 0)} {t("carCatalyst.details.results.compositionsSummary")}
              </span>
            </div>
          </div>

          <div className={styles.resultList}>
            {isLoading ? (
              <div className={styles.resultsLoading} role="status" aria-live="polite">
                <LoaderCircle size={24} aria-hidden="true" />
                <span>{t("carCatalyst.details.results.loading")}</span>
              </div>
            ) : displayedList.map((item) => {
              const isExpanded = expandedItemId === item.id;
              const birkaLabel =
                item.birkaName || getBirkaName(item.birkaId);
              const engineLabel = item.engineId
                ? getLookupName(definitions?.engines, item.engineId)
                : item.engineVolume
                  ? `${item.engineVolume} L · ${t("carCatalyst.details.fallback.unknown")}`
                  : t("carCatalyst.details.fallback.unknown");

              const bucketCount =
                selected?.id === item.id
                  ? (selected.buckets?.length ?? 0)
                  : (item.buckets?.length ?? 0);
              const compositionCount = (item.buckets ?? []).reduce((total, bucket) => {
                const compositions = Array.isArray(bucket.compositions)
                  ? bucket.compositions.filter(Boolean)
                  : [];
                return total + compositions.length;
              }, 0);
              const itemPriceBreakdown = getPriceBreakdownTotals(item);

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
                        {getBrandName(item.brandId)} / {" "}
                        {getModelName(item.brandId, item.modelId)}
                        {birkaLabel ? ` • ${birkaLabel}` : ""}
                        {(item.buckets ?? []).length > 0
                          ? ` • ${(item.buckets ?? [])
                              .map((bucket) => bucket.code)
                              .filter(Boolean)
                              .join(" / ")}`
                          : ""}
                      </h4>

                      {itemPriceBreakdown.totalPrice > 0 && (
                        <div className={styles.priceSummaryRow}>
                          {itemPriceBreakdown.hasCeramic && (
                            <span className={styles.priceSummaryChipCeramic}>
                              {t("carCatalyst.details.summary.ceramicPrice")}: {itemPriceBreakdown.ceramicPrice.toLocaleString()}
                            </span>
                          )}

                          {itemPriceBreakdown.hasFilter && (
                            <span className={styles.priceSummaryChipFilter}>
                              {t("carCatalyst.details.summary.filterPrice")}: {itemPriceBreakdown.filterPrice.toLocaleString()}
                            </span>
                          )}

                          {itemPriceBreakdown.hasIron && (
                            <span className={styles.priceSummaryChipIron}>
                              {t("carCatalyst.details.summary.ironPrice")}: {itemPriceBreakdown.ironPrice.toLocaleString()}
                            </span>
                          )}

                          <span className={styles.priceSummaryChipTotal}>
                            {t("carCatalyst.details.results.totalPrice")}: {itemPriceBreakdown.totalPrice.toLocaleString()}
                          </span>
                        </div>
                      )}

                      <p>
                        {t("carCatalyst.fields.yearFrom")}:{" "}
                        {item.yearFrom ?? item.year ?? t("carCatalyst.details.fallback.unknown")}
                        {" – "}
                        {item.yearTo ?? item.year ?? t("carCatalyst.details.fallback.unknown")}
                        {" • "}
                        {getCountryName(item.country)}
                        {" • "}
                        {t("carCatalyst.fields.engineVariant")}:{" "}
                        {engineLabel}
                        {" • "}
                        {t("carCatalyst.fields.fuelType")}:{" "}
                        {getLookupName(definitions?.fuelTypes, item.fuelTypeId)}
                        {" • "}
                        {t("carCatalyst.fields.driveType")}:{" "}
                        {getLookupName(definitions?.driveTypes, item.driveTypeId)}
                        {" • "}
                        {t("carCatalyst.fields.trimName")}:{" "}
                        {item.trimName || t("carCatalyst.details.fallback.unknown")}
                      </p>

                      <span className={styles.bucketCount}>
                        {t("carCatalyst.details.results.converterCount", {
                          count: bucketCount,
                        })}{" • "}
                        {compositionCount > 0
                          ? `${compositionCount} ${t("carCatalyst.details.results.compositions")}`
                          : t("carCatalyst.details.results.noCompositions")}
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
                <span className={styles.emptyStateIcon}>
                  <Search size={21} aria-hidden="true" />
                </span>
                <strong>{t("carCatalyst.details.results.empty")}</strong>
                <span>{t("carCatalyst.details.results.emptyHint")}</span>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
