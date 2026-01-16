import {
  useEffect,
  useRef,
  type FC,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import styles from "./Dropdown.module.css";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

/**
 * A lightweight Sheet using the native HTML Dialog element.
 * Provides built-in focus trapping and accessibility.
 */
export const Sheet: FC<SheetProps> = ({ open, onOpenChange, children }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [open]);

  // Handles the 'Escape' key automatically provided by the browser
  const handleCancel = (e: SyntheticEvent) => {
    e.preventDefault();
    onOpenChange(false);
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.nativeSheet}
      onCancel={handleCancel}
    >
      <div className={styles.sheetContent}>{children}</div>
    </dialog>
  );
};
