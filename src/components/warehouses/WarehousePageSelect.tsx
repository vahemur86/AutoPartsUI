import type { ChangeEvent, ReactNode } from "react";
import { Warehouse } from "lucide-react";

import { Select } from "@/ui-kit";
import styles from "./WarehousePageSelect.module.css";

export interface WarehousePageSelectOption {
  value: string;
  label: string;
}

interface WarehousePageSelectProps {
  label: string;
  placeholder: string;
  value: string;
  options: WarehousePageSelectOption[];
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  icon?: ReactNode;
}

export const WarehousePageSelect = ({
  label,
  placeholder,
  value,
  options,
  onChange,
  disabled = false,
  icon = <Warehouse size={16} aria-hidden="true" />,
}: WarehousePageSelectProps) => (
  <div className={styles.selectorCard}>
    <div className={styles.selectorLabel}>
      {icon}
      <span>{label}</span>
    </div>
    <Select
      aria-label={label}
      className={styles.select}
      containerClassName={styles.selectContainer}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  </div>
);