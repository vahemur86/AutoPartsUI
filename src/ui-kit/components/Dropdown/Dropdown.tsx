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

export interface AnchorRect {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

export interface DropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorRef?: RefObject<HTMLElement | null>;
  /** When opening from inside tables/cells, pass rect captured at click to avoid wrong position (ref can be stale after re-render) */
  anchorRect?: AnchorRect | null;
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
  anchorRect: anchorRectProp,
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

  // Desktop Positioning Logic: use anchorRect (captured at click) when provided, else anchorRef
  useEffect(() => {
    const rectFromRef =
      anchorRef?.current &&
      (() => {
        const r = anchorRef.current!.getBoundingClientRect();
        return {
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height,
          right: r.right,
          bottom: r.bottom,
        };
      })();
    const anchorRect = anchorRectProp ?? rectFromRef;

    if (!mounted || isMobile || !open || !anchorRect) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const rect = anchorRectProp ?? (anchorRef?.current && (() => {
        const r = anchorRef.current!.getBoundingClientRect();
        return { top: r.top, left: r.left, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
      })());
      if (!rect) return;
      const anchorRectCurrent = rect;
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
            ? anchorRectCurrent.right + sideOffset
            : anchorRectCurrent.left - contentWidth - sideOffset;
        if (align === "center")
          left = anchorRectCurrent.left + (anchorRectCurrent.width - contentWidth) / 2;
        else if (align === "end") left = anchorRectCurrent.right - contentWidth;
      } else {
        if (align === "start") left = anchorRectCurrent.left;
        else if (align === "center")
          left = anchorRectCurrent.left + (anchorRectCurrent.width - contentWidth) / 2;
        else left = anchorRectCurrent.right - contentWidth;
      }

      // Horizontal bounds
      left = Math.max(16, Math.min(left, viewportWidth - contentWidth - 16));

      // Vertical Positioning
      if (side === "bottom") top = anchorRectCurrent.bottom + sideOffset;
      else if (side === "top")
        top = anchorRectCurrent.top - estimatedContentHeight - sideOffset;
      else {
        if (align === "start") top = anchorRectCurrent.top;
        else if (align === "center")
          top =
            anchorRectCurrent.top + (anchorRectCurrent.height - estimatedContentHeight) / 2;
        else top = anchorRectCurrent.bottom - estimatedContentHeight;
      }

      // Vertical bounds
      top = Math.max(
        16,
        Math.min(top, viewportHeight - estimatedContentHeight - 16)
      );

      setPosition({ top, left });
    };

    updatePosition();
    // When using anchorRectProp, skip scroll/resize updates (rect is fixed at click time)
    if (!anchorRectProp) {
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
      };
    }
  }, [mounted, isMobile, open, anchorRef, anchorRectProp, align, side, sideOffset]);

  // Click Outside / Escape Logic for Desktop only
  useEffect(() => {
    if (!mounted || isMobile || !open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (!contentRef.current || contentRef.current.contains(e.target as Node))
        return;
      if (anchorRectProp) {
        onOpenChange(false);
        return;
      }
      if (anchorRef?.current && !anchorRef.current.contains(e.target as Node)) {
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
  }, [mounted, isMobile, open, onOpenChange, anchorRef, anchorRectProp]);

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
