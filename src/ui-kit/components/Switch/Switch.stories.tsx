import type { Meta, StoryObj } from "@storybook/react";
import { Switch } from "./Switch";
import { useState } from "react";

const meta = {
  title: "UI-Kit/Switch",
  component: Switch,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    checked: {
      control: "boolean",
      description: "Controlled checked state",
    },
    defaultChecked: {
      control: "boolean",
      description: "Default checked state (uncontrolled)",
    },
    disabled: {
      control: "boolean",
      description: "Disable the switch",
    },
    label: {
      control: "text",
      description: "Label text next to the switch",
    },
    onCheckedChange: {
      action: "checked changed",
      description: "Callback when checked state changes",
    },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

// Enabled switch
export const Enabled: Story = {
  args: {
    checked: true,
    label: "Enabled",
  },
};

// Disabled switch
export const Disabled: Story = {
  args: {
    checked: false,
    disabled: true,
    label: "Disabled",
  },
};

// Without label
export const WithoutLabel: Story = {
  args: {
    checked: false,
  },
};

// Controlled switch
export const Controlled: Story = {
  args: {
    checked: false,
    label: "Controlled",
  },
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Switch
          checked={checked}
          onCheckedChange={setChecked}
          label={checked ? "Enabled" : "Disabled"}
        />
        <p style={{ color: "#ffffff", fontSize: "14px" }}>
          Current state: {checked ? "Checked" : "Unchecked"}
        </p>
      </div>
    );
  },
  parameters: {
    layout: "padded",
  },
};

// Uncontrolled switch
export const Uncontrolled: Story = {
  args: {
    defaultChecked: false,
    label: "Uncontrolled Switch",
  },
};

// All states showcase
export const AllStates: Story = {
  args: {
    checked: false,
    label: "Switch",
  },
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        padding: "20px",
      }}
    >
      <Switch checked={true} label="Enabled" />
      <Switch checked={false} label="Disabled" />
      <Switch checked={true} disabled label="Enabled (Disabled)" />
      <Switch checked={false} disabled label="Disabled (Disabled)" />
      <Switch checked={true} />
      <Switch checked={false} />
    </div>
  ),
  parameters: {
    layout: "padded",
    controls: { disable: true },
  },
};

// Interactive example
export const Interactive: Story = {
  args: {
    checked: false,
    label: "Interactive Switch",
  },
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Switch
          checked={checked}
          onCheckedChange={setChecked}
          label={checked ? "Toggle ON" : "Toggle OFF"}
        />
        <button
          onClick={() => setChecked(!checked)}
          style={{
            padding: "8px 16px",
            backgroundColor: "#ecf15e",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            color: "#0e0f11",
            fontSize: "14px",
          }}
        >
          Toggle Programmatically
        </button>
      </div>
    );
  },
  parameters: {
    layout: "padded",
    controls: { disable: true },
  },
};
