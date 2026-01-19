import type { Meta, StoryObj } from "@storybook/react";

// components
import { Button } from "./Button";

// icons
import { Save, Trash2 } from "lucide-react";

const meta = {
  title: "UI-Kit/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "primary",
        "primary300",
        "primary400",
        "primary500",
        "secondary",
        "secondary300",
        "secondary400",
        "secondary500",
        "danger",
        "danger300",
        "danger400",
        "danger500",
        "disabled",
      ],
      description: "Button variant/style",
    },
    size: {
      control: "select",
      options: ["small", "medium", "large"],
      description: "Button size",
    },
    fullWidth: {
      control: "boolean",
      description: "Make button full width",
    },
    disabled: {
      control: "boolean",
      description: "Disable button",
    },
    children: {
      control: "text",
      description: "Button content",
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Primary button
export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Button",
  },
};

// Secondary button
export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Cancel",
  },
};

// Danger button
export const Danger: Story = {
  args: {
    variant: "danger",
    children: "Delete",
  },
};

// Disabled button
export const Disabled: Story = {
  args: {
    variant: "disabled",
    children: "Button",
  },
};

// With icon
export const WithIcon: Story = {
  args: {
    variant: "primary",
    children: (
      <>
        <Save size={16} />
        Save Changes
      </>
    ),
  },
};

// Danger with icon
export const DangerWithIcon: Story = {
  args: {
    variant: "danger",
    children: (
      <>
        <Trash2 size={16} />
        Delete Item
      </>
    ),
  },
};

// Full width
export const FullWidth: Story = {
  args: {
    variant: "primary",
    fullWidth: true,
    children: "Full Width Button",
  },
  parameters: {
    layout: "padded",
  },
};

export const AllVariants: Story = {
  args: {
    children: "",
  },
  render: () => (
    <div
      style={{
        display: "flex",
        gap: "16px",
        flexDirection: "column",
        width: "300px",
      }}
    >
      <h3 style={{ marginBottom: "8px", fontSize: "16px", fontWeight: "600" }}>
        Primary Variants
      </h3>
      <Button variant="primary300">Primary 300</Button>
      <Button variant="primary400">Primary 400</Button>
      <Button variant="primary500">Primary 500</Button>
      <Button variant="primary">Primary (Default)</Button>

      <h3
        style={{
          marginTop: "24px",
          marginBottom: "8px",
          fontSize: "16px",
          fontWeight: "600",
        }}
      >
        Secondary Variants
      </h3>
      <Button variant="secondary300">Secondary 300</Button>
      <Button variant="secondary400">Secondary 400</Button>
      <Button variant="secondary500">Secondary 500</Button>
      <Button variant="secondary">Secondary (Default)</Button>

      <h3
        style={{
          marginTop: "24px",
          marginBottom: "8px",
          fontSize: "16px",
          fontWeight: "600",
        }}
      >
        Danger Variants
      </h3>
      <Button variant="danger300">Danger 300</Button>
      <Button variant="danger400">Danger 400</Button>
      <Button variant="danger500">Danger 500</Button>
      <Button variant="danger">Danger (Default)</Button>

      <h3
        style={{
          marginTop: "24px",
          marginBottom: "8px",
          fontSize: "16px",
          fontWeight: "600",
        }}
      >
        Disabled States
      </h3>
      <Button variant="disabled">Disabled</Button>
      <Button variant="primary" disabled>
        Disabled Primary
      </Button>
      <Button variant="danger" disabled>
        Disabled Danger
      </Button>
    </div>
  ),
  parameters: {
    layout: "padded",
    controls: { disable: true },
  },
};

export const AllSizes: Story = {
  args: {
    children: "",
  },
  render: () => (
    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
      <Button variant="primary" size="small">
        Small
      </Button>
      <Button variant="primary" size="medium">
        Medium
      </Button>
      <Button variant="primary" size="large">
        Large
      </Button>
    </div>
  ),
  parameters: {
    controls: { disable: true },
  },
};

// Interactive example
export const Interactive: Story = {
  args: {
    variant: "primary",
    children: "Click Me!",
    onClick: () => alert("Button clicked!"),
  },
};

// With Actions (for testing events in Storybook)
export const WithActions: Story = {
  args: {
    variant: "primary",
    children: "Test Actions",
  },
  argTypes: {
    onClick: { action: "clicked" },
    onMouseEnter: { action: "mouse entered" },
    onMouseLeave: { action: "mouse left" },
  },
};
