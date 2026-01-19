import { useMemo, useState, useRef, useCallback, type FC } from "react";
import { DataTable, IconButton } from "@/ui-kit";
import { Plus } from "lucide-react";
import { AddVehicleDropdown } from "./vehicleActions/AddVehicleDropdown";
import { vehicles } from "./mockData";
import { getVehicleColumns } from "./columns";
import type { Vehicle } from "./types";
import styles from "../VehicleManagement.module.css";

interface VehiclesProps {
  withEdit?: boolean;
  withDelete?: boolean;
}

export const Vehicles: FC<VehiclesProps> = ({
  withEdit = true,
  withDelete = true,
}) => {
  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);

  const addAnchorRef = useRef<HTMLElement | null>(null);
  const addButtonDesktopWrapperRef = useRef<HTMLDivElement>(null);
  const addButtonMobileWrapperRef = useRef<HTMLDivElement>(null);

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
    async (data: unknown) => {
      console.log("Add vehicle:", data);
      handleCloseAddDropdown();
    },
    [handleCloseAddDropdown]
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
            ariaLabel="Add new vehicle"
            className={styles.plusButton}
            onClick={() => openAddDropdown(false)}
          />
          <span className={styles.addButtonText}>Add vehicle</span>
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
            ariaLabel="Add new vehicle"
            onClick={() => openAddDropdown(true)}
          />
          <span className={styles.addButtonText}>Add vehicle</span>
        </div>
      </div>

      <AddVehicleDropdown
        open={isVehicleDropdownOpen}
        anchorRef={addAnchorRef}
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
