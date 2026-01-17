import { useState } from "storybook/internal/preview-api";

// types
import type { Meta, StoryObj } from "@storybook/react";

// components
import { Checkbox } from "./Checkbox";

const meta = {
  title: "UI-Kit/Checkbox",
  component: Checkbox,
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
      description: "Disable the checkbox",
    },
    label: {
      control: "text",
      description: "Label text next to the checkbox",
    },
    shape: {
      control: "select",
      options: ["square", "circle"],
      description: "Shape of the checkbox",
    },
    onCheckedChange: {
      action: "checked changed",
      description: "Callback when checked state changes",
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

// Checked checkbox
export const Checked: Story = {
  args: {
    checked: true,
    label: "Use as Default language",
  },
};

// Without label
export const WithoutLabel: Story = {
  args: {
    checked: false,
  },
};

// Controlled checkbox
export const Controlled: Story = {
  args: {
    checked: false,
    label: "Use as Default language",
  },
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [checked, setChecked] = useState(false);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Checkbox
          checked={checked}
          onCheckedChange={setChecked}
          label={
            checked ? "Use as Default language" : "Use as Default language"
          }
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

// Uncontrolled checkbox
export const Uncontrolled: Story = {
  args: {
    defaultChecked: false,
    label: "Use as Default language",
  },
};

// All states showcase
export const AllStates: Story = {
  args: {
    checked: false,
    label: "Use as Default language",
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
      <Checkbox checked={true} label="Use as Default language" />
      <Checkbox checked={false} label="Use as Default language" />
      <Checkbox checked={true} disabled label="Use as Default language" />
      <Checkbox checked={false} disabled label="Use as Default language" />
      <Checkbox checked={true} />
      <Checkbox checked={false} />
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
    label: "Use as Default language",
  },
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [checked, setChecked] = useState(false);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Checkbox
          checked={checked}
          onCheckedChange={setChecked}
          label="Use as Default language"
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

// Circle checkbox stories
export const CircleChecked: Story = {
  args: {
    shape: "circle",
    checked: true,
    label: "Translation",
  },
};
export const CircleAllStates: Story = {
  args: {
    shape: "circle",
    checked: false,
    label: "Translation",
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
      <Checkbox shape="circle" checked={false} label="Translation" />
      <Checkbox shape="circle" checked={true} label="Translation" />
      <Checkbox shape="circle" checked={false} disabled label="Translation" />
      <Checkbox shape="circle" checked={true} disabled label="Translation" />
      <Checkbox shape="circle" checked={false} />
      <Checkbox shape="circle" checked={true} />
    </div>
  ),
  parameters: {
    layout: "padded",
    controls: { disable: true },
  },
};

export const CircleInteractive: Story = {
  args: {
    shape: "circle",
    checked: false,
    label: "Translation",
  },
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [checked, setChecked] = useState(false);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <Checkbox
          shape="circle"
          checked={checked}
          onCheckedChange={setChecked}
          label="Translation"
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

export const SquareAndCircle: Story = {
  args: {
    checked: false,
    label: "Use as Default language",
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
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h3 style={{ color: "#ffffff", fontSize: "16px", margin: 0 }}>
          Square Checkboxes
        </h3>
        <Checkbox shape="square" checked={true} label="Checked" />
        <Checkbox shape="square" checked={false} label="Unchecked" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h3 style={{ color: "#ffffff", fontSize: "16px", margin: 0 }}>
          Circle Checkboxes
        </h3>
        <Checkbox shape="circle" checked={true} label="Translation" />
        <Checkbox shape="circle" checked={false} label="Translation" />
      </div>
    </div>
  ),
  parameters: {
    layout: "padded",
    controls: { disable: true },
  },
};
