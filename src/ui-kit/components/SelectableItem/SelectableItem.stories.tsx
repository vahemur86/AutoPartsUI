import type { Meta, StoryObj } from "@storybook/react";
import { SelectableItem } from "./SelectableItem";
import { Edit } from "lucide-react";
import { useState } from "react";

const meta = {
  title: "UI-Kit/SelectableItem",
  component: SelectableItem,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    state: {
      control: "select",
      options: ["default", "selected", "hovered", "disabled"],
      description: "Item state",
    },
    text: {
      control: "text",
      description: "Item text",
    },
    width: {
      control: "number",
      description: "Item width in pixels",
    },
  },
} satisfies Meta<typeof SelectableItem>;

export default meta;
type Story = StoryObj<typeof meta>;

// BMW Logo component for examples
const BMWLogo = () => (
  <div
    style={{
      width: "100%",
      height: "100%",
      backgroundColor: "#0066CC",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#ffffff",
      fontSize: "10px",
      fontWeight: "bold",
    }}
  >
    BMW
  </div>
);

export const Default: Story = {
  args: {
    state: "default",
    text: "BMW",
    icon: <BMWLogo />,
  },
};

export const Selected: Story = {
  args: {
    state: "selected",
    text: "BMW",
    icon: <BMWLogo />,
    editIcon: <Edit size={16} />,
    onEditClick: () => console.log("Edit clicked"),
  },
};

export const Hovered: Story = {
  args: {
    state: "hovered",
    text: "BMW",
    icon: <BMWLogo />,
    editIcon: <Edit size={16} />,
    onEditClick: () => console.log("Edit clicked"),
  },
};

export const Disabled: Story = {
  args: {
    state: "disabled",
    text: "BMW",
    icon: <BMWLogo />,
  },
};

export const AllStates: Story = {
  args: {
    text: "",
  },
  render: () => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          width: "212px",
        }}
      >
        <SelectableItem
          state="default"
          text="BMW"
          icon={<BMWLogo />}
          onClick={() => setSelectedId("1")}
        />
        <SelectableItem
          state={selectedId === "2" ? "selected" : "default"}
          text="BMW"
          icon={<BMWLogo />}
          editIcon={<Edit size={16} />}
          onClick={() => setSelectedId("2")}
          onEditClick={() => console.log("Edit clicked on selected item")}
        />
        <SelectableItem
          state="hovered"
          text="BMW"
          icon={<BMWLogo />}
          editIcon={<Edit size={16} />}
          onEditClick={() => console.log("Edit clicked on hovered item")}
        />
        <SelectableItem state="disabled" text="BMW" icon={<BMWLogo />} />
      </div>
    );
  },
  parameters: {
    controls: { disable: true },
  },
};

export const WithCustomWidth: Story = {
  args: {
    text: "",
  },
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <SelectableItem
        state="default"
        text="BMW"
        icon={<BMWLogo />}
        width={212}
      />
      <SelectableItem
        state="selected"
        text="Mercedes-Benz with longer text"
        icon={<BMWLogo />}
        editIcon={<Edit size={16} />}
        width={300}
      />
      <SelectableItem
        state="hovered"
        text="Audi"
        icon={<BMWLogo />}
        editIcon={<Edit size={16} />}
        width="100%"
      />
    </div>
  ),
  parameters: {
    controls: { disable: true },
  },
};
