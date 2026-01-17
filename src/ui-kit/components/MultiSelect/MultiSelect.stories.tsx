import { useState } from "storybook/internal/preview-api";

// components
import { MultiSelect, type MultiSelectOption } from "./MultiSelect";

// types
import type { Meta, StoryObj } from "@storybook/react";

const mockOptions: MultiSelectOption[] = [
  { value: "volvo", label: "Volvo XC90" },
  { value: "saab", label: "Saab 9-3" },
  { value: "mercedes", label: "Mercedes-Benz G-Class" },
  { value: "audi", label: "Audi RS6" },
  { value: "bmw", label: "BMW M5" },
  { value: "porsche", label: "Porsche 911" },
  { value: "tesla", label: "Tesla Model S", disabled: true },
];

const meta: Meta<typeof MultiSelect> = {
  title: "UI Kit/MultiSelect",
  component: MultiSelect,
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
    options: { control: "object" },
  },
};

export default meta;
type Story = StoryObj<typeof MultiSelect>;

export const Default: Story = {
  args: {
    label: "Vehicles",
    placeholder: "Select vehicles...",
    options: mockOptions,
  },
};

export const WithSelectedValues: Story = {
  args: {
    label: "Vehicles",
    defaultValue: ["volvo", "audi"],
    options: mockOptions,
  },
};

export const OverflowTest: Story = {
  args: {
    label: "Overflow Truncation Test",
    defaultValue: ["volvo", "saab", "mercedes", "audi", "bmw"],
    options: mockOptions,
  },
  render: (args) => (
    <div style={{ maxWidth: "300px" }}>
      <MultiSelect {...args} />
    </div>
  ),
};

export const Error: Story = {
  args: {
    label: "Vehicles",
    error: true,
    helperText: "Please select at least one vehicle",
    options: mockOptions,
  },
};

export const Disabled: Story = {
  args: {
    label: "Vehicles",
    disabled: true,
    defaultValue: ["porsche"],
    options: mockOptions,
  },
};

export const Interactive: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [selected, setSelected] = useState<string[]>([]);
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          maxWidth: "400px",
        }}
      >
        <MultiSelect
          label="Interactive Select"
          placeholder="Choose brands..."
          options={mockOptions}
          value={selected}
          onChange={setSelected}
        />
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>
          <strong>Selected IDs:</strong>{" "}
          {selected.length > 0 ? selected.join(", ") : "None"}
        </div>
      </div>
    );
  },
};

export const AllStates: Story = {
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
      <MultiSelect label="Default" options={mockOptions} />
      <MultiSelect
        label="With Helper"
        helperText="Choose your fleet"
        options={mockOptions}
      />
      <MultiSelect
        label="Error State"
        error
        helperText="Selection is required"
        options={mockOptions}
      />
      <MultiSelect
        label="Disabled State"
        disabled
        options={mockOptions}
        defaultValue={["volvo"]}
      />
    </div>
  ),
};
