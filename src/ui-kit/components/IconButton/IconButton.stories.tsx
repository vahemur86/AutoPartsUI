import type { Meta, StoryObj } from "@storybook/react";
import { IconButton } from "./IconButton";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Settings,
  Bell,
  User,
} from "lucide-react";

const meta = {
  title: "UI-Kit/IconButton",
  component: IconButton,
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
        "disabled",
      ],
      description: "IconButton variant/style",
    },
    size: {
      control: "select",
      options: ["small", "medium", "large"],
      description: "IconButton size",
    },
    disabled: {
      control: "boolean",
      description: "Disable button",
    },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// Primary with Plus icon
export const Primary: Story = {
  args: {
    variant: "primary",
    icon: <Plus />,
    ariaLabel: "Add language",
  },
};

// Secondary variant
export const Secondary: Story = {
  args: {
    variant: "secondary",
    icon: <Settings />,
    ariaLabel: "Settings",
  },
};

// Disabled
export const Disabled: Story = {
  args: {
    variant: "disabled",
    icon: <Plus />,
    ariaLabel: "Add",
  },
};

// All variants showcase
export const AllVariants: Story = {
  args: {
    variant: "primary",
    icon: <Plus />,
    ariaLabel: "Add",
  },
  render: () => (
    <div
      style={{
        display: "flex",
        gap: "16px",
        flexDirection: "column",
        alignItems: "flex-start",
      }}
    >
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <h3 style={{ minWidth: "120px", fontSize: "14px", fontWeight: "600" }}>
          Primary
        </h3>
        <IconButton variant="primary300" icon={<Plus />} ariaLabel="Add" />
        <IconButton variant="primary400" icon={<Plus />} ariaLabel="Add" />
        <IconButton variant="primary500" icon={<Plus />} ariaLabel="Add" />
        <IconButton variant="primary" icon={<Plus />} ariaLabel="Add" />
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <h3 style={{ minWidth: "120px", fontSize: "14px", fontWeight: "600" }}>
          Secondary
        </h3>
        <IconButton variant="secondary300" icon={<Edit />} ariaLabel="Edit" />
        <IconButton variant="secondary400" icon={<Edit />} ariaLabel="Edit" />
        <IconButton variant="secondary500" icon={<Edit />} ariaLabel="Edit" />
        <IconButton variant="secondary" icon={<Edit />} ariaLabel="Edit" />
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <h3 style={{ minWidth: "120px", fontSize: "14px", fontWeight: "600" }}>
          Disabled
        </h3>
        <IconButton variant="disabled" icon={<Plus />} ariaLabel="Add" />
        <IconButton
          variant="primary"
          disabled
          icon={<Plus />}
          ariaLabel="Add"
        />
      </div>
    </div>
  ),
  parameters: {
    layout: "padded",
    controls: { disable: true },
  },
};

// All sizes showcase
export const AllSizes: Story = {
  args: {
    variant: "primary",
    icon: <Plus />,
    ariaLabel: "Add",
  },
  render: () => (
    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
      <IconButton
        variant="primary"
        size="small"
        icon={<Plus />}
        ariaLabel="Add"
      />
      <IconButton
        variant="primary"
        size="medium"
        icon={<Plus />}
        ariaLabel="Add"
      />
      <IconButton
        variant="primary"
        size="large"
        icon={<Plus />}
        ariaLabel="Add"
      />
    </div>
  ),
  parameters: {
    controls: { disable: true },
  },
};

// Different icons showcase
export const DifferentIcons: Story = {
  args: {
    variant: "primary",
    icon: <Plus />,
    ariaLabel: "Add",
  },
  render: () => (
    <div
      style={{
        display: "flex",
        gap: "16px",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <IconButton variant="primary" icon={<Plus />} ariaLabel="Add" />
      <IconButton variant="primary" icon={<Edit />} ariaLabel="Edit" />
      <IconButton variant="primary" icon={<Trash2 />} ariaLabel="Delete" />
      <IconButton variant="primary" icon={<Save />} ariaLabel="Save" />
      <IconButton variant="primary" icon={<X />} ariaLabel="Close" />
      <IconButton variant="primary" icon={<Settings />} ariaLabel="Settings" />
      <IconButton variant="primary" icon={<Bell />} ariaLabel="Notifications" />
      <IconButton variant="primary" icon={<User />} ariaLabel="Profile" />
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
    icon: <Plus />,
    ariaLabel: "Add language",
    onClick: () => alert("Button clicked!"),
  },
};
