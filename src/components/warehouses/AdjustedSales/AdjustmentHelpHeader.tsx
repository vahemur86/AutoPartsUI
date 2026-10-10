import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Info, X } from "lucide-react";

import styles from "./AdjustedSales.module.css";

interface AdjustmentHelpHeaderProps {
  titleKey: string;
  descriptionKey: string;
}

export const AdjustmentHelpHeader = ({
  titleKey,
  descriptionKey,
}: AdjustmentHelpHeaderProps) => {
  const { t } = useTranslation();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [open, setOpen] = useState(false);
  const title = t(titleKey);

  const updatePosition = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const popoverWidth = Math.min(340, window.innerWidth - 24);
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - popoverWidth - 12));
    const estimatedHeight = 150;
    const top = rect.bottom + estimatedHeight + 12 <= window.innerHeight
      ? rect.bottom + 8
      : Math.max(12, rect.top - estimatedHeight - 8);
    setPosition({ top, left });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  return (
    <span className={styles.groupHeader}>
      <span>{title}</span>
      <button
        ref={buttonRef}
        type="button"
        className={styles.helpButton}
        aria-label={t("powderSales.adjustments.helper.open", { title })}
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          if (!open) updatePosition();
          setOpen((current) => !current);
        }}
      >
        <Info size={14} aria-hidden="true" />
      </button>
      {open &&
        createPortal(
          <div
            ref={popoverRef}
            className={styles.helpPopover}
            style={{ top: position.top, left: position.left }}
            role="dialog"
            aria-label={title}
          >
            <div className={styles.helpPopoverHeader}>
              <strong>{title}</strong>
              <button
                type="button"
                className={styles.helpCloseButton}
                onClick={() => setOpen(false)}
                aria-label={t("common.close")}
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>
            <p>{t(descriptionKey)}</p>
          </div>,
          document.body,
        )}
    </span>
  );
};