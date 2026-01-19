import { useEffect, useMemo, useState, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Button, TextField, Select, Dropdown, Textarea } from "@/ui-kit";
import styles from "./VehicleDropdown.module.css";

export interface VehicleForm {
  brand: string;
  model: string;
  year: string;
  engine: string;
  fuelType: string;
  status: string;
}

export interface AddVehicleDropdownProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: VehicleForm) => void;
}

export const AddVehicleDropdown = ({
  open,
  anchorRef,
  onOpenChange,
  onSave,
}: AddVehicleDropdownProps) => {
  const { t } = useTranslation();
  const vehicleFormFields = useMemo(
    () => ({
      brand: {
        label: t("vehicles.vehicles.form.brand"),
        placeholder: t("vehicles.vehicles.form.selectBrand"),
      },
      model: {
        label: t("vehicles.vehicles.form.model"),
        placeholder: t("vehicles.vehicles.form.enterModel"),
      },
      year: {
        label: t("vehicles.vehicles.form.year"),
        placeholder: t("vehicles.vehicles.form.enterYear"),
      },
      engine: {
        label: t("vehicles.vehicles.form.engine"),
        placeholder: t("vehicles.vehicles.form.enterEngine"),
      },
      fuelType: {
        label: t("vehicles.vehicles.form.fuelType"),
        placeholder: t("vehicles.vehicles.form.selectFuelType"),
      },
      status: {
        label: t("vehicles.vehicles.form.status"),
        placeholder: t("vehicles.vehicles.form.status"),
      },
    }),
    [t]
  );

  const [formValues, setFormValues] = useState<VehicleForm>({
    brand: "",
    model: "",
    year: "",
    engine: "",
    fuelType: "",
    status: "",
  });

  const [hasTriedSave, setHasTriedSave] = useState(false);

  useEffect(() => {
    if (!open) return;

    setFormValues({
      brand: "",
      model: "",
      year: "",
      engine: "",
      fuelType: "",
      status: "",
    });
    setHasTriedSave(false);
  }, [open]);

  const isValid =
    formValues.brand.trim().length > 0 &&
    formValues.model.trim().length > 0 &&
    formValues.year.trim().length > 0 &&
    formValues.engine.trim().length > 0 &&
    formValues.fuelType.trim().length > 0 &&
    formValues.status.trim().length > 0;

  const handleClose = () => onOpenChange(false);

  const handleSaveClick = () => {
    setHasTriedSave(true);
    if (!isValid) return;

    onSave?.({
      ...formValues,
      brand: formValues.brand.trim(),
      model: formValues.model.trim(),
      year: formValues.year.trim(),
      engine: formValues.engine.trim(),
      fuelType: formValues.fuelType.trim(),
      status: formValues.status.trim(),
    });

    onOpenChange(false);
  };

  return (
    <Dropdown
      open={open}
      onOpenChange={onOpenChange}
      anchorRef={anchorRef}
      align="start"
      side="left"
      title={t("vehicles.vehicles.addVehicle")}
    >
      <div className={styles.header}>
        <span className={styles.title}>{t("vehicles.vehicles.addVehicle")}</span>
      </div>

      <div className={styles.content}>
        <div className={styles.grid}>
          <div className={styles.fullRow}>
            <Select
              label={vehicleFormFields.brand.label}
              value={formValues.brand}
              onChange={(e) =>
                setFormValues((p) => ({ ...p, brand: e.target.value }))
              }
              placeholder={vehicleFormFields.brand.placeholder}
              error={hasTriedSave && !formValues.brand.trim()}
            >
              <option value="">{vehicleFormFields.brand.placeholder}</option>
              <option value="bmw">BMW</option>
              <option value="ford">Ford</option>
            </Select>
          </div>

          <div className={styles.colLeft}>
            <TextField
              label={vehicleFormFields.model.label}
              value={formValues.model}
              onChange={(e) =>
                setFormValues((p) => ({ ...p, model: e.target.value }))
              }
              placeholder={vehicleFormFields.model.placeholder}
              error={hasTriedSave && !formValues.model.trim()}
            />
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
            />
          </div>

          <div className={styles.colLeft}>
            <TextField
              label={vehicleFormFields.engine.label}
              value={formValues.engine}
              onChange={(e) =>
                setFormValues((p) => ({ ...p, engine: e.target.value }))
              }
              placeholder={vehicleFormFields.engine.placeholder}
              error={hasTriedSave && !formValues.engine.trim()}
            />
          </div>

          <div className={styles.colRight}>
            <Select
              label={vehicleFormFields.fuelType.label}
              value={formValues.fuelType}
              onChange={(e) =>
                setFormValues((p) => ({ ...p, fuelType: e.target.value }))
              }
              placeholder={vehicleFormFields.fuelType.placeholder}
              error={hasTriedSave && !formValues.fuelType.trim()}
            >
              <option value="">{vehicleFormFields.fuelType.placeholder}</option>
              <option value="gasoline">Gasoline</option>
              <option value="diesel">Diesel</option>
              <option value="electric">Electric</option>
              <option value="hybrid">Hybrid</option>
            </Select>
          </div>

          <div className={styles.fullRow}>
            <Textarea
              resizable={false}
              label={vehicleFormFields.status.label}
              placeholder={vehicleFormFields.status.placeholder}
              value={formValues.status ?? ""}
              onChange={(e) =>
                setFormValues((p) => ({ ...p, status: e.target.value }))
              }
              className={styles.statusField}
              error={hasTriedSave && !formValues.status.trim()}
            />
          </div>
        </div>

        <div className={styles.actionswithoutDelete}>
          <div className={styles.primaryActions}>
            <Button variant="secondary" size="medium" onClick={handleClose}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" size="medium" onClick={handleSaveClick}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      </div>
    </Dropdown>
  );
};
