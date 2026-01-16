import {
  useEffect,
  useState,
  useRef,
  type RefObject,
  type ReactNode,
} from "react";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/isMobile";
import { X } from "lucide-react";
import styles from "./Dropdown.module.css";

export interface DropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorRef?: RefObject<HTMLElement>;
  children: ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  title?: string;
  contentClassName?: string;
}

export const Dropdown = ({
  open,
  onOpenChange,
  anchorRef,
  children,
  align = "start",
  side = "right",
  sideOffset = 8,
  title = "Edit Language",
  contentClassName = "",
}: DropdownProps) => {
  const { isMobile, mounted } = useIsMobile();
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Calculate position for desktop dropdown
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
      // Use a reasonable estimate for content height, will be adjusted after render
      const estimatedContentHeight = 400;

      // Calculate horizontal position based on align and side
      if (side === "right" || side === "left") {
        if (side === "right") {
          left = anchorRect.right + sideOffset;
        } else {
          left = anchorRect.left - contentWidth - sideOffset;
        }

        // Adjust based on align
        if (align === "center") {
          left = anchorRect.left + (anchorRect.width - contentWidth) / 2;
        } else if (align === "end") {
          left = anchorRect.right - contentWidth;
        }

        // Ensure content stays within viewport
        if (left + contentWidth > viewportWidth) {
          left = viewportWidth - contentWidth - 16;
        }
        if (left < 16) {
          left = 16;
        }
      } else {
        // For top/bottom, align horizontally
        if (align === "start") {
          left = anchorRect.left;
        } else if (align === "center") {
          left = anchorRect.left + (anchorRect.width - contentWidth) / 2;
        } else {
          left = anchorRect.right - contentWidth;
        }

        // Ensure content stays within viewport
        if (left + contentWidth > viewportWidth) {
          left = viewportWidth - contentWidth - 16;
        }
        if (left < 16) {
          left = 16;
        }
      }

      // Calculate vertical position based on side
      if (side === "bottom") {
        top = anchorRect.bottom + sideOffset;
        // If content would overflow, flip to top
        if (top + estimatedContentHeight > viewportHeight - 16) {
          top = anchorRect.top - estimatedContentHeight - sideOffset;
          // If still doesn't fit, position at top of viewport
          if (top < 16) {
            top = 16;
          }
        }
      } else if (side === "top") {
        top = anchorRect.top - estimatedContentHeight - sideOffset;
        // If content would overflow, flip to bottom
        if (top < 16) {
          top = anchorRect.bottom + sideOffset;
          // If still doesn't fit, position at bottom of viewport
          if (top + estimatedContentHeight > viewportHeight - 16) {
            top = viewportHeight - estimatedContentHeight - 16;
          }
        }
      } else {
        // For left/right, align vertically
        if (align === "start") {
          top = anchorRect.top;
        } else if (align === "center") {
          top =
            anchorRect.top + (anchorRect.height - estimatedContentHeight) / 2;
        } else {
          top = anchorRect.bottom - estimatedContentHeight;
        }

        // Ensure content stays within viewport - prioritize showing top of content
        if (top + estimatedContentHeight > viewportHeight - 16) {
          // If content would overflow bottom, position so bottom edge is visible
          top = viewportHeight - estimatedContentHeight - 16;
          // But don't go above viewport top
          if (top < 16) {
            top = 16;
          }
        }
        if (top < 16) {
          top = 16;
        }
      }

      setPosition({ top, left });
    };

    // Initial position calculation
    updatePosition();

    // Update on scroll and resize
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [mounted, isMobile, open, anchorRef, align, side, sideOffset]);

  // Adjust position after content is rendered
  useEffect(() => {
    if (
      !mounted ||
      isMobile ||
      !open ||
      !position ||
      !contentRef.current ||
      !anchorRef?.current
    ) {
      return;
    }

    const adjustPosition = () => {
      if (!contentRef.current || !anchorRef.current) return;

      const contentRect = contentRef.current.getBoundingClientRect();
      const anchorRect = anchorRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let adjustedTop = position.top;
      let adjustedLeft = position.left;

      // Adjust vertical position to ensure content is visible
      if (position.top + contentRect.height > viewportHeight - 16) {
        // Content overflows bottom - adjust to fit
        adjustedTop = Math.max(16, viewportHeight - contentRect.height - 16);
      }
      if (adjustedTop < 16) {
        adjustedTop = 16;
      }

      // Adjust horizontal position if needed (for right side)
      if (
        side === "right" &&
        adjustedLeft + contentRect.width > viewportWidth - 16
      ) {
        // Try flipping to left side
        const leftSidePosition =
          anchorRect.left - contentRect.width - sideOffset;
        if (leftSidePosition >= 16) {
          adjustedLeft = leftSidePosition;
        } else {
          // Can't fit on left either, just keep it within viewport
          adjustedLeft = viewportWidth - contentRect.width - 16;
        }
      }

      if (adjustedTop !== position.top || adjustedLeft !== position.left) {
        setPosition({ top: adjustedTop, left: adjustedLeft });
      }
    };

    // Use requestAnimationFrame to ensure content is rendered
    const rafId = requestAnimationFrame(() => {
      adjustPosition();
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [mounted, isMobile, open, position, side, sideOffset, anchorRef]);

  // Handle click outside for desktop
  useEffect(() => {
    if (!mounted || isMobile || !open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node) &&
        anchorRef?.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onOpenChange(false);
      }
    };

    // Use capture phase to catch clicks before they bubble
    document.addEventListener("mousedown", handleClickOutside, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [mounted, isMobile, open, onOpenChange, anchorRef]);

  // Handle escape key for desktop
  useEffect(() => {
    if (!mounted || isMobile || !open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [mounted, isMobile, open, onOpenChange]);

  // Mobile: render Sheet (Radix)
  if (isMobile && mounted) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="!bg-[#2C2C2C] !border-white/40 !rounded-t-2xl !p-0 focus:outline-none !inset-x-0 !w-full !max-w-full [&>button]:!hidden"
          style={{
            zIndex: 99999,
            backgroundColor: "#2C2C2C",
            borderTopLeftRadius: "16px",
            borderTopRightRadius: "16px",
            borderBottomLeftRadius: "0",
            borderBottomRightRadius: "0",
            height: "100vh",
            maxHeight: "100vh",
            width: "100vw",
            maxWidth: "100vw",
            left: 0,
            right: 0,
            bottom: 0,
            top: "auto",
            padding: 0,
          }}
        >
          <SheetHeader className="border-b border-white/40 p-6 pb-4 flex flex-row items-center justify-between relative">
            <h3
              className="font-bold text-sm text-center flex-1 pr-8 m-0"
              style={{ color: "#ffffff" }}
            >
              {title}
            </h3>
            <button
              onClick={() => onOpenChange(false)}
              className="absolute right-6 top-6 bg-transparent border-none p-0 opacity-70 hover:opacity-100 focus:outline-none transition-opacity cursor-pointer"
              aria-label="Close"
            >
              <X className="h-5 w-5" style={{ color: "#ffffff" }} />
            </button>
          </SheetHeader>
          <div
            className="overflow-y-auto"
            style={{
              height: "calc(100vh - 73px)",
              maxHeight: "calc(100vh - 73px)",
              padding: "16px 24px 24px",
            }}
          >
            {children}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Don't render desktop version until mounted to avoid hydration issues
  if (!mounted || !open) return null;

  // Desktop: render custom dropdown (no Radix)
  if (!position) return null;

  return (
    <>
      {/* Overlay for desktop */}
      <div
        className="fixed inset-0 z-40"
        onClick={() => onOpenChange(false)}
        style={{ backgroundColor: "transparent" }}
      />
      {/* Custom dropdown content */}
      <div
        ref={contentRef}
        className={`${styles.dropdownContent} ${contentClassName}`}
        style={{
          position: "fixed",
          top: `${position.top}px`,
          left: `${position.left}px`,
          zIndex: 50,
          backgroundColor: "#2C2C2C",
          border: "1px solid rgba(255, 255, 255, 0.4)",
          borderRadius: "16px",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          padding: 0,
          width: "490px",
          maxWidth: "calc(100vw - 32px)",
          maxHeight: "calc(100vh - 32px)",
          overflowY: "auto",
          overflowX: "hidden",
          animation: "fadeIn 0.15s ease-out",
        }}
      >
        {children}
      </div>
    </>
  );
};

Dropdown.displayName = "Dropdown";
