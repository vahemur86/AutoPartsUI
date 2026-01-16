import { useState, useCallback, useRef, type FC } from "react";
import { IconButton } from "@/ui-kit";
import { Plus } from "lucide-react";
import { AddTaskDropdown, type TaskForm } from "./AddTaskDropdown";
import styles from "./VehicleManagement.module.css";

interface TasksProps {
  withEdit?: boolean;
  withDelete?: boolean;
}

export const Tasks: FC<TasksProps> = () => {
  const [isTaskDropdownOpen, setIsTaskDropdownOpen] = useState(false);

  const addAnchorRef = useRef<HTMLElement | null>(null);

  const addButtonDesktopWrapperRef = useRef<HTMLDivElement>(null);
  const addButtonMobileWrapperRef = useRef<HTMLDivElement>(null);

  const openAddDropdown = useCallback((isMobile: boolean) => {
    const anchorEl = isMobile
      ? addButtonMobileWrapperRef.current
      : addButtonDesktopWrapperRef.current;

    if (!anchorEl) return;

    addAnchorRef.current = anchorEl;
    setIsTaskDropdownOpen(true);
  }, []);

  const handleCloseAddDropdown = useCallback(() => {
    setIsTaskDropdownOpen(false);
    addAnchorRef.current = null;
  }, []);

  const handleAddTask = useCallback(
    async (data: TaskForm) => {
      console.log("Add task:", data);
      handleCloseAddDropdown();
    },
    [handleCloseAddDropdown]
  );

  return (
    <div className={styles.tasksWrapper}>
      {/* Desktop header */}
      <div className={styles.tasksHeader}>
        <div
          ref={addButtonDesktopWrapperRef}
          className={styles.addTaskButtonWrapper}
        >
          <IconButton
            size="small"
            variant="primary"
            icon={<Plus size={12} color="#0e0f11" />}
            ariaLabel="Add new task"
            className={styles.plusButton}
            onClick={() => openAddDropdown(false)}
          />
          <span className={styles.addButtonText}>Add Task</span>
        </div>
      </div>

      {/* Mobile big button (like ProjectLanguages.addButtonMobile) */}
      <div className={styles.addTaskButtonMobile}>
        <div
          ref={addButtonMobileWrapperRef}
          className={styles.addTaskButtonWrapperMobile}
        >
          <IconButton
            size="small"
            variant="primary"
            icon={<Plus size={12} />}
            ariaLabel="Add new task"
            onClick={() => openAddDropdown(true)}
          />
          <span className={styles.addButtonText}>Add Task</span>
        </div>
      </div>

      <AddTaskDropdown
        open={isTaskDropdownOpen}
        anchorRef={addAnchorRef}
        onOpenChange={(open) => {
          if (!open) handleCloseAddDropdown();
        }}
        onSave={handleAddTask}
      />
    </div>
  );
};
