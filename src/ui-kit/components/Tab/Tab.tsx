import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import styles from "./Tab.module.css";

export type TabVariant = "underline" | "leftBorder" | "vertical" | "segmented";

export interface TabProps extends HTMLAttributes<HTMLDivElement> {
  variant?: TabVariant;
  active?: boolean;
  text: string;
  icon?: ReactNode;
  showCheckmark?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export const Tab = forwardRef<HTMLDivElement, TabProps>(
  (
    {
      variant = "underline",
      active = false,
      text,
      icon,
      showCheckmark = false,
      onClick,
      disabled = false,
      className = "",
      ...props
    },
    ref
  ) => {
    const handleClick = () => {
      if (disabled) return;
      onClick?.();
    };

    const classNames = [
      styles.tab,
      styles[variant],
      active ? styles.active : "",
      disabled ? styles.disabled : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    // Checkmark icon - use filled CircleCheck for vertical variant, SVG for others
    const checkmarkIcon =
      variant === "vertical" ? (
        <svg
          className={styles.checkmark}
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="8" cy="8" r="8" fill="#ecf15e" />
          <path
            d="M11 6L7 10L5 8"
            stroke="#000000"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          className={styles.checkmark}
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 3L4.5 8.5L2 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    if (variant === "underline") {
      return (
        <div
          ref={ref}
          className={classNames}
          onClick={handleClick}
          role="tab"
          aria-selected={active}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !disabled) {
              e.preventDefault();
              onClick?.();
            }
          }}
          {...props}
        >
          <span className={styles.tabText}>{text}</span>
        </div>
      );
    }

    if (variant === "leftBorder") {
      return (
        <div
          ref={ref}
          className={classNames}
          onClick={handleClick}
          role="tab"
          aria-selected={active}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !disabled) {
              e.preventDefault();
              onClick?.();
            }
          }}
          {...props}
        >
          {showCheckmark && (
            <div className={styles.checkmarkWrapper}>{checkmarkIcon}</div>
          )}
          {icon && <div className={styles.iconWrapper}>{icon}</div>}
          <span className={styles.tabText}>{text}</span>
        </div>
      );
    }

    if (variant === "segmented") {
      return (
        <div
          ref={ref}
          className={classNames}
          onClick={handleClick}
          role="tab"
          aria-selected={active}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !disabled) {
              e.preventDefault();
              onClick?.();
            }
          }}
          {...props}
        >
          <span className={styles.tabText}>{text}</span>
        </div>
      );
    }

    // vertical variant
    return (
      <div
        ref={ref}
        className={classNames}
        onClick={handleClick}
        role="tab"
        aria-selected={active}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            e.preventDefault();
            onClick?.();
          }
        }}
        {...props}
      >
        {showCheckmark && (
          <div className={styles.checkmarkWrapper}>{checkmarkIcon}</div>
        )}
        {icon && <div className={styles.iconWrapper}>{icon}</div>}
        <span className={styles.tabText}>{text}</span>
      </div>
    );
  }
);

Tab.displayName = "Tab";
