import { useState, useEffect, useMemo, useRef, useCallback, type FC } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { Select, TextField, Button } from "@/ui-kit";

// icons
import {
  BadgeCheck,
  Calculator,
  CircleAlert,
  LoaderCircle,
  Package,
  Scale,
  ShieldCheck,
} from "lucide-react";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchCarModels,
  recalculatePrices,
  setLocalCalculation,
  clearCalculation,
} from "@/store/slices/ironCarShopSlice";

// types
import type { IronTypePrice } from "@/types/ironCarShop";

// services
import { getBrandIronTypes } from "@/services/ironCarShop";

// styles
import styles from "./BuyIron.module.css";
import sharedStyles from "../../OperatorPage.module.css";

interface BuyIronProps {
  cashRegisterId: number;
  onCalculateAttempt: () => void;
}

export const BuyIron: FC<BuyIronProps> = ({
  cashRegisterId,
  onCalculateAttempt,
}) => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();

  const { carModels, ironPrices } = useAppSelector(
    (state) => state.ironCarShop,
  );
  const recalculationResult = useAppSelector(
    (state) => state.ironCarShop.recalculationResult,
  );
  const { items: searchedCustomers } = useAppSelector(
    (state) => state.customers,
  );
  const { intake } = useAppSelector((state) => state.operator);

  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [selectedIronTypeId, setSelectedIronTypeId] = useState("");
  const [weight, setWeight] = useState("");
  const [recalculationStep, setRecalculationStep] = useState("");
  const [notes, setNotes] = useState("");
  const [availableIronTypes, setAvailableIronTypes] = useState<
    Awaited<ReturnType<typeof getBrandIronTypes>>
  >([]);
  const [isLoadingIronTypes, setIsLoadingIronTypes] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [hasPreviewed, setHasPreviewed] = useState(false);
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const brandTypesRequestId = useRef(0);

  const isCustomerFound = useMemo(
    () => searchedCustomers.length > 0 || Boolean(intake?.customer?.phone),
    [searchedCustomers, intake?.customer?.phone],
  );

  const profileCustomerTypeId =
    intake?.customer?.customerTypeId ??
    intake?.customer?.customerType?.id ??
    searchedCustomers[0]?.customerTypeId;
  const customerPhone =
    intake?.customer?.phone ?? searchedCustomers[0]?.phone ?? "";
  const customerId = intake?.customer?.id ?? searchedCustomers[0]?.id;
  const currentCustomerTypeId = Number(profileCustomerTypeId) || 0;
  const selectedIronType = availableIronTypes.find(
    (type) => type.ironTypeId === Number(selectedIronTypeId),
  );
  const isPriceConfigured = Boolean(
    selectedIronType?.isPriceConfigured ??
      (selectedIronType?.pricePerKg != null && selectedIronType.pricePerKg > 0),
  ) && selectedIronType?.pricePerKg != null && selectedIronType.pricePerKg > 0;
  const canRecalculate = Boolean(
    selectedIronType?.hasRecalculateSteps &&
      (selectedIronType.recalculateStepCount ?? 0) > 0 &&
      selectedIronType.categoryId == null,
  );
  const recalculateItem = recalculationResult?.items.find(
    (item) => item.ironTypeId === selectedIronType?.ironTypeId,
  );
  const displayedPrice = hasPreviewed && recalculationResult
    ? recalculateItem?.pricePerKg ?? null
    : selectedIronType?.pricePerKg ?? null;
  const weightValue = Number(weight);
  const isWeightValid = Number.isFinite(weightValue) && weightValue > 0;
  const hasConfiguredPrice = isPriceConfigured && selectedIronType?.pricePerKg != null;
  const isPreviewDisabled = Boolean(
    isPreviewing ||
    isLoadingIronTypes ||
    !selectedBrandId ||
    !currentCustomerTypeId ||
    !selectedIronType ||
    !hasConfiguredPrice ||
    (recalculationStep && !canRecalculate),
  );

  const clearPreview = useCallback(() => {
    setHasPreviewed(false);
    dispatch(clearCalculation());
  }, [dispatch]);

  useEffect(() => {
    if (isCustomerFound) return;
    brandTypesRequestId.current += 1;
    setSelectedBrandId("");
    setSelectedIronTypeId("");
    setWeight("");
    setRecalculationStep("");
    setNotes("");
    setAvailableIronTypes([]);
    setIsLoadingIronTypes(false);
    setWasSubmitted(false);
    clearPreview();
  }, [clearPreview, isCustomerFound]);

  const loadBrandTypes = useCallback(
    async (brandId: number, customerTypeId: number) => {
      const requestId = ++brandTypesRequestId.current;
      setIsLoadingIronTypes(true);
      try {
        const types = await getBrandIronTypes(
          brandId,
          customerTypeId,
          cashRegisterId,
          i18n.language,
        );
        if (requestId === brandTypesRequestId.current) {
          setAvailableIronTypes(types);
          setSelectedIronTypeId("");
          setRecalculationStep("");
        }
      } catch (error) {
        if (requestId === brandTypesRequestId.current) {
          toast.error(
            error instanceof Error
              ? error.message
              : t("operatorPage.ironCarShop.failedToLoadIronTypes", "Failed to load iron types"),
          );
          setAvailableIronTypes([]);
        }
      } finally {
        if (requestId === brandTypesRequestId.current) {
          setIsLoadingIronTypes(false);
        }
      }
    },
    [cashRegisterId, i18n.language, t],
  );

  useEffect(() => {
    if (cashRegisterId) {
      dispatch(
        fetchCarModels({
          cashRegisterId,
          lang: i18n.language,
        }),
      );
    }
  }, [dispatch, cashRegisterId, i18n.language]);

  useEffect(() => {
    if (selectedBrandId && currentCustomerTypeId && isCustomerFound) {
      void loadBrandTypes(Number(selectedBrandId), currentCustomerTypeId);
    } else {
      brandTypesRequestId.current += 1;
      setAvailableIronTypes([]);
      setIsLoadingIronTypes(false);
    }
  }, [
    currentCustomerTypeId,
    isCustomerFound,
    loadBrandTypes,
    selectedBrandId,
  ]);

  const handleBrandChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBrandId(event.target.value);
    setSelectedIronTypeId("");
    setWeight("");
    setRecalculationStep("");
    setNotes("");
    setWasSubmitted(false);
    clearPreview();
  };

  const handleWeightChange = (value: string) => {
    if (value !== "" && !/^\d*\.?\d{0,3}$/.test(value)) return;
    setWeight(value);
    setWasSubmitted(false);
    clearPreview();
  };

  const handlePreview = async () => {
    setWasSubmitted(true);
    onCalculateAttempt();
    if (!isCustomerFound) {
      toast.error(t("operatorPage.ironCarShop.selectCustomerToCalculate"));
      return;
    }
    if (!customerPhone) {
      toast.error(t("operatorPage.ironCarShop.customerPhoneRequired"));
      return;
    }
    if (!selectedBrandId || !currentCustomerTypeId || !selectedIronType) return;
    if (!hasConfiguredPrice || selectedIronType.pricePerKg == null) {
      toast.error(t("operatorPage.ironCarShop.priceNotConfigured"));
      return;
    }
    if (!isWeightValid) return;

    const parsedStep = Number(recalculationStep) || 0;
    if (parsedStep > 0 && !canRecalculate) {
      toast.error(t("operatorPage.ironCarShop.recalculationNotAvailable"));
      return;
    }

    const initialTotal = Number((selectedIronType.pricePerKg * weightValue).toFixed(2));
    const item: IronTypePrice = {
      ironTypeId: selectedIronType.ironTypeId,
      name: selectedIronType.ironTypeName || selectedIronType.name || selectedIronType.code || "",
      pricePerKg: selectedIronType.pricePerKg,
      weightKg: weightValue,
      totalAmount: initialTotal,
      customerTypeId: currentCustomerTypeId,
      categoryId: selectedIronType.categoryId,
      categoryName: selectedIronType.categoryName,
      isPriceConfigured: hasConfiguredPrice,
      hasRecalculateSteps: canRecalculate,
      recalculateStepCount: selectedIronType.recalculateStepCount ?? 0,
      recalculationStep: parsedStep || null,
      notes: notes.trim(),
    };

    dispatch(setLocalCalculation({
      selectedBrandId: Number(selectedBrandId),
      items: [item],
      ironTotals: { weightKgTotal: weightValue, totalAmountTotal: initialTotal },
    }));

    if (parsedStep > 0) {
      if (!customerId) {
        dispatch(clearCalculation());
        toast.error(t("operatorPage.ironCarShop.customerRequiredForRecalculation"));
        return;
      }
      setIsPreviewing(true);
      try {
        const result = await dispatch(recalculatePrices({
          cashRegisterId,
          payload: {
            dictBrandId: Number(selectedBrandId),
            customerId,
            customerTypeId: currentCustomerTypeId,
            currentStep: parsedStep - 1,
            items: { [selectedIronType.ironTypeId]: weightValue },
          },
        })).unwrap();
        const resultItem = result.items.find(
          (resultEntry) => resultEntry.ironTypeId === selectedIronType.ironTypeId,
        );
        if (!resultItem || resultItem.pricePerKg == null || resultItem.pricePerKg <= 0) {
          dispatch(clearCalculation());
          toast.error(t("operatorPage.ironCarShop.priceNotConfigured"));
          return;
        }
      } catch (error) {
        dispatch(clearCalculation());
        toast.error(
          typeof error === "string"
            ? error
            : error instanceof Error
              ? error.message
              : t("operatorPage.ironCarShop.recalculationFailed"),
        );
        return;
      } finally {
        setIsPreviewing(false);
      }
    }

    setHasPreviewed(true);
  };

  return (
    <div className={styles.buyIronCard}>
      <header className={styles.purchaseHeader}>
        <div className={styles.purchaseHeaderMain}>
          <span className={styles.purchaseEyebrow}>{t("operatorPage.ironCarShop.purchaseEyebrow")}</span>
          <h2 className={sharedStyles.cardTitle}>{t("operatorPage.buyIron")}</h2>
          <p>{t("operatorPage.ironCarShop.purchaseHint")}</p>
        </div>
        <span className={styles.purchaseHeaderIcon} aria-hidden="true"><Package size={21} /></span>
      </header>

      <div className={styles.customerContext}>
        <ShieldCheck size={15} aria-hidden="true" />
        <span>{isCustomerFound ? customerPhone : t("operatorPage.ironCarShop.customerRequired")}</span>
      </div>

      <div className={styles.purchaseFields}>
        <Select
          searchable
          label={t("operatorPage.ironCarShop.brand")}
          value={selectedBrandId}
          onChange={handleBrandChange}
          placeholder={t("common.select")}
          disabled={!isCustomerFound || isLoadingIronTypes}
          containerClassName={styles.wideSelect}
        >
          {carModels.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
        </Select>

        <Select
          label={t("operatorPage.ironCarShop.ironType")}
          value={selectedIronTypeId}
          onChange={(event) => {
            setSelectedIronTypeId(event.target.value);
            setWeight("");
            setRecalculationStep("");
            setWasSubmitted(false);
            clearPreview();
          }}
          disabled={!selectedBrandId || !currentCustomerTypeId || isLoadingIronTypes}
          containerClassName={styles.wideSelect}
        >
          <option value="">{t("operatorPage.ironCarShop.selectIronType")}</option>
          {availableIronTypes.map((type) => {
            const configured = Boolean(
              type.isPriceConfigured ?? (type.pricePerKg != null && type.pricePerKg > 0),
            ) && type.pricePerKg != null && type.pricePerKg > 0;
            const typeName = type.ironTypeName || type.name || type.code || `#${type.ironTypeId}`;
            return (
              <option key={type.ironTypeId} value={type.ironTypeId} disabled={!configured}>
                {configured ? typeName : `${typeName} · ${t("operatorPage.ironCarShop.priceNotConfigured")}`}
              </option>
            );
          })}
        </Select>

        {isLoadingIronTypes && (
          <div className={styles.loadingLine} role="status">
            <LoaderCircle size={15} aria-hidden="true" />
            {t("common.loading")}
          </div>
        )}
      </div>

      {selectedIronType && (
        <section className={styles.selectedIronPanel} aria-live="polite">
          <div className={styles.selectedIronHeading}>
            <div className={styles.selectedIronIcon}><BadgeCheck size={17} aria-hidden="true" /></div>
            <div>
              <span>{t("operatorPage.ironCarShop.selectedIron")}</span>
              <strong>{selectedIronType.ironTypeName || selectedIronType.name || selectedIronType.code}</strong>
            </div>
          </div>
          <div className={styles.selectedIronMeta}>
            <div className={styles.metaCell}>
              <span>{t("operatorPage.ironCarShop.category")}</span>
              <strong>{selectedIronType.categoryName || t("operatorPage.ironCarShop.notConfigured")}</strong>
            </div>
            <div className={styles.metaCell}>
              <span>{t("operatorPage.ironCarShop.price")}</span>
              <strong className={isPriceConfigured ? styles.configuredPrice : styles.unconfiguredPrice}>
                {isPriceConfigured && displayedPrice != null
                  ? `${displayedPrice.toLocaleString()} AMD / kg`
                  : t("operatorPage.ironCarShop.priceNotConfigured")}
              </strong>
            </div>
          </div>
        </section>
      )}

      <div className={styles.entryGrid}>
        <TextField
          type="number"
          min="0"
          step="0.001"
          label={t("operatorPage.ironCarShop.weight")}
          placeholder="0.000"
          value={weight}
          onChange={(event) => handleWeightChange(event.target.value)}
          disabled={!selectedIronType || !isPriceConfigured}
          error={wasSubmitted && !isWeightValid}
          helperText={wasSubmitted && !isWeightValid ? t("operatorPage.ironCarShop.weightMustBePositive") : undefined}
          className={styles.weightField}
        />
        {canRecalculate && (
          <Select
            label={t("operatorPage.ironCarShop.recalculationStep")}
            value={recalculationStep}
            onChange={(event) => {
              setRecalculationStep(event.target.value);
              setWasSubmitted(false);
              clearPreview();
            }}
            disabled={!selectedIronType || !isPriceConfigured}
          >
            <option value="">{t("operatorPage.ironCarShop.noRecalculation")}</option>
            {Array.from({ length: selectedIronType?.recalculateStepCount ?? 0 }, (_, index) => index + 1).map((step) => (
              <option key={step} value={step}>{t("operatorPage.ironCarShop.stepLabel", { step })}</option>
            ))}
          </Select>
        )}
      </div>

      <TextField
        label={t("operatorPage.ironCarShop.notes")}
        value={notes}
        onChange={(event) => {
          setNotes(event.target.value);
          setWasSubmitted(false);
          clearPreview();
        }}
        placeholder={t("operatorPage.ironCarShop.notesPlaceholder")}
      />

      {hasPreviewed && (
        <div className={styles.totalPreview} role="status">
          <span><Scale size={16} aria-hidden="true" />{t("operatorPage.ironCarShop.totalAmount")}</span>
          <strong>{(recalculationResult?.totalAmount ?? ironPrices[0]?.totalAmount ?? 0).toLocaleString()} AMD</strong>
        </div>
      )}

      {selectedIronType && !isPriceConfigured && (
        <div className={styles.warningState} role="alert">
          <CircleAlert size={16} aria-hidden="true" />
          {t("operatorPage.ironCarShop.priceNotConfigured")}
        </div>
      )}

      <div className={styles.footerActions}>
        <Button
          fullWidth
          variant="primary"
          className={sharedStyles.catalystPrimaryAction}
          onClick={() => void handlePreview()}
          disabled={isPreviewDisabled}
        >
          {isPreviewing ? <LoaderCircle size={17} /> : <Calculator size={17} />}
          {t("operatorPage.ironCarShop.previewTotal")}
        </Button>
        <p>{t("operatorPage.ironCarShop.acceptHint")}</p>
      </div>
    </div>
  );
};
