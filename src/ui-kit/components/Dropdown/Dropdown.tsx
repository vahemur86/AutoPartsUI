import {
  useEffect,
  useState,
  useRef,
  type RefObject,
  type ReactNode,
  type FC,
} from "react";
import { Sheet } from "./Sheet";
import { useIsMobile } from "@/hooks/isMobile";
import { X } from "lucide-react";
import styles from "./Dropdown.module.css";

export interface DropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  title?: string;
  contentClassName?: string;
}

export const Dropdown: FC<DropdownProps> = ({
  open,
  onOpenChange,
  anchorRef,
  children,
  align = "start",
  side = "right",
  sideOffset = 8,
  title = "Edit Language",
  contentClassName = "",
}) => {
  const { isMobile, mounted } = useIsMobile();
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Desktop Positioning Logic
  useEffect(() => {
    if (!mounted || isMobile || !open || !anchorRef?.current) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      if (!anchorRef.current) return;
      const anchorRect = anchorRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = 0;
      let left = 0;
      const contentWidth = 490;
      const estimatedContentHeight = 400;

      // Horizontal Positioning
      if (side === "right" || side === "left") {
        left =
          side === "right"
            ? anchorRect.right + sideOffset
            : anchorRect.left - contentWidth - sideOffset;
        if (align === "center")
          left = anchorRect.left + (anchorRect.width - contentWidth) / 2;
        else if (align === "end") left = anchorRect.right - contentWidth;
      } else {
        if (align === "start") left = anchorRect.left;
        else if (align === "center")
          left = anchorRect.left + (anchorRect.width - contentWidth) / 2;
        else left = anchorRect.right - contentWidth;
      }

      // Horizontal bounds
      left = Math.max(16, Math.min(left, viewportWidth - contentWidth - 16));

      // Vertical Positioning
      if (side === "bottom") top = anchorRect.bottom + sideOffset;
      else if (side === "top")
        top = anchorRect.top - estimatedContentHeight - sideOffset;
      else {
        if (align === "start") top = anchorRect.top;
        else if (align === "center")
          top =
            anchorRect.top + (anchorRect.height - estimatedContentHeight) / 2;
        else top = anchorRect.bottom - estimatedContentHeight;
      }

      // Vertical bounds
      top = Math.max(
        16,
        Math.min(top, viewportHeight - estimatedContentHeight - 16)
      );

      setPosition({ top, left });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [mounted, isMobile, open, anchorRef, align, side, sideOffset]);

  // Click Outside / Escape Logic for Desktop only
  useEffect(() => {
    if (!mounted || isMobile || !open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(e.target as Node) &&
        anchorRef?.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onOpenChange(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };

    document.addEventListener("mousedown", handleClickOutside, true);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [mounted, isMobile, open, onOpenChange, anchorRef]);

  if (!mounted) return null;

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <header className={styles.sheetHeader}>
          <h3 className={styles.sheetTitle}>{title}</h3>
          <button
            onClick={() => onOpenChange(false)}
            className={styles.closeButton}
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </header>
        <main className={styles.sheetBody}>{children}</main>
      </Sheet>
    );
  }

  if (!open || !position) return null;

  return (
    <>
      <div
        className={styles.desktopOverlay}
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={contentRef}
        className={`${styles.dropdownContent} ${contentClassName}`}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        {children}
      </div>
    </>
  );
};
