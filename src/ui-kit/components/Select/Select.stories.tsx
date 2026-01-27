import { useState } from "storybook/internal/preview-api";

// components
import { Select } from "./Select";

// types
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof Select> = {
  title: "UI-Kit/Select",
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
    searchable: {
      control: "boolean",
      description: "Enable internal filtering of options",
    },
    searchPlaceholder: {
      control: "text",
      description: "Placeholder for the search input",
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const standardOptions = (
  <>
    <option value="en">English</option>
    <option value="es">Spanish</option>
    <option value="fr">French</option>
    <option value="de">German</option>
  </>
);

export const Default: Story = {
  args: {
    label: "Language code",
    placeholder: "Select",
    children: standardOptions,
  },
};

export const Searchable: Story = {
  args: {
    label: "Searchable Language",
    placeholder: "Select language",
    searchable: true,
    searchPlaceholder: "Search for a language...",
    children: (
      <>
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
        <option value="de">German</option>
        <option value="it">Italian</option>
        <option value="pt">Portuguese</option>
        <option value="ru">Russian</option>
        <option value="jp">Japanese</option>
        <option value="cn">Chinese</option>
        <option value="kr">Korean</option>
      </>
    ),
  },
};

export const WithHelperText: Story = {
  args: {
    label: "Language code",
    placeholder: "Select",
    helperText: "Please select a language",
    children: standardOptions,
  },
};

export const ErrorState: Story = {
  args: {
    label: "Language code",
    placeholder: "Select",
    error: true,
    helperText: "This field is required",
    children: standardOptions,
  },
};

export const Disabled: Story = {
  args: {
    label: "Language code",
    placeholder: "Select",
    disabled: true,
    children: standardOptions,
  },
};

export const AllStates: Story = {
  parameters: {
    controls: { disable: true },
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
      <Select label="Default" placeholder="Select">
        {standardOptions}
      </Select>
      <Select label="Searchable" placeholder="Search..." searchable>
        {standardOptions}
      </Select>
      <Select
        label="Error State"
        placeholder="Select"
        error
        helperText="Invalid selection"
      >
        {standardOptions}
      </Select>
      <Select label="Disabled" placeholder="Select" disabled>
        {standardOptions}
      </Select>
    </div>
  ),
};

export const Interactive: Story = {
  parameters: {
    controls: { disable: true },
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
        <Select
          label="Interactive Select"
          placeholder="Select"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          searchable
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
          <option value="pt">Portuguese</option>
        </Select>
        <p style={{ color: "#ffffff", fontSize: "14px", opacity: 0.6 }}>
          Selected value:{" "}
          <span
            style={{ color: "var(--color-primary-500)", fontWeight: "bold" }}
          >
            {value || "(none)"}
          </span>
        </p>
      </div>
    );
  },
};
