import {
  useMemo,
  useState,
  useRef,
  useCallback,
  type FC,
  type RefObject,
} from "react";
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
  const addButtonDesktopRef = useRef<HTMLButtonElement>(null);
  const addButtonDesktopWrapperRef = useRef<HTMLDivElement>(null);
  const addButtonMobileRef = useRef<HTMLButtonElement>(null);
  const addButtonMobileWrapperRef = useRef<HTMLDivElement>(null);
  const addButtonAnchorRef = useRef<HTMLElement | null>(null);

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

  const handleAddButtonClick = useCallback((isMobile: boolean = false) => {
    const wrapperRef = isMobile
      ? addButtonMobileWrapperRef
      : addButtonDesktopWrapperRef;
    const buttonRef = isMobile ? addButtonMobileRef : addButtonDesktopRef;
    const anchorElement = wrapperRef.current || buttonRef.current;

    if (anchorElement) {
      addButtonAnchorRef.current = anchorElement;
      setIsAddingVehicle(true);
    }
  }, []);

  const handleCloseAddDropdown = useCallback(() => {
    setIsAddingVehicle(false);
  }, []);

  const handleAddVehicle = useCallback((data: unknown) => {
    console.log("Add vehicle:", data);
  }, []);

  const handleEdit = () => {
    console.log("Edit Clicked");
  };

  const handleDelete = () => {
    console.log("Delete Clicked");
  };

  const getAddButtonAnchorRef = (): RefObject<HTMLElement> | undefined => {
    if (addButtonAnchorRef.current) {
      return { current: addButtonAnchorRef.current } as RefObject<HTMLElement>;
    }
    return undefined;
  };

  return (
    <>
      <div className={styles.addNewButton}>
        <div
          ref={addButtonDesktopWrapperRef}
          className={styles.addButtonWrapper}
        >
          <IconButton
            ref={addButtonDesktopRef}
            variant="primary"
            size="small"
            icon={<Plus size={12} color="#0e0f11" />}
            ariaLabel="Add New"
            onClick={() => handleAddButtonClick(false)}
          />
          <span className={styles.addButtonText}>Add vehicle</span>
        </div>
      </div>

      <AddVehicleDropdown
        open={isAddingVehicle}
        anchorRef={getAddButtonAnchorRef()}
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
          </TableBody>
        </Table>
      </div>

      <div className={styles.addButtonMobile}>
        <div
          ref={addButtonMobileWrapperRef}
          className={styles.addButtonWrapper}
        >
          <IconButton
            ref={addButtonMobileRef}
            variant="primary"
            size="small"
            icon={<Plus size={12} color="#0e0f11" />}
            ariaLabel="Add New"
            onClick={() => handleAddButtonClick(true)}
          />
          <span className={styles.addButtonText}>Add vehicle</span>
        </div>
      </div>
    </>
  );
};
