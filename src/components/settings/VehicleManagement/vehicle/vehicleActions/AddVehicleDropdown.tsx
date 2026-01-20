import { useEffect, useMemo, useState, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Button, TextField, Select, Dropdown } from "@/ui-kit";
import { getVehicleDefinitions } from "@/services/settings/vehicles";
import styles from "./VehicleDropdown.module.css";
import type { VehicleDefinition } from "@/types/settings";

export interface VehicleForm {
  brandId: string;
  modelId: string;
  year: string;
  engineId: string;
  fuelTypeId: string;
}

export interface AddVehicleDropdownProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: VehicleForm) => void;
}

export const AddVehicleDropdown = ({
  open,
  anchorRef,
  isLoading = false,
  onOpenChange,
  onSave,
}: AddVehicleDropdownProps) => {
  const { t } = useTranslation();
  const [vehicleDefinitions, setVehicleDefinitions] =
    useState<VehicleDefinition | null>(null);
  const [filteredModels, setFilteredModels] = useState<
    Array<{ id: number; code: string; name: string }>
  >([]);
  const [isLoadingDefinitions, setIsLoadingDefinitions] = useState(false);

  const vehicleFormFields = useMemo(
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
    }),
    [t]
  );

  const [formValues, setFormValues] = useState<VehicleForm>({
    brandId: "",
    modelId: "",
    year: "",
    engineId: "",
    fuelTypeId: "",
  });

  const [hasTriedSave, setHasTriedSave] = useState(false);

  // Fetch vehicle definitions when dropdown opens
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

    // Reset form
    setFormValues({
      brandId: "",
      modelId: "",
      year: "",
      engineId: "",
      fuelTypeId: "",
    });
    setHasTriedSave(false);
  }, [open]);

  useEffect(() => {
    if (!open || !formValues.brandId) {
      setFilteredModels(vehicleDefinitions?.models || []);
      return;
    }

    const fetchModels = async () => {
      try {
        const data = await getVehicleDefinitions(Number(formValues.brandId));
        setFilteredModels(data.models || []);
        setFormValues((prev) => ({ ...prev, modelId: "" }));
      } catch (error) {
        console.error("Failed to fetch models:", error);
      }
    };

    fetchModels();
  }, [formValues.brandId, open, vehicleDefinitions]);

  const isValid =
    formValues.brandId.trim().length > 0 &&
    formValues.modelId.trim().length > 0 &&
    formValues.year.trim().length > 0 &&
    formValues.engineId.trim().length > 0 &&
    formValues.fuelTypeId.trim().length > 0;

  const handleClose = () => onOpenChange(false);

  const handleSaveClick = () => {
    setHasTriedSave(true);
    if (!isValid) return;

    onSave?.({
      brandId: formValues.brandId.trim(),
      modelId: formValues.modelId.trim(),
      year: formValues.year.trim(),
      engineId: formValues.engineId.trim(),
      fuelTypeId: formValues.fuelTypeId.trim(),
    });
  };

  return (
    <Dropdown
      open={open}
      onOpenChange={onOpenChange}
      anchorRef={anchorRef}
      align="start"
      side="left"
      title={t("vehicles.vehicles.addVehicle")}
      contentClassName={styles.dropdownContentOverride}
    >
      <div className={styles.header}>
        <span className={styles.title}>
          {t("vehicles.vehicles.addVehicle")}
        </span>
      </div>

      <div className={styles.content}>
        <div className={styles.grid}>
          <div className={styles.fullRow}>
            <Select
              label={vehicleFormFields.brand.label}
              value={formValues.brandId}
              onChange={(e) =>
                setFormValues((p) => ({ ...p, brandId: e.target.value }))
              }
              placeholder={vehicleFormFields.brand.placeholder}
              error={hasTriedSave && !formValues.brandId.trim()}
              disabled={isLoading || isLoadingDefinitions}
            >
              <option value="">{vehicleFormFields.brand.placeholder}</option>
              {vehicleDefinitions?.brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name || brand.code}
                </option>
              ))}
            </Select>
          </div>

          <div className={styles.colLeft}>
            <Select
              label={vehicleFormFields.model.label}
              value={formValues.modelId}
              onChange={(e) =>
                setFormValues((p) => ({ ...p, modelId: e.target.value }))
              }
              placeholder={vehicleFormFields.model.placeholder}
              error={hasTriedSave && !formValues.modelId.trim()}
              disabled={
                isLoading || isLoadingDefinitions || !formValues.brandId
              }
            >
              <option value="">{vehicleFormFields.model.placeholder}</option>
              {filteredModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name || model.code}
                </option>
              ))}
            </Select>
          </div>

          <div className={styles.colRight}>
            <TextField
              label={vehicleFormFields.year.label}
              value={formValues.year}
              onChange={(e) =>
                setFormValues((p) => ({ ...p, year: e.target.value }))
              }
              placeholder={vehicleFormFields.year.placeholder}
              error={hasTriedSave && !formValues.year.trim()}
              disabled={isLoading}
              type="number"
            />
          </div>

          <div className={styles.colLeft}>
            <Select
              label={vehicleFormFields.engine.label}
              value={formValues.engineId}
              onChange={(e) =>
                setFormValues((p) => ({ ...p, engineId: e.target.value }))
              }
              placeholder={vehicleFormFields.engine.placeholder}
              error={hasTriedSave && !formValues.engineId.trim()}
              disabled={isLoading || isLoadingDefinitions}
            >
              <option value="">{vehicleFormFields.engine.placeholder}</option>
              {vehicleDefinitions?.engines.map((engine) => (
                <option key={engine.id} value={engine.id}>
                  {engine.name || engine.code}
                </option>
              ))}
            </Select>
          </div>

          <div className={styles.colRight}>
            <Select
              label={vehicleFormFields.fuelType.label}
              value={formValues.fuelTypeId}
              onChange={(e) =>
                setFormValues((p) => ({ ...p, fuelTypeId: e.target.value }))
              }
              placeholder={vehicleFormFields.fuelType.placeholder}
              error={hasTriedSave && !formValues.fuelTypeId.trim()}
              disabled={isLoading || isLoadingDefinitions}
            >
              <option value="">{vehicleFormFields.fuelType.placeholder}</option>
              {vehicleDefinitions?.fuelTypes.map((fuelType) => (
                <option key={fuelType.id} value={fuelType.id}>
                  {fuelType.name || fuelType.code}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className={styles.actionswithoutDelete}>
          <div className={styles.primaryActions}>
            <Button
              variant="secondary"
              size="medium"
              onClick={handleClose}
              disabled={isLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              size="medium"
              onClick={handleSaveClick}
              disabled={isLoading || isLoadingDefinitions}
            >
              {t("common.save")}
            </Button>
          </div>
        </div>
      </div>
    </Dropdown>
  );
};
