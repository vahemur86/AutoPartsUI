import {
  useState,
  useRef,
  useEffect,
  type ReactNode,
  type FC,
  useCallback,
} from "react";
import { createPortal } from "react-dom";

// styles
import styles from "./Tooltip.module.css";

export interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  className?: string;
  disabled?: boolean;
}

export const Tooltip: FC<TooltipProps> = ({
  children,
  content,
  className = "",
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX,
      });
    }
  }, []);

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    }
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isVisible, updatePosition]);

  if (disabled) return <>{children}</>;

  return (
    <div
      ref={triggerRef}
      className={`${styles.tooltipTrigger} ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible &&
        createPortal(
          <div
            className={styles.tooltipContent}
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
          >
            {content}
            <div className={styles.arrow} />
          </div>,
          document.body,
        )}
    </div>
  );
};
