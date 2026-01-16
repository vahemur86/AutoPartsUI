import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import styles from "./Tab.module.css";

export interface TabGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: "segmented";
}

export const TabGroup = forwardRef<HTMLDivElement, TabGroupProps>(
  ({ children, variant = "segmented", className = "", ...props }, ref) => {
    const groupClassName =
      variant === "segmented"
        ? `${styles.segmentedGroup} ${className}`
        : className;

    return (
      <div ref={ref} className={groupClassName} {...props}>
        {children}
      </div>
    );
  }
);

TabGroup.displayName = "TabGroup";
