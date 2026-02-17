import {
  useEffect,
  useId,
  useRef,
  type FC,
  type ReactNode,
  type SyntheticEvent,
} from "react";

// ui-kit
import { IconButton } from "../IconButton";

// icons
import { X } from "lucide-react";

// hooks
import { useIsMobile } from "@/hooks/isMobile";

// styles
import styles from "./ConfirmationModal.module.css";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  preventClose?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}

export const Modal: FC<ModalProps> = ({
  open,
  onOpenChange,
  title,
  preventClose = false,
  children,
  footer,
  width = "520px",
}) => {
  const { isMobile, mounted } = useIsMobile();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();

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

  const handleCancel = (e: SyntheticEvent) => {
    e.preventDefault();
    if (!preventClose) onOpenChange(false);
  };

  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (!preventClose && !isMobile && e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

  if (!mounted) return null;

  return (
    <dialog
      ref={dialogRef}
      className={`${styles.modal} ${isMobile ? styles.mobile : ""}`}
      onCancel={handleCancel}
      onMouseDown={handleBackdropMouseDown}
      aria-labelledby={title ? headingId : undefined}
    >
      <div
        className={styles.card}
        style={{ width: isMobile ? "100vw" : width }}
        role="document"
      >
        <header className={styles.header}>
          <h3 className={styles.title} id={headingId}>
            {title}
          </h3>
          {!preventClose && (
            <IconButton
              variant="secondary500"
              ariaLabel="Close"
              onClick={() => onOpenChange(false)}
              icon={<X className="h-6 w-6" />}
            />
          )}
        </header>

        <div className={styles.body}>{children}</div>

        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </dialog>
  );
};
