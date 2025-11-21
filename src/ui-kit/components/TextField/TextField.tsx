import React from "react";
import styles from "./TextField.module.css";

export interface TextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  icon?: React.ReactNode;
  error?: boolean;
  helperText?: string;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      label,
      icon,
      error = false,
      helperText,
      className = "",
      id,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const textFieldId =
      id || `textfield-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={`${styles.textFieldWrapper} ${className}`}>
        {label && (
          <label htmlFor={textFieldId} className={styles.textFieldLabel}>
            {label}
          </label>
        )}
        <div
          className={`${styles.textFieldContainer} ${
            error ? styles.error : ""
          } ${disabled ? styles.disabled : ""}`}
        >
          <input
            ref={ref}
            id={textFieldId}
            type="text"
            className={styles.textFieldInput}
            disabled={disabled}
            {...props}
          />
          {icon && (
            <>
              <div className={styles.textFieldSeparator} />
              <div className={styles.textFieldIcon}>{icon}</div>
            </>
          )}
        </div>
        {helperText && (
          <span
            className={`${styles.textFieldHelperText} ${
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

TextField.displayName = "TextField";
