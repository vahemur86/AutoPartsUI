import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { Button, IconButton, Select, TextField } from "@/ui-kit";
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
import { Copy, ExternalLink, Trash } from "lucide-react";
import { useNavigate } from "react-router-dom";

type UICompositionType = 0 | 1 | 2;

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
  compositions: UIComposition[];
};

const createCompositionId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const emptyComposition = (): UIComposition => ({
  id: createCompositionId(),
  code: "",
  type: 0,
  weightKg: "0",
  pricePerKg: "0",
  pt_g: "0",
  pd_g: "0",
  rh_g: "0",
});

const emptyBucket = (side: number): UIBucket => ({
  side,
  code: "",
  compositions: [emptyComposition()],
});

const sanitizeNumericInput = (value: string) =>
  value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");

const shouldShowMetalFields = (type: number) => type !== 1;

export const CarCatalystPage = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const [definitions, setDefinitions] = useState<VehicleDefinition | null>(
    null,
  );

  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);

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

    setBrandId(id);
    setModelId("");

    if (!id) {
      setModels([]);
      return;
    }

    try {
      const data = await getVehicleModels(id);
      setModels(data || []);
    } catch {
      toast.error(t("carCatalyst.errors.loading"));
    }
  };

  const resetForm = () => {
    setBrandId("");
    setBirkaId("");
    setModelId("");
    setYear("");
    setCountry("");
    setEngineId("");
    setFrontBuckets([]);
    setBackBuckets([]);
    setModels([]);
  };

  const addBucket = (side: "front" | "back") => {
    const setter = side === "front" ? setFrontBuckets : setBackBuckets;
    const sideValue = side === "front" ? 1 : 2;
    setter((prev) => [...prev, emptyBucket(sideValue)]);
  };

  const deleteBucket = (side: "front" | "back", index: number) => {
    const setter = side === "front" ? setFrontBuckets : setBackBuckets;
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const duplicateBucket = (side: "front" | "back", index: number) => {
    const setter = side === "front" ? setFrontBuckets : setBackBuckets;

    setter((prev) => {
      const item = prev[index];

      if (!item) return prev;

      return [
        ...prev,
        {
          ...item,
          id: undefined,
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
          {title}
        </h3>

        <Button size="small" onClick={() => addBucket(side)}>
          {t("common.add")}
        </Button>
      </div>

      <div className={styles.bucketList}>
        {data.map((bucket, bucketIndex) => (
          <div key={`${side}-${bucketIndex}`} className={styles.bucketCard}>
            <div className={styles.bucketHeaderRow}>
              <TextField
                label={t("carCatalyst.table.bucketCode")}
                value={bucket.code}
                onChange={(e) =>
                  updateBucket(side, bucketIndex, "code", e.target.value)
                }
              />

              <div className={styles.bucketActions}>
                <Button
                  size="small"
                  onClick={() => addComposition(side, bucketIndex)}
                >
                  {t("carCatalyst.table.addComposition")}
                </Button>

                <IconButton
                  size="medium"
                  onClick={() => duplicateBucket(side, bucketIndex)}
                  icon={<Copy size={18} />}
                  ariaLabel="duplicate"
                />

                <IconButton
                  className={styles.trashIconButton}
                  size="medium"
                  onClick={() => deleteBucket(side, bucketIndex)}
                  icon={<Trash className={styles.trashIcon} />}
                  ariaLabel=""
                />
              </div>
            </div>

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
                    </Select>

                    <TextField
                      label={t("carCatalyst.table.weight")}
                      type="text"
                      inputMode="decimal"
                      value={composition.weightKg || "0"}
                      placeholder="0"
                      onChange={(e) =>
                        updateComposition(
                          side,
                          bucketIndex,
                          compositionIndex,
                          "weightKg",
                          sanitizeNumericInput(e.target.value),
                        )
                      }
                    />

                    {composition.type === 1 && (
                      <TextField
                        label={t("carCatalyst.table.pricePerKg")}
                        type="text"
                        inputMode="decimal"
                        value={composition.pricePerKg || "0"}
                        placeholder="0"
                        onChange={(e) =>
                          updateComposition(
                            side,
                            bucketIndex,
                            compositionIndex,
                            "pricePerKg",
                            sanitizeNumericInput(e.target.value),
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
                          value={composition.pt_g || "0"}
                          placeholder="0"
                          onChange={(e) =>
                            updateComposition(
                              side,
                              bucketIndex,
                              compositionIndex,
                              "pt_g",
                              sanitizeNumericInput(e.target.value),
                            )
                          }
                        />

                        <TextField
                          label={t("carCatalyst.table.pd")}
                          type="text"
                          inputMode="decimal"
                          value={composition.pd_g || "0"}
                          placeholder="0"
                          onChange={(e) =>
                            updateComposition(
                              side,
                              bucketIndex,
                              compositionIndex,
                              "pd_g",
                              sanitizeNumericInput(e.target.value),
                            )
                          }
                        />

                        <TextField
                          label={t("carCatalyst.table.rh")}
                          type="text"
                          inputMode="decimal"
                          value={composition.rh_g || "0"}
                          placeholder="0"
                          onChange={(e) =>
                            updateComposition(
                              side,
                              bucketIndex,
                              compositionIndex,
                              "rh_g",
                              sanitizeNumericInput(e.target.value),
                            )
                          }
                        />
                      </>
                    )}

                    {bucket.compositions.length > 1 && (
                      <div className={styles.compositionDeleteWrap}>
                        <IconButton
                          className={styles.trashIconButton}
                          size="medium"
                          onClick={() =>
                            deleteComposition(side, bucketIndex, compositionIndex)
                          }
                          icon={<Trash className={styles.trashIcon} />}
                          ariaLabel=""
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
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

          <IconButton
            size="large"
            onClick={goToDetails}
            icon={<ExternalLink size={18} />}
            ariaLabel="details"
          />
        </div>

        <Button variant="primary" size="small" onClick={handleSave}>
          {t("carCatalyst.actions.save")}
        </Button>
      </div>

      <div className={styles.formGrid}>
        <Select
          label={t("carCatalyst.fields.brand")}
          value={brandId}
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
          value={country}
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

      <div className={styles.tablesRow}>
        {renderBucketSection(
          t("carCatalyst.sections.frontBuckets"),
          "front",
          frontBuckets,
        )}

        {renderBucketSection(
          t("carCatalyst.sections.backBuckets"),
          "back",
          backBuckets,
        )}
      </div>
    </div>
  );
};
