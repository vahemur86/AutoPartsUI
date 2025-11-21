import React from "react";
import styles from "./Button.module.css";

export type ButtonVariant =
  | "primary"
  | "primary300"
  | "primary400"
  | "primary500"
  | "secondary"
  | "secondary300"
  | "secondary400"
  | "secondary500"
  | "disabled";
export type ButtonSize = "small" | "medium" | "large";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "medium",
      fullWidth = false,
      className = "",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const classNames = [
      styles.button,
      styles[variant],
      styles[size],
      fullWidth ? styles.fullWidth : "",
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
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
