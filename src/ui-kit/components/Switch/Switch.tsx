import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  type InputHTMLAttributes,
} from "react";
import styles from "./Switch.module.css";

export interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      checked,
      defaultChecked,
      onCheckedChange,
      disabled = false,
      label,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const [internalChecked, setInternalChecked] = useState(
      defaultChecked || false
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

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const newChecked = event.target.checked;
      if (!isControlled) {
        setInternalChecked(newChecked);
      }
      onCheckedChange?.(newChecked);
      props.onChange?.(event);
    };

    const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;
    const isChecked = isControlled ? checked : internalChecked;

    return (
      <div className={`${styles.switchWrapper} ${className}`}>
        <label
          htmlFor={switchId}
          className={`${styles.switchLabel} ${disabled ? styles.disabled : ""}`}
        >
          <input
            ref={combinedRef}
            type="checkbox"
            id={switchId}
            className={styles.switchInput}
            checked={isChecked}
            defaultChecked={defaultChecked}
            onChange={handleChange}
            disabled={disabled}
            role="switch"
            aria-checked={isChecked}
            {...props}
          />
          <span
            className={`${styles.switchTrack} ${
              isChecked ? styles.checked : ""
            } ${disabled ? styles.disabled : ""}`}
          >
            <span
              className={`${styles.switchKnob} ${
                isChecked ? styles.checked : ""
              } ${disabled ? styles.disabled : ""}`}
            />
          </span>
        </label>
        {label && (
          <span
            className={`${styles.switchText} ${
              disabled ? styles.disabled : ""
            }`}
          >
            {label}
          </span>
        )}
      </div>
    );
  }
);

Switch.displayName = "Switch";
