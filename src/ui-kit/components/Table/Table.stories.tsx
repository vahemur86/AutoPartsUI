import type { Meta, StoryObj } from "@storybook/react";

// components
import { DataTable } from "./DataTable";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "./Table";
import { IconButton } from "../IconButton/IconButton";

// icons
import { Edit } from "lucide-react";

// types
import type { ColumnDef } from "@tanstack/react-table";

const meta = {
  title: "UI-Kit/DataTable",
  component: DataTable,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- MOCK DATA ---
interface Customer {
  id: string;
  name: string;
  country: string;
  company: string;
  status: string;
  date: string;
  avatar?: string;
}

const mockData: Customer[] = [
  {
    id: "1",
    name: "Amy Elsner",
    country: "Egypt",
    company: "Chanay, Jeffrey A Esq",
    status: "negotiation",
    date: "2019-02-09",
  },
  {
    id: "2",
    name: "Amy Elsner",
    country: "Chile",
    company: "Buckley Miller & Wright",
    status: "negotiation",
    date: "2016-07-25",
  },
  {
    id: "3",
    name: "Ezekiel Chui",
    country: "Ireland",
    company: "Sider, Donald C Esq",
    status: "new",
    date: "2016-09-24",
  },
  {
    id: "4",
    name: "Ezekiel Chui",
    country: "Italy",
    company: "Tri State Refueler Co",
    status: "qualified",
    date: "2018-04-25",
  },
  {
    id: "5",
    name: "Rozella Ostrosky",
    country: "Venezuela",
    company: "Parkway Company",
    status: "unqualified",
    date: "2016-02-27",
  },
];

const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ getValue, row }) => {
      if (row.getIsGrouped()) {
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "bold",
                color: "white",
              }}
            >
              {String(getValue()).charAt(0)}
            </div>
            {String(getValue())}
          </div>
        );
      }
      return getValue() as string;
    },
  },
  { accessorKey: "country", header: "Country" },
  { accessorKey: "company", header: "Company" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => (
      <span
        style={{
          padding: "4px 10px",
          borderRadius: "6px",
          fontSize: "12px",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          color: "white",
        }}
      >
        {getValue() as string}
      </span>
    ),
  },
  { accessorKey: "date", header: "Date" },
  {
    id: "actions",
    header: "Actions",
    cell: () => (
      <IconButton
        variant="secondary"
        size="small"
        icon={<Edit size={16} />}
        ariaLabel="Edit"
      />
    ),
  },
];

export const DefaultDataTable: Story = {
  args: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    columns: columns as any,
    data: mockData,
    enableSelection: true,
  },
};

export const ExpandableGroups: Story = {
  args: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    columns: columns as any,
    data: mockData,
    groupBy: ["name"],
    enableSelection: false,
  },
};

export const ManualTableLayout: StoryObj<unknown> = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableCell asHeader>Entity name</TableCell>
          <TableCell asHeader>Entity ID</TableCell>
          <TableCell asHeader>Field name</TableCell>
          <TableCell asHeader>Language code</TableCell>
          <TableCell asHeader>Value</TableCell>
          <TableCell asHeader>Actions</TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 3 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>Name here</TableCell>
            <TableCell>ID here</TableCell>
            <TableCell>Name here</TableCell>
            <TableCell>Code here</TableCell>
            <TableCell>Value here</TableCell>
            <TableCell>
              <IconButton
                variant="secondary"
                size="small"
                icon={<Edit size={16} />}
                ariaLabel="Edit"
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};
