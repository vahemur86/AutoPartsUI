import { useEffect, useState, useRef, type FC } from "react";
import type { RefObject } from "react";

// ui-kit
import { TextField } from "@/ui-kit";

// styles
import styles from "./TransferToShop.module.css";

export const QuantityInputCell: FC<{
  productId: number;
  maxQuantity: number;
  value: string;
  onChange: (value: string) => void;
  focusedInputRef: RefObject<{
    productId: number;
  } | null>;
}> = ({ productId, maxQuantity, value, onChange, focusedInputRef }) => {
  const [localValue, setLocalValue] = useState<string>(value || "");
  const prevValueRef = useRef<string>(value || "");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // This prevents resetting while user is typing
    const propValue = value || "";
    if (propValue !== prevValueRef.current) {
      setLocalValue(propValue);
      prevValueRef.current = propValue;
    }
  }, [value]);

  useEffect(() => {
    if (focusedInputRef.current?.productId === productId && inputRef.current) {
      // Use double requestAnimationFrame to ensure focus happens after DOM update
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            // Set cursor to end of input
            const length = inputRef.current.value.length;
            inputRef.current.setSelectionRange(length, length);
            // Clear the focus tracking
            focusedInputRef.current = null;
          }
        });
      });
    }
  }, [productId, focusedInputRef, localValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);

    if (document.activeElement === inputRef.current) {
      focusedInputRef.current = { productId };
    }
    onChange(val);
  };

  const handleFocus = () => {
    focusedInputRef.current = { productId };
  };

  const handleBlur = () => {
    const numValue = Number(localValue);
    if (localValue === "" || isNaN(numValue)) {
      // Allow empty - will default to 1 on transfer if selected
      return;
    }
    if (numValue > maxQuantity) {
      const clampedValue = maxQuantity.toString();
      setLocalValue(clampedValue);
      onChange(clampedValue);
    } else if (numValue < 0) {
      setLocalValue("0");
      onChange("0");
    }
  };

  return (
    <div className={styles.inputCell}>
      <TextField
        ref={inputRef}
        type="number"
        value={localValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="0"
        min="0"
        max={maxQuantity}
        step="1"
      />
    </div>
  );
};
