import { useEffect, useState, type FC } from "react";

// ui-kit
import { TextField } from "@/ui-kit";

// styles
import styles from "./TotalBatches.module.css";

export const SelectedKgCell: FC<{
  inventoryLotId: number;
  initialValue: number | undefined;
  disabled?: boolean;
  onKgChange: (id: number, val: number) => void;
}> = ({ inventoryLotId, initialValue, disabled = false, onKgChange }) => {
  const [localValue, setLocalValue] = useState<string>(
    initialValue !== undefined && initialValue !== 0
      ? initialValue.toString()
      : "",
  );

  useEffect(() => {
    if (initialValue === 0 || initialValue === undefined) {
      setLocalValue("");
    }
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);

    const numericVal = parseFloat(val);
    onKgChange(inventoryLotId, isNaN(numericVal) ? 0 : numericVal);
  };

  return (
    <div className={styles.selectedKgInput}>
      <TextField
        type="number"
        value={localValue}
        disabled={disabled}
        onChange={handleChange}
        placeholder="0"
        min="0"
        step="0.01"
      />
    </div>
  );
};
