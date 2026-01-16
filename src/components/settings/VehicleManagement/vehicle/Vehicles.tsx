import { useMemo, useState, useRef, useCallback, type FC } from "react";
import {
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/ui-kit";
import styles from "../VehicleManagement.module.css";
import { Plus } from "lucide-react";
import { AddVehicleDropdown } from "./vehicleActions/AddVehicleDropdown";

interface VehiclesProps {
  withEdit?: boolean;
  withDelete?: boolean;
}

export const Vehicles: FC<VehiclesProps> = ({
  withEdit = true,
  withDelete = true,
}) => {
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);

  const addAnchorRef = useRef<HTMLElement | null>(null);

  const addButtonDesktopWrapperRef = useRef<HTMLDivElement>(null);
  const addButtonMobileWrapperRef = useRef<HTMLDivElement>(null);

  const tasksCells = useMemo(
    () => [
      { id: "brand", label: "Brand" },
      { id: "model", label: "Model" },
      { id: "year", label: "Year" },
      { id: "engine", label: "Engine" },
      { id: "fuel-type", label: "Fuel Type" },
      { id: "status", label: "Status" },
      { id: "actions", label: "Actions" },
    ],
    []
  );

  const openAddDropdown = useCallback((isMobile: boolean) => {
    const anchorEl = isMobile
      ? addButtonMobileWrapperRef.current
      : addButtonDesktopWrapperRef.current;

    if (!anchorEl) return;

    addAnchorRef.current = anchorEl;
    setIsAddingVehicle(true);
  }, []);

  const handleCloseAddDropdown = useCallback(() => {
    setIsAddingVehicle(false);
    addAnchorRef.current = null;
  }, []);

  const handleAddVehicle = useCallback(
    async (data: unknown) => {
      console.log("Add vehicle:", data);
      handleCloseAddDropdown();
    },
    [handleCloseAddDropdown]
  );

  const handleEdit = () => {
    console.log("Edit Clicked");
  };

  const handleDelete = () => {
    console.log("Delete Clicked");
  };

  return (
    <>
      <div className={styles.addNewButton}>
        <div
          ref={addButtonDesktopWrapperRef}
          className={styles.addButtonWrapper}
        >
          <IconButton
            variant="primary"
            size="small"
            icon={<Plus size={12} color="#0e0f11" />}
            ariaLabel="Add New"
            className={styles.plusButton}
            onClick={() => openAddDropdown(false)}
          />
          <span className={styles.addButtonText}>Add vehicle</span>
        </div>
      </div>

      <AddVehicleDropdown
        open={isAddingVehicle}
        anchorRef={addAnchorRef}
        onOpenChange={(open) => {
          if (!open) handleCloseAddDropdown();
        }}
        onSave={handleAddVehicle}
      />

      <div className={styles.tableContainer}>
        <Table>
          <TableHeader>
            <TableRow>
              {tasksCells.map(({ id, label }) => (
                <TableCell key={id} asHeader>
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            <TableRow>
              <TableCell>Toyota</TableCell>
              <TableCell>Camry</TableCell>
              <TableCell>2018</TableCell>
              <TableCell>2.5L L4</TableCell>
              <TableCell>Gasoline</TableCell>
              <TableCell>Active</TableCell>

              <TableCell>
                <div className={styles.actionButtonsCell}>
                  {withEdit && (
                    <Button
                      variant="primary"
                      size="small"
                      aria-label="Edit vehicle"
                      onClick={handleEdit}
                    >
                      Edit
                    </Button>
                  )}

                  {withDelete && (
                    <Button
                      variant="secondary"
                      size="small"
                      aria-label="Delete vehicle"
                      onClick={handleDelete}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className={styles.addButtonMobile}>
        <div
          ref={addButtonMobileWrapperRef}
          className={styles.addButtonWrapperMobile}
        >
          <IconButton
            variant="primary"
            size="small"
            icon={<Plus size={12} />}
            ariaLabel="Add New"
            onClick={() => openAddDropdown(true)}
          />
          <span className={styles.addButtonText}>Add vehicle</span>
        </div>
      </div>
    </>
  );
};
