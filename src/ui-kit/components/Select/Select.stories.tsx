import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "./Select";

const meta: Meta<typeof Select> = {
  title: "UI Kit/Select",
  component: Select,
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
      description: "Label text above the select",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
    disabled: {
      control: "boolean",
      description: "Disable the select",
    },
    error: {
      control: "boolean",
      description: "Show error state",
    },
    helperText: {
      control: "text",
      description: "Helper text below the select",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  args: {
    label: "Language code",
    placeholder: "Select",
    children: (
      <>
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
        <option value="de">German</option>
      </>
    ),
  },
};

export const WithPlaceholder: Story = {
  args: {
    label: "Language code",
    placeholder: "Select",
    children: (
      <>
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
        <option value="de">German</option>
      </>
    ),
  },
};

export const WithHelperText: Story = {
  args: {
    label: "Language code",
    placeholder: "Select",
    helperText: "Please select a language",
    children: (
      <>
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
        <option value="de">German</option>
      </>
    ),
  },
};

export const Error: Story = {
  args: {
    label: "Language code",
    placeholder: "Select",
    error: true,
    helperText: "Please select a language",
    children: (
      <>
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
        <option value="de">German</option>
      </>
    ),
  },
};

export const Disabled: Story = {
  args: {
    label: "Language code",
    placeholder: "Select",
    disabled: true,
    children: (
      <>
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
        <option value="de">German</option>
      </>
    ),
  },
};

export const AllStates: Story = {
  args: {
    label: "Language code",
    placeholder: "Select",
  },
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        padding: "20px",
        maxWidth: "500px",
      }}
    >
      <Select label="Language code" placeholder="Select">
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
        <option value="de">German</option>
      </Select>
      <Select label="Language code" placeholder="Select">
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
        <option value="de">German</option>
      </Select>
      <Select label="Language code" placeholder="Select">
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
        <option value="de">German</option>
      </Select>
      <Select label="Language code" placeholder="Select" disabled>
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
        <option value="de">German</option>
      </Select>
    </div>
  ),
  parameters: {
    controls: { disable: true },
  },
};

export const Interactive: Story = {
  args: {
    label: "Language code",
    placeholder: "Select",
  },
  render: () => {
    const [value, setValue] = React.useState("");
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          maxWidth: "400px",
        }}
      >
        <Select
          label="Language code"
          placeholder="Select"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
          <option value="pt">Portuguese</option>
        </Select>
        <p style={{ color: "#ffffff", fontSize: "14px" }}>
          Selected value: {value || "(none)"}
        </p>
      </div>
    );
  },
  parameters: {
    controls: { disable: true },
  },
};
