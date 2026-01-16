import { useEffect, useMemo, useState, type RefObject } from "react";
import { Button, TextField, Select, Dropdown } from "@/ui-kit";
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
  const fields = useMemo(
    () => ({
      brand: { label: "Brand", placeholder: "Select brand..." },
      model: { label: "Model", placeholder: "Enter model..." },
      year: { label: "Year", placeholder: "Enter year..." },
      engine: { label: "Engine", placeholder: "Enter engine..." },
      fuelType: { label: "Fuel Type", placeholder: "Select fuel type..." },
      status: { label: "Status", placeholder: "Select status..." },
    }),
    []
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

    const payload: VehicleForm = {
      brand: formValues.brand.trim(),
      model: formValues.model.trim(),
      year: formValues.year.trim(),
      engine: formValues.engine.trim(),
      fuelType: formValues.fuelType.trim(),
      status: formValues.status.trim(),
    };

    onSave?.(payload);
    onOpenChange(false);
  };

  return (
    <Dropdown
      open={open}
      onOpenChange={onOpenChange}
      anchorRef={anchorRef}
      align="start"
      side="left"
      title="Add Vehicle"
    >
      <div className={styles.header}>
        <span className={styles.title}>Add Vehicle</span>
      </div>

      <div className={styles.content}>
        <div className={styles.fields}>
          <div className={styles.fieldRow}>
            <div className={styles.fieldLeft}>
              <Select
                label={fields.brand.label}
                value={formValues.brand}
                onChange={(e) =>
                  setFormValues((p) => ({ ...p, brand: e.target.value }))
                }
                placeholder={fields.brand.placeholder}
                error={hasTriedSave && !formValues.brand.trim()}
              >
                <option value="">{fields.brand.placeholder}</option>
                <option value="bmw">BMW</option>
                <option value="ford">Ford</option>
              </Select>
            </div>
            <div className={styles.fieldRight} />
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldLeft}>
              <TextField
                label={fields.model.label}
                value={formValues.model}
                onChange={(e) =>
                  setFormValues((p) => ({ ...p, model: e.target.value }))
                }
                placeholder={fields.model.placeholder}
                error={hasTriedSave && !formValues.model.trim()}
              />
            </div>
            <div className={styles.fieldRight}>
              <TextField
                label={fields.year.label}
                value={formValues.year}
                onChange={(e) =>
                  setFormValues((p) => ({ ...p, year: e.target.value }))
                }
                placeholder={fields.year.placeholder}
                error={hasTriedSave && !formValues.year.trim()}
              />
            </div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldLeft}>
              <TextField
                label={fields.engine.label}
                value={formValues.engine}
                onChange={(e) =>
                  setFormValues((p) => ({ ...p, engine: e.target.value }))
                }
                placeholder={fields.engine.placeholder}
                error={hasTriedSave && !formValues.engine.trim()}
              />
            </div>
            <div className={styles.fieldRight}>
              <Select
                label={fields.fuelType.label}
                value={formValues.fuelType}
                onChange={(e) =>
                  setFormValues((p) => ({ ...p, fuelType: e.target.value }))
                }
                placeholder={fields.fuelType.placeholder}
                error={hasTriedSave && !formValues.fuelType.trim()}
              >
                <option value="">{fields.fuelType.placeholder}</option>
                <option value="gasoline">Gasoline</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
              </Select>
            </div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldFullWidth}>
              <Select
                label={fields.status.label}
                value={formValues.status}
                onChange={(e) =>
                  setFormValues((p) => ({ ...p, status: e.target.value }))
                }
                placeholder={fields.status.placeholder}
                error={hasTriedSave && !formValues.status.trim()}
              >
                <option value="">{fields.status.placeholder}</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
          </div>
        </div>

        <div className={styles.actionswithoutDelete}>
          <div className={styles.primaryActions}>
            <Button variant="secondary" size="medium" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" size="medium" onClick={handleSaveClick}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </Dropdown>
  );
};
