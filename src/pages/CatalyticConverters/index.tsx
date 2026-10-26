import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { ArrowRight, BadgeCheck, CarFront, Eye, Filter, LoaderCircle, PackagePlus, Plus, RotateCcw, ShoppingCart, Store, X } from "lucide-react";

// ui-kit
import { Button, DataTable, Select } from "@/ui-kit";

// components
import { SectionHeader } from "@/components/common";
import actionStyles from "@/pages/ReferralPersons/ReferralActions.module.css";
import { CreateCatalyticConverterModal } from "./components/CreateCatalyticConverterModal";
import { CreatePurchaseModal } from "./components/CreatePurchaseModal";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCatalyticConverters } from "@/store/slices/catalyticConvertersSlice";
import { getVehicleDefinitions } from "@/services/settings/vehicles";
import {
  getVehicleDefinitionsPage,
  normalizeVehiclePage,
} from "@/services/vehicleAdmin";

// types
import type { VehicleDefinition } from "@/types/settings";
import type { VehicleDefinitionRecord } from "@/types/vehicleAdmin";
import type { CatalyticConverterListItemDto } from "@/types/catalyticConverters";

// styles
import styles from "./CatalyticConverters.module.css";

const PAGE_SIZE = 20;
const VEHICLE_PAGE_SIZE = 100;

const columnHelper = createColumnHelper<CatalyticConverterListItemDto>();

export const CatalyticConverters = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { items, totalItems, isLoading, pageSize } = useAppSelector(
    (state) => state.catalyticConverters,
  );

  const [definitions, setDefinitions] = useState<VehicleDefinition | null>(
    null,
  );
  const [brandId, setBrandId] = useState<string>("");
  const [vehicleMatches, setVehicleMatches] = useState<VehicleDefinitionRecord[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleDefinitionRecord | null>(null);
  const [isVehicleLoading, setIsVehicleLoading] = useState(false);
  const [isLoadingMoreVehicles, setIsLoadingMoreVehicles] = useState(false);
  const vehicleSearchRequestId = useRef(0);
  const [currentPage, setCurrentPage] = useState(0);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [purchaseForProductId, setPurchaseForProductId] = useState<
    number | null
  >(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getVehicleDefinitions();
        setDefinitions(data);
      } catch {
        toast.error(t("catalyticConverters.errors.loadingLookups"));
      }
    };
    load();
  }, [t]);

  useEffect(() => {
    const requestId = ++vehicleSearchRequestId.current;
    if (!brandId) {
      setVehicleMatches([]);
      setSelectedVehicle(null);
      setIsVehicleLoading(false);
      setIsLoadingMoreVehicles(false);
      return;
    }

    setIsVehicleLoading(true);
    setVehicleMatches([]);
    setSelectedVehicle(null);

    const loadVehicles = async () => {
      try {
        const firstPage = normalizeVehiclePage(await getVehicleDefinitionsPage({
          brandId: Number(brandId),
          page: 1,
          pageSize: VEHICLE_PAGE_SIZE,
        }));
        if (vehicleSearchRequestId.current !== requestId) return;

        let accumulatedVehicles = firstPage.results;
        setVehicleMatches(accumulatedVehicles);
        if (firstPage.totalItems === 1) {
          setSelectedVehicle(firstPage.results[0] ?? null);
        }
        setIsVehicleLoading(false);

        const pageSize = firstPage.pageSize || VEHICLE_PAGE_SIZE;
        const totalPages = Math.ceil(firstPage.totalItems / pageSize);
        if (totalPages <= 1) return;

        setIsLoadingMoreVehicles(true);
        for (let page = 2; page <= totalPages; page += 1) {
          const nextPage = normalizeVehiclePage(await getVehicleDefinitionsPage({
            brandId: Number(brandId),
            page,
            pageSize: VEHICLE_PAGE_SIZE,
          }));
          if (vehicleSearchRequestId.current !== requestId) return;
          if (!nextPage.results.length) break;
          accumulatedVehicles = [...accumulatedVehicles, ...nextPage.results];
          setVehicleMatches(accumulatedVehicles);
        }
      } catch {
        if (vehicleSearchRequestId.current === requestId) {
          toast.error(t("catalyticConverters.errors.loadingLookups"));
        }
      } finally {
        if (vehicleSearchRequestId.current === requestId) {
          setIsVehicleLoading(false);
          setIsLoadingMoreVehicles(false);
        }
      }
    };

    void loadVehicles();

    return () => {
      if (vehicleSearchRequestId.current === requestId) {
        vehicleSearchRequestId.current += 1;
      }
    };
  }, [brandId, t]);

  const loadList = useCallback(() => {
    dispatch(
      fetchCatalyticConverters({
        brandId: selectedVehicle?.brandId ?? (brandId ? Number(brandId) : undefined),
        modelId: selectedVehicle?.modelId,
        engineId: selectedVehicle?.engineId,
        fuelTypeId: selectedVehicle?.fuelTypeId,
        year: selectedVehicle?.year,
        powerHp: selectedVehicle?.horsePower,
        page: currentPage + 1,
        pageSize: PAGE_SIZE,
      }),
    );
  }, [
    dispatch,
    brandId,
    selectedVehicle,
    currentPage,
  ]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleResetFilters = () => {
    vehicleSearchRequestId.current += 1;
    setBrandId("");
    setVehicleMatches([]);
    setSelectedVehicle(null);
    setIsVehicleLoading(false);
    setIsLoadingMoreVehicles(false);
    setCurrentPage(0);
  };

  const hasActiveFilters = !!brandId || !!selectedVehicle;
  const shownFrom = totalItems === 0 ? 0 : currentPage * PAGE_SIZE + 1;
  const shownTo = Math.min((currentPage + 1) * PAGE_SIZE, totalItems);

  const getVehicleLabel = (vehicle: VehicleDefinitionRecord) => {
    const brand = vehicle.brand?.name || vehicle.brandName ||
      definitions?.brands.find((item) => item.id === vehicle.brandId)?.name ||
      vehicle.brand?.code || "";
    const model = vehicle.model?.name || vehicle.modelName ||
      definitions?.models.find((item) => item.id === vehicle.modelId)?.name ||
      vehicle.model?.code || "";
    const engine = vehicle.engine?.name || vehicle.engineName ||
      definitions?.engines.find((item) => item.id === vehicle.engineId)?.name ||
      vehicle.engine?.code || "";
    const fuel = vehicle.fuelType?.name || vehicle.fuelTypeName ||
      definitions?.fuelTypes.find((item) => item.id === vehicle.fuelTypeId)?.name ||
      vehicle.fuelType?.code || "";

    return [
      `${brand} ${model}`.trim(),
      vehicle.year,
      engine,
      fuel,
      `${vehicle.horsePower} ${t("carCatalyst.fields.horsePowerUnit")}`,
    ].filter(Boolean).join(" · ");
  };

  const handleCreated = (id: number) => {
    setIsCreateOpen(false);
    loadList();
    navigate(`/catalytic-converters/${id}`);
  };

  const handlePurchaseCreated = () => {
    setPurchaseForProductId(null);
    loadList();
    toast.success(t("catalyticConverters.purchase.success"));
  };

  const columns = useMemo<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ColumnDef<CatalyticConverterListItemDto, any>[]
  >(
    () => [
      columnHelper.accessor("code", {
        header: t("catalyticConverters.columns.code"),
        cell: (info) => <span className={styles.codeBadge}>{info.getValue()}</span>,
      }),
      columnHelper.accessor("description", {
        header: t("catalyticConverters.columns.description"),
        cell: (info) => info.getValue() || "-",
      }),
      columnHelper.accessor("sellingPrice", {
        header: t("catalyticConverters.columns.sellingPrice"),
        cell: (info) => {
          const value = info.getValue();
          return value != null
            ? <span className={styles.sellingPriceValue}>${Number(value).toFixed(2)}</span>
            : "-";
        },
      }),
      columnHelper.accessor("totalAvailableQuantity", {
        header: t("catalyticConverters.columns.available"),
        cell: (info) => (
          <span className={styles.badge}>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("batchesCount", {
        header: t("catalyticConverters.columns.batches"),
        cell: (info) => (
          <span className={`${styles.badge} ${styles.badgeMuted}`}>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.display({
        id: "priceRange",
        header: t("catalyticConverters.columns.priceRange"),
        cell: ({ row }) => {
          const { minPurchasePrice, maxPurchasePrice } = row.original;
          if (minPurchasePrice == null && maxPurchasePrice == null) return "-";
          return (
            <span className={styles.priceRange}>
              ${Number(minPurchasePrice ?? 0).toFixed(2)} - $
              {Number(maxPurchasePrice ?? 0).toFixed(2)}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: t("common.actions"),
        cell: ({ row }) => (
          <div className={styles.rowActions}>
            <button
              type="button"
              className={styles.rowAction}
              onClick={() =>
                navigate(`/catalytic-converters/${row.original.id}`)
              }
              aria-label={t("catalyticConverters.actions.viewDetails")}
              title={t("catalyticConverters.actions.viewDetails")}
            >
              <Eye size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`${styles.rowAction} ${styles.purchaseRowAction}`}
              onClick={() => setPurchaseForProductId(row.original.id)}
              aria-label={t("catalyticConverters.actions.createPurchase")}
              title={t("catalyticConverters.actions.createPurchase")}
            >
              <ShoppingCart size={15} aria-hidden="true" />
              <span>{t("catalyticConverters.actions.purchaseFromSupplier")}</span>
            </button>
          </div>
        ),
      }),
    ],
    [t, navigate],
  );

  return (
    <div className={styles.page}>
      <SectionHeader
        title={t("catalyticConverters.title")}
      />

      <div className={styles.container}>
        <div className={styles.workflowSteps}>
          <div className={`${styles.workflowStep} ${styles.workflowStepActive}`}>
            <span className={styles.workflowStepNumber}>01</span>
            <span className={styles.workflowStepIcon} aria-hidden="true">
              <PackagePlus size={18} />
            </span>
            <div className={styles.workflowStepCopy}>
              <strong>{t("catalyticConverters.workflow.createTitle")}</strong>
              <span>{t("catalyticConverters.workflow.createHint")}</span>
            </div>
            <Button
              size="small"
              className={`${actionStyles.referralButton} ${actionStyles.referralPrimary}`}
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus size={15} aria-hidden="true" />
              {t("catalyticConverters.actions.createProduct")}
            </Button>
          </div>
          <ArrowRight className={styles.workflowConnector} size={17} aria-hidden="true" />
          <div className={styles.workflowStep}>
            <span className={styles.workflowStepNumber}>02</span>
            <span className={`${styles.workflowStepIcon} ${styles.workflowPurchaseIcon}`} aria-hidden="true">
              <Store size={18} />
            </span>
            <div className={styles.workflowStepCopy}>
              <strong>{t("catalyticConverters.workflow.purchaseTitle")}</strong>
              <span>{t("catalyticConverters.workflow.purchaseHint")}</span>
            </div>
          </div>
        </div>

        <div className={styles.filtersSection}>
          <div className={styles.filtersHeading}>
            <div className={styles.filterTitleIcon} aria-hidden="true">
              <Filter size={16} />
            </div>
            <div className={styles.filterHeadingCopy}>
              <h2>{t("catalyticConverters.filters.title")}</h2>
              <span>{t("catalyticConverters.filters.vehicleHint")}</span>
            </div>
            {hasActiveFilters && (
              <span className={styles.activeFilterBadge}>
                <BadgeCheck size={13} aria-hidden="true" />
                {t("catalyticConverters.filters.active")}
              </span>
            )}
          </div>
          <div className={styles.filtersGrid}>
            <Select
              label={t("catalyticConverters.filters.brand")}
              value={brandId}
              onChange={(e) => {
                setBrandId(e.target.value);
                setSelectedVehicle(null);
                setCurrentPage(0);
              }}
              searchable
              searchPlaceholder={t("common.search")}
            >
              <option value="">{t("common.select")}</option>
              {(definitions?.brands ?? []).map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </Select>

            <Select
              label={t("catalyticConverters.filters.exactVehicle")}
              value={selectedVehicle?.id ?? ""}
              onChange={(e) => {
                const vehicle = vehicleMatches.find((item) => item.id === Number(e.target.value));
                setSelectedVehicle(vehicle ?? null);
                setCurrentPage(0);
              }}
              disabled={!brandId || isVehicleLoading || vehicleMatches.length === 0}
              searchable
              searchPlaceholder={t("common.search")}
            >
              <option value="">{t("catalyticConverters.filters.selectExactVehicle")}</option>
              {vehicleMatches.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {getVehicleLabel(vehicle)}
                </option>
              ))}
            </Select>
            {isVehicleLoading && (
              <div className={styles.vehicleLoading} role="status" aria-live="polite">
                <LoaderCircle size={15} aria-hidden="true" />
                {t("carCatalyst.sections.searchingVehicles")}
              </div>
            )}
            {isLoadingMoreVehicles && (
              <div className={styles.vehicleLoadingMore} role="status" aria-live="polite">
                <LoaderCircle size={13} aria-hidden="true" />
                {t("catalyticConverters.filters.loadingMoreVehicles")}
              </div>
            )}
            {!isVehicleLoading && brandId && vehicleMatches.length === 0 && (
              <div className={styles.vehicleEmpty} role="status">
                {t("carCatalyst.sections.noVehicleMatches")}
              </div>
            )}
            {selectedVehicle && (
              <div className={styles.selectedVehicleFilter}>
                <CarFront size={16} aria-hidden="true" />
                <span>{getVehicleLabel(selectedVehicle)}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedVehicle(null);
                    setCurrentPage(0);
                  }}
                  aria-label={t("catalyticConverters.filters.clearVehicle")}
                  title={t("catalyticConverters.filters.clearVehicle")}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          <div className={styles.filtersActions}>
            {hasActiveFilters && (
              <Button
                variant="secondary"
                size="small"
                className={`${actionStyles.referralButton} ${actionStyles.referralNeutral}`}
                onClick={handleResetFilters}
              >
                <RotateCcw size={14} />
                {t("common.reset")}
              </Button>
            )}
            <span className={styles.filterResultHint}>
              {t("catalyticConverters.filters.resultCount", { from: shownFrom, to: shownTo, total: totalItems })}
            </span>
          </div>
        </div>

        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <div className={styles.tableHeadingCopy}>
              <h3 className={styles.tableTitle}>{t("catalyticConverters.list")}</h3>
              <span>{t("catalyticConverters.listDescription")}</span>
            </div>
            <span className={styles.tableCount}>{totalItems.toLocaleString()}</span>
          </div>

          <div className={styles.tableScroll}>
            <DataTable
              data={items}
              columns={columns}
              isLoading={isLoading}
              manualPagination
              pageCount={Math.max(1, Math.ceil(totalItems / (pageSize || PAGE_SIZE)))}
              pageIndex={currentPage}
              onPaginationChange={setCurrentPage}
              noResultsText={t("catalyticConverters.emptyState")}
            />
          </div>
        </div>
      </div>

      <CreateCatalyticConverterModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreated={handleCreated}
        definitions={definitions}
      />

      <CreatePurchaseModal
        open={purchaseForProductId !== null}
        catalyticConverterId={purchaseForProductId}
        onOpenChange={(open) => {
          if (!open) setPurchaseForProductId(null);
        }}
        onCreated={handlePurchaseCreated}
      />
    </div>
  );
};
