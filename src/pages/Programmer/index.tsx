import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
  addProgrammingPricing,
  getMyProgrammingPricing,
  getProgrammingServices,
  getVehicleDefinitionLookups,
  updateMyProgrammingCost,
} from "@/services/settings/programmingPricing";
import {
  Button,
  ConfirmationModal,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TextField,
} from "@/ui-kit";
import { logout } from "@/store/slices/authSlice";
import { fetchLanguages } from "@/store/slices/languagesSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type {
  ProgrammingPricingEntry,
  ProgrammingServiceItem,
  VehicleDefinitionLookups,
} from "@/types/settings";
import { mapApiCodeToI18nCode, mapI18nCodeToApiCode } from "@/utils/languageMapping";

import styles from "./Programmer.module.css";

type ProgrammerTab = "add" | "entries";

const defaultLookups: VehicleDefinitionLookups = {
  brands: [],
  models: [],
  fuelTypes: [],
  engines: [],
  markets: [],
  driveTypes: [],
};

const formatMoney = (value: number | null | undefined) => {
  if (value == null) {
    return "-";
  }
  return value.toFixed(2);
};

export const ProgrammerPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const languagesState = useAppSelector((state) => state.languages);
  const authUser = useAppSelector((state) => state.auth.user);

  const [lookups, setLookups] = useState<VehicleDefinitionLookups>(defaultLookups);
  const [services, setServices] = useState<ProgrammingServiceItem[]>([]);
  const [myEntries, setMyEntries] = useState<ProgrammingPricingEntry[]>([]);

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [editingCost, setEditingCost] = useState<string>("");
  const [editingSellingPrice, setEditingSellingPrice] = useState<string>("");

  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");
  const [fuelTypeId, setFuelTypeId] = useState("");
  const [engineId, setEngineId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [year, setYear] = useState("");
  const [notes, setNotes] = useState("");

  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [serviceCost, setServiceCost] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProgrammerTab>("add");

  const modelOptions = useMemo(() => lookups.models, [lookups.models]);
  const languages = useMemo(
    () => languagesState.languages.filter((lang) => lang.isEnabled),
    [languagesState.languages],
  );
  const currentLanguageCode = useMemo(
    () =>
      languages.find((lang) => mapApiCodeToI18nCode(lang.code) === i18n.language)
        ?.code ?? "",
    [languages, i18n.language],
  );
  const displayUsername = useMemo(
    () => authUser?.username ?? "-",
    [authUser?.username],
  );

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 40 }, (_, index) => currentYear - index);
  }, []);
  const currentApiLanguageCode = useMemo(
    () => mapI18nCodeToApiCode(i18n.language),
    [i18n.language],
  );

  const hasAllVehicleParams = useMemo(
    () =>
      Boolean(
        brandId &&
          modelId &&
          fuelTypeId &&
          engineId &&
          locationId &&
          year,
      ),
    [brandId, modelId, fuelTypeId, engineId, locationId, year],
  );

  const canSubmitPricing = useMemo(
    () =>
      Boolean(
        hasAllVehicleParams &&
          selectedServiceId &&
          serviceCost.trim() &&
          sellingPrice.trim(),
      ),
    [hasAllVehicleParams, selectedServiceId, serviceCost, sellingPrice],
  );

  const loadPageData = async (langCode: string) => {
    setIsBootstrapping(true);
    try {
      const [lookupData, servicesData, entriesData] = await Promise.all([
        getVehicleDefinitionLookups(langCode),
        getProgrammingServices(),
        getMyProgrammingPricing(),
      ]);

      setLookups(lookupData);
      setServices(
        servicesData.filter(
          (service) =>
            service.serviceCategoryName?.toLowerCase() === "programming",
        ),
      );
      setMyEntries(entriesData);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("programmerPage.messages.loadDataFailed"),
      );
    } finally {
      setIsBootstrapping(false);
    }
  };

  const loadMyEntries = async () => {
    try {
      const entriesData = await getMyProgrammingPricing();
      setMyEntries(entriesData);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("programmerPage.messages.refreshFailed"),
      );
    }
  };

  useEffect(() => {
    if (!languagesState.isLoading && languagesState.languages.length === 0) {
      void dispatch(fetchLanguages());
    }
  }, [dispatch, languagesState.isLoading, languagesState.languages.length]);

  useEffect(() => {
    void loadPageData(currentApiLanguageCode);
  }, [currentApiLanguageCode]);

  useEffect(() => {
    const selectedBrandId = Number(brandId);
    if (!selectedBrandId) {
      return;
    }

    const loadBrandLookups = async () => {
      try {
        const lookupData = await getVehicleDefinitionLookups(
          currentApiLanguageCode,
          selectedBrandId,
        );
        setLookups((previous) => ({
          brands: lookupData.brands.length > 0 ? lookupData.brands : previous.brands,
          models: lookupData.models.length > 0 ? lookupData.models : previous.models,
          fuelTypes:
            lookupData.fuelTypes.length > 0
              ? lookupData.fuelTypes
              : previous.fuelTypes,
          engines: lookupData.engines.length > 0 ? lookupData.engines : previous.engines,
          markets: lookupData.markets.length > 0 ? lookupData.markets : previous.markets,
          driveTypes:
            lookupData.driveTypes.length > 0
              ? lookupData.driveTypes
              : previous.driveTypes,
        }));
      } catch {
        // Keep previous lookups; avoid noisy errors on each brand change.
      }
    };

    void loadBrandLookups();
  }, [brandId, currentApiLanguageCode]);

  const resetVehicleFilters = () => {
    setBrandId("");
    setModelId("");
    setFuelTypeId("");
    setEngineId("");
    setLocationId("");
    setYear("");
    setNotes("");
  };

  const handleCreatePricing = async () => {
    const parsedBrandId = Number(brandId);
    const parsedModelId = Number(modelId);
    const parsedFuelTypeId = Number(fuelTypeId);
    const parsedEngineId = Number(engineId);
    const parsedMarketId = Number(locationId);
    const parsedYear = Number(year);
    const serviceId = Number(selectedServiceId);
    const parsedServiceCost = Number(serviceCost);
    const parsedSellingPrice = Number(sellingPrice);
    const locationName =
      lookups.markets.find((item) => String(item.id) === locationId)?.name ?? "";

    if (!hasAllVehicleParams || !serviceId) {
      toast.error(t("programmerPage.messages.selectVehicleAndService"));
      return;
    }

    if (
      [
        parsedBrandId,
        parsedModelId,
        parsedFuelTypeId,
        parsedEngineId,
        parsedMarketId,
        parsedYear,
        parsedServiceCost,
        parsedSellingPrice,
      ].some((value) => Number.isNaN(value))
    ) {
      toast.error(t("programmerPage.messages.invalidCosts"));
      return;
    }

    if (!locationName) {
      toast.error(t("programmerPage.messages.selectVehicleAndService"));
      return;
    }

    setIsSaving(true);
    try {
      await addProgrammingPricing({
        brandId: parsedBrandId,
        modelId: parsedModelId,
        year: parsedYear,
        fuelTypeId: parsedFuelTypeId,
        engineId: parsedEngineId,
        marketId: parsedMarketId,
        location: locationName,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        services: [
          {
            serviceId,
            serviceCost: parsedServiceCost,
            sellingPrice: parsedSellingPrice,
          },
        ],
      });

      toast.success(t("programmerPage.messages.created"));
      setSelectedServiceId("");
      setServiceCost("");
      setSellingPrice("");
      setNotes("");
      await loadMyEntries();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("programmerPage.messages.createFailed"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const startCostEdit = (entry: ProgrammingPricingEntry) => {
    setEditingEntryId(entry.id);
    setEditingCost(entry.serviceCost.toString());
    setEditingSellingPrice(entry.sellingPrice.toString());
  };

  const cancelCostEdit = () => {
    setEditingEntryId(null);
    setEditingCost("");
    setEditingSellingPrice("");
  };

  const saveCostEdit = async (entryId: number) => {
    const parsedServiceCost = Number(editingCost);
    const parsedSellingPrice = Number(editingSellingPrice);

    if (Number.isNaN(parsedServiceCost) || Number.isNaN(parsedSellingPrice)) {
      toast.error(t("programmerPage.messages.invalidCosts"));
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateMyProgrammingCost({
        id: entryId,
        serviceCost: parsedServiceCost,
        sellingPrice: parsedSellingPrice,
      });

      setMyEntries((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      toast.success(t("programmerPage.messages.costUpdated"));
      cancelCostEdit();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("programmerPage.messages.updateCostFailed"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const handleLanguageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedApiCode = event.target.value;
    const code = mapApiCodeToI18nCode(selectedApiCode);
    i18n.changeLanguage(code);
    localStorage.setItem("i18nextLng", code);
  };

  return (
    <div className={styles.pageContainer}>
      <section className={styles.heroSection}>
        <div className={styles.heroHeaderRow}>
          <div>
            <div className={styles.userInfoRow}>
              <span className={styles.userInfoLabel}>{t("programmerPage.user.username")}</span>
              <span className={styles.userInfoValue}>{displayUsername}</span>
            </div>
            <p className={styles.badge}>{t("programmerPage.badge")}</p>
            <h1 className={styles.title}>{t("programmerPage.title")}</h1>
          </div>
          <div className={styles.heroActions}>
            <div className={styles.languageSelectWrapper}>
              <Select
                placeholder={t("common.select")}
                onChange={handleLanguageChange}
                value={currentLanguageCode}
                disabled={languagesState.isLoading || languages.length === 0}
              >
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </Select>
            </div>

            <Button
              variant="danger"
              onClick={() => setIsLogoutModalOpen(true)}
              className={styles.logoutButton}
            >
              {t("header.logout")}
            </Button>
          </div>
        </div>
          <p className={styles.subtitle}>
            {t("programmerPage.subtitle")}
          </p>
      </section>

      <div className={styles.tabWrapper}>
        <Tab
          variant="underline"
          active={activeTab === "add"}
          text={t("programmerPage.tabs.add")}
          onClick={() => setActiveTab("add")}
        />
        <Tab
          variant="underline"
          active={activeTab === "entries"}
          text={t("programmerPage.tabs.entries")}
          onClick={() => setActiveTab("entries")}
        />
      </div>

      {activeTab === "add" && (
      <section className={styles.gridSection}>
        <article className={styles.card}>
          <h2 className={styles.cardTitle}>{t("programmerPage.sections.vehicleLookup")}</h2>

          <div className={styles.filtersGrid}>
            <Select
              label={t("programmerPage.fields.brand")}
              value={brandId}
              onChange={(event) => {
                setBrandId(event.target.value);
                setModelId("");
                setFuelTypeId("");
                setEngineId("");
                setLocationId("");
                setYear("");
              }}
              placeholder={t("programmerPage.placeholders.selectBrand")}
            >
              {lookups.brands.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>

            <Select
              label={t("programmerPage.fields.model")}
              value={modelId}
              onChange={(event) => {
                setModelId(event.target.value);
                setFuelTypeId("");
                setEngineId("");
                setLocationId("");
                setYear("");
              }}
              placeholder={t("programmerPage.placeholders.selectModel")}
            >
              {modelOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>

            <Select
              label={t("programmerPage.fields.fuelType")}
              value={fuelTypeId}
              onChange={(event) => {
                setFuelTypeId(event.target.value);
                setEngineId("");
                setLocationId("");
                setYear("");
              }}
              placeholder={t("programmerPage.placeholders.selectFuelType")}
            >
              {lookups.fuelTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>

            <Select
              label={t("programmerPage.fields.engine")}
              value={engineId}
              onChange={(event) => {
                setEngineId(event.target.value);
                setLocationId("");
                setYear("");
              }}
              placeholder={t("programmerPage.placeholders.selectEngine")}
            >
              {lookups.engines.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>

            <Select
              label={t("programmerPage.fields.location")}
              value={locationId}
              onChange={(event) => setLocationId(event.target.value)}
              placeholder={t("programmerPage.placeholders.selectLocation")}
            >
              {lookups.markets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>

            <Select
              label={t("programmerPage.fields.year")}
              value={year}
              onChange={(event) => setYear(event.target.value)}
              placeholder={t("programmerPage.placeholders.selectYear")}
            >
              {years.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>

          <div className={styles.actionsRow}>
            <Button variant="secondary" onClick={resetVehicleFilters}>
              {t("programmerPage.actions.resetFilters")}
            </Button>
          </div>
        </article>

        <article className={styles.card}>
          <h2 className={styles.cardTitle}>{t("programmerPage.sections.createPricing")}</h2>

          <div className={styles.summaryBox}>
            <p className={styles.summaryLabel}>{t("programmerPage.fields.category")}</p>
            <p className={styles.summaryValue}>{t("programmerPage.values.programming")}</p>
          </div>

          <div className={styles.formGrid}>
            <Select
              label={t("programmerPage.fields.programmingService")}
              value={selectedServiceId}
              onChange={(event) => setSelectedServiceId(event.target.value)}
              placeholder={t("programmerPage.placeholders.chooseService")}
            >
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </Select>

            <TextField
              label={t("programmerPage.fields.notes")}
              placeholder={t("programmerPage.placeholders.notes")}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />

            <TextField
              label={t("programmerPage.fields.serviceCost")}
              type="number"
              min="0"
              step="0.01"
              placeholder={t("programmerPage.placeholders.serviceCost")}
              value={serviceCost}
              onChange={(event) => setServiceCost(event.target.value)}
            />

            <TextField
              label={t("programmerPage.fields.sellingPrice")}
              type="number"
              min="0"
              step="0.01"
              placeholder={t("programmerPage.placeholders.sellingPrice")}
              value={sellingPrice}
              onChange={(event) => setSellingPrice(event.target.value)}
            />
          </div>

          <div className={styles.actionsRow}>
            <Button
              variant="primary"
              onClick={handleCreatePricing}
              disabled={isSaving || isBootstrapping || !canSubmitPricing}
            >
              {isSaving
                ? t("programmerPage.actions.saving")
                : t("programmerPage.actions.addPricing")}
            </Button>
          </div>
        </article>
      </section>
      )}

      {activeTab === "entries" && (
      <section className={styles.tableSection}>
        <div className={styles.tableHeaderRow}>
          <h2 className={styles.cardTitle}>{t("programmerPage.sections.myEntries")}</h2>
          <Button variant="secondary" onClick={() => void loadMyEntries()}>
            {t("common.refresh")}
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableCell asHeader>{t("programmerPage.table.vehicle")}</TableCell>
              <TableCell asHeader>{t("programmerPage.table.service")}</TableCell>
              <TableCell asHeader>{t("programmerPage.table.myServiceCost")}</TableCell>
              <TableCell asHeader>{t("programmerPage.table.sellingPrice")}</TableCell>
              <TableCell asHeader>{t("programmerPage.table.profit")}</TableCell>
              <TableCell asHeader>{t("programmerPage.table.updatedAt")}</TableCell>
              <TableCell asHeader>{t("common.actions")}</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {myEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className={styles.emptyTableCell}>
                  {t("programmerPage.states.noEntries")}
                </TableCell>
              </TableRow>
            ) : (
              myEntries.map((entry) => {
                const isEditing = editingEntryId === entry.id;

                return (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.vehicleName}</TableCell>
                    <TableCell>{entry.serviceName}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          type="number"
                          min="0"
                          step="0.01"
                          value={editingCost}
                          onChange={(event) => setEditingCost(event.target.value)}
                        />
                      ) : (
                        formatMoney(entry.serviceCost)
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          type="number"
                          min="0"
                          step="0.01"
                          value={editingSellingPrice}
                          onChange={(event) => setEditingSellingPrice(event.target.value)}
                        />
                      ) : (
                        formatMoney(entry.sellingPrice)
                      )}
                    </TableCell>
                    <TableCell>{formatMoney(entry.profit)}</TableCell>
                    <TableCell>
                      {entry.updatedAt
                        ? new Date(entry.updatedAt).toLocaleString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className={styles.inlineActions}>
                        {isEditing ? (
                          <>
                            <Button
                              size="small"
                              variant="primary"
                              onClick={() => void saveCostEdit(entry.id)}
                              disabled={isSaving}
                            >
                              {t("common.save")}
                            </Button>
                            <Button
                              size="small"
                              variant="secondary"
                              onClick={cancelCostEdit}
                              disabled={isSaving}
                            >
                              {t("common.cancel")}
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="small"
                            variant="secondary"
                            onClick={() => startCostEdit(entry)}
                          >
                            {t("programmerPage.actions.editPricing")}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </section>
      )}

      <ConfirmationModal
        open={isLogoutModalOpen}
        onOpenChange={setIsLogoutModalOpen}
        title={t("programmerPage.logout.title")}
        description={t("programmerPage.logout.description")}
        confirmText={t("header.logout")}
        cancelText={t("common.cancel")}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
};
