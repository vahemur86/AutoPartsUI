import { useEffect, useMemo, useState, type RefObject } from "react";
import {
  Button,
  Dropdown,
  MultiSelect,
  Textarea,
  TextField,
  type MultiSelectOption,
} from "@/ui-kit";
import styles from "./AddTaskDropdown.module.css";

export interface TaskForm {
  name: string;
  type: string;
  linkedVehicles: string[];
  laborCost: number;
  notes?: string;
}

interface AddTaskDropdownProps {
  open: boolean;
  anchorRef?: RefObject<HTMLElement | null>;
  onOpenChange: (open: boolean) => void;
  onSave: (data: TaskForm) => void;
}

export const AddTaskDropdown = ({
  open,
  anchorRef,
  onOpenChange,
  onSave,
}: AddTaskDropdownProps) => {
  const vehicleOptions: MultiSelectOption[] = useMemo(
    () => [
      { value: "vehicle-1", label: "Vehicle 1" },
      { value: "vehicle-2", label: "Vehicle 2" },
      { value: "vehicle-3", label: "Vehicle 3" },
    ],
    []
  );

  const taskFormFields = useMemo(
    () => ({
      name: { label: "Task / Service", placeholder: "Enter task name..." },
      type: { label: "Type", placeholder: "Select task type..." },
      linkedVehicles: {
        label: "Linked Vehicles",
        placeholder: "Select vehicles...",
      },
      laborCost: { label: "Labor Cost (USD)", placeholder: "0.00" },
      notes: { label: "Notes (optional)", placeholder: "Optional notes..." },
    }),
    []
  );

  const [taskFormValues, setTaskFormValues] = useState<TaskForm>({
    name: "",
    type: "",
    linkedVehicles: [],
    laborCost: 0,
    notes: "",
  });

  const [hasTriedSave, setHasTriedSave] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTaskFormValues({
      name: "",
      type: "",
      linkedVehicles: [],
      laborCost: 0,
      notes: "",
    });
    setHasTriedSave(false);
  }, [open]);

  const isValid =
    taskFormValues.name.trim().length > 0 &&
    taskFormValues.type.trim().length > 0 &&
    taskFormValues.linkedVehicles.length > 0 &&
    Number.isFinite(taskFormValues.laborCost) &&
    taskFormValues.laborCost > 0;

  const handleClose = () => onOpenChange(false);

  const handleSaveClick = () => {
    setHasTriedSave(true);
    if (!isValid) return;

    onSave({
      ...taskFormValues,
      name: taskFormValues.name.trim(),
      type: taskFormValues.type.trim(),
      notes: taskFormValues.notes?.trim() || "",
    });

    onOpenChange(false);
  };

  return (
    <Dropdown
      open={open}
      onOpenChange={onOpenChange}
      anchorRef={anchorRef}
      align="start"
      side="left"
      title="Add Task"
    >
      <div className={styles.header}>
        <span className={styles.title}>Add Task</span>
      </div>

      <div className={styles.content}>
        <div className={styles.grid}>
          <div className={styles.fullRow}>
            <TextField
              label={taskFormFields.name.label}
              placeholder={taskFormFields.name.placeholder}
              value={taskFormValues.name}
              onChange={(e) =>
                setTaskFormValues((p) => ({ ...p, name: e.target.value }))
              }
              error={hasTriedSave && !taskFormValues.name.trim()}
            />
          </div>

          <div className={styles.colLeft}>
            <TextField
              label={taskFormFields.type.label}
              placeholder={taskFormFields.type.placeholder}
              value={taskFormValues.type}
              onChange={(e) =>
                setTaskFormValues((p) => ({ ...p, type: e.target.value }))
              }
              error={hasTriedSave && !taskFormValues.type.trim()}
            />
          </div>

          <div className={styles.colRight}>
            <MultiSelect
              label={taskFormFields.linkedVehicles.label}
              placeholder={taskFormFields.linkedVehicles.placeholder}
              options={vehicleOptions}
              value={taskFormValues.linkedVehicles}
              onChange={(vals) =>
                setTaskFormValues((p) => ({ ...p, linkedVehicles: vals }))
              }
              error={hasTriedSave && taskFormValues.linkedVehicles.length === 0}
            />
          </div>

          <div className={styles.colLeft}>
            <TextField
              label={taskFormFields.laborCost.label}
              placeholder={taskFormFields.laborCost.placeholder}
              value={String(taskFormValues.laborCost || "")}
              onChange={(e) => {
                const parsed = Number(e.target.value);
                setTaskFormValues((p) => ({
                  ...p,
                  laborCost: Number.isFinite(parsed) ? parsed : 0,
                }));
              }}
              error={
                hasTriedSave &&
                (!taskFormValues.laborCost || taskFormValues.laborCost <= 0)
              }
            />
          </div>
          <div className={styles.colRight} />

          <div className={styles.fullRow}>
            <Textarea
              resizable={false}
              label={taskFormFields.notes.label}
              placeholder={taskFormFields.notes.placeholder}
              value={taskFormValues.notes ?? ""}
              onChange={(e) =>
                setTaskFormValues((p) => ({ ...p, notes: e.target.value }))
              }
              className={styles.notesField}
            />
          </div>
        </div>

        <div className={styles.actionswithoutDelete}>
          <div className={styles.primaryActions}>
            <Button variant="secondary" size="medium" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="primary" size="medium" onClick={handleSaveClick}>
              Save
            </Button>
          </div>
        </div>
      </div>
    </Dropdown>
  );
};
