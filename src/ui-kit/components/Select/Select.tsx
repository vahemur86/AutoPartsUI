import React from "react";
import styles from "./Select.module.css";
import { ChevronDown } from "lucide-react";

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error = false,
      helperText,
      placeholder,
      className = "",
      id,
      disabled = false,
      children,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={`${styles.selectWrapper} ${className}`}>
        {label && (
          <label htmlFor={selectId} className={styles.selectLabel}>
            {label}
          </label>
        )}
        <div
          className={`${styles.selectContainer} ${error ? styles.error : ""} ${
            disabled ? styles.disabled : ""
          }`}
        >
          <select
            ref={ref}
            id={selectId}
            className={styles.selectInput}
            disabled={disabled}
            {...props}
          >
            {placeholder && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}
            {children}
          </select>
          <div className={styles.selectIcon}>
            <ChevronDown size={16} />
          </div>
        </div>
        {helperText && (
          <span
            className={`${styles.selectHelperText} ${
              error ? styles.error : ""
            }`}
          >
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";








