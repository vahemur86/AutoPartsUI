import { useState, useEffect, type RefObject } from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Button, Dropdown, TextField } from "@/ui-kit";
import type { AnchorRect } from "@/ui-kit";

// types
import type { CustomerType } from "@/types/settings";
import type { IronPriceForm } from "./IronPriceDropdown";

// styles
import styles from "./IronPriceDropdown.module.css";

interface AddRecalculationPriceDropdownProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  /** Pass when opening from table cell so dropdown positions correctly (avoids stale ref) */
  anchorRect?: AnchorRect | null;
  customerTypes: CustomerType[];
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: IronPriceForm) => void;
}

export const AddRecalculationPriceDropdown = ({
  open,
  anchorRef,
  anchorRect,
  customerTypes,
  isLoading = false,
  onOpenChange,
  onSave,
}: AddRecalculationPriceDropdownProps) => {
  const { t } = useTranslation();

  const [customerTypeId, setCustomerTypeId] = useState<number | "">("");
  const [pricePerKg, setPricePerKg] = useState("");
  const [hasTriedSave, setHasTriedSave] = useState(false);

  useEffect(() => {
    if (open) {
      const standardCustomerType =
        customerTypes.find(
          (ct) => ct.code.toLowerCase() === "standard",
        ) ?? customerTypes[0];

      setCustomerTypeId(standardCustomerType ? standardCustomerType.id : "");
      setPricePerKg("");
      setHasTriedSave(false);
    }
  }, [open, customerTypes]);

  const numPricePerKg = parseFloat(pricePerKg);

  const isCustomerTypeValid = customerTypeId !== "";
  const isPriceValid = !isNaN(numPricePerKg) && numPricePerKg >= 0;
  const isValid = isCustomerTypeValid && isPriceValid;

  const handleSaveClick = () => {
    setHasTriedSave(true);
    if (!isValid) return;

    onSave({
      customerTypeId: Number(customerTypeId),
      pricePerKg: numPricePerKg,
    });
  };

  const titleText = t("ironManagement.addRecalculationPrice");

  return (
    <Dropdown
      open={open}
      onOpenChange={onOpenChange}
      anchorRef={anchorRef}
      anchorRect={anchorRect}
      align="start"
      side="left"
      title={titleText}
      contentClassName={styles.dropdownContentOverride}
    >
      <div className={styles.header}>
        <span className={styles.title}>{titleText}</span>
      </div>

      <div className={styles.content}>
        <div className={styles.grid}>
          <TextField
            label={t("ironManagement.form.customerType")}
            value={
              customerTypes.find((ct) => ct.id === customerTypeId)?.code ??
              ""
            }
            disabled
          />

          <TextField
            label={t("ironManagement.form.pricePerKg")}
            placeholder="0"
            type="number"
            value={pricePerKg}
            onChange={(e) => setPricePerKg(e.target.value)}
            error={hasTriedSave && !isPriceValid}
            disabled={isLoading}
          />
        </div>

        <div className={styles.actionswithoutDelete}>
          <div className={styles.primaryActions}>
            <Button
              variant="secondary"
              size="medium"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              size="medium"
              onClick={handleSaveClick}
              disabled={isLoading || !isValid}
            >
              {t("common.save")}
            </Button>
          </div>
        </div>
      </div>
    </Dropdown>
  );
};
