import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
} from "react";

// icons
import { ChevronDown, Check } from "lucide-react";

// styles
import styles from "./MultiSelect.module.css";

export type MultiSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export interface MultiSelectProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange"
> {
  label?: string;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
  disabled?: boolean;
  options: MultiSelectOption[];
  value?: string[];
  defaultValue?: string[];
  onChange?: (values: string[]) => void;
  renderValue?: (selected: MultiSelectOption[]) => string;
}

export const MultiSelect = forwardRef<HTMLDivElement, MultiSelectProps>(
  (
    {
      label,
      error = false,
      helperText,
      placeholder = "Select…",
      className = "",
      disabled = false,
      options,
      value,
      defaultValue = [],
      onChange,
      renderValue,
      id,
      ...props
    },
    ref,
  ) => {
    const reactId = useId();
    const selectId = id || `multiselect-${reactId}`;

    const rootRef = useRef<HTMLDivElement | null>(null);
    const mergedRef = (node: HTMLDivElement | null) => {
      rootRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    };

    const isControlled = value !== undefined;
    const [internal, setInternal] = useState<string[]>(defaultValue);
    const selectedValues = isControlled ? value! : internal;

    const [open, setOpen] = useState(false);

    const selectedOptions = useMemo(() => {
      const map = new Map(options.map((o) => [o.value, o]));
      return selectedValues
        .map((v) => map.get(v))
        .filter(Boolean) as MultiSelectOption[];
    }, [options, selectedValues]);

    const displayText = useMemo(() => {
      if (renderValue) return renderValue(selectedOptions);
      if (selectedOptions.length === 0) return "";

      // If more than 2 items, show count to prevent extreme truncation
      if (selectedOptions.length > 2) {
        return `${selectedOptions.length} selected`;
      }

      return selectedOptions.map((o) => o.label).join(", ");
    }, [renderValue, selectedOptions]);

    const setSelected = (next: string[]) => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
    };

    const toggleValue = (val: string) => {
      const has = selectedValues.includes(val);
      const next = has
        ? selectedValues.filter((v) => v !== val)
        : [...selectedValues, val];
      setSelected(next);
    };

    useEffect(() => {
      if (!open) return;
      const onDown = (e: MouseEvent | TouchEvent) => {
        const el = rootRef.current;
        if (!el) return;
        if (e.target instanceof Node && !el.contains(e.target)) setOpen(false);
      };
      document.addEventListener("mousedown", onDown);
      document.addEventListener("touchstart", onDown);
      return () => {
        document.removeEventListener("mousedown", onDown);
        document.removeEventListener("touchstart", onDown);
      };
    }, [open]);

    useEffect(() => {
      if (!open) return;
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    const invalidPlaceholder = selectedOptions.length === 0;

    return (
      <div
        ref={mergedRef}
        className={`${styles.selectWrapper} ${className}`}
        {...props}
      >
        {label && (
          <label htmlFor={selectId} className={styles.selectLabel}>
            {label}
          </label>
        )}

        <div
          className={`${styles.selectContainer} ${error ? styles.error : ""} ${
            disabled ? styles.disabled : ""
          }`}
          data-open={open ? "true" : "false"}
        >
          <button
            id={selectId}
            type="button"
            className={`${styles.trigger} ${
              invalidPlaceholder ? styles.placeholder : ""
            }`}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => {
              if (disabled) return;
              setOpen((v) => !v);
            }}
          >
            <span className={styles.valueText}>
              {displayText || placeholder}
            </span>
          </button>

          <div className={styles.selectIcon}>
            <ChevronDown size={16} />
          </div>

          {open && !disabled && (
            <div
              className={styles.dropdown}
              role="listbox"
              aria-multiselectable="true"
            >
              {options.map((opt) => {
                const checked = selectedValues.includes(opt.value);
                const isOptDisabled = !!opt.disabled;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.option} ${
                      checked ? styles.optionSelected : ""
                    } ${isOptDisabled ? styles.optionDisabled : ""}`}
                    onClick={() => {
                      if (isOptDisabled) return;
                      toggleValue(opt.value);
                    }}
                    disabled={isOptDisabled}
                    role="option"
                    aria-selected={checked}
                  >
                    <span className={styles.optionLabel}>{opt.label}</span>
                    <span className={styles.checkIcon} aria-hidden="true">
                      {checked ? <Check size={16} /> : null}
                    </span>
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

MultiSelect.displayName = "MultiSelect";
