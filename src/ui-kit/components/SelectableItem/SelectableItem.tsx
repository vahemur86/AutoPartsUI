import {
  forwardRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import styles from "./SelectableItem.module.css";

export type SelectableItemState =
  | "default"
  | "selected"
  | "hovered"
  | "disabled";

export interface SelectableItemProps extends HTMLAttributes<HTMLDivElement> {
  state?: SelectableItemState;
  icon?: ReactNode;
  text: string;
  editIcon?: ReactNode;
  onEditClick?: () => void;
  onClick?: () => void;
  width?: number | string;
}

export const SelectableItem = forwardRef<HTMLDivElement, SelectableItemProps>(
  (
    {
      state = "default",
      icon,
      text,
      editIcon,
      onEditClick,
      onClick,
      width = 212,
      className = "",
      ...props
    },
    ref
  ) => {
    const [isHovered, setIsHovered] = useState(false);
    const isDisabled = state === "disabled";
    const showEditIcon =
      !isDisabled && (state === "selected" || state === "hovered" || isHovered);

    const handleClick = () => {
      if (isDisabled) return;
      onClick?.();
    };

    const handleEditClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isDisabled && onEditClick) {
        onEditClick();
      }
    };

    const classNames = [
      styles.selectableItem,
      styles[state],
      isHovered && state !== "disabled" ? styles.hovered : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const widthStyle = typeof width === "number" ? `${width}px` : width;

    return (
      <div
        ref={ref}
        className={classNames}
        style={{ width: widthStyle, ...props.style }}
        onClick={handleClick}
        onMouseEnter={() => !isDisabled && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-disabled={isDisabled}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !isDisabled) {
            e.preventDefault();
            onClick?.();
          }
        }}
        {...props}
      >
        {icon && <div className={styles.iconWrapper}>{icon}</div>}
        <span className={styles.text}>{text}</span>
        {showEditIcon && editIcon && (
          <button
            className={styles.editButton}
            onClick={handleEditClick}
            aria-label="Edit"
            type="button"
          >
            {editIcon}
          </button>
        )}
      </div>
    );
  }
);

SelectableItem.displayName = "SelectableItem";
