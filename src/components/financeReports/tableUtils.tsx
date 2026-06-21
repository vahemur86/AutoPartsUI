import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

export type DynamicRow = {
  id: string | number;
  [key: string]: unknown;
};

const columnHelper = createColumnHelper<DynamicRow>();

interface DynamicColumnsOptions {
  preferredKeys?: string[];
  hiddenKeys?: string[];
}

const moneyKeyRegex = /(amount|total|cost|price|profit|revenue|balance)/i;
const percentKeyRegex = /(percent|percentage|margin|markup)/i;
const dateKeyRegex = /(date|at)$/i;
const idKeyRegex = /id$/i;

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

const formatValue = (key: string, value: unknown): string => {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "number") {
    if (percentKeyRegex.test(key)) {
      return `${value.toFixed(2)}%`;
    }

    if (moneyKeyRegex.test(key)) {
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
    return value ? "Yes" : "No";
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

const toHeader = (key: string): string => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();
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

  return keys.map((key) => {
    if (key === "id") {
      return columnHelper.display({
        id: "id",
        header: "ID",
        cell: ({ row }) => `#${toText(row.original.id)}`,
      });
    }

    return columnHelper.display({
      id: key,
      header: toHeader(key),
      cell: ({ row }) => formatValue(key, row.original[key]),
    });
  });
};
