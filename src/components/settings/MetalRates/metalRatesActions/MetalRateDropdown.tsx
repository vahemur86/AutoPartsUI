import { useState, useEffect, type RefObject } from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { Button, Dropdown, TextField, Switch } from "@/ui-kit";

// types
import type { MetalRate } from "@/types/settings";

// styles
import styles from "./MetalRateDropdown.module.css";

export type MetalRateForm = Omit<MetalRate, "id">;

interface MetalRateDropdownProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  initialData?: (MetalRateForm & { id?: number }) | null;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: MetalRateForm) => void;
}

export const MetalRateDropdown = ({
  open,
  anchorRef,
  initialData,
  isLoading = false,
  onOpenChange,
  onSave,
}: MetalRateDropdownProps) => {
  const { t } = useTranslation();

  const [currencyCode, setCurrencyCode] = useState("");
  const [ptPrice, setPtPrice] = useState("");
  const [pdPrice, setPdPrice] = useState("");
  const [rhPrice, setRhPrice] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [hasTriedSave, setHasTriedSave] = useState(false);

  const isEditMode = !!initialData;

  useEffect(() => {
    if (open) {
      setCurrencyCode(initialData?.currencyCode ?? "USD");
      setPtPrice(initialData ? String(initialData.ptPricePerGram) : "");
      setPdPrice(initialData ? String(initialData.pdPricePerGram) : "");
      setRhPrice(initialData ? String(initialData.rhPricePerGram) : "");
      setIsActive(initialData?.isActive ?? true);
      setHasTriedSave(false);
    }
  }, [open, initialData]);

  const numPt = parseFloat(ptPrice);
  const numPd = parseFloat(pdPrice);
  const numRh = parseFloat(rhPrice);

  const isCurrencyValid = currencyCode.trim().length > 0;
  const arePricesValid = !isNaN(numPt) && !isNaN(numPd) && !isNaN(numRh);
  const isValid = isCurrencyValid && arePricesValid;

  const handleSaveClick = () => {
    setHasTriedSave(true);
    if (!isValid) return;

    onSave({
      currencyCode: currencyCode.trim(),
      ptPricePerGram: numPt,
      pdPricePerGram: numPd,
      rhPricePerGram: numRh,
      effectiveFrom: initialData?.effectiveFrom ?? new Date().toISOString(),
      isActive,
    });
  };

  const titleText = isEditMode ? t("metals.editRate") : t("metals.addRate");

  return (
    <Dropdown
      open={open}
      onOpenChange={onOpenChange}
      anchorRef={anchorRef}
      align="start"
      side="left"
      title={titleText}
    >
      <div className={styles.header}>
        <span className={styles.title}>{titleText}</span>
      </div>

      <div className={styles.content}>
        <div className={styles.grid}>
          <TextField
            label={t("metals.form.currency")}
            placeholder="e.g. USD"
            value={currencyCode}
            onChange={(e) => setCurrencyCode(e.target.value)}
            error={hasTriedSave && !isCurrencyValid}
            disabled={isLoading}
          />

          <TextField
            label={t("metals.form.platinum")}
            placeholder="0.00"
            type="number"
            value={ptPrice}
            onChange={(e) => setPtPrice(e.target.value)}
            error={hasTriedSave && isNaN(numPt)}
            disabled={isLoading}
          />

          <TextField
            label={t("metals.form.palladium")}
            placeholder="0.00"
            type="number"
            value={pdPrice}
            onChange={(e) => setPdPrice(e.target.value)}
            error={hasTriedSave && isNaN(numPd)}
            disabled={isLoading}
          />

          <TextField
            label={t("metals.form.rhodium")}
            placeholder="0.00"
            type="number"
            value={rhPrice}
            onChange={(e) => setRhPrice(e.target.value)}
            error={hasTriedSave && isNaN(numRh)}
            disabled={isLoading}
          />

          <div className={styles.switchWrapper}>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              label={t("common.enabled")}
            />
          </div>
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
              disabled={isLoading}
            >
              {isEditMode ? t("common.update") : t("common.save")}
            </Button>
          </div>
        </div>
      </div>
    </Dropdown>
  );
};
