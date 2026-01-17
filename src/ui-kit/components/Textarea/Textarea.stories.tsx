import { useState } from "storybook/internal/preview-api";

// components
import { Textarea } from "./Textarea";

// types
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Textarea> = {
  title: "UI Kit/Textarea",
  component: Textarea,
  parameters: {
    layout: "padded",
    backgrounds: {
      default: "dark",
      values: [{ name: "dark", value: "#0e0f11" }],
    },
  },
  tags: ["autodocs"],
  argTypes: {
    label: { control: "text" },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    error: { control: "boolean" },
    helperText: { control: "text" },
    autoResize: { control: "boolean" },
    resizable: { control: "boolean" },
    rows: { control: { type: "number", min: 1 } },
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    label: "Description",
    placeholder: "Enter details here...",
    resizable: true,
  },
};

export const AutoResizing: Story = {
  args: {
    label: "Auto-resize Textarea",
    placeholder: "Type a lot of text to see me grow infinitely...",
    autoResize: true,
    rows: 2,
  },
};

export const FixedSize: Story = {
  args: {
    label: "Non-resizable Textarea",
    placeholder: "I cannot be resized manually...",
    resizable: false,
    rows: 4,
  },
};

export const AllStates: Story = {
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "24px",
        padding: "20px",
        maxWidth: "900px",
      }}
    >
      <Textarea label="Default (Vertical Resize)" placeholder="Type..." />
      <Textarea
        label="No Resize Handle"
        placeholder="Fixed..."
        resizable={false}
      />
      <Textarea
        label="Auto-Resize"
        placeholder="Grows with content"
        autoResize
      />
      <Textarea label="Error State" error helperText="Required field" />
      <Textarea label="Disabled" disabled placeholder="Disabled..." />
      <Textarea label="Disabled with Value" disabled value="Pre-filled text" />
    </div>
  ),
};

export const Interactive: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [value, setValue] = useState("");
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          maxWidth: "500px",
        }}
      >
        <Textarea
          label="Interactive Input"
          placeholder="Start typing..."
          autoResize
          value={value}
          onChange={(e) => setValue(e.currentTarget.value)}
        />
        <div style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "13px" }}>
          Character count: {value.length}
        </div>
      </div>
    );
  },
};
