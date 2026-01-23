import {
  useMemo,
  useState,
  useRef,
  useCallback,
  useEffect,
  type FC,
} from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

// ui-kit
import { DataTable, IconButton, Switch } from "@/ui-kit";

// icons
import { Plus, Filter } from "lucide-react";

// components
import {
  AddVehicleDropdown,
  type VehicleForm,
} from "./vehicleActions/AddVehicleDropdown";
import { BucketsDropdown } from "./vehicleActions/BucketsDropdown";
import { FilterVehiclesDropdown } from "./vehicleActions/FilterVehiclesDropdown";

// columns
import { getVehicleColumns } from "./columns";

// utils
import { getErrorMessage } from "@/utils";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addVehicle,
  editVehicleBuckets,
  fetchVehicleBuckets,
  fetchVehicles,
} from "@/store/slices/vehiclesSlice";
import { fetchCatalystBuckets } from "@/store/slices/catalystBucketsSlice";

// types
import type { Vehicle, VehicleFilter } from "@/types/settings";

// styles
import styles from "../VehicleManagement.module.css";

export const Vehicles: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const isSuperAdmin = useMemo(() => {
    try {
      const storedData = localStorage.getItem("user_data");
      const userData = storedData ? JSON.parse(storedData) : null;
      return userData?.role === "SuperAdmin";
    } catch (error) {
      console.error("Error parsing user_data from localStorage", error);
      return false;
    }
  }, []);

  const { vehicles, isLoading: isTableLoading } = useAppSelector(
    (state) => state.vehicles,
  );

  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
  const [isBucketsDropdownOpen, setIsBucketsDropdownOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [activeFilters, setActiveFilters] = useState<VehicleFilter>({});

  const addAnchorRef = useRef<HTMLElement | null>(null);
  const bucketsAnchorRef = useRef<HTMLElement | null>(null);
  const filterAnchorRef = useRef<HTMLDivElement>(null);
  const addButtonDesktopWrapperRef = useRef<HTMLDivElement>(null);
  const addButtonMobileWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(
      fetchVehicles({
        filters: activeFilters,
        withBuckets: isSuperAdmin ? showActiveOnly : false,
      }),
    );
  }, [dispatch, showActiveOnly, isSuperAdmin, activeFilters]);

  const openAddDropdown = useCallback((isMobile: boolean) => {
    const anchorEl = isMobile
      ? addButtonMobileWrapperRef.current
      : addButtonDesktopWrapperRef.current;

    if (!anchorEl) return;
    addAnchorRef.current = anchorEl;
    setIsVehicleDropdownOpen(true);
  }, []);

  const handleApplyFilters = useCallback((filters: VehicleFilter) => {
    setActiveFilters(filters);
    setIsFilterDropdownOpen(false);
  }, []);

  const handleAddVehicle = useCallback(
    async (data: VehicleForm) => {
      try {
        setIsMutating(true);
        await dispatch(
          addVehicle({
            brandId: Number(data.brandId),
            modelId: Number(data.modelId),
            fuelTypeId: Number(data.fuelTypeId),
            engineId: Number(data.engineId),
            marketId: Number(data.marketId),
            horsePower: Number(data.horsePower),
            driveTypeId: Number(data.driveTypeId),
          }),
        ).unwrap();

        await dispatch(
          fetchVehicles({
            filters: activeFilters,
            withBuckets: isSuperAdmin ? showActiveOnly : false,
          }),
        ).unwrap();
        setIsVehicleDropdownOpen(false);
        toast.success(t("vehicles.success.vehicleCreated"));
      } catch (error) {
        toast.error(getErrorMessage(error, t("vehicles.vehicles.addVehicle")));
      } finally {
        setIsMutating(false);
      }
    },
    [dispatch, isSuperAdmin, showActiveOnly, activeFilters, t],
  );

  const handleOpenBuckets = useCallback(
    (vehicle: Vehicle, e: React.MouseEvent<HTMLElement>) => {
      setSelectedVehicle(vehicle);
      dispatch(fetchCatalystBuckets());
      dispatch(fetchVehicleBuckets(vehicle.id));
      bucketsAnchorRef.current = e.currentTarget;
      setIsBucketsDropdownOpen(true);
    },
    [dispatch],
  );

  const handleCloseBucketsDropdown = useCallback(() => {
    setIsBucketsDropdownOpen(false);
    setSelectedVehicle(null);
  }, []);

  const handleSaveBuckets = useCallback(
    async (id: string, ids: number[]) => {
      try {
        setIsMutating(true);
        await dispatch(
          editVehicleBuckets({ vehicleId: id, bucketIds: ids }),
        ).unwrap();
        toast.success(t("catalystBuckets.success.bucketsUpdated"));
        handleCloseBucketsDropdown();
        dispatch(
          fetchVehicles({
            filters: activeFilters,
            withBuckets: isSuperAdmin ? showActiveOnly : false,
          }),
        );
      } catch (error) {
        toast.error(
          getErrorMessage(error, t("catalystBuckets.error.failedToUpdate")),
        );
      } finally {
        setIsMutating(false);
      }
    },
    [
      dispatch,
      handleCloseBucketsDropdown,
      isSuperAdmin,
      showActiveOnly,
      activeFilters,
      t,
    ],
  );

  const columns = useMemo(
    () =>
      getVehicleColumns({
        isSuperAdmin,
        onViewBuckets: handleOpenBuckets,
        onCalculatePrice: (v) => console.log(v),
      }),
    [handleOpenBuckets, isSuperAdmin],
  );

  return (
    <div className={styles.vehiclesWrapper}>
      <div className={styles.vehiclesHeader}>
        <div className={styles.switchContainer}>
          {isSuperAdmin && (
            <Switch
              checked={showActiveOnly}
              onCheckedChange={setShowActiveOnly}
              label={t("vehicles.vehicles.actions.withBuckets")}
            />
          )}
        </div>

        <div className={styles.headerActionsDesktop}>
          <div
            ref={filterAnchorRef}
            className={styles.addVehicleButtonWrapper}
            onClick={() => setIsFilterDropdownOpen(true)}
            style={{ cursor: "pointer" }}
          >
            <IconButton
              size="small"
              variant="primary"
              icon={<Filter size={12} color="#0e0f11" />}
              ariaLabel={t("common.filters")}
            />
            <span className={styles.addButtonText}>{t("common.filters")}</span>
          </div>

          <div
            ref={addButtonDesktopWrapperRef}
            className={styles.addVehicleButtonWrapper}
            onClick={() => openAddDropdown(false)}
            style={{ cursor: "pointer" }}
          >
            <IconButton
              size="small"
              variant="primary"
              icon={<Plus size={12} color="#0e0f11" />}
              ariaLabel={t("vehicles.ariaLabels.addNewVehicle")}
            />
            <span className={styles.addButtonText}>
              {t("vehicles.vehicles.addVehicle")}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.addVehicleButtonMobile}>
        <div className={styles.mobileHeaderActions}>
          {isSuperAdmin && (
            <>
              <Switch
                checked={showActiveOnly}
                onCheckedChange={setShowActiveOnly}
                label={t("vehicles.vehicles.actions.withBuckets")}
              />
              <div className={styles.verticalDivider} />
            </>
          )}

          <div
            className={styles.addVehicleButtonWrapperMobile}
            onClick={() => setIsFilterDropdownOpen(true)}
          >
            <IconButton
              size="small"
              variant="primary"
              icon={<Filter size={12} color="#0e0f11" />}
              ariaLabel={t("common.filters")}
            />
            <span className={styles.addButtonText}>{t("common.filters")}</span>
          </div>

          <div
            ref={addButtonMobileWrapperRef}
            className={styles.addVehicleButtonWrapperMobile}
            onClick={() => openAddDropdown(true)}
          >
            <IconButton
              size="small"
              variant="primary"
              icon={<Plus size={12} color="#0e0f11" />}
              ariaLabel={t("vehicles.ariaLabels.addNewVehicle")}
            />
            <span className={styles.addButtonText}>
              {t("vehicles.vehicles.addVehicle")}
            </span>
          </div>
        </div>
      </div>

      <FilterVehiclesDropdown
        open={isFilterDropdownOpen}
        anchorRef={filterAnchorRef}
        onOpenChange={setIsFilterDropdownOpen}
        onSave={handleApplyFilters}
      />

      <AddVehicleDropdown
        open={isVehicleDropdownOpen}
        anchorRef={addAnchorRef}
        isLoading={isMutating}
        onOpenChange={setIsVehicleDropdownOpen}
        onSave={handleAddVehicle}
      />

      <BucketsDropdown
        open={isBucketsDropdownOpen}
        anchorRef={bucketsAnchorRef}
        vehicle={selectedVehicle}
        onOpenChange={handleCloseBucketsDropdown}
        isLoading={isMutating || isTableLoading}
        onSave={handleSaveBuckets}
      />

      <div className={styles.tableWrapper}>
        <DataTable data={vehicles} columns={columns} pageSize={7} />
      </div>
    </div>
  );
};
