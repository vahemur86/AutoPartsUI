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
  VehicleDefinition,
} from "@/types/settings";

import styles from "./CarCatalyst.module.css";
import { addCarCatalyst } from "@/store/slices/carCatalystSlice";
import {
  ArrowDown,
  ArrowUp,
  CarFront,
  ChevronDown,
  Copy,
  ExternalLink,
  Layers3,
  Plus,
  Save,
  Trash,
} from "lucide-react";
import actionStyles from "@/pages/ReferralPersons/ReferralActions.module.css";
import { useNavigate } from "react-router-dom";
import { getYearOptions } from "./yearOptions";

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

const emptyBucket = (side: number): UIBucket => ({
  clientKey: createCompositionId(),
  side,
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

  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [isModelsLoading, setIsModelsLoading] = useState(false);
  const modelRequestId = useRef(0);

  const [brandId, setBrandId] = useState<number | "">("");
  const [birkaId, setBirkaId] = useState<number | "">("");
  const [modelId, setModelId] = useState<number | "">("");
  const [year, setYear] = useState<number | "">("");
  const [country, setCountry] = useState<number | "">("");
  const [engineId, setEngineId] = useState<number | "">("");
  const navigate = useNavigate();

  const { tags } = useAppSelector((state) => state.tags);

  const [frontBuckets, setFrontBuckets] = useState<UIBucket[]>([]);
  const [backBuckets, setBackBuckets] = useState<UIBucket[]>([]);
  const [activeSide, setActiveSide] = useState<"front" | "back">("front");
  const [expandedBucketKey, setExpandedBucketKey] = useState<string | null>(null);
  const yearOptions = getYearOptions();
  const isVehicleComplete = Boolean(brandId && modelId && year && country && engineId);

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
    setCountry("");
    setEngineId("");
    setFrontBuckets([]);
    setBackBuckets([]);
    setModels([]);
    setActiveSide("front");
    setExpandedBucketKey(null);
  };

  const addBucket = (side: "front" | "back") => {
    const setter = side === "front" ? setFrontBuckets : setBackBuckets;
    const sideValue = side === "front" ? 1 : 2;
    const bucket = emptyBucket(sideValue);
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
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const duplicateBucket = (side: "front" | "back", index: number) => {
    const setter = side === "front" ? setFrontBuckets : setBackBuckets;
    const duplicateKey = createCompositionId();
    setExpandedBucketKey(duplicateKey);

    setter((prev) => {
      const item = prev[index];

      if (!item) return prev;

      return [
        ...prev,
        {
          ...item,
          id: undefined,
          clientKey: duplicateKey,
          compositions: item.compositions.map((composition) => ({
            ...composition,
            id: createCompositionId(),
          })),
        },
      ];
    });
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

    for (const bucket of buckets) {
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

        if (composition.type === 1) {
          if (!composition.weightKg || composition.pricePerKg === "") {
            toast.error(t("carCatalyst.errors.required"));
            return false;
          }
        } else if (
          !composition.weightKg ||
          !composition.pt_g ||
          !composition.pd_g ||
          !composition.rh_g
        ) {
          toast.error(t("carCatalyst.errors.required"));
          return false;
        }
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!brandId || !modelId || !year || !country || !engineId) {
      toast.error(t("carCatalyst.errors.required"));
      return;
    }

    const buckets = [...frontBuckets, ...backBuckets];

    if (!validateBuckets(buckets)) {
      return;
    }

    const normalize = (bucket: UIBucket): CarCatalystBucket => ({
      side: bucket.side,
      code: bucket.code.trim(),
      compositions: bucket.compositions.map((composition) => ({
        code: composition.code.trim(),
        type: Number(composition.type),
        weightKg: Number(composition.weightKg || 0),
        pt_g: composition.type === 1 ? 0 : Number(composition.pt_g || 0),
        pd_g: composition.type === 1 ? 0 : Number(composition.pd_g || 0),
        rh_g: composition.type === 1 ? 0 : Number(composition.rh_g || 0),
        ...(composition.type === 1
          ? { pricePerKg: Number(composition.pricePerKg || 0) }
          : {}),
      })),
    });

    const payload: CreateCarCatalyst = {
      birkaId: typeof birkaId === "number" ? birkaId : undefined,
      brandId: Number(brandId),
      modelId: Number(modelId),
      year: Number(year),
      country: Number(country),
      engineVolume: Number(engineId),
      side: 0,
      buckets: buckets.map(normalize),
    };

    try {
      await dispatch(addCarCatalyst(payload)).unwrap();
      toast.success(t("carCatalyst.errors.success"));
      resetForm();
    } catch {
      toast.error(t("common.error"));
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
        <h3
          className={`${styles.sectionTitle} ${
            side === "front" ? styles.frontTitle : styles.backTitle
          }`}
        >
          {side === "front" ? (
            <ArrowUp size={15} aria-hidden="true" />
          ) : (
            <ArrowDown size={15} aria-hidden="true" />
          )}
          {title}
        </h3>

        <Button
          size="medium"
          className={`${actionStyles.referralButton} ${actionStyles.referralPrimary}`}
          onClick={() => addBucket(side)}
        >
          <Plus size={15} aria-hidden="true" />
          {t("common.add")}
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
                <span className={styles.bucketToggleCode}>
                  {bucket.code || t("carCatalyst.table.bucketCode")}
                </span>
                <span className={styles.countBadge}>
                  <Layers3 size={12} aria-hidden="true" />
                  {t("carCatalyst.sections.componentCount", {
                    count: bucket.compositions.length,
                  })}
                </span>
              </button>

              <div className={styles.bucketActions}>
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

                <button
                  type="button"
                  className={styles.iconAction}
                  onClick={() => duplicateBucket(side, bucketIndex)}
                  aria-label={t("carCatalyst.actions.duplicateBucket")}
                  title={t("carCatalyst.actions.duplicateBucket")}
                >
                  <Copy size={16} aria-hidden="true" />
                </button>

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
                <TextField
                  label={t("carCatalyst.table.bucketCode")}
                  value={bucket.code}
                  onChange={(e) =>
                    updateBucket(side, bucketIndex, "code", e.target.value)
                  }
                />
                <div className={styles.compositionsList}>
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
          <h2 className={styles.title}>{t("carCatalyst.title")}</h2>

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
          onChange={(e) =>
            setYear(e.target.value === "" ? "" : Number(e.target.value))
          }
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
          label={t("carCatalyst.fields.engine")}
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
      </div>
      </section>

      <div className={styles.sideWorkspace}>
        <div className={styles.sideSwitcher} role="tablist" aria-label={t("carCatalyst.sections.bucketSides")}>
          {([
            { key: "front", side: "front", title: t("carCatalyst.sections.frontBuckets"), count: frontBuckets.length },
            { key: "back", side: "back", title: t("carCatalyst.sections.backBuckets"), count: backBuckets.length },
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
        <Button
          size="medium"
          className={`${actionStyles.referralButton} ${actionStyles.referralPrimary}`}
          onClick={handleSave}
        >
          <Save size={15} aria-hidden="true" />
          {t("carCatalyst.actions.save")}
        </Button>
      </div>
    </div>
  );
};
