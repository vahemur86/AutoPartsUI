import { useEffect, useState, useRef, type FC } from "react";

// ui-kit
import { TextField } from "@/ui-kit";

// styles
import styles from "./AddProduct.module.css";
import type { RefObject } from "react";

interface ProductInputs {
  originalPrice: string;
  salePrice: string;
  quantity: string;
}

export const ProductInputCell: FC<{
  productId: number;
  field: keyof ProductInputs;
  initialValue: string | undefined;
  disabled?: boolean;
  onInputChange: (
    productId: number,
    field: keyof ProductInputs,
    value: string,
  ) => void;
  focusedInputRef: RefObject<{
    productId: number;
    field: keyof ProductInputs;
  } | null>;
}> = ({
  productId,
  field,
  initialValue,
  disabled = false,
  onInputChange,
  focusedInputRef,
}) => {
  const [localValue, setLocalValue] = useState<string>(
    initialValue !== undefined && initialValue !== "" ? initialValue : "",
  );

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialValue === "" || initialValue === undefined) {
      setLocalValue("");
    }
  }, [initialValue]);

  useEffect(() => {
    if (
      focusedInputRef.current?.productId === productId &&
      focusedInputRef.current?.field === field &&
      inputRef.current
    ) {
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
  }, [productId, field, focusedInputRef, localValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);

    if (document.activeElement === inputRef.current) {
      focusedInputRef.current = { productId, field };
    }
    onInputChange(productId, field, val);
  };

  const handleFocus = () => {
    focusedInputRef.current = { productId, field };
  };

  return (
    <div className={styles.inputCell}>
      <TextField
        ref={inputRef}
        type="number"
        value={localValue}
        disabled={disabled}
        onChange={handleChange}
        onFocus={handleFocus}
        placeholder="0"
        min="0"
        step="1"
      />
    </div>
  );
};
