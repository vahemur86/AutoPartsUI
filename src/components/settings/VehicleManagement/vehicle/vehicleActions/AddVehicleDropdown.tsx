import { useEffect, useState, type RefObject } from "react";
import styles from "./VehicleDropdown.module.css";
import { Button, TextField, Select, Dropdown } from "@/ui-kit";

export interface AddVehicleDropdownProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement>;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: unknown) => void;
}

export const AddVehicleDropdown = ({
  open,
  anchorRef,
  onOpenChange,
  onSave,
}: AddVehicleDropdownProps) => {
  const [brandValue, setBrandValue] = useState("");
  const [modelValue, setModelValue] = useState("");
  const [yearValue, setYearValue] = useState("");
  const [engineValue, setEngineValue] = useState("");
  const [fuelTypeValue, setFuelTypeValue] = useState("");
  const [statusValue, setStatusValue] = useState("");

  useEffect(() => {
    if (open) {
      setBrandValue("");
      setModelValue("");
      setYearValue("");
      setEngineValue("");
      setFuelTypeValue("");
      setStatusValue("");
    }
  }, [open]);

  const handleSaveClick = () => {
    if (onSave) {
      onSave({
        brand: brandValue,
        model: modelValue,
        year: yearValue,
        engine: engineValue,
        fuelType: fuelTypeValue,
        status: statusValue,
      });
    }
    onOpenChange(false);
  };

  const handleClose = () => {
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
                label="Brand"
                value={brandValue}
                onChange={(e) => setBrandValue(e.target.value)}
                placeholder="Select brand..."
              >
                <option value="">Select brand...</option>
              </Select>
            </div>
            <div className={styles.fieldRight}></div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldLeft}>
              <TextField
                label="Model"
                value={modelValue}
                onChange={(e) => setModelValue(e.target.value)}
                placeholder="Enter model..."
              />
            </div>
            <div className={styles.fieldRight}>
              <TextField
                label="Year"
                value={yearValue}
                onChange={(e) => setYearValue(e.target.value)}
                placeholder="Enter year..."
              />
            </div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldLeft}>
              <TextField
                label="Engine"
                value={engineValue}
                onChange={(e) => setEngineValue(e.target.value)}
                placeholder="Enter engine..."
              />
            </div>
            <div className={styles.fieldRight}>
              <Select
                label="Fuel Type"
                value={fuelTypeValue}
                onChange={(e) => setFuelTypeValue(e.target.value)}
                placeholder="Select fuel type..."
              >
                <option value="">Select fuel type...</option>
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
                label="Status"
                value={statusValue}
                onChange={(e) => setStatusValue(e.target.value)}
                placeholder="Select status..."
              >
                <option value="">Select status...</option>
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
