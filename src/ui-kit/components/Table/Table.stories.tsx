import type { Meta, StoryObj } from "@storybook/react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "./Table";
import { IconButton } from "../IconButton/IconButton";
import { Edit } from "lucide-react";

const meta = {
  title: "UI-Kit/Table",
  component: Table,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: null,
  },
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
        <TableRow>
          <TableCell>Name here</TableCell>
          <TableCell>ID here</TableCell>
          <TableCell>Name here</TableCell>
          <TableCell>Code here</TableCell>
          <TableCell>Value here</TableCell>
          <TableCell></TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Name here</TableCell>
          <TableCell>ID here</TableCell>
          <TableCell>Name here</TableCell>
          <TableCell>Code here</TableCell>
          <TableCell>Value here</TableCell>
          <TableCell></TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Name here</TableCell>
          <TableCell>ID here</TableCell>
          <TableCell>Name here</TableCell>
          <TableCell>Code here</TableCell>
          <TableCell>Value here</TableCell>
          <TableCell></TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

export const WithEditButtons: Story = {
  args: {
    children: null,
  },
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
        <TableRow>
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
        <TableRow>
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
        <TableRow>
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
      </TableBody>
    </Table>
  ),
};

export const WithManyRows: Story = {
  args: {
    children: null,
  },
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
        {Array.from({ length: 8 }).map((_, index) => (
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
