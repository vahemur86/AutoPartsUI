import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type SelectHTMLAttributes,
} from "react";

// icons
import { ChevronDown } from "lucide-react";

// styles
import styles from "./Select.module.css";

export interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "size"
> {
  label?: string;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({
    label,
    error = false,
    helperText,
    placeholder,
    className = "",
    id,
    disabled = false,
    children,
    value,
    defaultValue = "",
    onChange,
    ...props
  }) => {
    const reactId = useId();
    const selectId = id || `select-${reactId}`;

    const rootRef = useRef<HTMLDivElement>(null);
    const selectRef = useRef<HTMLSelectElement>(null);

    const [open, setOpen] = useState(false);
    const [internalValue, setInternalValue] = useState(defaultValue);

    // Determine if controlled
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;

    // Get display text from the select element
    const getDisplayText = useCallback((): string => {
      if (!selectRef.current) return placeholder || "";
      const selectedOption = selectRef.current.selectedOptions[0];
      return selectedOption?.text || placeholder || "";
    }, [placeholder]);

    const [displayText, setDisplayText] = useState(getDisplayText);

    // Update display text when value changes
    useEffect(() => {
      setDisplayText(getDisplayText());
    }, [currentValue, children, getDisplayText]);

    const handleSelect = (optionValue: string) => {
      if (!selectRef.current) return;

      selectRef.current.value = optionValue;

      if (!isControlled) {
        setInternalValue(optionValue);
      }

      if (onChange) {
        const event = new Event("change", { bubbles: true });
        Object.defineProperty(event, "target", {
          writable: false,
          value: selectRef.current,
        });
        onChange(event as unknown as ChangeEvent<HTMLSelectElement>);
      }

      setOpen(false);
      setDisplayText(getDisplayText());
    };

    useEffect(() => {
      if (!open) return;

      const handleClose = (e: MouseEvent | KeyboardEvent) => {
        if (e instanceof KeyboardEvent) {
          if (e.key === "Escape") setOpen(false);
        } else if (e instanceof MouseEvent) {
          if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
            setOpen(false);
          }
        }
      };

      document.addEventListener("mousedown", handleClose);
      document.addEventListener("keydown", handleClose);

      return () => {
        document.removeEventListener("mousedown", handleClose);
        document.removeEventListener("keydown", handleClose);
      };
    }, [open]);

    const options = Array.from(selectRef.current?.options || [])
      .filter((opt) => opt.value)
      .map((opt) => ({
        value: opt.value,
        label: opt.text,
        disabled: opt.disabled,
      }));
    const showPlaceholder = !currentValue;

    return (
      <div ref={rootRef} className={`${styles.selectWrapper} ${className}`}>
        {label && (
          <label htmlFor={selectId} className={styles.selectLabel}>
            {label}
          </label>
        )}

        <div
          className={`${styles.selectContainer} ${error ? styles.error : ""} ${
            disabled ? styles.disabled : ""
          }`}
          data-open={open}
        >
          <select
            ref={selectRef}
            id={selectId}
            value={currentValue}
            onChange={(e) => {
              if (!isControlled) {
                setInternalValue(e.target.value);
              }
              onChange?.(e);
            }}
            disabled={disabled}
            style={{ display: "none" }}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {children}
          </select>

          <button
            type="button"
            className={`${styles.trigger} ${
              showPlaceholder ? styles.placeholder : ""
            }`}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => !disabled && setOpen((v) => !v)}
          >
            <span className={styles.valueText}>{displayText}</span>
          </button>

          <div className={styles.selectIcon}>
            <ChevronDown size={16} />
          </div>

          {open && !disabled && (
            <div className={styles.dropdown} role="listbox">
              {options.map((opt) => {
                const isSelected = String(currentValue) === opt.value;
                const isDisabled = opt.disabled;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.option} ${
                      isSelected ? styles.optionSelected : ""
                    } ${isDisabled ? styles.optionDisabled : ""}`}
                    onClick={() => !isDisabled && handleSelect(opt.value)}
                    disabled={isDisabled}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className={styles.optionLabel}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          )}
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
  },
);

Select.displayName = "Select";
