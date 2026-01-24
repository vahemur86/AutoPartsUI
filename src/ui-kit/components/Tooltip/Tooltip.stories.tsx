import type { Meta, StoryObj } from "@storybook/react";

// components
import { Tooltip } from "./Tooltip";

const meta = {
  title: "UI-Kit/Tooltip",
  component: Tooltip,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <span style={{ textDecoration: "underline dotted" }}>Hover me</span>
    ),
    content: "This is a portal tooltip",
  },
};

export const MultiLine: Story = {
  args: {
    children: <button>Info</button>,
    content: (
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <strong>Details:</strong>
        <span>USD: 1,200</span>
        <span>EUR: 1,100</span>
      </div>
    ),
  },
};
