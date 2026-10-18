import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { TFunction } from "i18next";
import type { ReactNode } from "react";
import {
  Banknote,
  CalendarClock,
  ChartNoAxesCombined,
  Hash,
  Package,
  Percent,
  Store,
  UserRound,
  Warehouse,
  Weight,
  type LucideIcon,
} from "lucide-react";
import styles from "./FinanceReports.module.css";

export type DynamicRow = {
  id: string | number;
  [key: string]: unknown;
};

const columnHelper = createColumnHelper<DynamicRow>();

interface DynamicColumnsOptions {
  preferredKeys?: string[];
  hiddenKeys?: string[];
  cellRenderers?: Record<string, (value: unknown, row: DynamicRow) => ReactNode>;
}

const moneyKeyRegex = /(amount|cost|price|profit|revenue|balance|value|expense|sales)/i;
const percentKeyRegex = /(percent|percentage|margin|markup)/i;
const dateKeyRegex = /(date|at|time)$/i;
const idKeyRegex = /id$/i;
const quantityKeyRegex = /(count|quantity|units|products|items|number)/i;
const salesCountKeyRegex = /^(total)?sales$/i;

export const isFinanceMoneyKey = (key: string) =>
  moneyKeyRegex.test(key) &&
  !percentKeyRegex.test(key) &&
  !quantityKeyRegex.test(key) &&
  !salesCountKeyRegex.test(key);

export const getFinanceColumnIcon = (key: string): LucideIcon => {
  if (/(date|created|updated|occurred|purchased|last)/i.test(key)) return CalendarClock;
  if (/(percent|percentage|margin|markup|rate)/i.test(key)) return Percent;
  if (/(amount|cost|price|profit|revenue|sales|balance|value)/i.test(key)) return Banknote;
  if (/(weight|quantity|count|units|stock)/i.test(key)) return Weight;
  if (/warehouse/i.test(key)) return Warehouse;
  if (/shop|store/i.test(key)) return Store;
  if (/product|service|category/i.test(key)) return Package;
  if (/employee|operator|customer|user/i.test(key)) return UserRound;
  if (/id$/i.test(key)) return Hash;
  return ChartNoAxesCombined;
};

const toText = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
};

const formatValue = (key: string, value: unknown, t?: TFunction): string => {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "number") {
    if (percentKeyRegex.test(key)) {
      return `${value.toFixed(2)}%`;
    }

    if (isFinanceMoneyKey(key)) {
      return value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

    if (Number.isInteger(value) || idKeyRegex.test(key)) {
      return value.toLocaleString();
    }

    return value.toLocaleString(undefined, {
      maximumFractionDigits: 4,
    });
  }

  if (typeof value === "boolean") {
    return t ? t(value ? "common.yes" : "common.no") : value ? "Yes" : "No";
  }

  if (typeof value === "string") {
    if (dateKeyRegex.test(key)) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleString();
      }
    }

    return value;
  }

  return toText(value);
};

export const formatFinanceValue = (
  key: string,
  value: unknown,
  t?: TFunction,
): string => {
  const formatted = formatValue(key, value, t);
  if (
    typeof value === "number" && isFinanceMoneyKey(key)
  ) {
    return `${formatted} AMD`;
  }
  return formatted;
};

export const isFinanceProfitKey = (key: string) => /profit/i.test(key);

export const toFinanceHeader = (key: string, t?: TFunction): string => {
  const fallback = key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
  return t
    ? t(`financeReports.fields.${key}`, { defaultValue: fallback })
    : fallback;
};

export const toDynamicRows = (data: unknown): DynamicRow[] => {
  if (Array.isArray(data)) {
    return data.map((item, index) => {
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        const id =
          (record.id as string | number | undefined) ??
          (record.saleId as string | number | undefined) ??
          (record.productId as string | number | undefined) ??
          index + 1;

        return {
          id,
          ...record,
        };
      }

      return {
        id: index + 1,
        value: item,
      };
    });
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    return [
      {
        id:
          (record.id as string | number | undefined) ??
          (record.saleId as string | number | undefined) ??
          1,
        ...record,
      },
    ];
  }

  return [{ id: 1, value: data }];
};

export const getDynamicColumns = (
  rows: DynamicRow[],
  options: DynamicColumnsOptions = {},
  t?: TFunction,
): ColumnDef<DynamicRow, unknown>[] => {
  if (rows.length === 0) {
    return [];
  }

  const allKeys = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row))),
  ).filter((key) => !(options.hiddenKeys || []).includes(key));

  const preferred = (options.preferredKeys || []).filter((key) =>
    allKeys.includes(key),
  );

  const remaining = allKeys.filter((key) => !preferred.includes(key));
  const keys = [...preferred, ...remaining];

  const columns = keys.map((key) => {
    if (key === "id") {
      return columnHelper.display({
        id: "id",
        header: () => (
          <span className={styles.dynamicColumnHeader}>
            <Hash size={13} aria-hidden="true" />
            {toFinanceHeader("id", t)}
          </span>
        ),
        cell: ({ row }) => `#${toText(row.original.id)}`,
      });
    }

    return columnHelper.display({
      id: key,
      header: () => {
        const Icon = getFinanceColumnIcon(key);
        return (
          <span className={styles.dynamicColumnHeader}>
            <Icon size={13} aria-hidden="true" />
            {toFinanceHeader(key, t)}
          </span>
        );
      },
      cell: ({ row }) => {
        const value = row.original[key];
        const customRenderer = options.cellRenderers?.[key];
        if (customRenderer) {
          return customRenderer(value, row.original);
        }
        if (typeof value === "number" && isFinanceMoneyKey(key)) {
          const profitClass = /profit/i.test(key)
            ? value >= 0
              ? styles.positiveValue
              : styles.negativeValue
            : "";
          return (
            <span className={`${styles.moneyValue} ${profitClass}`}>
              {formatFinanceValue(key, value, t)}
            </span>
          );
        }
        return formatValue(key, value, t);
      },
    });
  });

  return columns;
};
