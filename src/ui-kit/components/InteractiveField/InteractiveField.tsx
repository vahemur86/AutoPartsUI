import {
  useState,
  useRef,
  type HTMLAttributes,
  type ReactNode,
  forwardRef,
  type ChangeEvent,
} from "react";
import { Switch } from "../Switch";
import { IconButton } from "../IconButton/IconButton";
import styles from "./InteractiveField.module.css";

export type InteractiveFieldVariant = "editable" | "display";
export type InteractiveFieldSize = "medium" | "large";

export interface InteractiveFieldProps extends HTMLAttributes<HTMLDivElement> {
  variant?: InteractiveFieldVariant;
  size?: InteractiveFieldSize;
  disabled?: boolean;
  photoUpload?: {
    onUpload?: (file: File) => void;
    icon?: ReactNode;
    imageUrl?: string;
  };
  textInput?: {
    value?: string;
    defaultValue?: string;
    placeholder?: string;
    onChange?: (value: string) => void;
    label?: string;
  };
  displayText?: string | ReactNode;
  displayIcon?: ReactNode;
  toggle?: {
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    label?: string;
  };
  actions?: {
    cancel?: {
      icon: ReactNode;
      onClick?: () => void;
      ariaLabel?: string;
    };
    save?: {
      icon: ReactNode;
      onClick?: () => void;
      ariaLabel?: string;
    };
    edit?: {
      icon: ReactNode;
      onClick?: () => void;
      ariaLabel?: string;
    };
    delete?: {
      icon: ReactNode;
      onClick?: () => void;
      ariaLabel?: string;
    };
  };
}

export const InteractiveField = forwardRef<
  HTMLDivElement,
  InteractiveFieldProps
>(
  (
    {
      variant = "display",
      size = "medium",
      disabled = false,
      photoUpload,
      textInput,
      displayText,
      displayIcon,
      toggle,
      actions,
      className = "",
      ...props
    },
    ref
  ) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [internalTextValue, setInternalTextValue] = useState(
      textInput?.defaultValue || ""
    );

    const textValue =
      textInput?.value !== undefined ? textInput.value : internalTextValue;

    const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (textInput?.value === undefined) {
        setInternalTextValue(newValue);
      }
      textInput?.onChange?.(newValue);
    };

    const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && photoUpload?.onUpload) {
        photoUpload.onUpload(file);
      }
    };

    const handlePhotoClick = () => {
      if (!disabled && photoUpload?.onUpload) {
        fileInputRef.current?.click();
      }
    };

    const classNames = [
      styles.interactiveField,
      styles[variant],
      styles[size],
      disabled ? styles.disabled : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div ref={ref} className={classNames} {...props}>
        {/* Photo Upload Area */}
        {photoUpload && (
          <div
            className={`${styles.photoUpload} ${
              disabled ? styles.disabled : ""
            }`}
            onClick={handlePhotoClick}
          >
            {photoUpload.imageUrl ? (
              <img
                src={photoUpload.imageUrl}
                alt="Upload preview"
                className={styles.photoPreview}
              />
            ) : (
              <>
                {photoUpload.icon || (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className={styles.fileInput}
                  disabled={disabled}
                />
              </>
            )}
          </div>
        )}

        {/* Display Icon */}
        {displayIcon && <div className={styles.displayIcon}>{displayIcon}</div>}

        {/* Text Input or Display Text */}
        {textInput ? (
          <div className={styles.textInputWrapper}>
            {textInput.label && (
              <label className={styles.textInputLabel}>{textInput.label}</label>
            )}
            <input
              type="text"
              value={textValue}
              onChange={handleTextChange}
              placeholder={textInput.placeholder || "Name here"}
              className={styles.textInput}
              disabled={disabled}
            />
          </div>
        ) : displayText ? (
          <div
            className={`${styles.displayText} ${
              typeof displayText !== "string" ? styles.displayTextNode : ""
            }`}
          >
            {displayText}
          </div>
        ) : null}

        {/* Toggle Switch */}
        {toggle && (
          <div className={styles.toggleWrapper}>
            <Switch
              checked={toggle.checked}
              defaultChecked={toggle.defaultChecked}
              onCheckedChange={toggle.onCheckedChange}
              disabled={disabled}
              label={toggle.label}
            />
          </div>
        )}

        {/* Action Buttons */}
        {actions && (
          <div className={styles.actionsWrapper}>
            {actions.cancel && (
              <IconButton
                variant="secondary"
                size="small"
                icon={actions.cancel.icon}
                ariaLabel={actions.cancel.ariaLabel || "Cancel"}
                onClick={actions.cancel.onClick}
                disabled={disabled}
              />
            )}
            {actions.save && (
              <IconButton
                variant="secondary"
                size="small"
                icon={actions.save.icon}
                ariaLabel={actions.save.ariaLabel || "Save"}
                onClick={actions.save.onClick}
                disabled={disabled}
              />
            )}
            {actions.edit && (
              <IconButton
                variant="secondary"
                size="small"
                icon={actions.edit.icon}
                ariaLabel={actions.edit.ariaLabel || "Edit"}
                onClick={actions.edit.onClick}
                disabled={disabled}
              />
            )}
            {actions.delete && (
              <IconButton
                variant="secondary"
                size="small"
                icon={actions.delete.icon}
                ariaLabel={actions.delete.ariaLabel || "Delete"}
                onClick={actions.delete.onClick}
                disabled={disabled}
              />
            )}
          </div>
        )}
      </div>
    );
  }
);

InteractiveField.displayName = "InteractiveField";
