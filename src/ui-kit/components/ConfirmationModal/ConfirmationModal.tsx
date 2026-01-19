import {
  useEffect,
  useId,
  useRef,
  type FC,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { X } from "lucide-react";
import styles from "./ConfirmationModal.module.css";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { useIsMobile } from "@/hooks/isMobile";

export interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title?: string;
  description?: ReactNode;

  confirmText?: string;
  cancelText?: string;

  onConfirm: () => void;
  onCancel?: () => void;

  confirmDisabled?: boolean;
  confirmLoading?: boolean;
  preventClose?: boolean;

  children?: ReactNode;
}

export const ConfirmationModal: FC<ConfirmationModalProps> = ({
  open,
  onOpenChange,
  title = "Confirm action",
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  confirmDisabled = false,
  confirmLoading = false,
  preventClose = false,
  children,
}) => {
  const { isMobile, mounted } = useIsMobile();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const descId = useId();

  useEffect(() => {
    if (!mounted) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [open, mounted]);

  const close = () => onOpenChange(false);

  const handleCancel = (e: SyntheticEvent) => {
    e.preventDefault();
    if (preventClose) return;
    onCancel?.();
    close();
  };

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (preventClose) return;

    // On mobile we usually want explicit buttons (like your Sheet)
    if (isMobile) return;

    if (e.target === e.currentTarget) {
      onCancel?.();
      close();
    }
  };

  const handleConfirm = () => {
    onConfirm();
    close();
  };

  const handleCancelClick = () => {
    onCancel?.();
    close();
  };

  if (!mounted) return null;

  return (
    <dialog
      ref={dialogRef}
      className={`${styles.modal} ${isMobile ? styles.mobile : ""}`}
      onCancel={handleCancel}
      onMouseDown={handleBackdropMouseDown}
      aria-labelledby={headingId}
      aria-describedby={description ? descId : undefined}
    >
      <div className={styles.card} role="document">
        <header className={styles.header}>
          <h3 className={styles.title} id={headingId}>
            {title}
          </h3>

          {!preventClose && (
            <IconButton
              variant="secondary500"
              ariaLabel="Close"
              onClick={handleCancelClick}
              icon={<X className="h-6 w-6" />}
            />
          )}
        </header>

        {(description || children) && (
          <div className={styles.body}>
            {description && (
              <p className={styles.description} id={descId}>
                {description}
              </p>
            )}
            {children}
          </div>
        )}

        <footer className={styles.footer}>
          <Button
            variant="secondary"
            onClick={handleCancelClick}
            disabled={confirmLoading}
          >
            {cancelText}
          </Button>

          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={confirmDisabled || confirmLoading}
          >
            {confirmLoading ? "Working..." : confirmText}
          </Button>
        </footer>
      </div>
    </dialog>
  );
};
