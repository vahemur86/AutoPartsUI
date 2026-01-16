import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useCallback,
  type TextareaHTMLAttributes,
} from "react";
import styles from "./Textarea.module.css";

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
  label?: string;
  error?: boolean;
  helperText?: string;
  autoResize?: boolean;
  resizable?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error = false,
      helperText,
      className = "",
      id,
      disabled = false,
      rows = 4,
      autoResize = false,
      resizable = true,
      value,
      onChange,
      ...props
    },
    forwardedRef
  ) => {
    const reactId = useId();
    const textareaId = id || `textarea-${reactId}`;
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useImperativeHandle(
      forwardedRef,
      () => textareaRef.current as HTMLTextAreaElement
    );

    const adjustHeight = useCallback(() => {
      const el = textareaRef.current;
      if (!autoResize || !el) return;

      // Reset height to shrink if text was deleted
      el.style.height = "auto";
      // Set to scrollHeight to match content
      el.style.height = `${el.scrollHeight}px`;
    }, [autoResize]);

    // Adjust height when value changes
    useEffect(() => {
      adjustHeight();
    }, [value, adjustHeight]);

    // Adjust height on window/container resize
    useEffect(() => {
      if (!autoResize || !textareaRef.current) return;

      const observer = new ResizeObserver(() => {
        adjustHeight();
      });

      observer.observe(textareaRef.current);
      return () => observer.disconnect();
    }, [adjustHeight, autoResize]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize) adjustHeight();
      onChange?.(e);
    };

    // autoResize overrides resizable to prevent layout conflicts
    const isResizable = autoResize ? false : resizable;

    return (
      <div className={`${styles.textareaWrapper} ${className}`}>
        {label && (
          <label htmlFor={textareaId} className={styles.textareaLabel}>
            {label}
          </label>
        )}

        <div
          className={`${styles.textareaContainer} ${
            error ? styles.error : ""
          } ${disabled ? styles.disabled : ""}`}
        >
          <textarea
            ref={textareaRef}
            id={textareaId}
            rows={rows}
            disabled={disabled}
            value={value}
            onChange={handleChange}
            className={`${styles.textareaInput} ${
              autoResize ? styles.autoResize : ""
            } ${!isResizable ? styles.noResize : ""}`}
            {...props}
          />
        </div>

        {helperText && (
          <span
            className={`${styles.textareaHelperText} ${
              error ? styles.error : ""
            }`}
          >
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
