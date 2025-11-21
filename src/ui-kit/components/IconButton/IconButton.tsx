import React from "react";
import styles from "./IconButton.module.css";

export type IconButtonVariant =
  | "primary"
  | "primary300"
  | "primary400"
  | "primary500"
  | "secondary"
  | "secondary300"
  | "secondary400"
  | "secondary500"
  | "disabled";
export type IconButtonSize = "small" | "medium" | "large";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  icon: React.ReactNode;
  ariaLabel: string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = "primary",
      size = "medium",
      icon,
      ariaLabel,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    const classNames = [
      styles.iconButton,
      styles[variant],
      styles[size],
      disabled ? styles.disabled : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        className={classNames}
        disabled={disabled || variant === "disabled"}
        aria-label={ariaLabel}
        {...props}
      >
        {icon}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
