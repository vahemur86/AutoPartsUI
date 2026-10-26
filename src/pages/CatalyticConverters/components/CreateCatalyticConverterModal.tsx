import { useEffect, useRef, useState, type FC } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { BadgeCheck, CarFront, LoaderCircle, Plus, Trash, Wrench, X } from "lucide-react";

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
import { getAllVehicleDefinitions } from "@/services/vehicleAdmin";

// types
import type { VehicleDefinition } from "@/types/settings";
import type { VehicleDefinitionRecord } from "@/types/vehicleAdmin";
import type {
  CatalyticConverterCompatibility,
  CreateCatalyticConverterRequest,
} from "@/types/catalyticConverters";

// utils
import { getApiErrorMessage } from "@/utils";

// styles
import styles from "../CatalyticConverters.module.css";

interface CompatibilityRow extends CatalyticConverterCompatibility {
  rowId: string;
}

const createRowId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const emptyRow = (): CompatibilityRow => ({
  rowId: createRowId(),
  vehicleDefinitionId: null,
  brandId: null,
  modelId: null,
  engineId: null,
  fuelTypeId: null,
  enginePowerHp: null,
  yearFrom: null,
  yearTo: null,
  maxMileageKm: null,
});

const applyVehicleToRow = (
  row: CompatibilityRow,
  vehicle: VehicleDefinitionRecord,
): CompatibilityRow => ({
  ...row,
  vehicleDefinitionId: vehicle.id,
  brandId: vehicle.brandId,
  modelId: vehicle.modelId,
  engineId: vehicle.engineId,
  fuelTypeId: vehicle.fuelTypeId,
  enginePowerHp: vehicle.horsePower,
  yearFrom: vehicle.year,
  yearTo: vehicle.year,
});

const findMatchingVehicle = (
  row: CompatibilityRow,
  candidates: VehicleDefinitionRecord[],
) => {
  if (row.vehicleDefinitionId != null) {
    return candidates.find((vehicle) => vehicle.id === row.vehicleDefinitionId) ?? null;
  }

  const matches = candidates.filter((vehicle) =>
    (!row.engineId || vehicle.engineId === row.engineId) &&
    (!row.fuelTypeId || vehicle.fuelTypeId === row.fuelTypeId) &&
    (!row.enginePowerHp || vehicle.horsePower === row.enginePowerHp) &&
    (row.yearFrom == null || vehicle.year >= row.yearFrom) &&
    (row.yearTo == null || vehicle.year <= row.yearTo),
  );

  return matches.length === 1 ? matches[0] : null;
};

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
  const [vehiclesByRow, setVehiclesByRow] = useState<
    Record<string, VehicleDefinitionRecord[]>
  >({});
  const [loadingVehiclesByRow, setLoadingVehiclesByRow] = useState<
    Record<string, boolean>
  >({});
  const vehicleSearchRequestIds = useRef<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codeError, setCodeError] = useState(false);

  useEffect(() => {
    if (!open) return;

    setCode(initialData?.code ?? "");
    setDescription(initialData?.description ?? "");
    setSellingPrice(
      initialData?.sellingPrice != null ? String(initialData.sellingPrice) : "",
    );
    const initialRows: CompatibilityRow[] = (initialData?.compatibilities ?? []).map((item) => ({
        rowId: createRowId(),
        vehicleDefinitionId: item.vehicleDefinitionId ?? null,
        brandId: item.brandId ?? null,
        modelId: item.modelId ?? null,
        engineId: item.engineId ?? null,
        fuelTypeId: item.fuelTypeId ?? null,
        enginePowerHp: item.enginePowerHp ?? null,
        yearFrom: item.yearFrom ?? null,
        yearTo: item.yearTo ?? null,
        maxMileageKm: item.maxMileageKm ?? null,
      }));
    setRows(initialRows);
    setVehiclesByRow({});
    setLoadingVehiclesByRow({});
    setCodeError(false);

    let cancelled = false;
    const rowsWithBrand = initialRows.filter(
      (row): row is CompatibilityRow & { brandId: number } => row.brandId != null,
    );

    void Promise.all(rowsWithBrand.map(async (row) => {
      try {
        const vehicles = await getAllVehicleDefinitions({
          brandId: row.brandId,
          ...(row.modelId != null ? { modelId: row.modelId } : {}),
        });
        return [row.rowId, vehicles] as const;
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : t("catalyticConverters.errors.loadingLookups"),
        );
        return [row.rowId, []] as const;
      }
    })).then((entries) => {
      if (cancelled) return;
      const matches = Object.fromEntries(entries);
      setVehiclesByRow(matches);
      setRows((currentRows) => currentRows.map((row) => {
        const vehicle = findMatchingVehicle(row, matches[row.rowId] ?? []);
        if (vehicle) return applyVehicleToRow(row, vehicle);
        return row.vehicleDefinitionId != null
          ? { ...row, vehicleDefinitionId: null }
          : row;
      }));
    });

    return () => {
      cancelled = true;
    };
  }, [initialData, open, t]);

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
    vehicleSearchRequestIds.current[rowId] = (vehicleSearchRequestIds.current[rowId] ?? 0) + 1;
    setRows((prev) => prev.filter((row) => row.rowId !== rowId));
    setVehiclesByRow((prev) => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
    setLoadingVehiclesByRow((prev) => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
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
    const nextBrandId = brandIdValue ? Number(brandIdValue) : null;
    const previousRow = rows.find((row) => row.rowId === rowId);
    const requestId = (vehicleSearchRequestIds.current[rowId] ?? 0) + 1;
    vehicleSearchRequestIds.current[rowId] = requestId;

    setRows((prev) => prev.map((row) => row.rowId === rowId
      ? { ...emptyRow(), rowId, brandId: nextBrandId, maxMileageKm: row.maxMileageKm }
      : row));
    setVehiclesByRow((prev) => ({ ...prev, [rowId]: [] }));

    if (nextBrandId == null) {
      setLoadingVehiclesByRow((prev) => ({ ...prev, [rowId]: false }));
      return;
    }

    setLoadingVehiclesByRow((prev) => ({ ...prev, [rowId]: true }));
    try {
      const vehicles = await getAllVehicleDefinitions({ brandId: nextBrandId });
      if (vehicleSearchRequestIds.current[rowId] !== requestId) return;
      setVehiclesByRow((prev) => ({ ...prev, [rowId]: vehicles }));
      const updatedRow = {
        ...(previousRow ?? emptyRow()),
        rowId,
        brandId: nextBrandId,
        vehicleDefinitionId: null,
        modelId: null,
        engineId: null,
        fuelTypeId: null,
        enginePowerHp: null,
        yearFrom: null,
        yearTo: null,
      };
      const matchingVehicle = findMatchingVehicle(updatedRow, vehicles);
      if (matchingVehicle) {
        setRows((prev) => prev.map((row) => row.rowId === rowId
          ? applyVehicleToRow(row, matchingVehicle)
          : row));
      }
    } catch (error) {
      if (vehicleSearchRequestIds.current[rowId] === requestId) {
        toast.error(
          error instanceof Error
            ? error.message
            : t("catalyticConverters.errors.loadingLookups"),
        );
        setVehiclesByRow((prev) => ({ ...prev, [rowId]: [] }));
      }
    } finally {
      if (vehicleSearchRequestIds.current[rowId] === requestId) {
        setLoadingVehiclesByRow((prev) => ({ ...prev, [rowId]: false }));
      }
    }
  };

  const handleVehicleChange = (rowId: string, vehicleIdValue: string) => {
    const vehicle = (vehiclesByRow[rowId] ?? []).find(
      (item) => item.id === Number(vehicleIdValue),
    );
    if (!vehicle) {
      setRows((prev) => prev.map((row) => row.rowId === rowId
        ? {
            ...row,
            vehicleDefinitionId: null,
            modelId: null,
            engineId: null,
            fuelTypeId: null,
            enginePowerHp: null,
            yearFrom: null,
            yearTo: null,
          }
        : row));
      return;
    }

    setRows((prev) => prev.map((row) => row.rowId === rowId
      ? applyVehicleToRow(row, vehicle)
      : row));
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

    if (rows.some((row) => row.vehicleDefinitionId == null)) {
      toast.error(t("catalyticConverters.validation.selectVehicle"));
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

  const getVehicleOptionLabel = (vehicle?: VehicleDefinitionRecord) => {
    if (!vehicle) return "";
    const brandName = vehicle.brand?.name || vehicle.brandName ||
      definitions?.brands.find((item) => item.id === vehicle.brandId)?.name ||
      vehicle.brand?.code || "";
    const modelName = vehicle.model?.name || vehicle.modelName ||
      definitions?.models.find((item) => item.id === vehicle.modelId)?.name ||
      vehicle.model?.code || "";
    const engineName = vehicle.engine?.name || vehicle.engineName ||
      definitions?.engines.find((item) => item.id === vehicle.engineId)?.name ||
      vehicle.engine?.code || "";
    const fuelName = vehicle.fuelType?.name || vehicle.fuelTypeName ||
      definitions?.fuelTypes.find((item) => item.id === vehicle.fuelTypeId)?.name ||
      vehicle.fuelType?.code || "";

    return [
      `${brandName} ${modelName}`.trim(),
      vehicle.year,
      engineName,
      fuelName,
      `${vehicle.horsePower} ${t("carCatalyst.fields.horsePowerUnit")}`,
    ].filter(Boolean).join(" · ");
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
                searchable
                searchPlaceholder={t("common.search")}
              >
                <option value="">{t("common.select")}</option>
                {(definitions?.brands ?? []).map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </Select>

              <Select
                label={t("carCatalyst.fields.exactVehicle")}
                value={row.vehicleDefinitionId ?? ""}
                onChange={(e) => handleVehicleChange(row.rowId, e.target.value)}
                disabled={!row.brandId || Boolean(loadingVehiclesByRow[row.rowId])}
                searchable
                searchPlaceholder={t("common.search")}
              >
                <option value="">{t("carCatalyst.fields.selectExactVehicle")}</option>
                {(vehiclesByRow[row.rowId] ?? []).map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {getVehicleOptionLabel(vehicle)}
                  </option>
                ))}
              </Select>

              {loadingVehiclesByRow[row.rowId] ? (
                <div className={styles.vehicleSelectionStatus} role="status" aria-live="polite">
                  <LoaderCircle size={15} className={styles.vehicleLoadingIcon} aria-hidden="true" />
                  <span>{t("carCatalyst.sections.searchingVehicles")}</span>
                </div>
              ) : row.brandId != null && !(vehiclesByRow[row.rowId] ?? []).length ? (
                <div className={styles.vehicleSelectionStatus} role="status">
                  <span>{t("carCatalyst.sections.noVehicleMatches")}</span>
                </div>
              ) : row.vehicleDefinitionId != null ? (
                <div className={styles.selectedVehicleSummary}>
                  <CarFront size={15} aria-hidden="true" />
                  <span>{getVehicleOptionLabel(
                    (vehiclesByRow[row.rowId] ?? []).find(
                      (vehicle) => vehicle.id === row.vehicleDefinitionId,
                    )!,
                  )}</span>
                  <BadgeCheck size={15} aria-hidden="true" />
                </div>
              ) : null}

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
