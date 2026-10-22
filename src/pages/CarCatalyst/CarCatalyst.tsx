import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { Button, Select, TextField } from "@/ui-kit";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getVehicleDefinitions,
  getVehicleModels,
} from "@/services/settings/vehicles";
import { fetchTags } from "@/store/slices/tagsSlice";

import type {
  CarCatalystBucket,
  CreateCarCatalyst,
  CarCatalyst,
  VehicleDefinition,
} from "@/types/settings";

import styles from "./CarCatalyst.module.css";
import {
  addCarCatalyst,
  editCarCatalyst,
} from "@/store/slices/carCatalystSlice";
import { getCarCatalystById } from "@/services/settings/carCatalyst";
import {
  ArrowDown,
  ArrowUp,
  CarFront,
  ChevronDown,
  ExternalLink,
  Info,
  Layers3,
  MoveDown,
  MoveUp,
  Package,
  PackagePlus,
  Plus,
  Save,
  Trash,
} from "lucide-react";
import actionStyles from "@/pages/ReferralPersons/ReferralActions.module.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getYearOptions } from "./yearOptions";
import { getCashRegisterId } from "@/utils";

type UICompositionType = 0 | 1 | 2 | 3;

interface UIComposition {
  id: string;
  code: string;
  type: UICompositionType;
  weightKg: string;
  pricePerKg: string;
  pt_g: string;
  pd_g: string;
  rh_g: string;
}

type UIBucket = Omit<CarCatalystBucket, "compositions"> & {
  clientKey: string;
  positionIndex: number;
  quantity: number;
  compositions: UIComposition[];
};

const createCompositionId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const emptyComposition = (): UIComposition => ({
  id: createCompositionId(),
  code: "",
  type: 0,
  weightKg: "",
  pricePerKg: "",
  pt_g: "",
  pd_g: "",
  rh_g: "",
});

const emptyBucket = (side: number, positionIndex: number): UIBucket => ({
  clientKey: createCompositionId(),
  side,
  positionIndex,
  quantity: 1,
  code: "",
  compositions: [emptyComposition()],
});

const handleNumericChange = (value: string): string => {
  // Keep only digits and one dot
  let val = value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
  // Strip leading zeros before a digit (but not "0." prefix)
  if (val.length > 1 && val.startsWith("0") && val[1] !== ".") {
    val = val.replace(/^0+/, "") || "0";
  }
  // Allow lone dot as "0."
  if (val === ".") val = "0.";
  return val;
};

const shouldShowMetalFields = (type: number) => type !== 1;

export const CarCatalystPage = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const [definitions, setDefinitions] = useState<VehicleDefinition | null>(
    null,
  );

  const [brands, setBrands] = useState<VehicleDefinition["brands"]>([]);
  const [models, setModels] = useState<VehicleDefinition["models"]>([]);
  const [isModelsLoading, setIsModelsLoading] = useState(false);
  const modelRequestId = useRef(0);

  const [brandId, setBrandId] = useState<number | "">("");
  const [birkaId, setBirkaId] = useState<number | "">("");
  const [modelId, setModelId] = useState<number | "">("");
  const [year, setYear] = useState<number | "">("");
  const [yearFrom, setYearFrom] = useState<number | "">("");
  const [yearTo, setYearTo] = useState<number | "">("");
  const [country, setCountry] = useState<number | "">("");
  const [engineId, setEngineId] = useState<number | "">("");
  const [fuelTypeId, setFuelTypeId] = useState<number | "">("");
  const [driveTypeId, setDriveTypeId] = useState<number | "">("");
  const [trimName, setTrimName] = useState("");
  const [engineVolume, setEngineVolume] = useState("");
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = Number(searchParams.get("editId")) || undefined;
  const isEditing = Boolean(editId);

  const { tags } = useAppSelector((state) => state.tags);
  const isSaving = useAppSelector((state) => state.carCatalyst.isLoading);

  const [frontBuckets, setFrontBuckets] = useState<UIBucket[]>([]);
  const [backBuckets, setBackBuckets] = useState<UIBucket[]>([]);
  const [activeSide, setActiveSide] = useState<"front" | "back">("front");
  const [expandedBucketKey, setExpandedBucketKey] = useState<string | null>(null);
  const yearOptions = getYearOptions();
  const unitCount = [...frontBuckets, ...backBuckets].reduce(
    (total, bucket) => total + bucket.quantity,
    0,
  );
  const isVehicleComplete = Boolean(
    brandId &&
      modelId &&
      year &&
      yearFrom &&
      yearTo &&
      country &&
      engineId &&
      fuelTypeId &&
      driveTypeId &&
      trimName.trim(),
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
  }, [t]);

  useEffect(() => {
    if (!editId || !definitions) return;

    let cancelled = false;
    const loadForEdit = async () => {
      try {
        const cashRegisterId = getCashRegisterId();
        const catalyst: CarCatalyst = await getCarCatalystById(
          editId,
          cashRegisterId,
        );
        if (cancelled) return;
        const modelsForBrand = await getVehicleModels(catalyst.brandId);
        if (cancelled) return;
        setBrandId(catalyst.brandId);
        setModels(modelsForBrand || []);
        setModelId(catalyst.modelId);
        setBirkaId(catalyst.birkaId ?? "");
        setYear(catalyst.year || "");
        setYearFrom(catalyst.yearFrom ?? catalyst.year ?? "");
        setYearTo(catalyst.yearTo ?? catalyst.year ?? "");
        setCountry(catalyst.country || "");
        setEngineId(catalyst.engineId ?? "");
        setFuelTypeId(catalyst.fuelTypeId ?? "");
        setDriveTypeId(catalyst.driveTypeId ?? "");
        setTrimName(catalyst.trimName ?? "");
        setEngineVolume(
          catalyst.engineVolume != null ? String(catalyst.engineVolume) : "",
        );
        const buckets = (catalyst.buckets ?? []).map((bucket) => ({
          ...bucket,
          clientKey: createCompositionId(),
          positionIndex: bucket.positionIndex ?? 1,
          quantity: bucket.quantity ?? 1,
          compositions: (bucket.compositions ?? []).map((composition) => ({
            id: createCompositionId(),
            code: composition.code ?? "",
            type: composition.type as UICompositionType,
            weightKg:
              composition.weightKg == null ? "" : String(composition.weightKg),
            pricePerKg:
              composition.pricePerKg == null
                ? ""
                : String(composition.pricePerKg),
            pt_g: composition.pt_g == null ? "" : String(composition.pt_g),
            pd_g: composition.pd_g == null ? "" : String(composition.pd_g),
            rh_g: composition.rh_g == null ? "" : String(composition.rh_g),
          })),
        }));
        setFrontBuckets(
          buckets
            .filter((bucket) => bucket.side === 1)
            .sort(
              (a, b) =>
                (a.positionIndex ?? 1) - (b.positionIndex ?? 1),
            )
            .map((bucket, index) => ({ ...bucket, positionIndex: index + 1 })),
        );
        setBackBuckets(
          buckets
            .filter((bucket) => bucket.side === 2)
            .sort(
              (a, b) =>
                (a.positionIndex ?? 1) - (b.positionIndex ?? 1),
            )
            .map((bucket, index) => ({ ...bucket, positionIndex: index + 1 })),
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("carCatalyst.errors.loading"));
      }
    };

    void loadForEdit();
    return () => {
      cancelled = true;
    };
  }, [definitions, editId, t]);

  useEffect(() => {
    if (tags.length > 0) return;
    dispatch(fetchTags());
  }, [dispatch, tags.length]);

  const handleBrandChange = async (value: string) => {
    const id = value === "" ? "" : Number(value);
    const requestId = ++modelRequestId.current;

    setBrandId(id);
    setModelId("");
    setModels([]);

    if (!id) {
      setIsModelsLoading(false);
      return;
    }

    setIsModelsLoading(true);
    try {
      const data = await getVehicleModels(id);
      if (requestId === modelRequestId.current) setModels(data || []);
    } catch {
      if (requestId === modelRequestId.current) {
        toast.error(t("carCatalyst.errors.loading"));
      }
    } finally {
      if (requestId === modelRequestId.current) setIsModelsLoading(false);
    }
  };

  const resetForm = () => {
    modelRequestId.current += 1;
    setIsModelsLoading(false);
    setBrandId("");
    setBirkaId("");
    setModelId("");
    setYear("");
    setYearFrom("");
    setYearTo("");
    setCountry("");
    setEngineId("");
    setFuelTypeId("");
    setDriveTypeId("");
    setTrimName("");
    setEngineVolume("");
    setServerError("");
    setFrontBuckets([]);
    setBackBuckets([]);
    setModels([]);
    setActiveSide("front");
    setExpandedBucketKey(null);
  };

  const addBucket = (side: "front" | "back") => {
    const setter = side === "front" ? setFrontBuckets : setBackBuckets;
    const sideValue = side === "front" ? 1 : 2;
    const buckets = side === "front" ? frontBuckets : backBuckets;
    const nextPosition = buckets.length + 1;
    const bucket = emptyBucket(sideValue, nextPosition);
    setActiveSide(side);
    setExpandedBucketKey(bucket.clientKey);
    setter((prev) => [...prev, bucket]);
  };

  const deleteBucket = (side: "front" | "back", index: number) => {
    const setter = side === "front" ? setFrontBuckets : setBackBuckets;
    const buckets = side === "front" ? frontBuckets : backBuckets;
    if (buckets[index]?.clientKey === expandedBucketKey) {
      setExpandedBucketKey(null);
    }
    setter((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((bucket, bucketIndex) => ({
          ...bucket,
          positionIndex: bucketIndex + 1,
        })),
    );
  };

  const moveBucket = (
    side: "front" | "back",
    index: number,
    direction: -1 | 1,
  ) => {
    const setter = side === "front" ? setFrontBuckets : setBackBuckets;
    setter((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const reordered = [...prev];
      [reordered[index], reordered[targetIndex]] = [
        reordered[targetIndex],
        reordered[index],
      ];
      return reordered.map((bucket, bucketIndex) => ({
        ...bucket,
        positionIndex: bucketIndex + 1,
      }));
    });
  };

  const duplicateBucket = (side: "front" | "back", index: number) => {
    const setter = side === "front" ? setFrontBuckets : setBackBuckets;
    setter((prev) => {
      if (!prev[index] || unitCount >= 4) return prev;
      return prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, quantity: item.quantity + 1 } : item,
      );
    });
  };

  const updateBucketQuantity = (side: "front" | "back", index: number, value: number) => {
    const setter = side === "front" ? setFrontBuckets : setBackBuckets;
    const currentBuckets = side === "front" ? frontBuckets : backBuckets;
    const currentQuantity = currentBuckets[index]?.quantity ?? 1;
    const maxQuantity = Math.max(1, currentQuantity + (4 - unitCount));
    setter((prev) =>
      prev.map((bucket, bucketIndex) =>
        bucketIndex === index
          ? {
              ...bucket,
              quantity: Math.min(
                maxQuantity,
                Math.max(1, Math.trunc(value) || 1),
              ),
            }
          : bucket,
      ),
    );
  };

  const updateBucket = (
    side: "front" | "back",
    index: number,
    field: keyof UIBucket,
    value: string | number,
  ) => {
    const setter = side === "front" ? setFrontBuckets : setBackBuckets;
    setter((prev) =>
      prev.map((bucket, bucketIndex) =>
        bucketIndex === index ? { ...bucket, [field]: value } : bucket,
      ),
    );
  };

  const addComposition = (side: "front" | "back", bucketIndex: number) => {
    const setter = side === "front" ? setFrontBuckets : setBackBuckets;

    setter((prev) =>
      prev.map((bucket, index) =>
        index === bucketIndex
          ? {
              ...bucket,
              compositions: [...bucket.compositions, emptyComposition()],
            }
          : bucket,
      ),
    );
  };

  const deleteComposition = (
    side: "front" | "back",
    bucketIndex: number,
    compositionIndex: number,
  ) => {
    const setter = side === "front" ? setFrontBuckets : setBackBuckets;

    setter((prev) =>
      prev.map((bucket, index) => {
        if (index !== bucketIndex) return bucket;

        return {
          ...bucket,
          compositions: bucket.compositions.filter(
            (_, compositionIdx) => compositionIdx !== compositionIndex,
          ),
        };
      }),
    );
  };

  const updateComposition = (
    side: "front" | "back",
    bucketIndex: number,
    compositionIndex: number,
    field: keyof UIComposition,
    value: string | number,
  ) => {
    const setter = side === "front" ? setFrontBuckets : setBackBuckets;

    setter((prev) =>
      prev.map((bucket, index) => {
        if (index !== bucketIndex) return bucket;

        return {
          ...bucket,
          compositions: bucket.compositions.map((composition, compositionIdx) =>
            compositionIdx === compositionIndex
              ? { ...composition, [field]: value }
              : composition,
          ),
        };
      }),
    );
  };

  const validateBuckets = (buckets: UIBucket[]) => {
    if (!buckets.length) {
      toast.error(t("carCatalyst.errors.required"));
      return false;
    }

    const physicalUnitCount = buckets.reduce(
      (total, bucket) => total + bucket.quantity,
      0,
    );
    if (physicalUnitCount > 4) {
      toast.error(t("carCatalyst.errors.maxUnits"));
      return false;
    }

    for (const bucket of buckets) {
      if (
        !Number.isInteger(bucket.quantity) ||
        bucket.quantity < 1 ||
        !Number.isInteger(bucket.positionIndex) ||
        bucket.positionIndex < 1
      ) {
        toast.error(t("carCatalyst.errors.invalidBucket"));
        return false;
      }
      if (!bucket.code.trim()) {
        toast.error(t("carCatalyst.errors.required"));
        return false;
      }

      if (!bucket.compositions.length) {
        toast.error(t("carCatalyst.errors.required"));
        return false;
      }

      for (const composition of bucket.compositions) {
        if (!composition.code.trim()) {
          toast.error(t("carCatalyst.errors.required"));
          return false;
        }

        const weight = Number(composition.weightKg);
        if (!composition.weightKg || !Number.isFinite(weight) || weight <= 0) {
          toast.error(t("carCatalyst.errors.weightRequired"));
          return false;
        }

        if (composition.type === 1) {
          const price = Number(composition.pricePerKg);
          if (
            composition.pricePerKg === "" ||
            !Number.isFinite(price) ||
            price < 0
          ) {
            toast.error(t("carCatalyst.errors.required"));
            return false;
          }
        }
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (yearFrom && yearTo && yearFrom > yearTo) {
      toast.error(t("carCatalyst.errors.invalidYearRange"));
      return;
    }
    if (
      !brandId ||
      !modelId ||
      !year ||
      !yearFrom ||
      !yearTo ||
      yearFrom > yearTo ||
      !country ||
      !engineId ||
      !fuelTypeId ||
      !driveTypeId ||
      !trimName.trim() ||
      !engineVolume
    ) {
      toast.error(t("carCatalyst.errors.required"));
      return;
    }

    const buckets = [
      ...frontBuckets.map((bucket, index) => ({
        ...bucket,
        positionIndex: index + 1,
      })),
      ...backBuckets.map((bucket, index) => ({
        ...bucket,
        positionIndex: index + 1,
      })),
    ];

    if (!validateBuckets(buckets)) {
      return;
    }

    const normalize = (bucket: UIBucket): CarCatalystBucket => ({
      side: bucket.side,
      positionIndex: bucket.positionIndex,
      quantity: bucket.quantity,
      code: bucket.code.trim(),
      compositions: bucket.compositions.map((composition) => ({
        code: composition.code.trim(),
        type: Number(composition.type),
        weightKg: Number(composition.weightKg),
        pt_g:
          composition.type === 1 || composition.pt_g === ""
            ? null
            : Number(composition.pt_g),
        pd_g:
          composition.type === 1 || composition.pd_g === ""
            ? null
            : Number(composition.pd_g),
        rh_g:
          composition.type === 1 || composition.rh_g === ""
            ? null
            : Number(composition.rh_g),
        pricePerKg:
          composition.type === 1 ? Number(composition.pricePerKg) : null,
      })),
    });

    const normalizedBuckets = buckets.map(normalize);
    const uniqueBuckets: CarCatalystBucket[] = [];
    for (const bucket of normalizedBuckets) {
      const identical = uniqueBuckets.find(
        (candidate) =>
          candidate.side === bucket.side &&
          candidate.code.trim() === bucket.code.trim() &&
          JSON.stringify(candidate.compositions) ===
            JSON.stringify(bucket.compositions),
      );
      if (identical) {
        identical.quantity =
          (identical.quantity ?? 1) + (bucket.quantity ?? 1);
      } else {
        uniqueBuckets.push(bucket);
      }
    }

    const payload: CreateCarCatalyst = {
      birkaId: typeof birkaId === "number" ? birkaId : undefined,
      brandId: Number(brandId),
      modelId: Number(modelId),
      year: Number(year),
      yearFrom: Number(yearFrom),
      yearTo: Number(yearTo),
      country: Number(country),
      engineVolume: Number(engineVolume),
      engineId: Number(engineId),
      fuelTypeId: Number(fuelTypeId),
      driveTypeId: Number(driveTypeId),
      trimName: trimName.trim(),
      side: 0,
      buckets: uniqueBuckets,
    };

    try {
      if (editId) {
        await dispatch(
          editCarCatalyst({
            id: editId,
            payload,
            cashRegisterId: getCashRegisterId(),
          }),
        ).unwrap();
      } else {
        await dispatch(addCarCatalyst(payload)).unwrap();
      }
      toast.success(
        t(isEditing ? "carCatalyst.errors.updated" : "carCatalyst.errors.success"),
      );
      resetForm();
      if (editId) setSearchParams({});
    } catch (error) {
      const message =
        typeof error === "string"
          ? error
          : error instanceof Error
            ? error.message
            : t("common.error");
      setServerError(message);
      toast.error(message);
    }
  };

  const goToDetails = () => {
    navigate("/car-catalyst/details");
  };

  const toggleBucket = (clientKey: string) => {
    setExpandedBucketKey((current) =>
      current === clientKey ? null : clientKey,
    );
  };

  const renderBucketSection = (
    title: string,
    side: "front" | "back",
    data: UIBucket[],
  ) => (
    <div className={styles.bucketSection}>
      <div className={styles.sectionHeader}>
        <div>
          <h3
            className={`${styles.sectionTitle} ${
              side === "front" ? styles.frontTitle : styles.backTitle
            }`}
          >
            {side === "front" ? (
              <ArrowUp size={17} aria-hidden="true" />
            ) : (
              <ArrowDown size={17} aria-hidden="true" />
            )}
            {title}
          </h3>
          <p className={styles.sectionHint}>
            <Info size={14} aria-hidden="true" />
            {t("carCatalyst.sections.positionHelp")}
          </p>
        </div>

        <Button
          size="medium"
          className={`${actionStyles.referralButton} ${actionStyles.referralPrimary}`}
          onClick={() => addBucket(side)}
          disabled={unitCount >= 4}
        >
          <Plus size={15} aria-hidden="true" />
          {t("carCatalyst.actions.addBucket")}
        </Button>
      </div>

      <div className={styles.bucketList}>
        {data.map((bucket, bucketIndex) => (
          <div key={bucket.clientKey} className={styles.bucketCard}>
            <div className={styles.bucketAccordionHeader}>
              <button
                type="button"
                className={styles.bucketToggle}
                onClick={() => toggleBucket(bucket.clientKey)}
                aria-expanded={expandedBucketKey === bucket.clientKey}
              >
                <ChevronDown
                  className={`${styles.bucketChevron} ${expandedBucketKey === bucket.clientKey ? styles.bucketChevronOpen : ""}`}
                  size={17}
                  aria-hidden="true"
                />
                <span className={styles.orderNumber} aria-hidden="true">
                  {bucketIndex + 1}
                </span>
                <span className={styles.bucketToggleCode}>
                  {bucket.code || t("carCatalyst.table.bucketCode")}
                </span>
                <span className={styles.countBadge}>
                  <Layers3 size={12} aria-hidden="true" />
                  {t("carCatalyst.sections.componentCount", {
                    count: bucket.compositions.length,
                  })}
                </span>
                <span className={`${styles.countBadge} ${styles.unitBadge}`}>
                  <Package size={12} aria-hidden="true" />
                  {t("carCatalyst.table.unitsCount", {
                    count: bucket.quantity,
                  })}
                </span>
              </button>

              <div className={styles.bucketActions}>
                <button
                  type="button"
                  className={styles.iconAction}
                  onClick={() => moveBucket(side, bucketIndex, -1)}
                  disabled={bucketIndex === 0}
                  aria-label={t("carCatalyst.actions.moveBucketUp")}
                  title={t("carCatalyst.actions.moveBucketUp")}
                >
                  <MoveUp size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={styles.iconAction}
                  onClick={() => moveBucket(side, bucketIndex, 1)}
                  disabled={bucketIndex === data.length - 1}
                  aria-label={t("carCatalyst.actions.moveBucketDown")}
                  title={t("carCatalyst.actions.moveBucketDown")}
                >
                  <MoveDown size={15} aria-hidden="true" />
                </button>
                <Button
                  size="small"
                  variant="secondary"
                  className={`${actionStyles.referralButton} ${actionStyles.referralNeutral}`}
                  onClick={() => {
                    setActiveSide(side);
                    setExpandedBucketKey(bucket.clientKey);
                    addComposition(side, bucketIndex);
                  }}
                >
                  <Plus size={14} aria-hidden="true" />
                  {t("carCatalyst.table.addComposition")}
                </Button>

                <Button
                  size="small"
                  variant="secondary"
                  className={`${actionStyles.referralButton} ${actionStyles.referralNeutral}`}
                  onClick={() => duplicateBucket(side, bucketIndex)}
                  disabled={unitCount >= 4}
                >
                  <PackagePlus size={15} aria-hidden="true" />
                  {t("carCatalyst.actions.addIdenticalUnit")}
                </Button>

                <button
                  type="button"
                  className={`${styles.iconAction} ${styles.iconActionDanger}`}
                  onClick={() => deleteBucket(side, bucketIndex)}
                  aria-label={t("carCatalyst.actions.deleteBucket")}
                  title={t("carCatalyst.actions.deleteBucket")}
                >
                  <Trash size={15} aria-hidden="true" />
                </button>
              </div>
            </div>

            {expandedBucketKey === bucket.clientKey && (
              <>
                <div className={styles.orderGuide}>
                  <span className={side === "front" ? styles.frontOrder : styles.rearOrder}>
                    {side === "front" ? (
                      <ArrowUp size={15} aria-hidden="true" />
                    ) : (
                      <ArrowDown size={15} aria-hidden="true" />
                    )}
                    {t(
                      side === "front"
                        ? "carCatalyst.sections.frontPosition"
                        : "carCatalyst.sections.rearPosition",
                      { position: bucketIndex + 1 },
                    )}
                  </span>
                </div>
                <div className={styles.bucketFields}>
                  <TextField
                    label={t("carCatalyst.table.bucketCode")}
                    value={bucket.code}
                    onChange={(e) =>
                      updateBucket(side, bucketIndex, "code", e.target.value)
                    }
                  />
                  <TextField
                    label={t("carCatalyst.table.identicalUnits")}
                    type="number"
                    min="1"
                    max={bucket.quantity + (4 - unitCount)}
                    step="1"
                    value={bucket.quantity}
                    onChange={(e) =>
                      updateBucketQuantity(
                        side,
                        bucketIndex,
                        Number(e.target.value),
                      )
                    }
                  />
                </div>
                <div className={styles.compositionsList}>
              <p className={styles.unitValueHint}>
                {t("carCatalyst.table.unitValueHint")}
              </p>
              {bucket.compositions.map((composition, compositionIndex) => (
                <div key={composition.id} className={styles.compositionCard}>
                  <div className={styles.compositionGrid}>
                    <TextField
                      label={t("carCatalyst.table.compositionCode")}
                      value={composition.code}
                      onChange={(e) =>
                        updateComposition(
                          side,
                          bucketIndex,
                          compositionIndex,
                          "code",
                          e.target.value,
                        )
                      }
                    />

                    <Select
                      label={t("carCatalyst.table.compositionType")}
                      value={composition.type}
                      searchable
                      searchPlaceholder={t("common.search")}
                      onChange={(e) =>
                        updateComposition(
                          side,
                          bucketIndex,
                          compositionIndex,
                          "type",
                          Number(e.target.value),
                        )
                      }
                    >
                      <option value={0}>
                        {t("carCatalyst.table.compositionTypes.ceramic")}
                      </option>
                      <option value={1}>
                        {t("carCatalyst.table.compositionTypes.iron")}
                      </option>
                      <option value={2}>
                        {t("carCatalyst.table.compositionTypes.filter")}
                      </option>
                      <option value={3}>
                        {t("carCatalyst.table.compositionTypes.diesel")}
                      </option>
                    </Select>

                    <TextField
                      label={t("carCatalyst.table.weight")}
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9.]*"
                      step="any"
                      value={composition.weightKg}
                      placeholder="0"
                      onChange={(e) =>
                        updateComposition(
                          side,
                          bucketIndex,
                          compositionIndex,
                          "weightKg",
                          handleNumericChange(e.target.value),
                        )
                      }
                    />

                    {composition.type === 1 && (
                      <TextField
                        label={t("carCatalyst.table.pricePerKg")}
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9.]*"
                        step="any"
                        value={composition.pricePerKg}
                        placeholder="0"
                        onChange={(e) =>
                          updateComposition(
                            side,
                            bucketIndex,
                            compositionIndex,
                            "pricePerKg",
                            handleNumericChange(e.target.value),
                          )
                        }
                      />
                    )}

                    {shouldShowMetalFields(composition.type) && (
                      <>
                        <TextField
                          label={t("carCatalyst.table.pt")}
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9.]*"
                          step="any"
                          value={composition.pt_g}
                          placeholder="0"
                          onChange={(e) =>
                            updateComposition(
                              side,
                              bucketIndex,
                              compositionIndex,
                              "pt_g",
                              handleNumericChange(e.target.value),
                            )
                          }
                        />

                        <TextField
                          label={t("carCatalyst.table.pd")}
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9.]*"
                          step="any"
                          value={composition.pd_g}
                          placeholder="0"
                          onChange={(e) =>
                            updateComposition(
                              side,
                              bucketIndex,
                              compositionIndex,
                              "pd_g",
                              handleNumericChange(e.target.value),
                            )
                          }
                        />

                        <TextField
                          label={t("carCatalyst.table.rh")}
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9.]*"
                          step="any"
                          value={composition.rh_g}
                          placeholder="0"
                          onChange={(e) =>
                            updateComposition(
                              side,
                              bucketIndex,
                              compositionIndex,
                              "rh_g",
                              handleNumericChange(e.target.value),
                            )
                          }
                        />
                      </>
                    )}

                    {bucket.compositions.length > 1 && (
                      <div className={styles.compositionDeleteWrap}>
                        <button
                          type="button"
                          className={`${styles.iconAction} ${styles.iconActionDanger}`}
                          onClick={() =>
                            deleteComposition(side, bucketIndex, compositionIndex)
                          }
                          aria-label={t("carCatalyst.actions.deleteComposition")}
                          title={t("carCatalyst.actions.deleteComposition")}
                        >
                          <Trash size={15} aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className={styles.compositionTotals}>
                    <strong>{t("carCatalyst.table.unitTotals")}</strong>
                    <span>
                      {t("carCatalyst.table.weight")}:{" "}
                      {(
                        Number(composition.weightKg || 0) * bucket.quantity
                      ).toFixed(3)}{" "}
                      kg
                    </span>
                    {composition.type !== 1 && (
                      <>
                        <span>
                          Pt:{" "}
                          {(
                            Number(composition.pt_g || 0) * bucket.quantity
                          ).toFixed(2)}{" "}
                          g
                        </span>
                        <span>
                          Pd:{" "}
                          {(
                            Number(composition.pd_g || 0) * bucket.quantity
                          ).toFixed(2)}{" "}
                          g
                        </span>
                        <span>
                          Rh:{" "}
                          {(
                            Number(composition.rh_g || 0) * bucket.quantity
                          ).toFixed(2)}{" "}
                          g
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
                </div>
              </>
            )}
          </div>
        ))}

        {!data.length && (
          <div className={styles.emptyState}>{t("carCatalyst.errors.emptyBuckets")}</div>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>
            {isEditing
              ? t("carCatalyst.actions.editTitle")
              : t("carCatalyst.title")}
          </h2>

          <button
            type="button"
            className={styles.detailsAction}
            onClick={goToDetails}
            aria-label={t("common.details")}
            title={t("common.details")}
          >
            <ExternalLink size={17} aria-hidden="true" />
          </button>
        </div>

      </div>

      <section className={styles.vehiclePanel}>
        <div className={styles.vehiclePanelHeader}>
          <div className={styles.vehiclePanelTitle}>
            <span className={styles.vehicleIconBadge}>
              <CarFront size={19} aria-hidden="true" />
            </span>
            <div>
              <h3>{t("carCatalyst.sections.vehicleTitle")}</h3>
              <p>{t("carCatalyst.sections.vehicleHint")}</p>
            </div>
          </div>
          {isVehicleComplete && (
            <span className={styles.vehicleReadyBadge}>
              {t("carCatalyst.sections.vehicleReady")}
            </span>
          )}
          <span className={styles.unitCountBadge}>
            {t("carCatalyst.sections.physicalUnits", {
              count: unitCount,
              max: 4,
            })}
          </span>
        </div>

      <div className={`${styles.formGrid} ${styles.vehicleFormGrid}`}>
        <Select
          label={t("carCatalyst.fields.brand")}
          value={brandId}
          searchable
          searchPlaceholder={t("common.search")}
          onChange={(e) => handleBrandChange(e.target.value)}
        >
          <option value="">{t("carCatalyst.fields.selectBrand")}</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name || b.code}
            </option>
          ))}
        </Select>

        <Select
          label={t("carCatalyst.fields.model")}
          value={modelId}
          searchable
          searchPlaceholder={t("common.search")}
          disabled={!brandId || isModelsLoading}
          onChange={(e) =>
            setModelId(e.target.value === "" ? "" : Number(e.target.value))
          }
        >
          <option value="">{t("carCatalyst.fields.selectModel")}</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name || m.code}
            </option>
          ))}
        </Select>

        <Select
          label={t("carCatalyst.fields.birka")}
          value={birkaId}
          searchable
          searchPlaceholder={t("common.search")}
          onChange={(e) =>
            setBirkaId(e.target.value === "" ? "" : Number(e.target.value))
          }
        >
          <option value="">{t("carCatalyst.fields.selectBirka")}</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </Select>

        <Select
          label={t("carCatalyst.fields.year")}
          value={year}
          searchable
          searchPlaceholder={t("common.search")}
          onChange={(e) => {
            const value = e.target.value === "" ? "" : Number(e.target.value);
            setYear(value);
            if (value !== "") {
              setYearFrom((current) => current || value);
              setYearTo((current) => current || value);
            }
          }}
        >
          <option value="">{t("carCatalyst.fields.selectYear")}</option>
          {yearOptions.map((optionYear) => (
            <option key={optionYear} value={optionYear}>
              {optionYear}
            </option>
          ))}
        </Select>

        <Select
          label={t("carCatalyst.fields.country")}
          value={country}
          searchable
          searchPlaceholder={t("common.search")}
          onChange={(e) =>
            setCountry(e.target.value === "" ? "" : Number(e.target.value))
          }
        >
          <option value="">{t("carCatalyst.fields.selectCountry")}</option>
          {definitions?.markets?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>

        <Select
          label={t("carCatalyst.fields.engineVariant")}
          value={engineId}
          searchable
          searchPlaceholder={t("common.search")}
          onChange={(e) =>
            setEngineId(e.target.value === "" ? "" : Number(e.target.value))
          }
        >
          <option value="">{t("carCatalyst.fields.selectEngine")}</option>
          {definitions?.engines?.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </Select>
        <Select
          label={t("carCatalyst.fields.fuelType")}
          value={fuelTypeId}
          searchable
          searchPlaceholder={t("common.search")}
          onChange={(e) =>
            setFuelTypeId(e.target.value === "" ? "" : Number(e.target.value))
          }
        >
          <option value="">{t("carCatalyst.fields.selectFuelType")}</option>
          {definitions?.fuelTypes?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
        <Select
          label={t("carCatalyst.fields.driveType")}
          value={driveTypeId}
          searchable
          searchPlaceholder={t("common.search")}
          onChange={(e) =>
            setDriveTypeId(e.target.value === "" ? "" : Number(e.target.value))
          }
        >
          <option value="">{t("carCatalyst.fields.selectDriveType")}</option>
          {definitions?.driveTypes?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </Select>
        <TextField
          label={t("carCatalyst.fields.trimName")}
          value={trimName}
          placeholder={t("carCatalyst.fields.trimPlaceholder")}
          onChange={(e) => setTrimName(e.target.value)}
        />
        <Select
          label={t("carCatalyst.fields.yearFrom")}
          value={yearFrom}
          searchable
          searchPlaceholder={t("common.search")}
          onChange={(e) =>
            setYearFrom(e.target.value ? Number(e.target.value) : "")
          }
        >
          <option value="">{t("carCatalyst.fields.yearFrom")}</option>
          {yearOptions.map((optionYear) => (
            <option key={optionYear} value={optionYear}>{optionYear}</option>
          ))}
        </Select>
        <Select
          label={t("carCatalyst.fields.yearTo")}
          value={yearTo}
          searchable
          searchPlaceholder={t("common.search")}
          onChange={(e) =>
            setYearTo(e.target.value ? Number(e.target.value) : "")
          }
        >
          <option value="">{t("carCatalyst.fields.yearTo")}</option>
          {yearOptions.map((optionYear) => (
            <option key={optionYear} value={optionYear}>{optionYear}</option>
          ))}
        </Select>
        <TextField
          label={t("carCatalyst.fields.engineVolume")}
          type="number"
          min="0"
          step="any"
          value={engineVolume}
          onChange={(e) => setEngineVolume(handleNumericChange(e.target.value))}
        />
      </div>
      </section>

      <div className={styles.sideWorkspace}>
        <div className={styles.sideSwitcher} role="tablist" aria-label={t("carCatalyst.sections.bucketSides")}>
          {([
            { key: "front", side: "front", title: t("carCatalyst.sections.frontBuckets"), count: frontBuckets.reduce((sum, bucket) => sum + bucket.quantity, 0) },
            { key: "back", side: "back", title: t("carCatalyst.sections.backBuckets"), count: backBuckets.reduce((sum, bucket) => sum + bucket.quantity, 0) },
          ] as const).map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={activeSide === item.side}
              aria-controls="car-catalyst-active-side"
              id={`car-catalyst-${item.side}-tab`}
              disabled={!isVehicleComplete}
              className={`${styles.sideTab} ${activeSide === item.side ? styles.sideTabActive : ""}`}
              onClick={() => setActiveSide(item.side)}
            >
              {item.side === "front" ? (
                <ArrowUp size={15} aria-hidden="true" />
              ) : (
                <ArrowDown size={15} aria-hidden="true" />
              )}
              <span>{item.title}</span>
              <span className={styles.countBadge}>{item.count}</span>
            </button>
          ))}
        </div>

        {isVehicleComplete ? (
          <div
            id="car-catalyst-active-side"
            role="tabpanel"
            aria-labelledby={`car-catalyst-${activeSide}-tab`}
            className={styles.activeSidePanel}
          >
            {activeSide === "front"
              ? renderBucketSection(
                  t("carCatalyst.sections.frontBuckets"),
                  "front",
                  frontBuckets,
                )
              : renderBucketSection(
                  t("carCatalyst.sections.backBuckets"),
                  "back",
                  backBuckets,
                )}
          </div>
        ) : (
          <div className={styles.vehiclePrompt}>
            <CarFront size={20} aria-hidden="true" />
            <span>{t("carCatalyst.sections.selectVehiclePrompt")}</span>
          </div>
        )}
      </div>

      <div className={styles.footerActionBar}>
        {serverError && (
          <div className={styles.serverError} role="alert">
            {serverError}
          </div>
        )}
        <Button
          size="medium"
          className={`${actionStyles.referralButton} ${actionStyles.referralPrimary}`}
          onClick={handleSave}
          disabled={isSaving}
        >
          <Save size={15} aria-hidden="true" />
          {isEditing ? t("carCatalyst.actions.update") : t("carCatalyst.actions.save")}
        </Button>
      </div>
    </div>
  );
};
