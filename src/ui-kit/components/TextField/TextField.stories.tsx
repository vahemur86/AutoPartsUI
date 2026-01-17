import { useState } from "storybook/internal/preview-api";

// components
import { TextField } from "./TextField";

// types
import type { Meta, StoryObj } from "@storybook/react";

// icons
import { Trash2 } from "lucide-react";

const meta: Meta<typeof TextField> = {
  title: "UI Kit/TextField",
  component: TextField,
  parameters: {
    layout: "padded",
    backgrounds: {
      default: "dark",
      values: [
        {
          name: "dark",
          value: "#0e0f11",
        },
      ],
    },
  },
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
      description: "Label text above the input",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
    disabled: {
      control: "boolean",
      description: "Disable the text field",
    },
    error: {
      control: "boolean",
      description: "Show error state",
    },
    helperText: {
      control: "text",
      description: "Helper text below the input",
    },
  },
};

export default meta;
type Story = StoryObj<typeof TextField>;

export const Default: Story = {
  args: {
    label: "Entity name",
    placeholder: "Type",
  },
};

export const WithIcon: Story = {
  args: {
    label: "Warehouse name",
    placeholder: "Select",
    icon: <Trash2 size={16} />,
  },
};

export const WithHelperText: Story = {
  args: {
    label: "Entity name",
    placeholder: "Type",
    helperText: "This is helper text",
  },
};

export const Error: Story = {
  args: {
    label: "Entity name",
    placeholder: "Type",
    error: true,
    helperText: "This field is required",
  },
};

export const Disabled: Story = {
  args: {
    label: "Entity name",
    placeholder: "Type",
    disabled: true,
  },
};

export const AllStates: Story = {
  args: {
    label: "Entity name",
    placeholder: "Type",
  },
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
      <TextField label="Entity name" placeholder="Type" />
      <TextField
        label="Warehouse name"
        placeholder="Select"
        icon={<Trash2 size={16} />}
      />
      <TextField label="Entity name" placeholder="Type" />
      <TextField
        label="Warehouse name"
        placeholder="Select"
        icon={<Trash2 size={16} />}
      />
      <TextField label="Entity name" placeholder="Type" />
      <TextField
        label="Warehouse name"
        placeholder="Select"
        icon={<Trash2 size={16} />}
      />
      <TextField label="Entity name" placeholder="Type" disabled />
      <TextField
        label="Warehouse name"
        placeholder="Select"
        icon={<Trash2 size={16} />}
        disabled
      />
    </div>
  ),
  parameters: {
    controls: { disable: true },
  },
};

export const Interactive: Story = {
  args: {
    label: "Entity name",
    placeholder: "Type",
  },
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [value, setValue] = useState("");
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          maxWidth: "400px",
        }}
      >
        <TextField
          label="Entity name"
          placeholder="Type"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <p style={{ color: "#ffffff", fontSize: "14px" }}>
          Current value: {value || "(empty)"}
        </p>
      </div>
    );
  },
  parameters: {
    controls: { disable: true },
  },
};
