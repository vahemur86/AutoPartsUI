import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import i18next from "i18next";

// types
import type {
  CarModel,
  IronType,
  IronPrice,
  IronTypePriceByCustomer,
} from "@/types/ironCarShop";

const columnHelper = createColumnHelper<CarModel>();
const ironTypeColumnHelper = createColumnHelper<IronType>();
const ironPriceColumnHelper = createColumnHelper<
  IronPrice & { customerTypeName?: string }
>();
const ironTypePriceByCustomerHelper =
  createColumnHelper<IronTypePriceByCustomer>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { Button } from "@/ui-kit";
import styles from "./IronManagement.module.css";

export const getCarModelColumns = (
  {
    onDelete,
    onEdit,
  }: {
    onDelete: (carModel: CarModel) => void;
    onEdit?: (carModel: CarModel) => void;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): ColumnDef<CarModel, any>[] => [
  columnHelper.accessor("id", {
    header: i18next.t("ironManagement.columns.id"),
  }),
  columnHelper.accessor("name", {
    header: i18next.t("ironManagement.columns.name"),
  }),
  columnHelper.display({
    id: "actions",
    header: i18next.t("common.actions"),
    cell: ({ row }) => (
      <div className={styles.actionButtonsCell}>
        {onEdit && (
          <Button variant="secondary" size="small" onClick={() => onEdit(row.original)}>
            {i18next.t("common.edit")}
          </Button>
        )}
        <Button
          variant="danger"
          size="small"
          onClick={() => onDelete(row.original)}
        >
          {i18next.t("common.delete")}
        </Button>
      </div>
    ),
  }),
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getIronTypeColumns = (
  {
    onDelete,
    onEdit,
  }: {
    onDelete?: (ironType: IronType) => void;
    onEdit?: (ironType: IronType) => void;
  } = {},
): ColumnDef<IronType, any>[] => [
  ironTypeColumnHelper.accessor("id", {
    header: i18next.t("ironManagement.columns.id"),
  }),
  ironTypeColumnHelper.accessor("name", {
    header: i18next.t("ironManagement.columns.name"),
  }),
  ...(onDelete
    ? [
        ironTypeColumnHelper.display({
          id: "actions",
          header: i18next.t("common.actions"),
          cell: ({ row }) => (
            <div className={styles.actionButtonsCell}>
              {onEdit && (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => onEdit(row.original)}
                >
                  {i18next.t("common.edit")}
                </Button>
              )}
              <Button
                variant="danger"
                size="small"
                onClick={() => onDelete?.(row.original)}
              >
                {i18next.t("common.delete")}
              </Button>
            </div>
          ),
        }),
      ]
    : []),
];

export const getIronPriceColumns = (): ColumnDef<
  IronPrice & { customerTypeName?: string },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
>[] => [
  ironPriceColumnHelper.accessor("id", {
    header: i18next.t("ironManagement.columns.id"),
  }),
  ironPriceColumnHelper.accessor("customerTypeName", {
    header: i18next.t("ironManagement.columns.customerType"),
  }),
  ironPriceColumnHelper.accessor("pricePerKg", {
    header: i18next.t("ironManagement.columns.pricePerKg"),
    cell: (info) => info.getValue().toLocaleString(),
  }),
];

export const getIronTypePriceByCustomerColumns = (): ColumnDef<
  IronTypePriceByCustomer,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
>[] => [
  ironTypePriceByCustomerHelper.accessor("customerTypeName", {
    header: i18next.t("ironManagement.columns.customerType"),
  }),
  ironTypePriceByCustomerHelper.accessor("pricePerKg", {
    header: i18next.t("ironManagement.columns.pricePerKg"),
    cell: (info) => info.getValue().toLocaleString(),
  }),
];
