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
import { Plus } from "lucide-react";

// components
import {
  AddVehicleDropdown,
  type VehicleForm,
} from "./vehicleActions/AddVehicleDropdown";
import { BucketsDropdown } from "./vehicleActions/BucketsDropdown";

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
import type { Vehicle } from "@/types/settings";

// styles
import styles from "../VehicleManagement.module.css";

export const Vehicles: FC = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { vehicles, isLoading: isTableLoading } = useAppSelector(
    (state) => state.vehicles,
  );

  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
  const [isBucketsDropdownOpen, setIsBucketsDropdownOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const [showActiveOnly, setShowActiveOnly] = useState(false);

  const addAnchorRef = useRef<HTMLElement | null>(null);
  const bucketsAnchorRef = useRef<HTMLElement | null>(null);
  const addButtonDesktopWrapperRef = useRef<HTMLDivElement>(null);
  const addButtonMobileWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchVehicles(showActiveOnly));
  }, [dispatch, showActiveOnly]);

  const openAddDropdown = useCallback((isMobile: boolean) => {
    const anchorEl = isMobile
      ? addButtonMobileWrapperRef.current
      : addButtonDesktopWrapperRef.current;

    if (!anchorEl) return;

    addAnchorRef.current = anchorEl;
    setIsVehicleDropdownOpen(true);
  }, []);

  const handleCloseAddDropdown = useCallback(() => {
    setIsVehicleDropdownOpen(false);
    addAnchorRef.current = null;
  }, []);

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
    bucketsAnchorRef.current = null;
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
          }),
        ).unwrap();

        // Refetch respecting current filter state
        await dispatch(fetchVehicles(showActiveOnly)).unwrap();
        handleCloseAddDropdown();
        toast.success(t("vehicles.success.vehicleCreated"));
      } catch (error) {
        console.error("Failed to add vehicle:", error);
        toast.error(
          typeof error === "string"
            ? error
            : getErrorMessage(error, t("vehicles.vehicles.addVehicle")),
        );
      } finally {
        setIsMutating(false);
      }
    },
    [dispatch, handleCloseAddDropdown, showActiveOnly, t],
  );

  const handleSaveBuckets = useCallback(
    async (id: string, ids: number[]) => {
      try {
        setIsMutating(true);
        await dispatch(
          editVehicleBuckets({ vehicleId: id, bucketIds: ids }),
        ).unwrap();

        toast.success(t("catalystBuckets.success.bucketsUpdated"));
        handleCloseBucketsDropdown();

        dispatch(fetchVehicles(showActiveOnly));
      } catch (error) {
        toast.error(
          getErrorMessage(error, t("catalystBuckets.error.failedToUpdate")),
        );
      } finally {
        setIsMutating(false);
      }
    },
    [dispatch, handleCloseBucketsDropdown, showActiveOnly, t],
  );

  const columns = useMemo(
    () =>
      getVehicleColumns({
        onViewBuckets: (vehicle, e) => handleOpenBuckets(vehicle, e),
        onCalculatePrice: (vehicle) => {
          console.log("Calculate Price for:", vehicle);
        },
      }),
    [handleOpenBuckets],
  );

  return (
    <div className={styles.vehiclesWrapper}>
      <div className={styles.vehiclesHeader}>
        <div className={styles.switchContainer}>
          <Switch
            checked={showActiveOnly}
            onCheckedChange={setShowActiveOnly}
            label={t("vehicles.vehicles.actions.withBuckets")}
          />
        </div>

        <div
          ref={addButtonDesktopWrapperRef}
          className={styles.addVehicleButtonWrapper}
        >
          <IconButton
            size="small"
            variant="primary"
            icon={<Plus size={12} color="#0e0f11" />}
            ariaLabel={t("vehicles.ariaLabels.addNewVehicle")}
            className={styles.plusButton}
            onClick={() => openAddDropdown(false)}
          />
          <span className={styles.addButtonText}>
            {t("vehicles.vehicles.addVehicle")}
          </span>
        </div>
      </div>

      <div className={styles.addVehicleButtonMobile}>
        <div className={styles.mobileHeaderActions}>
          <Switch
            checked={showActiveOnly}
            onCheckedChange={setShowActiveOnly}
            label={t("vehicles.vehicles.actions.withBuckets")}
          />
          <div className={styles.verticalDivider} />
          <div
            ref={addButtonMobileWrapperRef}
            className={styles.addVehicleButtonWrapperMobile}
            onClick={() => openAddDropdown(true)}
          >
            <IconButton
              size="small"
              variant="primary"
              icon={<Plus size={12} />}
              ariaLabel={t("vehicles.ariaLabels.addNewVehicle")}
            />
            <span className={styles.addButtonText}>
              {t("vehicles.vehicles.addVehicle")}
            </span>
          </div>
        </div>
      </div>

      <AddVehicleDropdown
        open={isVehicleDropdownOpen}
        anchorRef={addAnchorRef}
        isLoading={isMutating}
        onOpenChange={(open) => {
          if (!open) handleCloseAddDropdown();
        }}
        onSave={handleAddVehicle}
      />

      <BucketsDropdown
        open={isBucketsDropdownOpen}
        anchorRef={bucketsAnchorRef}
        vehicle={selectedVehicle}
        onOpenChange={(open) => {
          if (!open) handleCloseBucketsDropdown();
        }}
        isLoading={isMutating || isTableLoading}
        onSave={handleSaveBuckets}
      />

      <div className={styles.tableWrapper}>
        <DataTable data={vehicles} columns={columns} pageSize={7} />
      </div>
    </div>
  );
};
