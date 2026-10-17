import {
  Fragment,
  forwardRef,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import i18next from "i18next";
import {
  ArrowLeft,
  ArrowRightLeft,
  Check,
  Download,
  Eye,
  FileText,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Printer,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";

// styles
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
  | "danger"
  | "danger300"
  | "danger400"
  | "danger500"
  | "disabled";

export type ButtonSize = "small" | "medium" | "large";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
}

const actionIcons = [
  {
    icon: Save,
    keys: ["common.save", "common.saving"],
    aliases: ["save", "saving", "պահպանել", "պահպանվում է", "сохранить", "сохраняется"],
  },
  {
    icon: X,
    keys: ["common.cancel", "common.close"],
    aliases: ["cancel", "close", "չեղարկել", "փակել", "отмена", "закрыть"],
  },
  {
    icon: Trash2,
    keys: ["common.delete", "common.deleting"],
    aliases: ["delete", "deleting", "remove", "ջնջել", "հեռացնել", "удалить", "удаление"],
  },
  {
    icon: Eye,
    keys: ["common.details"],
    aliases: ["view", "details", "դիտել", "մանրամասն", "просмотр", "детали"],
  },
  {
    icon: Pencil,
    keys: ["common.edit"],
    aliases: ["edit", "modify", "խմբագրել", "փոփոխել", "редактировать", "изменить"],
  },
  {
    icon: RotateCcw,
    keys: ["common.reset"],
    aliases: ["reset", "վերակայել", "մաքրել", "сбросить", "очистить"],
  },
  {
    icon: RefreshCw,
    keys: ["common.refresh"],
    aliases: ["refresh", "update", "թարմացնել", "обновить"],
  },
  {
    icon: Search,
    keys: ["common.apply", "common.search"],
    aliases: ["apply", "search", "կիրառել", "որոնել", "применить", "поиск"],
  },
  {
    icon: Plus,
    keys: ["common.add"],
    aliases: ["add", "create", "ավելացնել", "ստեղծել", "добавить", "создать"],
  },
  {
    icon: Check,
    keys: [],
    aliases: ["confirm", "approve", "հաստատել", "применить", "подтвердить"],
  },
  {
    icon: ArrowRightLeft,
    keys: [],
    aliases: ["transfer", "move to shop", "տեղափոխել", "передать", "переместить"],
  },
  {
    icon: Power,
    keys: [],
    aliases: ["activate", "ակտիվացնել", "активировать"],
  },
  {
    icon: PowerOff,
    keys: [],
    aliases: ["deactivate", "ապաակտիվացնել", "деактивировать"],
  },
  {
    icon: Download,
    keys: [],
    aliases: ["download", "export", "ներբեռնել", "արտահանել", "скачать", "экспорт"],
  },
  {
    icon: Upload,
    keys: [],
    aliases: ["upload", "import", "վերբեռնել", "ներմուծել", "загрузить", "импорт"],
  },
  {
    icon: Printer,
    keys: [],
    aliases: ["print", "տպել", "печать"],
  },
  {
    icon: FileText,
    keys: [],
    aliases: ["report", "հաշվետվություն", "отчет"],
  },
  {
    icon: ArrowLeft,
    keys: [],
    aliases: ["back", "go back", "հետ", "վերադառնալ", "назад"],
  },
];

interface ButtonContent {
  text: string;
  hasVisual: boolean;
}

const getButtonContent = (children: ReactNode): ButtonContent => {
  if (typeof children === "string" || typeof children === "number") {
    return { text: String(children), hasVisual: false };
  }

  if (Array.isArray(children)) {
    const texts: string[] = [];
    let hasVisual = false;
    for (const child of children) {
      const content = getButtonContent(child);
      texts.push(content.text);
      hasVisual ||= content.hasVisual;
    }
    return { text: texts.join(" "), hasVisual };
  }

  if (isValidElement<{ children?: ReactNode }>(children)) {
    if (children.type === Fragment) {
      return getButtonContent(children.props.children);
    }
    if (typeof children.type !== "string" || children.type === "svg" || children.type === "img") {
      return { text: "", hasVisual: true };
    }
    return getButtonContent(children.props.children);
  }

  return { text: "", hasVisual: false };
};

const getActionIcon = (children: ReactNode) => {
  const content = getButtonContent(children);
  const text = content.text.trim().toLocaleLowerCase();
  if (!text || content.hasVisual) return null;

  return (
    actionIcons.find(({ keys, aliases }) => {
      const labels = [...keys.map((key) => i18next.t(key)), ...aliases]
        .map((label) => label.trim().toLocaleLowerCase())
        .filter(Boolean);
      return labels.some(
        (label) => text === label || text.startsWith(`${label} `) || text.startsWith(`${label}...`),
      );
    })?.icon ?? null
  );
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
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
    ref,
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
    const ActionIcon = getActionIcon(children);

    return (
      <button
        ref={ref}
        className={classNames}
        disabled={disabled || variant === "disabled"}
        {...props}
      >
        {ActionIcon && (
          <span className={styles.actionIcon} aria-hidden="true">
            <ActionIcon size={size === "small" ? 14 : size === "large" ? 18 : 16} />
          </span>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
