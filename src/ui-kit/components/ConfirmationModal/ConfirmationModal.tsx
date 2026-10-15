import {
  useEffect,
  useId,
  useRef,
  type FC,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import styles from "./ConfirmationModal.module.css";
import { Button, type ButtonVariant } from "../Button";
import { IconButton } from "../IconButton";
import { useIsMobile } from "@/hooks/isMobile";

export interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title?: ReactNode;
  description?: ReactNode;

  confirmText?: string;
  cancelText?: string;
  confirmIcon?: ReactNode;
  cancelIcon?: ReactNode;
  confirmVariant?: ButtonVariant;
  confirmClassName?: string;
  cancelClassName?: string;

  onConfirm: () => void;
  onCancel?: () => void;

  confirmDisabled?: boolean;
  confirmLoading?: boolean;
  preventClose?: boolean;
  className?: string;

  children?: ReactNode;
}

export const ConfirmationModal: FC<ConfirmationModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  cancelText,
  confirmIcon,
  cancelIcon,
  confirmVariant = "danger",
  confirmClassName = "",
  cancelClassName = "",
  onConfirm,
  onCancel,
  confirmDisabled = false,
  confirmLoading = false,
  preventClose = false,
  className = "",
  children,
}) => {
  const { t } = useTranslation();
  const { isMobile, mounted } = useIsMobile();

  const resolvedTitle = title ?? t("common.areYouSure");
  const resolvedConfirmText = confirmText ?? t("common.confirm");
  const resolvedCancelText = cancelText ?? t("common.cancel");

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
    if (!preventClose) close();
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
      <div className={`${styles.card} ${className}`} role="document">
        <header className={styles.header}>
          <h3 className={styles.title} id={headingId}>
            {resolvedTitle}
          </h3>

          {!preventClose && (
            <IconButton
              variant="secondary500"
              ariaLabel={t("common.close")}
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
            className={cancelClassName}
            onClick={handleCancelClick}
            disabled={confirmLoading}
          >
            {cancelIcon}
            {resolvedCancelText}
          </Button>

          <Button
            variant={confirmVariant}
            className={confirmClassName}
            onClick={handleConfirm}
            disabled={confirmDisabled || confirmLoading}
          >
            {!confirmLoading && confirmIcon}
            {confirmLoading ? t("common.loading") : resolvedConfirmText}
          </Button>
        </footer>
      </div>
    </dialog>
  );
};
