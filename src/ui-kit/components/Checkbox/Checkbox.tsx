import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  type InputHTMLAttributes,
  type ChangeEvent,
} from "react";
import styles from "./Checkbox.module.css";

export type CheckboxShape = "square" | "circle";

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  shape?: CheckboxShape;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      checked,
      defaultChecked,
      onCheckedChange,
      disabled = false,
      label,
      shape = "square",
      className = "",
      id,
      ...props
    },
    ref,
  ) => {
    const [internalChecked, setInternalChecked] = useState(
      defaultChecked || false,
    );
    const inputRef = useRef<HTMLInputElement>(null);
    const isControlled = checked !== undefined;

    // Combine refs
    const combinedRef = (node: HTMLInputElement) => {
      inputRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    // Update internal state when defaultChecked changes (uncontrolled mode)
    useEffect(() => {
      if (!isControlled && defaultChecked !== undefined) {
        setInternalChecked(defaultChecked);
      }
    }, [defaultChecked, isControlled]);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const newChecked = event.target.checked;
      if (!isControlled) {
        setInternalChecked(newChecked);
      }
      onCheckedChange?.(newChecked);
      props.onChange?.(event);
    };

    const checkboxId =
      id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
    const isChecked = isControlled ? checked : internalChecked;

    return (
      <div className={`${styles.checkboxWrapper} ${className}`}>
        <label
          htmlFor={checkboxId}
          className={`${styles.checkboxLabel} ${
            disabled ? styles.disabled : ""
          }`}
        >
          <input
            ref={combinedRef}
            type="checkbox"
            id={checkboxId}
            className={styles.checkboxInput}
            checked={isChecked}
            defaultChecked={defaultChecked}
            onChange={handleChange}
            disabled={disabled}
            aria-checked={isChecked}
            {...props}
          />
          <span
            className={`${styles.checkboxBox} ${styles[shape]} ${
              isChecked ? styles.checked : ""
            } ${disabled ? styles.disabled : ""}`}
          >
            {isChecked && (
              <svg
                className={styles.checkmark}
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 3L4.5 8.5L2 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
        </label>
        {label && (
          <span
            className={`${styles.checkboxText} ${
              disabled ? styles.disabled : ""
            }`}
          >
            {label}
          </span>
        )}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
