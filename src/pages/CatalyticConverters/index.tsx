import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { Plus, RotateCcw, Eye, ShoppingCart } from "lucide-react";

// ui-kit
import { Button, DataTable, IconButton, Select, TextField } from "@/ui-kit";

// components
import { SectionHeader } from "@/components/common";
import { CreateCatalyticConverterModal } from "./components/CreateCatalyticConverterModal";
import { CreatePurchaseModal } from "./components/CreatePurchaseModal";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCatalyticConverters } from "@/store/slices/catalyticConvertersSlice";
import { getVehicleDefinitions, getVehicleModels } from "@/services/settings/vehicles";

// types
import type { VehicleDefinition } from "@/types/settings";
import type { CatalyticConverterListItemDto } from "@/types/catalyticConverters";

// styles
import styles from "./CatalyticConverters.module.css";

const PAGE_SIZE = 20;

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
  const [models, setModels] = useState<VehicleDefinition["models"]>([]);

  const [brandId, setBrandId] = useState<string>("");
  const [modelId, setModelId] = useState<string>("");
  const [engineId, setEngineId] = useState<string>("");
  const [fuelTypeId, setFuelTypeId] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [powerHp, setPowerHp] = useState<string>("");
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
    if (!brandId) {
      setModels(definitions?.models ?? []);
      return;
    }

    const load = async () => {
      try {
        const data = await getVehicleModels(Number(brandId));
        setModels(
          (data || []).map((m) => ({ id: m.id, code: m.code, name: m.name })),
        );
      } catch {
        toast.error(t("catalyticConverters.errors.loadingLookups"));
      }
    };
    load();
  }, [brandId, definitions, t]);

  const loadList = useCallback(() => {
    dispatch(
      fetchCatalyticConverters({
        brandId: brandId ? Number(brandId) : undefined,
        modelId: modelId ? Number(modelId) : undefined,
        engineId: engineId ? Number(engineId) : undefined,
        fuelTypeId: fuelTypeId ? Number(fuelTypeId) : undefined,
        year: year ? Number(year) : undefined,
        powerHp: powerHp ? Number(powerHp) : undefined,
        page: currentPage + 1,
        pageSize: PAGE_SIZE,
      }),
    );
  }, [
    dispatch,
    brandId,
    modelId,
    engineId,
    fuelTypeId,
    year,
    powerHp,
    currentPage,
  ]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const handleResetFilters = () => {
    setBrandId("");
    setModelId("");
    setEngineId("");
    setFuelTypeId("");
    setYear("");
    setPowerHp("");
    setCurrentPage(0);
  };

  const hasActiveFilters =
    !!brandId || !!modelId || !!engineId || !!fuelTypeId || !!year || !!powerHp;

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
        cell: (info) => <b>{info.getValue()}</b>,
      }),
      columnHelper.accessor("description", {
        header: t("catalyticConverters.columns.description"),
        cell: (info) => info.getValue() || "-",
      }),
      columnHelper.accessor("sellingPrice", {
        header: t("catalyticConverters.columns.sellingPrice"),
        cell: (info) => {
          const value = info.getValue();
          return value != null ? `$${Number(value).toFixed(2)}` : "-";
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
            <IconButton
              ariaLabel={t("catalyticConverters.actions.viewDetails")}
              variant="secondary"
              size="small"
              icon={<Eye size={14} />}
              onClick={() =>
                navigate(`/catalytic-converters/${row.original.id}`)
              }
            />
            <IconButton
              ariaLabel={t("catalyticConverters.actions.createPurchase")}
              variant="secondary"
              size="small"
              icon={<ShoppingCart size={14} />}
              onClick={() => setPurchaseForProductId(row.original.id)}
            />
          </div>
        ),
      }),
    ],
    [t, navigate],
  );

  return (
    <>
      <SectionHeader
        title={t("catalyticConverters.title")}
        actions={
          <Button size="small" onClick={() => setIsCreateOpen(true)}>
            <Plus size={16} />
            {t("catalyticConverters.actions.createProduct")}
          </Button>
        }
      />

      <div className={styles.container}>
        <div className={styles.filtersSection}>
          <div className={styles.filtersGrid}>
            <Select
              label={t("catalyticConverters.filters.brand")}
              value={brandId}
              onChange={(e) => {
                setBrandId(e.target.value);
                setModelId("");
                setCurrentPage(0);
              }}
            >
              <option value="">{t("common.select")}</option>
              {(definitions?.brands ?? []).map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </Select>

            <Select
              label={t("catalyticConverters.filters.model")}
              value={modelId}
              onChange={(e) => {
                setModelId(e.target.value);
                setCurrentPage(0);
              }}
              disabled={!brandId}
            >
              <option value="">{t("common.select")}</option>
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </Select>

            <Select
              label={t("catalyticConverters.filters.engine")}
              value={engineId}
              onChange={(e) => {
                setEngineId(e.target.value);
                setCurrentPage(0);
              }}
            >
              <option value="">{t("common.select")}</option>
              {(definitions?.engines ?? []).map((engine) => (
                <option key={engine.id} value={engine.id}>
                  {engine.name}
                </option>
              ))}
            </Select>

            <Select
              label={t("catalyticConverters.filters.fuelType")}
              value={fuelTypeId}
              onChange={(e) => {
                setFuelTypeId(e.target.value);
                setCurrentPage(0);
              }}
            >
              <option value="">{t("common.select")}</option>
              {(definitions?.fuelTypes ?? []).map((fuel) => (
                <option key={fuel.id} value={fuel.id}>
                  {fuel.name}
                </option>
              ))}
            </Select>

            <TextField
              label={t("catalyticConverters.filters.year")}
              type="number"
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                setCurrentPage(0);
              }}
            />

            <TextField
              label={t("catalyticConverters.filters.powerHp")}
              type="number"
              value={powerHp}
              onChange={(e) => {
                setPowerHp(e.target.value);
                setCurrentPage(0);
              }}
            />
          </div>

          <div className={styles.filtersActions}>
            {hasActiveFilters && (
              <Button
                variant="secondary"
                size="small"
                onClick={handleResetFilters}
              >
                <RotateCcw size={14} />
                {t("common.reset")}
              </Button>
            )}
          </div>
        </div>

        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <h3 className={styles.tableTitle}>
              {t("catalyticConverters.list")}
            </h3>
          </div>

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
    </>
  );
};
