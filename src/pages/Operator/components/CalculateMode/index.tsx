import { useCallback } from "react";
import { PrpServiceLoader } from "@/components/common/PrpServiceLoader";
import {
  Search,
  Database,
  RotateCcw,
  Car,
  SlidersHorizontal,
  CarFront,
  CalendarDays,
  MapPin,
  Cog,
  Fuel,
  Milestone,
  Scale,
  CircleDollarSign,
  LoaderCircle,
  SearchX,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";

// ui-kit
import { Button, TextField, Tab, TabGroup, Select } from "@/ui-kit";

// hooks
import {
  getCarCatalystTotals,
  useCalculateMode,
} from "../../hooks";

// styles
import styles from "./CalculateMode.module.css";

export const CalculateMode = ({
  cashRegisterId,
}: {
  cashRegisterId?: number;
}) => {
  const {
    t,
    mode,
    searchCode,
    setSearchCode,
    attrFilters,
    updateFilter,
    definitions,
    attributeResults,
    hasSearched,
    ceramicPrices,
    isDefinitionsLoading,
    isGlobalLoading,
    handleModeChange,
    handleFullReset,
    handleBrandChange,
    handleGroupSearch,
    handleAttributeSearch,
    errors,
    hasTriedSubmit,
  } = useCalculateMode(cashRegisterId);

  // Helper to determine error state for UI components
  const getError = (key: string) => (hasTriedSubmit ? errors[key] : undefined);
  const hasResults = attributeResults.length > 0;

  const getDefinitionName = (
    items: Array<{ id: number; name: string }> | undefined,
    id: number | undefined,
  ) => items?.find((item) => item.id === id)?.name ?? "—";

  const fieldLabel = (Icon: LucideIcon, label: string) => (
    <span className={styles.fieldLabel}>
      <Icon size={14} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );

  const formatMetric = (value: number | null | undefined, fractionDigits = 2) =>
    typeof value === "number" && Number.isFinite(value)
      ? value.toLocaleString(undefined, {
          maximumFractionDigits: fractionDigits,
        })
      : "—";

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !isGlobalLoading) {
        if (mode === "code") {
          handleGroupSearch();
        } else {
          handleAttributeSearch();
        }
      }
    },
    [mode, isGlobalLoading, handleGroupSearch, handleAttributeSearch],
  );

  return (
    <div className={styles.container}>
      {/* --- Left Panel: Search Form --- */}
      <div className={styles.formPanel}>
        <div className={styles.formHeading}>
          <span className={styles.formHeadingIcon}>
            {mode === "code" ? (
              <Database size={18} aria-hidden="true" />
            ) : (
              <SlidersHorizontal size={18} aria-hidden="true" />
            )}
          </span>
          <div>
            <strong>
              {mode === "code"
                ? t("operatorPage.calculate.mode.byCode")
                : t("operatorPage.calculate.mode.byAttributes")}
            </strong>
            <span>
              {mode === "code"
                ? t("operatorPage.calculate.instructions.byCode")
                : t("operatorPage.calculate.instructions.byAttributes")}
            </span>
          </div>
        </div>

        <div className={styles.tabsContainer}>
          <TabGroup>
            <Tab
              variant="segmented"
              active={mode === "attributes"}
              icon={<SlidersHorizontal size={15} aria-hidden="true" />}
              text={t("operatorPage.calculate.mode.byAttributes")}
              onClick={() => handleModeChange("attributes")}
            />
            <Tab
              variant="segmented"
              active={mode === "code"}
              icon={<Database size={15} aria-hidden="true" />}
              text={t("operatorPage.calculate.mode.byCode")}
              onClick={() => handleModeChange("code")}
            />
          </TabGroup>
        </div>

        <div className={styles.formScrollArea}>
          {mode === "code" ? (
            <div className={`${styles.inputGrid} ${styles.codeInputGrid}`}>
              <TextField
                label={t("operatorPage.calculate.label.bucketGroupCode")}
                placeholder={t("operatorPage.calculate.placeholder.bucketGroupCode")}
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                onKeyDown={handleKeyDown}
                error={!!getError("searchCode")}
                disabled={isGlobalLoading}
                containerClassName={styles.codeInputContainer}
                inputClassName={styles.codeInput}
              />
            </div>
          ) : (
            <div className={`${styles.inputGrid} ${styles.vehicleInputGrid}`}>
              <Select
                label={fieldLabel(CarFront, t("carCatalyst.fields.brand"))}
                value={attrFilters.brandId}
                onChange={handleBrandChange}
                onKeyDown={handleKeyDown}
                disabled={isDefinitionsLoading}
                searchable
                searchPlaceholder={t("common.search")}
              >
                <option value="">{t("carCatalyst.fields.selectBrand")}</option>
                {definitions?.brands?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name || b.code}
                  </option>
                ))}
              </Select>

              <Select
                label={fieldLabel(Car, t("carCatalyst.fields.model"))}
                value={attrFilters.modelId}
                onChange={(e) => updateFilter("modelId", e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isDefinitionsLoading}
                searchable
                searchPlaceholder={t("common.search")}
              >
                <option value="">{t("carCatalyst.fields.selectModel")}</option>
                {definitions?.models?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>

              <TextField
                label={fieldLabel(
                  CalendarDays,
                  t("carCatalyst.fields.fromYear"),
                )}
                type="number"
                min={1970}
                max={new Date().getFullYear()}
                value={attrFilters.fromYear}
                onChange={(e) => updateFilter("fromYear", e.target.value)}
                onKeyDown={handleKeyDown}
              />

              <TextField
                label={fieldLabel(CalendarDays, t("carCatalyst.fields.toYear"))}
                type="number"
                min={1970}
                max={new Date().getFullYear()}
                value={attrFilters.toYear}
                onChange={(e) => updateFilter("toYear", e.target.value)}
                onKeyDown={handleKeyDown}
              />

              <Select
                label={fieldLabel(MapPin, t("carCatalyst.fields.country"))}
                value={attrFilters.countryId}
                onChange={(e) => updateFilter("countryId", e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isDefinitionsLoading}
                searchable
                searchPlaceholder={t("common.search")}
              >
                <option value="">{t("carCatalyst.fields.selectCountry")}</option>
                {definitions?.markets?.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </Select>

              <Select
                label={fieldLabel(
                  Cog,
                  t("carCatalyst.fields.engineVariant"),
                )}
                value={attrFilters.engineId}
                onChange={(e) => updateFilter("engineId", e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isDefinitionsLoading}
                searchable
                searchPlaceholder={t("common.search")}
              >
                <option value="">{t("carCatalyst.fields.selectEngine")}</option>
                {definitions?.engines?.map((engine) => (
                  <option key={engine.id} value={engine.id}>
                    {engine.name}
                  </option>
                ))}
              </Select>

              <Select
                label={fieldLabel(Fuel, t("carCatalyst.fields.fuelType"))}
                value={attrFilters.fuelTypeId}
                onChange={(e) => updateFilter("fuelTypeId", e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isDefinitionsLoading}
                searchable
                searchPlaceholder={t("common.search")}
              >
                <option value="">{t("carCatalyst.fields.selectFuelType")}</option>
                {definitions?.fuelTypes?.map((fuel) => (
                  <option key={fuel.id} value={fuel.id}>
                    {fuel.name}
                  </option>
                ))}
              </Select>

              <Select
                label={fieldLabel(
                  Milestone,
                  t("carCatalyst.fields.driveType"),
                )}
                value={attrFilters.driveTypeId}
                onChange={(e) => updateFilter("driveTypeId", e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isDefinitionsLoading}
                searchable
                searchPlaceholder={t("common.search")}
              >
                <option value="">{t("carCatalyst.fields.selectDriveType")}</option>
                {definitions?.driveTypes?.map((driveType) => (
                  <option key={driveType.id} value={driveType.id}>
                    {driveType.name}
                  </option>
                ))}
              </Select>

              {hasTriedSubmit && (errors.attributes || errors.yearRange) && (
                <div className={styles.validationMessage} role="alert">
                  {errors.attributes || errors.yearRange}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.formFooter}>
          <Button
            onClick={handleFullReset}
            variant="secondary"
            className={`${styles.actionIconButton} ${styles.resetBtn}`}
            aria-label={t("common.reset")}
          >
            <RotateCcw size={23} aria-hidden="true" />
            <span className={styles.actionTooltip} aria-hidden="true">
              {t("common.reset")}
            </span>
          </Button>
          <Button
            onClick={
              mode === "code" ? handleGroupSearch : handleAttributeSearch
            }
            disabled={isGlobalLoading}
            className={`${styles.actionIconButton} ${styles.searchBtn}`}
            variant="primary"
            aria-label={t(isGlobalLoading ? "common.loading" : "common.search")}
          >
            {isGlobalLoading ? (
              <LoaderCircle size={17} className={styles.loadingSpinner} aria-hidden="true" />
            ) : (
              <Search size={24} aria-hidden="true" />
            )}
            <span className={styles.actionTooltip} aria-hidden="true">
              {t(isGlobalLoading ? "common.loading" : "common.search")}
            </span>
          </Button>
        </div>
      </div>

      {/* --- Right Panel: Results --- */}
      <div className={styles.resultsArea}>
        <div
          className={`${styles.resultsScrollArea} ${
            !hasResults || isGlobalLoading ? styles.centered : ""
          }`}
        >
          {isGlobalLoading ? (
            <div className={styles.searchLoadingState}>
              <PrpServiceLoader ariaLabel={t("common.loading")} />
              <div className={styles.loaderText}>{t("common.loading")}</div>
            </div>
          ) : (
            <div className={`${styles.resultsContent} ${styles.visible}`}>
              {attributeResults.length > 0 ? (
                <>
                  <div className={styles.resultsHeader}>
                    <div>
                      <div className={styles.resultsTitle}>
                        <span className={styles.resultsTitleIcon}>
                          <Search size={16} aria-hidden="true" />
                        </span>
                        <h3>{t("operatorPage.calculate.results.title")}</h3>
                      </div>
                      <p className={styles.resultCount}>
                        <Car size={13} aria-hidden="true" />
                        {t("operatorPage.calculate.results.foundCars", {
                          count: attributeResults.length,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className={styles.resultsList}>
                    {attributeResults.map((item) => {
                      const totals = getCarCatalystTotals(item);
                      const buckets = item.buckets ?? [];
                      const engineName = item.engineId
                        ? getDefinitionName(definitions?.engines, item.engineId)
                        : item.engineVolume
                          ? `${item.engineVolume} L`
                          : "—";
                      const vehicleName = `${getDefinitionName(
                        definitions?.brands,
                        item.brandId,
                      )} ${getDefinitionName(definitions?.models, item.modelId)}`;
                      const ceramicPrice = ceramicPrices[item.id] ?? 0;
                      const ironPrice =
                        typeof item.totalIronPrice === "number" &&
                        item.totalIronPrice > 0
                          ? item.totalIronPrice
                          : 0;
                      const totalPrice = ceramicPrice + ironPrice;

                      return (
                        <article key={item.id} className={styles.vehicleCard}>
                          <div className={styles.vehicleResultHeader}>
                            <span className={styles.iconCircle}>
                              <Car size={18} aria-hidden="true" />
                            </span>
                            <div className={styles.vehicleIdentity}>
                              <h3>{vehicleName}</h3>
                              <span>
                                {item.yearFrom ?? item.year ?? "—"}
                                {" – "}
                                {item.yearTo ?? item.year ?? "—"}
                              </span>
                            </div>
                            <div className={styles.bucketBadges}>
                              <span>
                                <Database size={12} aria-hidden="true" />
                                {t("operatorPage.calculate.results.buckets", {
                                  count: buckets.length,
                                })}
                              </span>
                              {buckets.map((bucket, index) => (
                                <span
                                  key={`${item.id}-${bucket.id ?? bucket.code}-${index}`}
                                  className={styles.bucketBadge}
                                >
                                  <strong>{bucket.code}</strong>
                                  <span>
                                    <MapPin size={11} aria-hidden="true" />
                                    {t(
                                      bucket.side === 1
                                        ? "carCatalyst.sections.frontPosition"
                                        : "carCatalyst.sections.rearPosition",
                                      {
                                        position: bucket.positionIndex ?? 1,
                                      },
                                    )}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className={styles.vehicleSpecs}>
                            <div className={styles.specItem}>
                              <span className={styles.specLabel}>
                                <MapPin size={12} aria-hidden="true" />
                                {t("carCatalyst.fields.country")}
                              </span>
                              <strong>
                                {getDefinitionName(
                                  definitions?.markets,
                                  item.country,
                                )}
                              </strong>
                            </div>
                            <div className={styles.specItem}>
                              <span className={styles.specLabel}>
                                <Cog size={12} aria-hidden="true" />
                                {t("carCatalyst.fields.engineVariant")}
                              </span>
                              <strong>{engineName}</strong>
                            </div>
                            <div className={styles.specItem}>
                              <span className={styles.specLabel}>
                                <Fuel size={12} aria-hidden="true" />
                                {t("carCatalyst.fields.fuelType")}
                              </span>
                              <strong>
                                {getDefinitionName(
                                  definitions?.fuelTypes,
                                  item.fuelTypeId,
                                )}
                              </strong>
                            </div>
                            <div className={styles.specItem}>
                              <span className={styles.specLabel}>
                                <Milestone size={12} aria-hidden="true" />
                                {t("carCatalyst.fields.driveType")}
                              </span>
                              <strong>
                                {getDefinitionName(
                                  definitions?.driveTypes,
                                  item.driveTypeId,
                                )}
                              </strong>
                            </div>
                          </div>
                          <div className={styles.vehicleTotals}>
                            <div>
                              <Scale size={17} aria-hidden="true" />
                              <span>
                                {t("carCatalyst.details.summary.totalWeight")}
                              </span>
                              <strong>
                                {formatMetric(totals.weight, 3)} kg
                              </strong>
                            </div>
                            {ceramicPrice > 0 && (
                              <div>
                                <CircleDollarSign size={17} aria-hidden="true" />
                                <span>
                                  {t(
                                    "carCatalyst.details.summary.ceramicPrice",
                                  )}
                                </span>
                                <strong>
                                  {formatMetric(ceramicPrice)} AMD
                                </strong>
                              </div>
                            )}
                            {ironPrice > 0 && (
                              <div>
                                <CircleDollarSign size={17} aria-hidden="true" />
                                <span>
                                  {t("carCatalyst.details.summary.ironPrice")}
                                </span>
                                <strong>{formatMetric(ironPrice)} AMD</strong>
                              </div>
                            )}
                            {totalPrice > 0 && (
                              <div className={styles.totalPrice}>
                                <CircleDollarSign size={17} aria-hidden="true" />
                                <span>
                                  {t("carCatalyst.details.summary.totalPrice")}
                                </span>
                                <strong>
                                  {formatMetric(totalPrice)} AMD
                                </strong>
                              </div>
                            )}
                          </div>
                          <details className={styles.metalDetails}>
                            <summary>
                              <span>{t("operatorPage.calculate.results.metalComposition")}</span>
                              <ChevronDown size={16} aria-hidden="true" />
                            </summary>
                            <div className={styles.metalTotals}>
                              <span className={styles.ptTotal}>
                                Pt {formatMetric(totals.pt)} g
                              </span>
                              <span className={styles.pdTotal}>
                                Pd {formatMetric(totals.pd)} g
                              </span>
                              <span className={styles.rhTotal}>
                                Rh {formatMetric(totals.rh)} g
                              </span>
                            </div>
                          </details>
                        </article>
                      );
                    })}
                  </div>
                </>
              ) : hasSearched ? (
                <div className={`${styles.emptyState} ${styles.noResultsState}`}>
                  <span className={styles.emptyIconWrap}>
                    <SearchX size={21} aria-hidden="true" />
                  </span>
                  <p>{t("operatorPage.calculate.noResults")}</p>
                </div>
              ) : (
                <div className={`${styles.emptyState} ${styles.initialState}`}>
                  <span className={styles.emptyIconWrap}>
                    <Search size={21} aria-hidden="true" />
                  </span>
                  <p>{t("operatorPage.calculate.initialPrompt")}</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
