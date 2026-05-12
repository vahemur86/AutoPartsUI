import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";


import { Button, IconButton, Select, TextField } from "@/ui-kit";
import { useAppDispatch } from "@/store/hooks";
import {
  getVehicleDefinitions,
  getVehicleModels,
} from "@/services/settings/vehicles";
import autoParts from "@/assets/images/autoParts.png";

import type {
  CarCatalystBucket,
  CreateCarCatalyst,
  VehicleDefinition,
} from "@/types/settings";

import styles from "./CarCatalyst.module.css";
import { addCarCatalyst } from "@/store/slices/carCatalystSlice";
import { Copy, ExternalLink, Trash } from "lucide-react";
import { useNavigate } from "react-router-dom";

type UIBucket = Omit<
  CarCatalystBucket,
  "weightKg" | "pt_g" | "pd_g" | "rh_g"
> & {
  weightKg: string;
  pt_g: string;
  pd_g: string;
  rh_g: string;
};

const emptyBucket = (side: number): UIBucket => ({
  side,
  code: "",
  weightKg: "",
  pt_g: "",
  pd_g: "",
  rh_g: "",
});

const sanitizeDecimal = (value: string) =>
  value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");

export const CarCatalystPage = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const [definitions, setDefinitions] = useState<VehicleDefinition | null>(
    null,
  );

  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);

  const [brandId, setBrandId] = useState<number | "">("");
  const [modelId, setModelId] = useState<number | "">("");
  const [year, setYear] = useState<number | "">("");
  const [country, setCountry] = useState<number | "">("");
  const [engineId, setEngineId] = useState<number | "">("");
  const navigate = useNavigate();

  const [frontBuckets, setFrontBuckets] = useState<UIBucket[]>([]);
  const [backBuckets, setBackBuckets] = useState<UIBucket[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getVehicleDefinitions();
        setDefinitions(data);
        setBrands(data.brands || []);
      } catch {
        toast.error(t("carCatalyst.error.loading"));
      }
    };
    load();
  }, []);

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
      toast.error(t("carCatalyst.error.loading"));
    }
  };

  const resetForm = () => {
    setBrandId("");
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

  const duplicateBucket = (
  side: "front" | "back",
  index: number,
) => {
  const setter = side === "front"
    ? setFrontBuckets
    : setBackBuckets;

  setter((prev) => {
    const item = prev[index];

    return [
      ...prev,
      {
        ...item,
      },
    ];
  });
};

  const updateBucket = (
    side: "front" | "back",
    index: number,
    field: keyof UIBucket,
    value: any,
  ) => {
    const setter = side === "front" ? setFrontBuckets : setBackBuckets;
    setter((prev) =>
      prev.map((b, i) => (i === index ? { ...b, [field]: value } : b)),
    );
  };

  const handleSave = async () => {
    if (!brandId || !modelId || !year || !country || !engineId) {
      toast.error(t("carCatalyst.errors.required"));
      return;
    }

    const normalize = (b: UIBucket): CarCatalystBucket => ({
      side: b.side,
      code: b.code,
      weightKg: Number(b.weightKg || 0),
      pt_g: Number(b.pt_g || 0),
      pd_g: Number(b.pd_g || 0),
      rh_g: Number(b.rh_g || 0),
    });

    const payload: CreateCarCatalyst = {
      brandId: Number(brandId),
      modelId: Number(modelId),
      year: Number(year),
      country: Number(country),
      engineVolume: Number(engineId),
      side: 0,
      buckets: [...frontBuckets, ...backBuckets].map(normalize),
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

  const renderTable = (
    title: string,
    side: "front" | "back",
    data: UIBucket[],
  ) => (
    <div className={styles.bucketTable}>
      <div className={styles.tableHeader}>
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

      <table className={styles.table}>
        <thead>
          <tr>
            <th>{t("carCatalyst.table.code")}</th>
            <th>{t("carCatalyst.table.weight")}</th>
            <th>{t("carCatalyst.table.pt")}</th>
            <th>{t("carCatalyst.table.pd")}</th>
            <th>{t("carCatalyst.table.rh")}</th>
            <th>{t("common.copy")}</th>
            <th>{t("common.delete")}</th>
          </tr>
        </thead>

        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <td>
                <TextField
                  value={row.code}
                  onChange={(e) =>
                    updateBucket(side, i, "code", e.target.value)
                  }
                />
              </td>

              <td>
                <TextField
                  value={row.weightKg}
                  placeholder="0"
                  onChange={(e) =>
                    updateBucket(
                      side,
                      i,
                      "weightKg",
                      sanitizeDecimal(e.target.value),
                    )
                  }
                />
              </td>

              <td>
                <TextField
                  value={row.pt_g}
                  placeholder="0"
                  onChange={(e) =>
                    updateBucket(
                      side,
                      i,
                      "pt_g",
                      sanitizeDecimal(e.target.value),
                    )
                  }
                />
              </td>

              <td>
                <TextField
                  value={row.pd_g}
                  placeholder="0"
                  onChange={(e) =>
                    updateBucket(
                      side,
                      i,
                      "pd_g",
                      sanitizeDecimal(e.target.value),
                    )
                  }
                />
              </td>

              <td>
                <TextField
                  value={row.rh_g}
                  placeholder="0"
                  onChange={(e) =>
                    updateBucket(
                      side,
                      i,
                      "rh_g",
                      sanitizeDecimal(e.target.value),
                    )
                  }
                />
              </td>
<td>
  <IconButton
    size="medium"
    onClick={() => duplicateBucket(side, i)}
    icon={<Copy size={18} />}
    ariaLabel="duplicate"
  />
</td>
              <td>
                <IconButton
                  className={styles.trashIconButton}
                  size="medium"
                  onClick={() => deleteBucket(side, i)}
                  icon={<Trash className={styles.trashIcon} />}
                  ariaLabel=""
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
          {t("common.save")}
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

      <div className={styles.tablesRowWithImage}>
        {renderTable(
          t("carCatalyst.sections.frontBuckets"),
          "front",
          frontBuckets,
        )}

        <div className={styles.centerImage}>
          <img
            src={autoParts}
            alt="auto parts"
            className={styles.centerImageImg}
          />
        </div>

        {renderTable(
          t("carCatalyst.sections.backBuckets"),
          "back",
          backBuckets,
        )}
      </div>
    </div>
  );
};
