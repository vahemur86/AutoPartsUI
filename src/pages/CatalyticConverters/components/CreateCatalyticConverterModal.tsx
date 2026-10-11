import { useEffect, useMemo, useState, type FC } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { BadgeCheck, Plus, Trash, Wrench, X } from "lucide-react";

// ui-kit
import { Button, Select, TextField } from "@/ui-kit";
import actionStyles from "@/pages/ReferralPersons/ReferralActions.module.css";

// stores
import { useAppDispatch } from "@/store/hooks";
import {
  addCatalyticConverter,
  editCatalyticConverter,
} from "@/store/slices/catalyticConvertersSlice";

// services
import { getVehicleModels } from "@/services/settings/vehicles";

// types
import type { VehicleDefinition } from "@/types/settings";
import type {
  CatalyticConverterCompatibility,
  CreateCatalyticConverterRequest,
} from "@/types/catalyticConverters";

// utils
import { getApiErrorMessage } from "@/utils";
import { getYearOptions } from "@/pages/CarCatalyst/yearOptions";

// styles
import styles from "../CatalyticConverters.module.css";

interface CompatibilityRow extends CatalyticConverterCompatibility {
  rowId: string;
}

const createRowId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const emptyRow = (): CompatibilityRow => ({
  rowId: createRowId(),
  brandId: null,
  modelId: null,
  engineId: null,
  fuelTypeId: null,
  enginePowerHp: null,
  yearFrom: null,
  yearTo: null,
  maxMileageKm: null,
});

interface CreateCatalyticConverterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: number) => void;
  onSaved?: () => void;
  definitions: VehicleDefinition | null;
  mode?: "create" | "edit";
  catalyticConverterId?: number;
  initialData?: CreateCatalyticConverterRequest | null;
}

export const CreateCatalyticConverterModal: FC<
  CreateCatalyticConverterModalProps
> = ({
  open,
  onOpenChange,
  onCreated,
  onSaved,
  definitions,
  mode = "create",
  catalyticConverterId,
  initialData,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [rows, setRows] = useState<CompatibilityRow[]>([]);
  const [modelsByRow, setModelsByRow] = useState<
    Record<string, VehicleDefinition["models"]>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codeError, setCodeError] = useState(false);

  const yearOptions = useMemo(() => getYearOptions(1970), []);

  useEffect(() => {
    if (!open) return;

    setCode(initialData?.code ?? "");
    setDescription(initialData?.description ?? "");
    setSellingPrice(
      initialData?.sellingPrice != null ? String(initialData.sellingPrice) : "",
    );
    setRows(
      (initialData?.compatibilities ?? []).map((item) => ({
        rowId: createRowId(),
        brandId: item.brandId ?? null,
        modelId: item.modelId ?? null,
        engineId: item.engineId ?? null,
        fuelTypeId: item.fuelTypeId ?? null,
        enginePowerHp: item.enginePowerHp ?? null,
        yearFrom: item.yearFrom ?? null,
        yearTo: item.yearTo ?? null,
        maxMileageKm: item.maxMileageKm ?? null,
      })),
    );
    setModelsByRow({});
    setCodeError(false);
  }, [initialData, open]);

  useEffect(() => {
    if (!open || rows.length === 0) return;

    const rowsWithBrand = rows.filter(
      (row): row is CompatibilityRow & { brandId: number } => row.brandId != null,
    );

    if (rowsWithBrand.length === 0) return;

    const loadModels = async () => {
      const entries = await Promise.all(
        rowsWithBrand.map(async (row) => {
          const data = await getVehicleModels(row.brandId);
          return [
            row.rowId,
            (data || []).map((model) => ({
              id: model.id,
              code: model.code,
              name: model.name,
            })),
          ] as const;
        }),
      );

      setModelsByRow((prev) => ({
        ...prev,
        ...Object.fromEntries(entries),
      }));
    };

    loadModels().catch(() => {
      toast.error(t("catalyticConverters.errors.loadingLookups"));
    });
  }, [open, rows, t]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) onOpenChange(false);
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isSubmitting, onOpenChange, open]);

  const addRow = () => {
    setRows((prev) => [...prev, emptyRow()]);
  };

  const removeRow = (rowId: string) => {
    setRows((prev) => prev.filter((row) => row.rowId !== rowId));
  };

  const updateRow = (
    rowId: string,
    field: keyof CatalyticConverterCompatibility,
    value: string,
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.rowId !== rowId) return row;

        return {
          ...row,
          [field]: value === "" ? null : Number(value),
        };
      }),
    );
  };

  const handleBrandChange = async (rowId: string, brandIdValue: string) => {
    updateRow(rowId, "brandId", brandIdValue);
    updateRow(rowId, "modelId", "");

    if (!brandIdValue) {
      setModelsByRow((prev) => ({ ...prev, [rowId]: [] }));
      return;
    }

    try {
      const data = await getVehicleModels(Number(brandIdValue));
      setModelsByRow((prev) => ({
        ...prev,
        [rowId]: (data || []).map((model) => ({
          id: model.id,
          code: model.code,
          name: model.name,
        })),
      }));
    } catch {
      toast.error(t("catalyticConverters.errors.loadingLookups"));
    }
  };

  const handleSave = async () => {
    if (!code.trim()) {
      setCodeError(true);
      toast.error(t("catalyticConverters.validation.codeRequired"));
      return;
    }

    if (sellingPrice && Number(sellingPrice) < 0) {
      toast.error(t("catalyticConverters.validation.invalidSellingPrice"));
      return;
    }

    const compatibilities = rows.map((row) => {
      return Object.fromEntries(
        Object.entries(row).filter(([key]) => key !== "rowId"),
      ) as CatalyticConverterCompatibility;
    });

    setIsSubmitting(true);
    try {
      const payload = {
        code: code.trim(),
        description: description.trim() || null,
        sellingPrice: sellingPrice ? Number(sellingPrice) : null,
        compatibilities: compatibilities.length > 0 ? compatibilities : undefined,
      };

      if (mode === "edit" && catalyticConverterId) {
        await dispatch(
          editCatalyticConverter({
            id: catalyticConverterId,
            payload,
          }),
        ).unwrap();

        toast.success(t("catalyticConverters.success.updated"));
        onSaved?.();
      } else {
        const id = await dispatch(addCatalyticConverter(payload)).unwrap();
        toast.success(t("catalyticConverters.success.created"));
        onCreated?.(id);
      }
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        mode === "edit"
          ? t("catalyticConverters.error.failedToUpdate")
          : t("catalyticConverters.error.failedToCreate"),
      );

      if (message.toLowerCase().includes("exist")) {
        setCodeError(true);
        toast.error(t("catalyticConverters.validation.codeExists"));
      } else {
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  const title = mode === "edit"
    ? t("catalyticConverters.edit.title")
    : t("catalyticConverters.create.title");

  return createPortal(
    <div
      className={styles.drawerBackdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onOpenChange(false);
        }
      }}
    >
      <aside
        className={styles.converterDrawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="converter-drawer-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.drawerHeader}>
          <div className={styles.drawerIcon} aria-hidden="true">
            <Wrench size={20} />
          </div>
          <div className={styles.drawerHeaderCopy}>
            <span>{t("catalyticConverters.title")}</span>
            <h2 id="converter-drawer-title">{title}</h2>
          </div>
          <button
            type="button"
            className={styles.drawerClose}
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            aria-label={t("common.close")}
            title={t("common.close")}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.drawerBody}>
          <div className={styles.drawerSectionHeading}>
            <BadgeCheck size={15} aria-hidden="true" />
            <span>{t("catalyticConverters.form.compatibilities")}</span>
          </div>
          <div className={styles.modalIntro}>
            {t("catalyticConverters.form.compatibilitiesHint")}
          </div>

          <div className={styles.formGrid}>
        <TextField
          label={t("catalyticConverters.form.code")}
          value={code}
          error={codeError}
          helperText={
            codeError ? t("catalyticConverters.validation.codeExists") : undefined
          }
          onChange={(e) => {
            setCode(e.target.value);
            setCodeError(false);
          }}
        />

        <TextField
          label={t("catalyticConverters.form.description")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <TextField
          label={t("catalyticConverters.form.sellingPrice")}
          type="number"
          value={sellingPrice}
          onChange={(e) => setSellingPrice(e.target.value)}
        />
          </div>

      <div className={styles.compatibilityHeader}>
        <div>
          <h4 className={styles.sectionTitle}>
            {t("catalyticConverters.form.compatibilities")}
          </h4>
        </div>
        <Button
          size="small"
          variant="secondary"
          className={`${actionStyles.referralButton} ${actionStyles.referralNeutral}`}
          onClick={addRow}
        >
          <Plus size={14} aria-hidden="true" />
          {t("catalyticConverters.actions.addCompatibility")}
        </Button>
      </div>

      <div className={styles.compatibilityList}>
        {rows.map((row, index) => (
          <div key={row.rowId} className={styles.compatibilityCard}>
            <div className={styles.compatibilityCardHeader}>
              <h5 className={styles.compatibilityCardTitle}>
                {t("catalyticConverters.form.compatibilityItem")} #{index + 1}
              </h5>
                <button
                  type="button"
                  className={styles.compatibilityRemoveIcon}
                onClick={() => removeRow(row.rowId)}
                  aria-label={t("common.delete")}
                  title={t("common.delete")}
              >
                  <Trash size={14} aria-hidden="true" />
                </button>
            </div>

            <div className={styles.compatibilityFields}>
              <Select
                label={t("catalyticConverters.filters.brand")}
                value={row.brandId ?? ""}
                onChange={(e) => handleBrandChange(row.rowId, e.target.value)}
              >
                <option value="">{t("common.select")}</option>
                {(definitions?.brands ?? []).map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </Select>

              <Select
                label={t("catalyticConverters.filters.model")}
                value={row.modelId ?? ""}
                onChange={(e) => updateRow(row.rowId, "modelId", e.target.value)}
                disabled={!row.brandId}
              >
                <option value="">{t("common.select")}</option>
                {(modelsByRow[row.rowId] ?? []).map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </Select>

              <Select
                label={t("catalyticConverters.filters.engine")}
                value={row.engineId ?? ""}
                onChange={(e) => updateRow(row.rowId, "engineId", e.target.value)}
              >
                <option value="">{t("common.select")}</option>
                {(definitions?.engines ?? []).map((engine) => (
                  <option key={engine.id} value={engine.id}>
                    {engine.name}
                  </option>
                ))}
              </Select>

              <Select
                label={t("catalyticConverters.filters.fuelType")}
                value={row.fuelTypeId ?? ""}
                onChange={(e) => updateRow(row.rowId, "fuelTypeId", e.target.value)}
              >
                <option value="">{t("common.select")}</option>
                {(definitions?.fuelTypes ?? []).map((fuel) => (
                  <option key={fuel.id} value={fuel.id}>
                    {fuel.name}
                  </option>
                ))}
              </Select>

              <TextField
                label={t("catalyticConverters.form.enginePowerHp")}
                type="number"
                value={row.enginePowerHp ?? ""}
                onChange={(e) =>
                  updateRow(row.rowId, "enginePowerHp", e.target.value)
                }
              />

              <Select
                label={t("catalyticConverters.form.yearFrom")}
                value={row.yearFrom ?? ""}
                onChange={(e) => updateRow(row.rowId, "yearFrom", e.target.value)}
              >
                <option value="">{t("common.select")}</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>

              <Select
                label={t("catalyticConverters.form.yearTo")}
                value={row.yearTo ?? ""}
                onChange={(e) => updateRow(row.rowId, "yearTo", e.target.value)}
              >
                <option value="">{t("common.select")}</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>

              <TextField
                label={t("catalyticConverters.form.maxMileageKm")}
                type="number"
                value={row.maxMileageKm ?? ""}
                onChange={(e) =>
                  updateRow(row.rowId, "maxMileageKm", e.target.value)
                }
              />
            </div>
          </div>
        ))}
      </div>

        </div>

        <footer className={styles.drawerFooter}>
          <Button
            variant="secondary"
            className={`${actionStyles.referralButton} ${actionStyles.referralNeutral}`}
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t("common.cancel")}
          </Button>
          <Button
            className={`${actionStyles.referralButton} ${actionStyles.referralPrimary}`}
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? t("common.loading")
              : mode === "edit"
                ? t("common.save")
                : t("common.add")}
          </Button>
        </footer>
      </aside>
    </div>,
    document.body,
  );
};
