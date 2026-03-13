import { useState, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchCatalystQuoteGroup,
  resetQuoteGroup,
} from "@/store/slices/catalystBucketsSlice";
import {
  fetchVehicles,
  fetchVehicleDefinitions,
  clearVehicles,
} from "@/store/slices/vehiclesSlice";

export type ModeType = "code" | "attributes";

export const useCalculateMode = (cashRegisterId?: number) => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();

  const [mode, setMode] = useState<ModeType>("code");
  const [searchCode, setSearchCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  const [attrFilters, setAttrFilters] = useState({
    brandId: "",
    modelId: "",
    fuelTypeId: "",
    engineId: "",
    marketId: "",
    driveTypeId: "",
    year: "",
    hpMin: "",
    hpMax: "",
  });

  const { definitions, isLoading, isDefinitionsLoading } = useAppSelector(
    (state) => state.vehicles,
  );
  const { catalystQuoteGroup, isLoading: isBucketsLoading } = useAppSelector(
    (state) => state.catalystBuckets,
  );

  useEffect(() => {
    dispatch(
      fetchVehicleDefinitions({
        lang: i18n.language,
        cashRegisterId,
      }),
    );
  }, [dispatch, cashRegisterId, i18n.language]);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (mode === "code") {
      if (!searchCode.trim())
        newErrors.searchCode = t("common.errors.required");
    } else {
      Object.entries(attrFilters).forEach(([key, value]) => {
        if (!value) newErrors[key] = t("common.errors.required");
      });
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [mode, searchCode, attrFilters, t]);

  const handleModeChange = (newMode: ModeType) => {
    if (newMode === mode) return;
    setSearchCode("");
    setAttrFilters({
      brandId: "",
      modelId: "",
      fuelTypeId: "",
      engineId: "",
      marketId: "",
      driveTypeId: "",
      year: "",
      hpMin: "",
      hpMax: "",
    });
    setErrors({});
    setHasTriedSubmit(false);
    dispatch(resetQuoteGroup());
    dispatch(clearVehicles());
    setMode(newMode);
  };

  const handleFullReset = () => {
    setSearchCode("");
    setAttrFilters({
      brandId: "",
      modelId: "",
      fuelTypeId: "",
      engineId: "",
      marketId: "",
      driveTypeId: "",
      year: "",
      hpMin: "",
      hpMax: "",
    });
    setErrors({});
    setHasTriedSubmit(false);
    dispatch(resetQuoteGroup());
    dispatch(clearVehicles());
  };

  const updateFilter = (key: string, value: string) => {
    setAttrFilters((prev) => ({ ...prev, [key]: value }));
    if (hasTriedSubmit) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const brandId = e.target.value;
    updateFilter("brandId", brandId);
    dispatch(
      fetchVehicleDefinitions({
        brandId: brandId ? Number(brandId) : undefined,
        lang: i18n.language,
        cashRegisterId,
      }),
    );
  };

  const handleGroupSearch = useCallback(async () => {
    setHasTriedSubmit(true);
    if (!validate()) return;
    dispatch(resetQuoteGroup());
    dispatch(clearVehicles());
    dispatch(fetchCatalystQuoteGroup({ code: searchCode, cashRegisterId }));
  }, [searchCode, validate, cashRegisterId, dispatch]);

  const handleAttributeSearch = useCallback(async () => {
    setHasTriedSubmit(true);
    if (!validate()) return;
    dispatch(resetQuoteGroup());
    dispatch(clearVehicles());
    try {
      const vehicleResult = await dispatch(
        fetchVehicles({
          filters: {
            brandId: Number(attrFilters.brandId),
            modelId: Number(attrFilters.modelId),
            fuelTypeId: Number(attrFilters.fuelTypeId),
            engineId: Number(attrFilters.engineId),
            marketId: Number(attrFilters.marketId),
            driveTypeId: Number(attrFilters.driveTypeId),
            year: Number(attrFilters.year),
            hpMin: Number(attrFilters.hpMin),
            hpMax: Number(attrFilters.hpMax),
            cashRegisterId,
          },
          withBuckets: true,
        }),
      ).unwrap();

      if (vehicleResult.length > 0 && vehicleResult[0].bucketCodes?.length) {
        dispatch(
          fetchCatalystQuoteGroup({
            code: vehicleResult[0].bucketCodes[0],
            cashRegisterId,
          }),
        );
      }
    } catch (error) {
      console.error(error);
    }
  }, [attrFilters, validate, cashRegisterId, dispatch]);

  const totalWeight = useMemo(() => {
    if (!catalystQuoteGroup?.items) return 0;
    return catalystQuoteGroup.items.reduce(
      (sum, item) => sum + (Number(item.weight) || 0),
      0,
    );
  }, [catalystQuoteGroup]);

  return {
    t,
    mode,
    searchCode,
    setSearchCode,
    attrFilters,
    updateFilter,
    definitions,
    isDefinitionsLoading,
    isGlobalLoading: isLoading || isBucketsLoading,
    hasGridItems:
      catalystQuoteGroup?.items && catalystQuoteGroup.items.length > 0,
    catalystQuoteGroup,
    handleModeChange,
    handleFullReset,
    handleBrandChange,
    handleGroupSearch,
    handleAttributeSearch,
    errors,
    hasTriedSubmit,
    totalWeight,
  };
};
