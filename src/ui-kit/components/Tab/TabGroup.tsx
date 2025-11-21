import React from "react";
import styles from "./Tab.module.css";

export interface TabGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "segmented";
}

export const TabGroup = React.forwardRef<HTMLDivElement, TabGroupProps>(
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








