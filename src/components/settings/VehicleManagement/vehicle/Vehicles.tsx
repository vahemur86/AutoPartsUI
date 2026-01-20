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
import { DataTable, IconButton } from "@/ui-kit";
import { Plus } from "lucide-react";
import {
  AddVehicleDropdown,
  type VehicleForm,
} from "./vehicleActions/AddVehicleDropdown";
import { getVehicleColumns } from "./columns";
import styles from "../VehicleManagement.module.css";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addVehicle, fetchVehicles } from "@/store/slices/vehiclesSlice";
import type { Vehicle } from "@/types/settings";
import { getErrorMessage } from "@/utils";

interface VehiclesProps {
  withEdit?: boolean;
  withDelete?: boolean;
}

export const Vehicles: FC<VehiclesProps> = ({
  withEdit = false,
  withDelete = false,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { vehicles } = useAppSelector((state) => state.vehicles);

  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const addAnchorRef = useRef<HTMLElement | null>(null);
  const addButtonDesktopWrapperRef = useRef<HTMLDivElement>(null);
  const addButtonMobileWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  const handleEdit = useCallback((vehicle: Vehicle) => {
    console.log("Edit Clicked for:", vehicle.id);
  }, []);

  const handleDelete = useCallback((vehicle: Vehicle) => {
    console.log("Delete Clicked for:", vehicle.id);
  }, []);

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
          })
        ).unwrap();
        await dispatch(fetchVehicles()).unwrap();
        handleCloseAddDropdown();
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
    [dispatch, handleCloseAddDropdown, t]
  );

  const columns = useMemo(
    () => getVehicleColumns(withEdit, withDelete, handleEdit, handleDelete),
    [withEdit, withDelete, handleEdit, handleDelete]
  );

  return (
    <div className={styles.vehiclesWrapper}>
      <div className={styles.vehiclesHeader}>
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
        <div
          ref={addButtonMobileWrapperRef}
          className={styles.addVehicleButtonWrapperMobile}
        >
          <IconButton
            size="small"
            variant="primary"
            icon={<Plus size={12} />}
            ariaLabel={t("vehicles.ariaLabels.addNewVehicle")}
            onClick={() => openAddDropdown(true)}
          />
          <span className={styles.addButtonText}>
            {t("vehicles.vehicles.addVehicle")}
          </span>
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

      <div className={styles.tableWrapper}>
        <DataTable
          enableSelection
          data={vehicles}
          columns={columns}
          pageSize={7}
        />
      </div>
    </div>
  );
};
