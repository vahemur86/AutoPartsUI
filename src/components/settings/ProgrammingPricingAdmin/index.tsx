import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { CarFront } from "lucide-react";

import {
  getAllProgrammingPricingForAdmin,
  getVehicleDefinitionLookups,
  searchProgrammingPricingForAdmin,
  updateProgrammingSellingPriceAsAdmin,
} from "@/services/settings/programmingPricing";
import { getUsers } from "@/services/users";
import {
  Button,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TextField,
} from "@/ui-kit";
import type {
  ProgrammingPricingEntry,
} from "@/types/settings";

import styles from "./ProgrammingPricingAdmin.module.css";

const formatMoney = (value: number | null | undefined) => {
  if (value == null) {
    return "-";
  }
  return value.toFixed(2);
};

const getBrandFromVehicleName = (vehicleName: string) => {
  const normalized = String(vehicleName || "").trim();
  if (!normalized) {
    return "";
  }

  // Most names come as "Brand Model Year", so first token is the brand.
  return normalized.split(/\s+/)[0] || "";
};

const getBrandBadgeText = (brandName: string) => {
  const cleaned = brandName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (!cleaned) {
    return "AU";
  }

  if (cleaned.length === 1) {
    return cleaned;
  }

  return cleaned.slice(0, 2);
};

export const ProgrammingPricingAdmin = () => {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<ProgrammingPricingEntry[]>([]);
  const [programmerOptions, setProgrammerOptions] = useState<string[]>([]);
  const [brandOptions, setBrandOptions] = useState<Array<{ id: number; name: string }>>([]);
  const [modelOptions, setModelOptions] = useState<Array<{ id: number; name: string }>>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [editingSellingPrice, setEditingSellingPrice] = useState("");
  const [filterProgrammerUsername, setFilterProgrammerUsername] = useState("");
  const [filterBrandId, setFilterBrandId] = useState("");
  const [filterModelId, setFilterModelId] = useState("");

  const groupedEntries = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        vehicleName: string;
        location: string;
        offers: ProgrammingPricingEntry[];
      }
    >();

    entries.forEach((entry) => {
      const vehicleKey =
        entry.vehicleDefinitionId > 0
          ? `id:${entry.vehicleDefinitionId}`
          : `name:${entry.vehicleName}|loc:${entry.location ?? ""}`;

      if (!groups.has(vehicleKey)) {
        groups.set(vehicleKey, {
          key: vehicleKey,
          vehicleName: entry.vehicleName,
          location: entry.location ?? "-",
          offers: [],
        });
      }

      groups.get(vehicleKey)?.offers.push(entry);
    });

    return Array.from(groups.values());
  }, [entries]);

  const loadAllEntries = async () => {
    setIsLoading(true);
    setEditingEntryId(null);
    setEditingSellingPrice("");
    try {
      const data = await getAllProgrammingPricingForAdmin();
      setEntries(data);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("serviceTemplates.programmerAdmin.messages.loadFailed"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAllEntries();
  }, []);

  useEffect(() => {
    const loadBrandAndModels = async () => {
      try {
        const lookups = await getVehicleDefinitionLookups();
        setBrandOptions(Array.isArray(lookups.brands) ? lookups.brands : []);
        setModelOptions(Array.isArray(lookups.models) ? lookups.models : []);
      } catch {
        setBrandOptions([]);
        setModelOptions([]);
      }
    };

    void loadBrandAndModels();
  }, []);

  useEffect(() => {
    const loadProgrammers = async () => {
      try {
        const users = await getUsers();
        const usernames = Array.isArray(users)
          ? users
              .filter(
                (user: { role?: string; username?: string }) =>
                  String(user.role || "").toLowerCase() === "programmer" &&
                  String(user.username || "").trim().length > 0,
              )
              .map((user: { username?: string }) => String(user.username))
          : [];

        setProgrammerOptions(Array.from(new Set(usernames)));
      } catch {
        setProgrammerOptions([]);
      }
    };

    void loadProgrammers();
  }, []);

  useEffect(() => {
    const selectedBrandId = Number(filterBrandId);

    if (!selectedBrandId) {
      return;
    }

    const loadModelsByBrand = async () => {
      try {
        const lookups = await getVehicleDefinitionLookups(undefined, selectedBrandId);
        setModelOptions(Array.isArray(lookups.models) ? lookups.models : []);
      } catch {
        setModelOptions([]);
      }
    };

    void loadModelsByBrand();
  }, [filterBrandId]);

  const handleApplyFilters = async () => {
    setIsLoading(true);
    setEditingEntryId(null);
    setEditingSellingPrice("");
    try {
      const trimmedUsername = filterProgrammerUsername.trim();
      const parsedBrandId = Number(filterBrandId);
      const parsedModelId = Number(filterModelId);

      const data = await searchProgrammingPricingForAdmin({
        ...(trimmedUsername ? { programmerUsername: trimmedUsername } : {}),
        ...(filterBrandId && !Number.isNaN(parsedBrandId)
          ? { brandId: parsedBrandId }
          : {}),
        ...(filterModelId && !Number.isNaN(parsedModelId)
          ? { modelId: parsedModelId }
          : {}),
      });

      setEntries(data);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("serviceTemplates.programmerAdmin.messages.searchFailed"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetFilters = async () => {
    setFilterProgrammerUsername("");
    setFilterBrandId("");
    setFilterModelId("");

    try {
      const lookups = await getVehicleDefinitionLookups();
      setBrandOptions(Array.isArray(lookups.brands) ? lookups.brands : []);
      setModelOptions(Array.isArray(lookups.models) ? lookups.models : []);
    } catch {
      setBrandOptions([]);
      setModelOptions([]);
    }

    await loadAllEntries();
  };

  const startEditing = (entry: ProgrammingPricingEntry) => {
    setEditingEntryId(entry.id);
    setEditingSellingPrice(entry.sellingPrice.toString());
  };

  const cancelEditing = () => {
    setEditingEntryId(null);
    setEditingSellingPrice("");
  };

  const saveSellingPrice = async (entryId: number) => {
    const parsed = Number(editingSellingPrice);
    if (Number.isNaN(parsed)) {
      toast.error(t("serviceTemplates.programmerAdmin.messages.invalidSellingPrice"));
      return;
    }

    setIsLoading(true);
    try {
      const updated = await updateProgrammingSellingPriceAsAdmin({
        id: entryId,
        sellingPrice: parsed,
      });

      setEntries((prev) => prev.map((entry) => (entry.id === updated.id ? updated : entry)));
      toast.success(t("serviceTemplates.programmerAdmin.messages.sellingPriceUpdated"));
      cancelEditing();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("serviceTemplates.programmerAdmin.messages.updateFailed"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className={styles.wrapper}>
      <div className={styles.hero}>
        <div>
          <p className={styles.badge}>{t("serviceTemplates.programmerAdmin.badge")}</p>
          <h2 className={styles.title}>{t("serviceTemplates.programmerAdmin.title")}</h2>
          <p className={styles.subtitle}>
            {t("serviceTemplates.programmerAdmin.subtitle")}
          </p>
        </div>
      </div>

      <div className={styles.filtersCard}>
        <div className={styles.filterControls}>
          <Select
            label={t("serviceTemplates.programmerAdmin.filters.programmerUsername")}
            value={filterProgrammerUsername}
            onChange={(event) => setFilterProgrammerUsername(event.target.value)}
            placeholder={t("serviceTemplates.programmerAdmin.filters.allProgrammers")}
          >
            <option value="">{t("serviceTemplates.programmerAdmin.filters.allProgrammers")}</option>
            {programmerOptions.map((username) => (
              <option key={username} value={username}>
                {username}
              </option>
            ))}
          </Select>

          <Select
            label={t("serviceTemplates.programmerAdmin.filters.brand")}
            value={filterBrandId}
            onChange={(event) => {
              setFilterBrandId(event.target.value);
              setFilterModelId("");
            }}
            placeholder={t("serviceTemplates.programmerAdmin.filters.allBrands")}
          >
            <option value="">{t("serviceTemplates.programmerAdmin.filters.allBrands")}</option>
            {brandOptions.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </Select>

          <Select
            label={t("serviceTemplates.programmerAdmin.filters.model")}
            value={filterModelId}
            onChange={(event) => setFilterModelId(event.target.value)}
            placeholder={t("serviceTemplates.programmerAdmin.filters.allModels")}
            disabled={!filterBrandId}
          >
            <option value="">{t("serviceTemplates.programmerAdmin.filters.allModels")}</option>
            {modelOptions.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </Select>

          <Button variant="secondary" onClick={() => void handleApplyFilters()}>
            {t("serviceTemplates.programmerAdmin.actions.applyFilters")}
          </Button>

          <Button variant="secondary" onClick={() => void handleResetFilters()}>
            {t("serviceTemplates.programmerAdmin.actions.resetFilters")}
          </Button>

          <Button variant="primary" onClick={() => void loadAllEntries()}>
            {t("common.refresh")}
          </Button>
        </div>

        <p className={styles.filterHint}>
          {t("serviceTemplates.programmerAdmin.hint")}
        </p>
      </div>

      <div className={styles.tablePanel}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell asHeader>{t("serviceTemplates.programmerAdmin.columns.vehicle")}</TableCell>
              <TableCell asHeader>{t("serviceTemplates.programmerAdmin.columns.programmerPrices")}</TableCell>
            </TableRow>
          </TableHeader>

          <TableBody>
            {groupedEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className={styles.emptyCell}>
                  {isLoading
                    ? t("common.loading")
                    : t("serviceTemplates.programmerAdmin.messages.noEntries")}
                </TableCell>
              </TableRow>
            ) : (
              groupedEntries.map((group) => {
                const brandName = getBrandFromVehicleName(group.vehicleName);
                const brandBadgeText = getBrandBadgeText(brandName);

                return (
                  <TableRow key={group.key}>
                    <TableCell>
                      <div className={styles.vehicleCell}>
                        <div className={styles.vehicleTitleRow}>
                          <span className={styles.vehicleBrandBadge}>{brandBadgeText}</span>
                          <span className={styles.vehicleCarIcon}>
                            <CarFront size={14} />
                          </span>
                          <span className={styles.vehicleTitle}>{group.vehicleName}</span>
                        </div>
                        <div className={styles.vehicleMeta}>
                          {t("serviceTemplates.programmerAdmin.columns.location")}: {group.location || "-"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={styles.offerList}>
                        {group.offers.map((entry) => {
                          const isEditing = editingEntryId === entry.id;

                          return (
                            <div key={entry.id} className={styles.offerCard}>
                              <div className={styles.offerMainRow}>
                                <span className={styles.offerService}>{entry.serviceName}</span>
                                <span className={styles.offerProgrammer}>
                                  {entry.programmerUsername}
                                </span>
                              </div>

                              <div className={styles.offerMetricsRow}>
                                <span>
                                  {t("serviceTemplates.programmerAdmin.columns.serviceCost")}: {formatMoney(entry.serviceCost)}
                                </span>
                                <span className={styles.profitMetric}>
                                  {t("serviceTemplates.programmerAdmin.columns.profit")}: {formatMoney(entry.profit)}
                                </span>
                                <span>
                                  {t("serviceTemplates.programmerAdmin.columns.created")}: {new Date(entry.createdAt).toLocaleString()}
                                </span>
                              </div>

                              <div className={styles.offerActionsRow}>
                                {isEditing ? (
                                  <>
                                    <TextField
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={editingSellingPrice}
                                      onChange={(event) =>
                                        setEditingSellingPrice(event.target.value)
                                      }
                                    />
                                    <Button
                                      size="small"
                                      variant="primary"
                                      onClick={() => void saveSellingPrice(entry.id)}
                                      disabled={isLoading}
                                    >
                                      {t("common.save")}
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="secondary"
                                      onClick={cancelEditing}
                                      disabled={isLoading}
                                    >
                                      {t("common.cancel")}
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <span>
                                      {t("serviceTemplates.programmerAdmin.columns.sellingPrice")}: {formatMoney(entry.sellingPrice)}
                                    </span>
                                    <Button
                                      size="small"
                                      variant="secondary"
                                      onClick={() => startEditing(entry)}
                                    >
                                      {t("serviceTemplates.programmerAdmin.actions.editSellingPrice")}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
};
