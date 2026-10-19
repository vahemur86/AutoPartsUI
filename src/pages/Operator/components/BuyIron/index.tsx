import { useState, useEffect, useMemo, useRef, useCallback, type FC } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

// ui-kit
import { Select, TextField, Button } from "@/ui-kit";

// icons
import {
  CarFront,
  Calculator,
  Eye,
  EyeOff,
  Layers3,
  LoaderCircle,
  Package,
  Scale,
  ShieldCheck,
  X,
} from "lucide-react";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchCarModels,
  recalculatePrices,
  setLocalCalculation,
  clearCalculation,
  clearRecalculation,
  setRecalculationResult,
} from "@/store/slices/ironCarShopSlice";

// types
import type { IronCategory, IronTypePrice, RecalculateResponse } from "@/types/ironCarShop";

// services
import { getAvailableIronTypes, getIronCategories } from "@/services/ironCarShop";

// styles
import styles from "./BuyIron.module.css";
import sharedStyles from "../../OperatorPage.module.css";

interface BuyIronProps {
  cashRegisterId: number;
  onCalculateAttempt: () => void;
}

type IronFilterMode = "brand" | "category";
type IronPriceSource = { dictBrandId?: number; categoryId?: number | null };

const sameIronPriceSource = (left: IronPriceSource, right: IronPriceSource) =>
  left.categoryId != null || right.categoryId != null
    ? left.categoryId === right.categoryId
    : left.dictBrandId === right.dictBrandId;

export const BuyIron: FC<BuyIronProps> = ({
  cashRegisterId,
  onCalculateAttempt,
}) => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();

  const { carModels } = useAppSelector(
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [filterMode, setFilterMode] = useState<IronFilterMode>("brand");
  const [categories, setCategories] = useState<IronCategory[]>([]);
  const [entryWeights, setEntryWeights] = useState<Record<string, string>>({});
  const [entrySteps, setEntrySteps] = useState<Record<string, string>>({});
  const [visibleEntrySteps, setVisibleEntrySteps] = useState<Record<string, boolean>>({});
  const [cartItems, setCartItems] = useState<IronTypePrice[]>([]);
  const [notes, setNotes] = useState("");
  const [availableIronTypes, setAvailableIronTypes] = useState<
    Awaited<ReturnType<typeof getAvailableIronTypes>>
  >([]);
  const [isLoadingIronTypes, setIsLoadingIronTypes] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [hasPreviewed, setHasPreviewed] = useState(false);
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const brandTypesRequestId = useRef(0);
  const previousCustomerIdentity = useRef<string | null>(null);

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
  const isPreviewDisabled = isPreviewing || isLoadingIronTypes || cartItems.length === 0;
  const selectedCategory = categories.find(
    (category) => String(category.id) === selectedCategoryId,
  );
  const selectedBrandName =
    carModels.find((brand) => brand.id === Number(selectedBrandId))?.name ??
    selectedCategory?.brands.find((brand) => brand.dictBrandId === Number(selectedBrandId))?.dictBrandCode;
  const availableTypeRows = availableIronTypes.map((type) => ({
    key: String(type.ironTypeId),
    brandId: filterMode === "brand" ? Number(selectedBrandId) : undefined,
    brandName: selectedBrandName ?? type.dictBrandName ?? "",
    type,
  }));

  const clearPreview = useCallback(() => {
    setHasPreviewed(false);
    dispatch(clearRecalculation());
  }, [dispatch]);

  useEffect(() => {
    if (isCustomerFound) return;
    brandTypesRequestId.current += 1;
    setSelectedBrandId("");
    setSelectedCategoryId("");
    setEntryWeights({});
    setEntrySteps({});
    setVisibleEntrySteps({});
    setCartItems([]);
    setNotes("");
    setAvailableIronTypes([]);
    setIsLoadingIronTypes(false);
    setWasSubmitted(false);
    dispatch(clearCalculation());
    clearPreview();
  }, [clearPreview, dispatch, isCustomerFound]);

  useEffect(() => {
    const customerIdentity = `${customerId ?? ""}:${customerPhone}:${currentCustomerTypeId}`;
    if (previousCustomerIdentity.current == null) {
      previousCustomerIdentity.current = customerIdentity;
      return;
    }
    if (previousCustomerIdentity.current === customerIdentity) return;
    previousCustomerIdentity.current = customerIdentity;
    setCartItems([]);
    setSelectedBrandId("");
    setSelectedCategoryId("");
    setAvailableIronTypes([]);
    setEntryWeights({});
    setEntrySteps({});
    setVisibleEntrySteps({});
    setHasPreviewed(false);
    dispatch(clearCalculation());
  }, [currentCustomerTypeId, customerId, customerPhone, dispatch]);

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
    let isCurrentRequest = true;
    void getIronCategories(cashRegisterId)
      .then((items) => {
        if (isCurrentRequest) setCategories(items.filter((category) => category.isActive));
      })
      .catch((error) => {
        if (isCurrentRequest) {
          toast.error(error instanceof Error ? error.message : t("operatorPage.ironCarShop.failedToLoadIronTypes"));
        }
      });
    return () => {
      isCurrentRequest = false;
    };
  }, [cashRegisterId, t]);

  const selectedRequestId = filterMode === "category" ? selectedCategoryId : selectedBrandId;
  const canLoadTypes = Boolean(currentCustomerTypeId && isCustomerFound && selectedRequestId);

  useEffect(() => {
    if (!canLoadTypes) {
      brandTypesRequestId.current += 1;
      setAvailableIronTypes([]);
      setIsLoadingIronTypes(false);
      setEntryWeights({});
      setEntrySteps({});
      setVisibleEntrySteps({});
      return;
    }
    const requestId = ++brandTypesRequestId.current;
    setIsLoadingIronTypes(true);
    setAvailableIronTypes([]);
    setEntryWeights({});
    setEntrySteps({});
    setVisibleEntrySteps({});

    void getAvailableIronTypes({
      ...(filterMode === "category"
        ? { categoryId: Number(selectedRequestId) }
        : { dictBrandId: Number(selectedRequestId) }),
      customerTypeId: currentCustomerTypeId,
      lang: i18n.language,
    }, cashRegisterId)
      .then((types) => {
        if (requestId === brandTypesRequestId.current) setAvailableIronTypes(types);
      })
      .catch((error) => {
        if (requestId === brandTypesRequestId.current) {
          toast.error(
            error instanceof Error
              ? error.message
              : t("operatorPage.ironCarShop.failedToLoadIronTypes", "Failed to load iron types"),
          );
        }
      })
      .finally(() => {
        if (requestId === brandTypesRequestId.current) setIsLoadingIronTypes(false);
      });

    return () => {
      if (brandTypesRequestId.current === requestId) brandTypesRequestId.current += 1;
    };
  }, [
    canLoadTypes,
    cashRegisterId,
    currentCustomerTypeId,
    filterMode,
    i18n.language,
    selectedRequestId,
    t,
  ]);

  const handleBrandChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBrandId(event.target.value);
    setEntryWeights({});
    setEntrySteps({});
    setVisibleEntrySteps({});
    setWasSubmitted(false);
  };

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = event.target.value;
    setSelectedCategoryId(categoryId);
    setSelectedBrandId("");
    setEntryWeights({});
    setEntrySteps({});
    setVisibleEntrySteps({});
    setWasSubmitted(false);
  };

  const handleFilterModeChange = (mode: IronFilterMode) => {
    setFilterMode(mode);
    setSelectedBrandId("");
    setSelectedCategoryId("");
    setEntryWeights({});
    setEntrySteps({});
    setVisibleEntrySteps({});
    setWasSubmitted(false);
  };

  const handleWeightChange = (entryKey: string, value: string) => {
    if (value !== "" && !/^\d*\.?\d{0,3}$/.test(value)) return;
    setEntryWeights((weights) => ({ ...weights, [entryKey]: value }));
    setWasSubmitted(false);
  };

  const addToCart = () => {
    setWasSubmitted(true);
    if (!currentCustomerTypeId) return;
    if (!customerPhone) {
      toast.error(t("operatorPage.ironCarShop.customerPhoneRequired"));
      return;
    }
    const additions = availableTypeRows.flatMap(({ type, brandId, brandName, key }): IronTypePrice[] => {
      const weightKg = Number(entryWeights[key]);
      const configured = Boolean(type.isPriceConfigured ?? (type.pricePerKg != null && type.pricePerKg > 0));
      if (!configured || !Number.isFinite(weightKg) || weightKg <= 0 || type.pricePerKg == null || type.pricePerKg <= 0) return [];
      const recalculationStep = Number(entrySteps[key]) || null;
      const canRecalculate = Boolean((type.recalculateStepCount ?? 0) > 0 && type.hasRecalculateSteps !== false);
      if (recalculationStep && !canRecalculate) return [];
      return [{
        ...(brandId && { dictBrandId: brandId }),
        ...(brandName && { brandName }),
        ironTypeId: type.ironTypeId,
        name: type.ironTypeName || type.name || type.code || `#${type.ironTypeId}`,
        pricePerKg: type.pricePerKg,
        weightKg,
        totalAmount: Number((type.pricePerKg * weightKg).toFixed(2)),
        customerTypeId: currentCustomerTypeId,
           categoryId: type.categoryId ?? (filterMode === "category" ? Number(selectedCategoryId) || undefined : undefined),
        categoryName: type.categoryName ?? selectedCategory?.name,
        isPriceConfigured: true,
        hasRecalculateSteps: canRecalculate,
        recalculateStepCount: type.recalculateStepCount ?? 0,
        recalculationStep,
        notes: notes.trim(),
      }];
    });
    if (!additions.length) {
      toast.error(t("operatorPage.ironCarShop.enterAtLeastOneWeight"));
      return;
    }
    const nextCartItems = [...cartItems];
    additions.forEach((item) => {
      const existingIndex = nextCartItems.findIndex((existing) =>
        sameIronPriceSource(existing, item) &&
        existing.ironTypeId === item.ironTypeId &&
        existing.recalculationStep === item.recalculationStep &&
        existing.notes === item.notes,
      );
      if (existingIndex >= 0) {
        const existing = nextCartItems[existingIndex];
        const weightKg = existing.weightKg + item.weightKg;
        nextCartItems[existingIndex] = {
          ...existing,
          weightKg,
          totalAmount: Number((existing.pricePerKg * weightKg).toFixed(2)),
        };
      } else {
        nextCartItems.push(item);
      }
    });
    setCartItems(nextCartItems);
    const totalAmount = nextCartItems.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalWeight = nextCartItems.reduce((sum, item) => sum + item.weightKg, 0);
    dispatch(setLocalCalculation({
      selectedBrandId: nextCartItems[0].dictBrandId ?? 0,
      items: nextCartItems,
      ironTotals: { weightKgTotal: totalWeight, totalAmountTotal: totalAmount },
    }));
    setEntryWeights({});
    setEntrySteps({});
    setVisibleEntrySteps({});
    setNotes("");
    setWasSubmitted(false);
    clearPreview();
    toast.success(t("operatorPage.ironCarShop.itemsAdded"));
  };

  const removeFromCart = (brandId: number | undefined, categoryId: number | null | undefined, ironTypeId: number, step: number | null | undefined, itemNotes?: string) => {
    const next = cartItems.filter((item) => !(
      item.dictBrandId === brandId &&
      item.categoryId === categoryId &&
      item.ironTypeId === ironTypeId &&
      item.recalculationStep === step &&
      item.notes === itemNotes
    ));
    setCartItems(next);
    setHasPreviewed(false);
    dispatch(clearRecalculation());
    if (next.length === 0) {
      dispatch(clearCalculation());
    } else {
      const totalAmount = next.reduce((sum, item) => sum + item.totalAmount, 0);
      const totalWeight = next.reduce((sum, item) => sum + item.weightKg, 0);
      dispatch(setLocalCalculation({
        selectedBrandId: next[0].dictBrandId ?? 0,
        items: next,
        ironTotals: { weightKgTotal: totalWeight, totalAmountTotal: totalAmount },
      }));
    }
  };

  const handlePreview = async () => {
    setWasSubmitted(true);
    onCalculateAttempt();
    if (!isCustomerFound || !customerPhone) {
      toast.error(t("operatorPage.ironCarShop.selectCustomerToCalculate"));
      return;
    }
    if (cartItems.length === 0) {
      toast.error(t("operatorPage.ironCarShop.enterAtLeastOneWeight"));
      return;
    }
    if (cartItems.some((item) => (!item.dictBrandId && item.categoryId == null) || !item.customerTypeId || item.pricePerKg <= 0)) {
      toast.error(t("operatorPage.ironCarShop.priceNotConfigured"));
      return;
    }

    const groups = new Map<string, IronTypePrice[]>();
    cartItems.filter((item) => item.recalculationStep != null).forEach((item) => {
      const sourceKey = item.categoryId != null
        ? `category:${item.categoryId}`
        : `brand:${item.dictBrandId}`;
      const key = `${sourceKey}:${item.recalculationStep}`;
      groups.set(key, [...(groups.get(key) ?? []), item]);
    });
    if (groups.size > 0 && !customerId) {
      toast.error(t("operatorPage.ironCarShop.customerRequiredForRecalculation"));
      return;
    }

    const totalWeight = cartItems.reduce((sum, item) => sum + item.weightKg, 0);
    const baseTotal = cartItems.reduce((sum, item) => sum + item.totalAmount, 0);
    dispatch(setLocalCalculation({
      selectedBrandId: cartItems[0].dictBrandId ?? 0,
      items: cartItems,
      ironTotals: { weightKgTotal: totalWeight, totalAmountTotal: baseTotal },
    }));

    setIsPreviewing(true);
    try {
      const groupEntries = Array.from(groups.entries());
      const recalculatedGroups = await Promise.all(groupEntries.map(async ([, items]) => {
        const firstItem = items[0];
        return dispatch(recalculatePrices({
          cashRegisterId,
          payload: {
            ...(firstItem.categoryId != null
              ? { categoryId: firstItem.categoryId }
              : { dictBrandId: firstItem.dictBrandId! }),
            customerId: customerId!,
            customerTypeId: firstItem.customerTypeId ?? currentCustomerTypeId,
            currentStep: (firstItem.recalculationStep ?? 1) - 1,
            items: Object.fromEntries(items.map((item) => [String(item.ironTypeId), item.weightKg])),
          },
        })).unwrap();
      }));

      const recalculatedItems = recalculatedGroups.flatMap((group, index) =>
        group.items.map((item) => ({
          ...item,
          dictBrandId: groupEntries[index][1][0].dictBrandId,
          categoryId: groupEntries[index][1][0].categoryId,
          recalculationStep: groupEntries[index][1][0].recalculationStep,
          appliedRecalculationStep: group.appliedStep,
        })),
      );
      const hasMissingRecalculatedItem = cartItems.some((item) =>
        item.recalculationStep != null && !recalculatedItems.some((result) =>
          sameIronPriceSource(result, item) &&
          result.ironTypeId === item.ironTypeId &&
          result.recalculationStep === item.recalculationStep,
        ),
      );
      if (hasMissingRecalculatedItem) {
        throw new Error(t("operatorPage.ironCarShop.recalculationFailed"));
      }
      const mergedResult: RecalculateResponse = {
        currentStep: 0,
        nextStep: 0,
        appliedStep: 0,
        isLastStep: true,
        totalWeight: cartItems.reduce((sum, item) => sum + item.weightKg, 0),
        totalAmount: cartItems.reduce((sum, item) => {
          const recalculated = recalculatedItems.find((candidate) =>
            sameIronPriceSource(candidate, item) &&
            candidate.ironTypeId === item.ironTypeId &&
            candidate.recalculationStep === item.recalculationStep,
          );
          return sum + (recalculated?.totalAmount ?? item.totalAmount);
        }, 0),
        items: cartItems.map((item) => {
          const recalculated = recalculatedItems.find((candidate) =>
            sameIronPriceSource(candidate, item) &&
            candidate.ironTypeId === item.ironTypeId &&
            candidate.recalculationStep === item.recalculationStep,
          );
          if (recalculated) {
            return {
              ...recalculated,
              categoryId: recalculated.categoryId ?? undefined,
              weightKg: item.weightKg,
              totalAmount: Number(((recalculated.pricePerKg ?? 0) * item.weightKg).toFixed(2)),
            };
          }
          return {
            dictBrandId: item.dictBrandId,
            categoryId: item.categoryId ?? undefined,
            ironTypeId: item.ironTypeId,
            weightKg: item.weightKg,
            pricePerKg: item.pricePerKg,
            totalAmount: item.totalAmount,
            recalculationStep: null,
          };
        }),
      };
      if (mergedResult.items.some((item) => item.pricePerKg == null || item.pricePerKg <= 0)) {
        throw new Error(t("operatorPage.ironCarShop.priceNotConfigured"));
      }
      dispatch(setRecalculationResult(mergedResult));
      setHasPreviewed(true);
    } catch (error) {
      dispatch(clearRecalculation());
      dispatch(setLocalCalculation({
        selectedBrandId: cartItems[0].dictBrandId ?? 0,
        items: cartItems,
        ironTotals: {
          weightKgTotal: cartItems.reduce((sum, item) => sum + item.weightKg, 0),
          totalAmountTotal: 0,
        },
      }));
      toast.error(error instanceof Error ? error.message : t("operatorPage.ironCarShop.recalculationFailed"));
    } finally {
      setIsPreviewing(false);
    }
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

      <div className={styles.filterModeSwitch} role="group" aria-label={t("operatorPage.ironCarShop.filterMode")}>
        <button
          type="button"
          className={filterMode === "brand" ? styles.filterModeActive : ""}
          aria-pressed={filterMode === "brand"}
          onClick={() => handleFilterModeChange("brand")}
        >
          <CarFront size={15} aria-hidden="true" />{t("operatorPage.ironCarShop.filterByBrand")}
        </button>
        <button
          type="button"
          className={filterMode === "category" ? styles.filterModeActive : ""}
          aria-pressed={filterMode === "category"}
          onClick={() => handleFilterModeChange("category")}
        >
          <Layers3 size={15} aria-hidden="true" />{t("operatorPage.ironCarShop.filterByCategory")}
        </button>
      </div>

      <div className={styles.purchaseFields}>
        {filterMode === "category" && (
          <Select
            searchable
            label={t("operatorPage.ironCarShop.category")}
            value={selectedCategoryId}
            onChange={handleCategoryChange}
            placeholder={t("common.select")}
            disabled={!isCustomerFound || isLoadingIronTypes}
            containerClassName={styles.wideSelect}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </Select>
          )}
        {isLoadingIronTypes && (
          <div className={styles.loadingLine} role="status">
            <LoaderCircle size={15} aria-hidden="true" />
            {t("common.loading")}
          </div>
        )}
        {filterMode === "brand" && (
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
        )}
      </div>

      {canLoadTypes && !isLoadingIronTypes && (
        <section className={styles.availableTypes}>
          <h3>{t("operatorPage.ironCarShop.availableTypes")}</h3>
          <div className={styles.availableTypesList}>
            {availableTypeRows.length === 0 ? (
              <p className={styles.emptyTypes}>{t("operatorPage.ironCarShop.noIronTypes")}</p>
            ) : availableTypeRows.map(({ type, key }) => {
            const configured = Boolean(type.isPriceConfigured ?? (type.pricePerKg != null && type.pricePerKg > 0)) &&
              type.pricePerKg != null && type.pricePerKg > 0;
            const canRecalculate = Boolean((type.recalculateStepCount ?? 0) > 0 && type.hasRecalculateSteps !== false);
            const typeName = type.ironTypeName || type.name || type.code || `#${type.ironTypeId}`;
            const weightKg = Number(entryWeights[key]);
            const lineTotal = configured && Number.isFinite(weightKg) && weightKg > 0
              ? Number((type.pricePerKg! * weightKg).toFixed(2))
              : null;
            return (
              <div className={styles.availableTypeRow} key={key}>
                <div className={styles.availableTypeInfo}>
                  <strong>{typeName}</strong>
                  <span>{type.categoryName || t("operatorPage.ironCarShop.notConfigured")}</span>
                  <b className={configured ? styles.configuredPrice : styles.unconfiguredPrice}>
                    {configured ? `${type.pricePerKg!.toLocaleString()} AMD / kg` : t("operatorPage.ironCarShop.priceNotConfigured")}
                  </b>
                </div>
                <div className={`${styles.availableTypeActions} ${canRecalculate ? styles.withRecalculation : ""}`}>
                  <TextField
                    type="number"
                    min="0"
                    step="0.001"
                    label={t("operatorPage.ironCarShop.weight")}
                    placeholder="0.000"
                    value={entryWeights[key] ?? ""}
                    onChange={(event) => handleWeightChange(key, event.target.value)}
                    disabled={!configured}
                    error={wasSubmitted && entryWeights[key] !== undefined && Number(entryWeights[key]) <= 0}
                    className={styles.weightField}
                  />
                  {lineTotal != null && (
                    <span className={styles.weightEstimate}>
                      {t("operatorPage.ironCarShop.weightEstimate", {
                        weight: weightKg,
                        price: type.pricePerKg!.toLocaleString(),
                        total: lineTotal.toLocaleString(),
                      })}
                    </span>
                  )}
                  {canRecalculate && (
                    <div className={styles.recalculationControl}>
                      {visibleEntrySteps[key] && (
                        <div className={styles.recalculationSelect}>
                          <Select
                            label={t("operatorPage.ironCarShop.recalculationStep")}
                            value={entrySteps[key] ?? ""}
                            onChange={(event) => setEntrySteps((steps) => ({ ...steps, [key]: event.target.value }))}
                          >
                            <option value="">{t("operatorPage.ironCarShop.noRecalculation")}</option>
                            {Array.from({ length: type.recalculateStepCount ?? 0 }, (_, index) => index + 1).map((step) => (
                              <option key={step} value={step}>{t("operatorPage.ironCarShop.stepLabel", { step })}</option>
                            ))}
                          </Select>
                        </div>
                      )}
                      <button
                        type="button"
                        className={styles.recalculationVisibilityToggle}
                        onClick={() => setVisibleEntrySteps((visible) => ({ ...visible, [key]: !visible[key] }))}
                        title={t(visibleEntrySteps[key] ? "operatorPage.ironCarShop.hideRecalculationStep" : "operatorPage.ironCarShop.showRecalculationStep")}
                        aria-label={t(visibleEntrySteps[key] ? "operatorPage.ironCarShop.hideRecalculationStep" : "operatorPage.ironCarShop.showRecalculationStep")}
                        aria-expanded={Boolean(visibleEntrySteps[key])}
                      >
                        {visibleEntrySteps[key] ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  )}
                  {!canRecalculate && (
                    <span className={styles.noRecalculationHint}>
                      {t("operatorPage.ironCarShop.recalculationNotAvailable")}
                    </span>
                  )}
                </div>
              </div>
            );
            })}
          </div>
          <div className={styles.availableTypesFooter}>
            <TextField
              label={t("operatorPage.ironCarShop.notes")}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={t("operatorPage.ironCarShop.notesPlaceholder")}
            />
            <Button
              variant="secondary"
              onClick={addToCart}
              disabled={!availableTypeRows.some(({ key }) => Number(entryWeights[key]) > 0)}
            >
              <Package size={16} />{t("operatorPage.ironCarShop.addItems")}
            </Button>
          </div>
        </section>
      )}

      {cartItems.length > 0 && (
        <section className={styles.cartSection}>
          <h3>{t("operatorPage.ironCarShop.purchaseList")}</h3>
          <div className={styles.cartList}>
            {cartItems.map((item) => (
              <div className={styles.cartItem} key={`${item.dictBrandId ?? item.categoryId}-${item.ironTypeId}-${item.recalculationStep ?? 0}-${item.notes ?? ""}`}>
                <div className={styles.cartItemInfo}>
                  <strong>{item.name}</strong>
                  <span>{item.brandName ?? item.categoryName} · {item.weightKg} kg · {item.pricePerKg.toLocaleString()} AMD/kg</span>
                  {item.recalculationStep != null && <small>{t("operatorPage.ironCarShop.stepLabel", { step: item.recalculationStep })}</small>}
                </div>
                <strong>{item.totalAmount.toLocaleString()} AMD</strong>
                <button
                  type="button"
                  className={styles.removeCartItem}
                  onClick={() => removeFromCart(item.dictBrandId, item.categoryId, item.ironTypeId, item.recalculationStep, item.notes)}
                  aria-label={t("operatorPage.ironCarShop.removeItem", { name: item.name })}
                  title={t("operatorPage.ironCarShop.removeItem", { name: item.name })}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {hasPreviewed && (
        <div className={styles.totalPreview} role="status">
          <span><Scale size={16} aria-hidden="true" />{t("operatorPage.ironCarShop.totalAmount")}</span>
          <strong>{(recalculationResult?.totalAmount ?? cartItems.reduce((sum, item) => sum + item.totalAmount, 0)).toLocaleString()} AMD</strong>
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
