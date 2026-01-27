import {
  Children,
  forwardRef,
  Fragment,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { useTranslation } from "react-i18next";

// icons
import { ChevronDown, Search } from "lucide-react";

// styles
import styles from "./Select.module.css";

export interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "size"
> {
  label?: string;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
  containerClassName?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error = false,
      helperText,
      placeholder,
      className = "",
      containerClassName = "",
      id,
      disabled = false,
      children,
      value,
      defaultValue = "",
      onChange,
      searchable = false,
      searchPlaceholder = "Search...",
      ...props
    },
    ref,
  ) => {
    const { t } = useTranslation();
    const reactId = useId();
    const selectId = id || `select-${reactId}`;
    const rootRef = useRef<HTMLDivElement>(null);
    const internalSelectRef = useRef<HTMLSelectElement>(null);

    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [internalValue, setInternalValue] = useState(defaultValue);

    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;

    const getTextFromChildren = useCallback((node: ReactNode): string => {
      if (!node) return "";
      if (typeof node === "string" || typeof node === "number")
        return String(node);
      if (Array.isArray(node)) return node.map(getTextFromChildren).join("");
      if (isValidElement(node)) {
        const element = node as ReactElement<{ children?: ReactNode }>;
        return getTextFromChildren(element.props.children);
      }
      return "";
    }, []);

    const allOptions = useMemo(() => {
      const options: {
        value: string;
        label: string;
        originalChildren: ReactNode;
        disabled: boolean;
      }[] = [];

      Children.forEach(children, (child) => {
        if (!isValidElement(child)) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const element = child as ReactElement<any>;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const processOption = (opt: ReactElement<any>) => {
          if (opt.type === "option") {
            options.push({
              value: String(opt.props.value || ""),
              label: getTextFromChildren(opt.props.children),
              originalChildren: opt.props.children,
              disabled: !!opt.props.disabled,
            });
          }
        };

        if (element.type === Fragment) {
          Children.forEach(element.props.children, (nested) => {
            if (isValidElement(nested)) processOption(nested as ReactElement);
          });
        } else {
          processOption(element);
        }
      });

      return options.filter((opt) => opt.value !== "");
    }, [children, getTextFromChildren]);

    const filteredOptions = useMemo(() => {
      if (!searchable || !searchQuery.trim()) return allOptions;
      const query = searchQuery.toLowerCase();
      return allOptions.filter((opt) =>
        opt.label.toLowerCase().includes(query),
      );
    }, [allOptions, searchable, searchQuery]);

    const displayText = useMemo(() => {
      const selected = allOptions.find(
        (opt) => String(opt.value) === String(currentValue),
      );
      return selected ? selected.originalChildren : placeholder || "";
    }, [allOptions, currentValue, placeholder]);

    useEffect(() => {
      if (!open) setSearchQuery("");
    }, [open]);

    const handleSelect = (optionValue: string) => {
      if (!internalSelectRef.current) return;
      internalSelectRef.current.value = optionValue;
      if (!isControlled) setInternalValue(optionValue);
      if (onChange) {
        const event = new Event("change", { bubbles: true });
        Object.defineProperty(event, "target", {
          writable: false,
          value: internalSelectRef.current,
        });
        onChange(event as unknown as ChangeEvent<HTMLSelectElement>);
      }
      setOpen(false);
    };

    useEffect(() => {
      if (!open) return;
      const handleClose = (e: MouseEvent | KeyboardEvent) => {
        if (e instanceof KeyboardEvent && e.key === "Escape") setOpen(false);
        else if (
          e instanceof MouseEvent &&
          rootRef.current &&
          !rootRef.current.contains(e.target as Node)
        )
          setOpen(false);
      };
      document.addEventListener("mousedown", handleClose);
      document.addEventListener("keydown", handleClose);
      return () => {
        document.removeEventListener("mousedown", handleClose);
        document.removeEventListener("keydown", handleClose);
      };
    }, [open]);

    return (
      <div ref={rootRef} className={`${styles.selectWrapper} ${className}`}>
        {label && (
          <label htmlFor={selectId} className={styles.selectLabel}>
            {label}
          </label>
        )}

        <div
          className={`${styles.selectContainer} ${containerClassName} ${error ? styles.error : ""} ${disabled ? styles.disabled : ""}`}
          data-open={open}
        >
          <select
            ref={(node) => {
              internalSelectRef.current = node;
              if (typeof ref === "function") ref(node);
              else if (ref) ref.current = node;
            }}
            id={selectId}
            value={currentValue}
            onChange={(e) => {
              if (!isControlled) setInternalValue(e.target.value);
              onChange?.(e);
            }}
            disabled={disabled}
            style={{ display: "none" }}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {children}
          </select>

          <button
            type="button"
            className={`${styles.trigger} ${!currentValue ? styles.placeholder : ""}`}
            disabled={disabled}
            onClick={() => !disabled && setOpen((v) => !v)}
          >
            <span className={styles.valueText}>{displayText}</span>
          </button>

          <div className={styles.selectIcon}>
            <ChevronDown size={16} />
          </div>

          {open && !disabled && (
            <div className={styles.dropdown} role="listbox">
              {searchable && (
                <div className={styles.searchContainer}>
                  <div className={styles.searchIcon}>
                    <Search size={14} />
                  </div>
                  <input
                    className={styles.searchInput}
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}

              <div className={styles.optionsList}>
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`${styles.option} ${String(currentValue) === opt.value ? styles.optionSelected : ""} ${opt.disabled ? styles.optionDisabled : ""}`}
                      onClick={() => !opt.disabled && handleSelect(opt.value)}
                      disabled={opt.disabled}
                    >
                      <span className={styles.optionLabel}>
                        {opt.originalChildren}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className={styles.noResults}>
                    {searchQuery
                      ? "No results found"
                      : t("common.noOptionsAvailable")}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {helperText && (
          <span
            className={`${styles.selectHelperText} ${error ? styles.error : ""}`}
          >
            {helperText}
          </span>
        )}
      </div>
    );
  },
);
Select.displayName = "Select";
