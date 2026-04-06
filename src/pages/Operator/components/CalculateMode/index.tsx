import { useCallback } from "react";
import { Search, Zap, Database, RotateCcw, Car } from "lucide-react";

// ui-kit
import { Button, TextField, Tab, TabGroup, Select } from "@/ui-kit";

// hooks
import { useCalculateMode } from "../../hooks";

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
    definitionsByBucket,
    isDefinitionsLoading,
    isGlobalLoading,
    hasGridItems,
    catalystQuoteGroup,
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

  // Labels for catalyst position
  const getPositionLabel = (typeId: number) => {
    if (typeId === 1) return t("common.front");
    if (typeId === 2) return t("common.back");
    return t("common.unknown");
  };

  const isBrandNotSelected = !attrFilters.brandId;

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
        <div className={styles.tabsContainer}>
          <TabGroup>
            <Tab
              variant="segmented"
              active={mode === "code"}
              text={t("operatorPage.calculate.mode.byCode")}
              onClick={() => handleModeChange("code")}
            />
            <Tab
              variant="segmented"
              active={mode === "attributes"}
              text={t("operatorPage.calculate.mode.byAttributes")}
              onClick={() => handleModeChange("attributes")}
            />
          </TabGroup>
        </div>

        <div className={styles.formScrollArea}>
          {mode === "code" ? (
            <div className={styles.inputGrid}>
              <TextField
                label={t("operatorPage.calculate.label.bucketGroupCode")}
                placeholder="e.g. newT1"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                onKeyDown={handleKeyDown}
                error={!!getError("searchCode")}
                disabled={isGlobalLoading}
              />
            </div>
          ) : (
            <div className={styles.inputGrid}>
              <Select
                label={t("operatorPage.calculate.label.brandId")}
                value={attrFilters.brandId}
                onChange={handleBrandChange}
                onKeyDown={handleKeyDown}
                error={!!getError("brandId")}
                disabled={isDefinitionsLoading}
              >
                <option value="">{t("common.select")}</option>
                {definitions?.brands?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code}
                  </option>
                ))}
              </Select>

              <Select
                label={t("operatorPage.calculate.label.modelId")}
                value={attrFilters.modelId}
                onChange={(e) => updateFilter("modelId", e.target.value)}
                onKeyDown={handleKeyDown}
                error={!!getError("modelId")}
                disabled={isBrandNotSelected || isDefinitionsLoading}
              >
                <option value="">{t("common.select")}</option>
                {definitions?.models?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>

              <Select
                label={t("operatorPage.calculate.label.fuelTypeId")}
                value={attrFilters.fuelTypeId}
                onChange={(e) => updateFilter("fuelTypeId", e.target.value)}
                onKeyDown={handleKeyDown}
                error={!!getError("fuelTypeId")}
                disabled={isBrandNotSelected || isDefinitionsLoading}
              >
                <option value="">{t("common.select")}</option>
                {definitions?.fuelTypes?.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </Select>

              <Select
                label={t("operatorPage.calculate.label.engineId")}
                value={attrFilters.engineId}
                onChange={(e) => updateFilter("engineId", e.target.value)}
                onKeyDown={handleKeyDown}
                error={!!getError("engineId")}
                disabled={isBrandNotSelected || isDefinitionsLoading}
              >
                <option value="">{t("common.select")}</option>
                {definitions?.engines?.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </Select>

              <Select
                label={t("operatorPage.calculate.label.marketId")}
                value={attrFilters.marketId}
                onChange={(e) => updateFilter("marketId", e.target.value)}
                onKeyDown={handleKeyDown}
                error={!!getError("marketId")}
                disabled={isBrandNotSelected || isDefinitionsLoading}
              >
                <option value="">{t("common.select")}</option>
                {definitions?.markets?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>

              <Select
                label={t("operatorPage.calculate.label.driveTypeId")}
                value={attrFilters.driveTypeId}
                onChange={(e) => updateFilter("driveTypeId", e.target.value)}
                onKeyDown={handleKeyDown}
                error={!!getError("driveTypeId")}
                disabled={isBrandNotSelected || isDefinitionsLoading}
              >
                <option value="">{t("common.select")}</option>
                {definitions?.driveTypes?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>

              <TextField
                label={t("operatorPage.calculate.label.year")}
                type="number"
                value={attrFilters.year}
                onChange={(e) => updateFilter("year", e.target.value)}
                onKeyDown={handleKeyDown}
                error={!!getError("year")}
                disabled={isBrandNotSelected}
              />

              <TextField
                label={t("operatorPage.calculate.label.hpMin")}
                type="number"
                value={attrFilters.hpMin}
                onChange={(e) => updateFilter("hpMin", e.target.value)}
                onKeyDown={handleKeyDown}
                error={!!getError("hpMin")}
                disabled={isBrandNotSelected}
              />

              <TextField
                label={t("operatorPage.calculate.label.hpMax")}
                type="number"
                value={attrFilters.hpMax}
                onChange={(e) => updateFilter("hpMax", e.target.value)}
                onKeyDown={handleKeyDown}
                error={!!getError("hpMax")}
                disabled={isBrandNotSelected}
              />
            </div>
          )}
        </div>

        <div className={styles.formFooter}>
          <Button
            onClick={
              mode === "code" ? handleGroupSearch : handleAttributeSearch
            }
            disabled={isGlobalLoading}
            className={styles.searchBtn}
            variant="primary"
          >
            <Search size={18} /> {t("common.search")}
          </Button>
          <Button
            onClick={handleFullReset}
            variant="secondary"
            className={styles.resetBtn}
          >
            <RotateCcw size={18} /> {t("common.reset")}
          </Button>
        </div>
      </div>

      {/* --- Right Panel: Results Grid --- */}
      <div className={styles.resultsArea}>
        <div
          className={`${styles.resultsScrollArea} ${
            !hasGridItems || isGlobalLoading ? styles.centered : ""
          }`}
        >
          {isGlobalLoading ? (
            <div className={styles.emptyState}>
              <div className={styles.loaderText}>{t("common.loading")}</div>
            </div>
          ) : (
            <div className={`${styles.resultsContent} ${styles.visible}`}>
              {hasGridItems ? (
                <div className={styles.resultsGrid}>
                  {catalystQuoteGroup?.items.flatMap((item) => {
                    const matchedDefs = definitionsByBucket?.results.filter(
                      (def) => def.bucketCodes?.includes(item.code),
                    );

                    // ❗ If no cars found, still show code-only card
                    if (!matchedDefs?.length) {
                      return [
                        <div key={item.id} className={styles.vehicleCard}>
                          <div className={styles.cardHeader}>
                            <div className={styles.iconCircle}>
                              <Database size={20} />
                            </div>

                            <div className={styles.headerInfo}>
                              <h3>{item.code}</h3>
                              <div className={styles.positionBadge}>
                                {getPositionLabel(item.catalystTypeId)}
                              </div>
                            </div>
                          </div>

                          <div className={styles.specTable}>
                            <div className={styles.specItem}>
                              <span>
                                {t("operatorPage.calculate.specs.weight")}
                              </span>
                              <strong>{item.weight} kg</strong>
                            </div>

                            <div className={styles.specItem}>
                              <span>
                                {t("operatorPage.calculate.specs.price")}
                              </span>
                              <strong>
                                {item.price.toLocaleString()}{" "}
                                {catalystQuoteGroup.currencyCode}
                              </strong>
                            </div>
                          </div>
                        </div>,
                      ];
                    }

                    // ✅ Create ONE CARD PER CAR
                    return matchedDefs.map((def) => (
                      <div
                        key={`${item.id}-${def.id}`}
                        className={styles.vehicleCard}
                      >
                        {/* --- HEADER --- */}
                        <div className={styles.cardHeader}>
                          <div className={styles.iconCircle}>
                            <Database size={20} />
                          </div>

                          <div className={styles.headerInfo}>
                            <h3>{item.code}</h3>
                            <div className={styles.positionBadge}>
                              {getPositionLabel(item.catalystTypeId)}
                            </div>
                          </div>
                        </div>

                        {/* --- PRICE / WEIGHT --- */}
                        <div className={styles.specTable}>
                          <div className={styles.specItem}>
                            <span>
                              {t("operatorPage.calculate.specs.weight")}
                            </span>
                            <strong>{item.weight} kg</strong>
                          </div>

                          <div className={styles.specItem}>
                            <span>
                              {t("operatorPage.calculate.specs.price")}
                            </span>
                            <strong>
                              {item.price.toLocaleString()}{" "}
                              {catalystQuoteGroup.currencyCode}
                            </strong>
                          </div>
                        </div>

                        {/* --- CAR INFO --- */}
                        <div className={styles.carDetails}>
                          <div className={styles.subHeader}>
                            <Car size={16} />
                            <span>
                              {def.brand.name} {def.model.name}
                            </span>
                          </div>

                          <div className={styles.specTable}>
                            <div className={styles.specItem}>
                              <span>
                                {t("vehicles.vehicles.form.fuelType")}
                              </span>
                              <strong>{def.fuelType?.name}</strong>
                            </div>

                            <div className={styles.specItem}>
                              <span>{t("vehicles.vehicles.form.engine")}</span>
                              <strong>{def.engine?.name}</strong>
                            </div>

                            <div className={styles.specItem}>
                              <span>
                                {t("vehicles.vehicles.form.horsePower")}
                              </span>
                              <strong>{def.horsePower}</strong>
                            </div>

                            <div className={styles.specItem}>
                              <span>
                                {t("vehicles.vehicles.form.driveType")}
                              </span>
                              <strong>{def.driveType?.name}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    ));
                  })}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <Zap size={48} className={styles.emptyIcon} />
                  <p>{t("operatorPage.calculate.noResults")}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- Summary Footer --- */}
        {/* <div
          className={`${styles.groupSummary} ${
            catalystQuoteGroup && !isGlobalLoading
              ? styles.visible
              : styles.hidden
          }`}
        > */}
        {/* {catalystQuoteGroup && (
            <div className={styles.totalsRow}>
              <div className={styles.totalBox}>
                <span className={styles.currencyLabel}>
                  {t("operatorPage.calculate.summary.totalPrice")}
                </span>
                <div className={styles.priceWrapper}>
                  <span className={styles.currencyType}>
                    {catalystQuoteGroup.currencyCode}
                  </span>
                  <strong className={styles.currencyValue}>
                    {Number(
                      catalystQuoteGroup.totalPrice || 0,
                    ).toLocaleString()}
                  </strong>
                </div>
              </div> */}

        {/* Total Weight Section
              <div className={styles.totalBox}>
                <span className={styles.currencyLabel}>
                  {t("operatorPage.calculate.summary.totalWeight")}
                </span>
                <div className={styles.priceWrapper}>
                  {" "}
                  <strong className={styles.currencyValue}>
                    {totalWeight.toFixed(2)}
                  </strong>
                  <span className={styles.unitLabel}>KG</span>
                </div>
              </div>
            </div>
          )}
        </div> */}
      </div>
    </div>
  );
};
