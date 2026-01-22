import {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
  type FC,
} from "react";
import { useTranslation } from "react-i18next";

// ui-kit
import { ConfirmationModal, DataTable, IconButton } from "@/ui-kit";

// icons
import { Plus } from "lucide-react";

// components
import { TaskDropdown, type TaskForm } from "./taskActions/TaskDropdown";

// columns
import { getTaskColumns } from "./columns";

// stores
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addTask,
  fetchTasks,
  editTask,
  removeTask,
} from "@/store/slices/tasksSlice";

// types
import type { Task } from "@/types/settings";

// styles
import styles from "../VehicleManagement.module.css";

interface TasksProps {
  withEdit?: boolean;
  withDelete?: boolean;
}

export const Tasks: FC<TasksProps> = ({
  withEdit = true,
  withDelete = true,
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { tasks } = useAppSelector((state) => state.tasks);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const anchorRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  const handleOpenAdd = useCallback((e: React.MouseEvent<HTMLElement>) => {
    anchorRef.current = e.currentTarget;
    setActiveTask(null);
    setIsDropdownOpen(true);
  }, []);

  const handleOpenEdit = useCallback(
    (task: Task, e: React.MouseEvent<HTMLElement>) => {
      anchorRef.current = e.currentTarget;
      setActiveTask(task);
      setIsDropdownOpen(true);
    },
    [],
  );

  const handleCloseDropdown = useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  const handleSaveTask = useCallback(
    async (data: TaskForm) => {
      try {
        setIsMutating(true);
        if (activeTask) {
          await dispatch(
            editTask({
              id: activeTask.id,
              isActive: activeTask.isActive ?? false,
              ...data,
            }),
          ).unwrap();
        } else {
          await dispatch(addTask(data)).unwrap();
        }

        await dispatch(fetchTasks()).unwrap();
        handleCloseDropdown();
      } catch (error) {
        console.error("Failed to save task:", error);
      } finally {
        setIsMutating(false);
      }
    },
    [dispatch, activeTask, handleCloseDropdown],
  );

  const handleDeleteTask = useCallback(
    async (task: Task) => {
      try {
        setIsMutating(true);
        await dispatch(removeTask(task.id)).unwrap();
        await dispatch(fetchTasks()).unwrap();
        setDeletingTask(null);
      } catch (error) {
        console.error("Failed to delete task:", error);
      } finally {
        setIsMutating(false);
      }
    },
    [dispatch],
  );

  const columns = useMemo(
    () =>
      getTaskColumns({
        withEdit,
        withDelete,
        onEdit: handleOpenEdit,
        onDelete: (task) => setDeletingTask(task),
      }),
    [withEdit, withDelete, handleOpenEdit],
  );

  return (
    <div className={styles.tasksWrapper}>
      <div className={styles.tasksHeader}>
        <div className={styles.addTaskButtonWrapper}>
          <IconButton
            size="small"
            variant="primary"
            icon={<Plus size={12} color="#0e0f11" />}
            ariaLabel={t("vehicles.ariaLabels.addNewTask")}
            className={styles.plusButton}
            onClick={handleOpenAdd}
          />
          <span className={styles.addButtonText}>
            {t("vehicles.tasks.addTask")}
          </span>
        </div>
      </div>

      <div className={styles.addTaskButtonMobile}>
        <div className={styles.addTaskButtonWrapperMobile}>
          <IconButton
            size="small"
            variant="primary"
            icon={<Plus size={12} />}
            ariaLabel={t("vehicles.ariaLabels.addNewTask")}
            onClick={handleOpenAdd}
          />
          <span className={styles.addButtonText}>
            {t("vehicles.tasks.addTask")}
          </span>
        </div>
      </div>

      <TaskDropdown
        open={isDropdownOpen}
        anchorRef={anchorRef}
        initialData={activeTask}
        isLoading={isMutating}
        onOpenChange={(open) => {
          if (!open) handleCloseDropdown();
        }}
        onSave={handleSaveTask}
      />

      {!!deletingTask && (
        <ConfirmationModal
          open={!!deletingTask}
          onOpenChange={(open) => !open && setDeletingTask(null)}
          title={t("vehicles.tasks.confirmation.deleteTitle")}
          description={t("vehicles.tasks.confirmation.deleteDescription", {
            code: deletingTask?.code,
          })}
          confirmText={
            isMutating
              ? t("vehicles.tasks.confirmation.deleting")
              : t("vehicles.tasks.confirmation.delete")
          }
          cancelText={t("common.cancel")}
          onConfirm={() => deletingTask && handleDeleteTask(deletingTask)}
          onCancel={() => setDeletingTask(null)}
        />
      )}

      <div className={styles.tableWrapper}>
        <DataTable data={tasks} columns={columns} pageSize={7} />
      </div>
    </div>
  );
};
