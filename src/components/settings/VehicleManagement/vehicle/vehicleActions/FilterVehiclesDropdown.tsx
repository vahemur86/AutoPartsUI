import { useEffect, useMemo, useState, type FC, type RefObject } from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Button, TextField, Select, Dropdown } from "@/ui-kit";

// services
import { getVehicleDefinitions } from "@/services/settings/vehicles";

// types
import type { VehicleDefinition, VehicleFilter } from "@/types/settings";

// styles
import styles from "./VehicleDropdown.module.css";

interface FilterVehiclesDropdownProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  onOpenChange: (open: boolean) => void;
  onSave: (filters: VehicleFilter) => void;
}

export const FilterVehiclesDropdown: FC<FilterVehiclesDropdownProps> = ({
  open,
  anchorRef,
  onOpenChange,
  onSave,
}) => {
  const { t } = useTranslation();

  const [vehicleDefinitions, setVehicleDefinitions] =
    useState<VehicleDefinition | null>(null);
  const [filteredModels, setFilteredModels] = useState<
    Array<{ id: number; name: string; code: string }>
  >([]);
  const [isLoadingDefinitions, setIsLoadingDefinitions] = useState(false);

  // Labels and placeholders mirrored from AddVehicleDropdown pattern
  const filterFormFields = useMemo(
    () => ({
      brand: {
        label: t("vehicles.vehicles.form.brand"),
        placeholder: t("vehicles.vehicles.form.selectBrand"),
      },
      model: {
        label: t("vehicles.vehicles.form.model"),
        placeholder: t("vehicles.vehicles.form.selectModel"),
      },
      year: {
        label: t("vehicles.vehicles.form.year"),
        placeholder: t("vehicles.vehicles.form.enterYear"),
      },
      engine: {
        label: t("vehicles.vehicles.form.engine"),
        placeholder: t("vehicles.vehicles.form.selectEngine"),
      },
      fuelType: {
        label: t("vehicles.vehicles.form.fuelType"),
        placeholder: t("vehicles.vehicles.form.selectFuelType"),
      },
      market: {
        label: t("vehicles.vehicles.form.market"),
        placeholder: t("vehicles.vehicles.form.selectMarket"),
      },
      hpMin: {
        label: t("vehicles.vehicles.form.hpMin"),
        placeholder: t("vehicles.vehicles.form.selectHPMin"),
      },
      hpMax: {
        label: t("vehicles.vehicles.form.hpMax"),
        placeholder: t("vehicles.vehicles.form.selectHPMax"),
      },
      driveType: {
        label: t("vehicles.vehicles.form.driveType"),
        placeholder: t("vehicles.vehicles.form.selectDriveType"),
      },
    }),
    [t],
  );

  const [tempValues, setTempValues] = useState({
    brandId: "",
    modelId: "",
    year: "",
    engineId: "",
    fuelTypeId: "",
    marketId: "",
    hpMin: "",
    hpMax: "",
    driveTypeId: "",
  });

  // Fetch definitions on open
  useEffect(() => {
    if (!open) return;

    const fetchDefinitions = async () => {
      setIsLoadingDefinitions(true);
      try {
        const data = await getVehicleDefinitions();
        setVehicleDefinitions(data);
        setFilteredModels(data.models || []);
      } catch (error) {
        console.error("Failed to fetch vehicle definitions:", error);
      } finally {
        setIsLoadingDefinitions(false);
      }
    };

    fetchDefinitions();
  }, [open]);

  // Handle Model filtering based on Brand
  useEffect(() => {
    if (!open) return;

    if (tempValues.brandId) {
      getVehicleDefinitions(Number(tempValues.brandId)).then((data) => {
        setFilteredModels(data.models || []);
      });
    } else {
      setFilteredModels(vehicleDefinitions?.models || []);
    }
  }, [tempValues.brandId, open, vehicleDefinitions]);

  const handleApply = () => {
    const filters: VehicleFilter = {};

    if (tempValues.brandId) filters.brandId = Number(tempValues.brandId);
    if (tempValues.modelId) filters.modelId = Number(tempValues.modelId);
    if (tempValues.year) filters.year = Number(tempValues.year);
    if (tempValues.engineId) filters.engineId = Number(tempValues.engineId);
    if (tempValues.fuelTypeId)
      filters.fuelTypeId = Number(tempValues.fuelTypeId);
    if (tempValues.marketId) filters.marketId = Number(tempValues.marketId);
    if (tempValues.driveTypeId)
      filters.driveTypeId = Number(tempValues.driveTypeId);
    if (tempValues.hpMin) filters.hpMin = Number(tempValues.hpMin);
    if (tempValues.hpMax) filters.hpMax = Number(tempValues.hpMax);

    onSave(filters);
    onOpenChange(false);
  };

  const handleReset = () => {
    setTempValues({
      brandId: "",
      modelId: "",
      year: "",
      engineId: "",
      fuelTypeId: "",
      marketId: "",
      hpMin: "",
      hpMax: "",
      driveTypeId: "",
    });
    onSave({});
    onOpenChange(false);
  };

  return (
    <Dropdown
      open={open}
      onOpenChange={onOpenChange}
      anchorRef={anchorRef}
      align="start"
      side="left"
      title={t("common.filters")}
      contentClassName={styles.dropdownContentOverride}
    >
      <div className={styles.header}>
        <span className={styles.title}>{t("common.filters")}</span>
      </div>

      <div className={styles.content}>
        <div className={styles.grid}>
          {/* Brand Row */}
          <div className={styles.fullRow}>
            <Select
              label={filterFormFields.brand.label}
              value={tempValues.brandId}
              onChange={(e) =>
                setTempValues((p) => ({
                  ...p,
                  brandId: e.target.value,
                  modelId: "",
                }))
              }
              disabled={isLoadingDefinitions}
            >
              <option value="">{filterFormFields.brand.placeholder}</option>
              {vehicleDefinitions?.brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name || b.code}
                </option>
              ))}
            </Select>
          </div>

          {/* Model & Year */}
          <div className={styles.colLeft}>
            <Select
              label={filterFormFields.model.label}
              value={tempValues.modelId}
              onChange={(e) =>
                setTempValues((p) => ({ ...p, modelId: e.target.value }))
              }
              disabled={isLoadingDefinitions}
            >
              <option value="">{filterFormFields.model.placeholder}</option>
              {filteredModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name || m.code}
                </option>
              ))}
            </Select>
          </div>
          <div className={styles.colRight}>
            <TextField
              label={filterFormFields.year.label}
              value={tempValues.year}
              onChange={(e) =>
                setTempValues((p) => ({ ...p, year: e.target.value }))
              }
              placeholder={filterFormFields.year.placeholder}
              type="number"
            />
          </div>

          {/* HP Range */}
          <div className={styles.colLeft}>
            <TextField
              label={filterFormFields.hpMin.label}
              value={tempValues.hpMin}
              onChange={(e) =>
                setTempValues((p) => ({ ...p, hpMin: e.target.value }))
              }
              placeholder={filterFormFields.hpMin.placeholder}
              type="number"
            />
          </div>
          <div className={styles.colRight}>
            <TextField
              label={filterFormFields.hpMax.label}
              value={tempValues.hpMax}
              onChange={(e) =>
                setTempValues((p) => ({ ...p, hpMax: e.target.value }))
              }
              placeholder={filterFormFields.hpMax.placeholder}
              type="number"
            />
          </div>

          {/* Engine & Fuel Type */}
          <div className={styles.colLeft}>
            <Select
              label={filterFormFields.engine.label}
              value={tempValues.engineId}
              onChange={(e) =>
                setTempValues((p) => ({ ...p, engineId: e.target.value }))
              }
              disabled={isLoadingDefinitions}
            >
              <option value="">{filterFormFields.engine.placeholder}</option>
              {vehicleDefinitions?.engines?.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name || e.code}
                </option>
              ))}
            </Select>
          </div>
          <div className={styles.colRight}>
            <Select
              label={filterFormFields.fuelType.label}
              value={tempValues.fuelTypeId}
              onChange={(e) =>
                setTempValues((p) => ({ ...p, fuelTypeId: e.target.value }))
              }
              disabled={isLoadingDefinitions}
            >
              <option value="">{filterFormFields.fuelType.placeholder}</option>
              {vehicleDefinitions?.fuelTypes?.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name || f.code}
                </option>
              ))}
            </Select>
          </div>

          {/* Market & Drive Type */}
          <div className={styles.colLeft}>
            <Select
              label={filterFormFields.market.label}
              value={tempValues.marketId}
              onChange={(e) =>
                setTempValues((p) => ({ ...p, marketId: e.target.value }))
              }
              disabled={isLoadingDefinitions}
            >
              <option value="">{filterFormFields.market.placeholder}</option>
              {vehicleDefinitions?.markets?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name || m.code}
                </option>
              ))}
            </Select>
          </div>
          <div className={styles.colRight}>
            <Select
              label={filterFormFields.driveType.label}
              value={tempValues.driveTypeId}
              onChange={(e) =>
                setTempValues((p) => ({ ...p, driveTypeId: e.target.value }))
              }
              disabled={isLoadingDefinitions}
            >
              <option value="">{filterFormFields.driveType.placeholder}</option>
              {vehicleDefinitions?.driveTypes?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name || d.code}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className={styles.actionswithoutDelete}>
          <div className={styles.primaryActions}>
            <Button variant="secondary" size="medium" onClick={handleReset}>
              {t("common.reset")}
            </Button>
            <Button variant="primary" size="medium" onClick={handleApply}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      </div>
    </Dropdown>
  );
};
