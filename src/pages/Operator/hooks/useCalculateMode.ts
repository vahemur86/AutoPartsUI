import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { CarCatalyst, CarCatalystSearchParams } from "@/types/settings";
import type { SalesLotsCalculatorRequest } from "@/types/warehouses/salesLots";
import { fetchVehicleDefinitions } from "@/store/slices/vehiclesSlice";
import { fetchCarCatalysts } from "@/store/slices/carCatalystSlice";
import { calculateSalesLotThunk } from "@/store/slices/warehouses/salesLotsSlice";

export type ModeType = "code" | "attributes";

export const getCarCatalystTotals = (catalyst: CarCatalyst) => {
  const bucketTotals = (metric: "weight" | "pt" | "pd" | "rh") =>
    (catalyst.buckets ?? []).reduce((total, bucket) => {
      const quantity = bucket.quantity ?? 1;
      const compositions = bucket.compositions ?? [];
      if (compositions.length > 0) {
        return (
          total +
          compositions.reduce((compositionTotal, composition) => {
            const value =
              metric === "weight"
                ? composition.weightKg
                : metric === "pt"
                  ? composition.pt_g
                  : metric === "pd"
                    ? composition.pd_g
                    : composition.rh_g;
            return compositionTotal + (Number(value) || 0) * quantity;
          }, 0)
        );
      }

      const value =
        metric === "weight"
          ? bucket.weightKg
          : metric === "pt"
            ? bucket.pt_g
            : metric === "pd"
              ? bucket.pd_g
              : bucket.rh_g;
      return total + (Number(value) || 0);
    }, 0);

  return {
    weight:
      catalyst.totalWeightKg ?? bucketTotals("weight"),
    pt:
      catalyst.totalPt_g ??
      catalyst.averagePt_g ??
      bucketTotals("pt"),
    pd:
      catalyst.totalPd_g ??
      catalyst.averagePd_g ??
      bucketTotals("pd"),
    rh:
      catalyst.totalRh_g ??
      catalyst.averageRh_g ??
      bucketTotals("rh"),
  };
};

export const useCalculateMode = (cashRegisterId?: number) => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();

  // --- State ---
  const [mode, setMode] = useState<ModeType>("code");
  const [searchCode, setSearchCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [attributeResults, setAttributeResults] = useState<CarCatalyst[]>([]);
  const [ceramicPrices, setCeramicPrices] = useState<Record<number, number>>(
    {},
  );
  const [isSearchingVehicles, setIsSearchingVehicles] = useState(false);

  const [attrFilters, setAttrFilters] = useState({
    brandId: "",
    modelId: "",
    fromYear: "",
    toYear: "",
    countryId: "",
    fuelTypeId: "",
    engineId: "",
    driveTypeId: "",
  });

  // --- Selectors ---
  const {
    definitions,
    isDefinitionsLoading,
  } = useAppSelector((state) => state.vehicles);

  useEffect(() => {
    if (cashRegisterId) {
      dispatch(
        fetchVehicleDefinitions({
          lang: i18n.language,
          cashRegisterId,
        }),
      );
    }
  }, [dispatch, cashRegisterId, i18n.language]);

  // --- Validation ---
  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (mode === "code") {
      if (!searchCode.trim())
        newErrors.searchCode = t("common.errors.required");
    } else {
      const hasFilter = Object.entries(attrFilters).some(([key, value]) =>
        key === "fromYear" || key === "toYear"
          ? value.trim() !== ""
          : Number(value) > 0,
      );
      if (!hasFilter) {
        newErrors.attributes = t(
          "operatorPage.calculate.validation.attributesRequired",
        );
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [mode, searchCode, attrFilters, t]);

  // --- Handlers ---
  const handleFullReset = () => {
    setSearchCode("");
    setAttrFilters({
      brandId: "",
      modelId: "",
      fromYear: "",
      toYear: "",
      countryId: "",
      fuelTypeId: "",
      engineId: "",
      driveTypeId: "",
    });
    setErrors({});
    setHasTriedSubmit(false);
    setHasSearched(false);
    setAttributeResults([]);
    setCeramicPrices({});
  };

  const handleModeChange = (newMode: ModeType) => {
    if (newMode === mode) return;
    handleFullReset();
    setMode(newMode);
  };

  const updateFilter = (key: string, value: string) => {
    setAttrFilters((prev) => ({ ...prev, [key]: value }));
    if (hasTriedSubmit) {
      setErrors((prev) => ({
        ...prev,
        [key]: "",
        attributes: value.trim() ? "" : prev.attributes,
        yearRange: "",
      }));
    }
  };

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const brandId = e.target.value;
    setAttrFilters((prev) => ({ ...prev, brandId, modelId: "" }));
    setErrors((prev) => ({
      ...prev,
      brandId: "",
      modelId: "",
      attributes: brandId ? "" : prev.attributes,
    }));

    dispatch(
      fetchVehicleDefinitions({
        brandId: brandId ? Number(brandId) : undefined,
        lang: i18n.language,
        cashRegisterId,
      }),
    );
    setAttributeResults([]);
    setCeramicPrices({});
  };

  const searchCatalysts = useCallback(
    async (params: CarCatalystSearchParams) => {
      setHasSearched(true);
      setIsSearchingVehicles(true);
      setAttributeResults([]);
      setCeramicPrices({});

      try {
        const results = await dispatch(
          fetchCarCatalysts({ params, cashRegisterId }),
        ).unwrap();
        setAttributeResults(results);

        const calculatedPrices: Record<number, number> = {};
        let failedCalculations = 0;
        await Promise.all(
          results.map(async (catalyst) => {
            const hasCeramic =
              catalyst.hasCeramic ??
              (catalyst.buckets ?? []).some((bucket) =>
                (bucket.compositions ?? []).some(
                  (composition) => composition.type === 0,
                ),
              );
            if (!hasCeramic) return;

            const totals = getCarCatalystTotals(catalyst);
            const powderKg = Number(totals.weight);
            const pt = Number(totals.pt);
            const pd = Number(totals.pd);
            const rh = Number(totals.rh);
            const request = {
              cashRegisterId,
              powderKg: Number.isFinite(powderKg) ? powderKg : 0,
              pt_g: Number.isFinite(pt) ? pt : 0,
              pd_g: Number.isFinite(pd) ? pd : 0,
              rh_g: Number.isFinite(rh) ? rh : 0,
            } as unknown as SalesLotsCalculatorRequest;

            try {
              const quote = await dispatch(
                calculateSalesLotThunk(request),
              ).unwrap();
              if (quote.customerOfferAmd > 0) {
                calculatedPrices[catalyst.id] = quote.customerOfferAmd;
              }
            } catch (error) {
              failedCalculations += 1;
              console.error(
                `Failed to calculate ceramic price for car catalyst ${catalyst.id}:`,
                error,
              );
            }
          }),
        );
        setCeramicPrices(calculatedPrices);
        if (failedCalculations > 0) {
          toast.error(t("carCatalyst.details.offer.error"));
        }
      } catch (error) {
        console.error("Failed to search car catalysts:", error);
        toast.error(t("common.error"));
      } finally {
        setIsSearchingVehicles(false);
      }
    },
    [cashRegisterId, dispatch, t],
  );

  const handleGroupSearch = useCallback(async () => {
    setHasTriedSubmit(true);
    if (!validate()) return;
    await searchCatalysts({ code: searchCode.trim() });
  }, [searchCode, validate, searchCatalysts]);

  const handleAttributeSearch = useCallback(async () => {
    setHasTriedSubmit(true);
    if (!validate()) return;

    try {
      const currentYear = new Date().getFullYear();
      const fromYear = attrFilters.fromYear
        ? Number(attrFilters.fromYear)
        : undefined;
      const toYear = attrFilters.toYear
        ? Number(attrFilters.toYear)
        : undefined;
      const invalidYear = [fromYear, toYear].some(
        (year) =>
          year !== undefined &&
          (!Number.isInteger(year) || year < 1970 || year > currentYear),
      );
      if (
        invalidYear ||
        (fromYear !== undefined &&
          toYear !== undefined &&
          fromYear > toYear)
      ) {
        setErrors({
          yearRange: t("operatorPage.calculate.validation.invalidYearRange"),
        });
        return;
      }

      const filters: CarCatalystSearchParams = {
        ...(Number(attrFilters.brandId) > 0 && {
          brandId: Number(attrFilters.brandId),
        }),
        ...(Number(attrFilters.modelId) > 0 && {
          modelId: Number(attrFilters.modelId),
        }),
        ...(fromYear !== undefined && { fromYear }),
        ...(toYear !== undefined && { toYear }),
        ...(Number(attrFilters.countryId) > 0 && {
          countryId: Number(attrFilters.countryId),
        }),
        ...(Number(attrFilters.fuelTypeId) > 0 && {
          fuelTypeId: Number(attrFilters.fuelTypeId),
        }),
        ...(Number(attrFilters.engineId) > 0 && {
          engineId: Number(attrFilters.engineId),
        }),
        ...(Number(attrFilters.driveTypeId) > 0 && {
          driveTypeId: Number(attrFilters.driveTypeId),
        }),
      };

      await searchCatalysts(filters);
    } catch (error) {
      console.error("Invalid car catalyst search filters:", error);
      toast.error(t("common.error"));
    }
  }, [attrFilters, validate, searchCatalysts, t]);

  return {
    t,
    mode,
    searchCode,
    setSearchCode,
    attrFilters,
    updateFilter,
    definitions,
    isDefinitionsLoading,
    isGlobalLoading: isSearchingVehicles,
    attributeResults,
    hasSearched,
    ceramicPrices,
    isSearchingVehicles,
    handleModeChange,
    handleFullReset,
    handleBrandChange,
    handleGroupSearch,
    handleAttributeSearch,
    errors,
    hasTriedSubmit,
  };
};
