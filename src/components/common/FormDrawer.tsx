import { useEffect, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import styles from "./FormDrawer.module.css";

interface FormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eyebrow: string;
  title: string;
  titleId: string;
  closeLabel: string;
  icon: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}

export const FormDrawer = ({
  open,
  onOpenChange,
  eyebrow,
  title,
  titleId,
  closeLabel,
  icon,
  children,
  footer,
}: FormDrawerProps) => {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const handleBackdropMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onOpenChange(false);
  };

  return createPortal(
    <div className={styles.backdrop} onMouseDown={handleBackdropMouseDown}>
      <aside
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className={styles.header}>
          <div className={styles.icon} aria-hidden="true">{icon}</div>
          <div className={styles.headerCopy}>
            <span>{eyebrow}</span>
            <h2 id={titleId}>{title}</h2>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => onOpenChange(false)}
            aria-label={closeLabel}
            title={closeLabel}
          >
            <X size={18} />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
        <footer className={styles.footer}>{footer}</footer>
      </aside>
    </div>,
    document.body,
  );
};
