import { useState, useEffect, useRef, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Pencil } from "lucide-react";

// ui-kit
import { Dropdown, TextField, Button, IconButton } from "@/ui-kit";

// styles
import styles from "./EditPriceDropdown.module.css";

interface EditPriceDropdownProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement>;
  onOpenChange: (open: boolean) => void;
  onSave: (price: number) => void;
  currentPrice: number;
}

const PriceTrigger = ({
  onEdit,
}: {
  onEdit: (ref: RefObject<HTMLElement>) => void;
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <IconButton
      variant="secondary"
      size="small"
      ariaLabel="Edit price"
      ref={ref}
      icon={<Pencil size={14} color="#ffffff" />}
      onClick={(e) => {
        e.stopPropagation();
        onEdit(ref as RefObject<HTMLElement>);
      }}
    />
  );
};

export const EditPriceDropdown = ({
  open,
  anchorRef,
  onOpenChange,
  onSave,
  currentPrice,
}: EditPriceDropdownProps) => {
  const { t } = useTranslation();
  const [price, setPrice] = useState<string>("");

  useEffect(() => {
    if (open) {
      setPrice(currentPrice.toString());
    }
  }, [open, currentPrice]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    if (val !== "" && !/^\d*\.?\d{0,4}$/.test(val)) {
      return;
    }

    if (val.length > 1 && val.startsWith("0") && val[1] !== ".") {
      val = val.replace(/^0+/, "");
      if (val === "") val = "0";
    }

    if (val === ".") {
      val = "0.";
    }

    setPrice(val);
  };

  const handleSave = () => {
    const numPrice = parseFloat(price);
    if (price !== "" && !isNaN(numPrice)) {
      onSave(numPrice);
      onOpenChange(false);
    }
  };

  return (
    <Dropdown
      open={open}
      onOpenChange={onOpenChange}
      anchorRef={anchorRef}
      align="start"
      side="left"
    >
      <div className={styles.dropdownContainer}>
        <div className={styles.header}>
          <span className={styles.title}>{t("products.form.editPrice")}</span>
        </div>

        <div className={styles.scrollableContent}>
          <div className={styles.fields}>
            <TextField
              label={t("products.form.unitPrice")}
              // Changed to text + inputMode decimal for better regex control
              type="text"
              inputMode="decimal"
              value={price}
              onChange={handlePriceChange}
              placeholder="0.00"
              autoFocus
            />
          </div>
        </div>

        <div className={styles.actionswithoutDelete}>
          <div className={styles.primaryActions}>
            <Button
              variant="secondary"
              size="medium"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              size="medium"
              onClick={handleSave}
              disabled={price === "" || isNaN(parseFloat(price))}
            >
              {t("common.save")}
            </Button>
          </div>
        </div>
      </div>
    </Dropdown>
  );
};

EditPriceDropdown.Trigger = PriceTrigger;
