import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import styles from "./TextField.module.css";

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  label?: string;
  icon?: ReactNode;
  suffix?: string;
  error?: boolean;
  helperText?: string;
  containerClassName?: string;
  inputClassName?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      label,
      icon,
      suffix,
      error = false,
      helperText,
      className = "",
      containerClassName = "",
      inputClassName = "",
      id,
      disabled = false,
      type = "text",
      inputMode,
      step,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const textFieldId = id || generatedId;

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
          } ${disabled ? styles.disabled : ""} ${containerClassName}`}
        >
          <input
            ref={ref}
            id={textFieldId}
            type={type}
            className={`${styles.textFieldInput} ${inputClassName}`}
            disabled={disabled}
            inputMode={inputMode ?? (type === "number" ? "decimal" : undefined)}
            step={step ?? (type === "number" ? "any" : undefined)}
            {...props}
          />
          {suffix && (
            <>
              <div className={styles.textFieldSeparator} />
              <div className={styles.textFieldSuffix}>{suffix}</div>
            </>
          )}
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
  },
);

TextField.displayName = "TextField";
