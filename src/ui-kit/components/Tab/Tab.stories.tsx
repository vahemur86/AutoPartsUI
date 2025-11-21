import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Tab } from "./Tab";
import { TabGroup } from "./TabGroup";
import {
  Globe,
  Languages,
  Warehouse,
  ShoppingBag,
  Settings,
} from "lucide-react";

const meta: Meta<typeof Tab> = {
  title: "UI Kit/Tab",
  component: Tab,
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
    variant: {
      control: "select",
      options: ["underline", "leftBorder", "vertical", "segmented"],
      description: "The visual style variant of the tab",
    },
    active: {
      control: "boolean",
      description: "Whether the tab is active/selected",
    },
    text: {
      control: "text",
      description: "The text content of the tab",
    },
    showCheckmark: {
      control: "boolean",
      description: "Whether to show a checkmark icon",
    },
    disabled: {
      control: "boolean",
      description: "Whether the tab is disabled",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tab>;

export const UnderlineVariants: Story = {
  args: {
    variant: "underline",
    active: false,
    text: "Settings",
  },
  render: () => (
    <div style={{ display: "flex", gap: "24px", padding: "20px" }}>
      <Tab variant="underline" active={false} text="Settings" />
      <Tab variant="underline" active={true} text="Settings" />
      <Tab variant="underline" active={false} text="Settings" />
    </div>
  ),
  parameters: {
    controls: { disable: true },
  },
};

export const LeftBorderAllStates: Story = {
  args: {
    variant: "leftBorder",
    active: false,
    text: "Project Languages",
    showCheckmark: true,
    icon: <Globe size={20} color="#ffffff" />,
  },
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "12px",
        padding: "20px",
        maxWidth: "800px",
      }}
    >
      <Tab
        variant="leftBorder"
        active={false}
        text="Project Languages"
        showCheckmark={true}
        icon={<Globe size={20} color="#ffffff" />}
      />
      <Tab
        variant="leftBorder"
        active={false}
        text="Translation"
        showCheckmark={true}
        icon={<Languages size={20} color="#ffffff" />}
      />
      <Tab
        variant="leftBorder"
        active={false}
        text="Warehouse"
        showCheckmark={true}
        icon={<Warehouse size={20} color="#ffffff" />}
      />
      <Tab
        variant="leftBorder"
        active={false}
        text="Shops"
        showCheckmark={true}
        icon={<ShoppingBag size={20} color="#ffffff" />}
      />
      <Tab
        variant="leftBorder"
        active={true}
        text="Project Languages"
        showCheckmark={true}
        icon={<Globe size={20} color="#ffffff" />}
      />
      <Tab
        variant="leftBorder"
        active={true}
        text="Translation"
        showCheckmark={true}
        icon={<Languages size={20} color="#ffffff" />}
      />
      <Tab
        variant="leftBorder"
        active={true}
        text="Warehouse"
        showCheckmark={true}
        icon={<Warehouse size={20} color="#ffffff" />}
      />
      <Tab
        variant="leftBorder"
        active={true}
        text="Shops"
        showCheckmark={true}
        icon={<ShoppingBag size={20} color="#ffffff" />}
      />
    </div>
  ),
  parameters: {
    controls: { disable: true },
  },
};

export const VerticalNavigation: Story = {
  args: {
    variant: "vertical",
    active: false,
    text: "Project Languages",
    showCheckmark: true,
    icon: <Globe size={20} color="#ffffff" />,
  },
  render: () => (
    <div style={{ padding: "20px", maxWidth: "300px" }}>
      <Tab
        variant="vertical"
        active={true}
        text="Project Languages"
        showCheckmark={true}
        icon={<Globe size={20} color="#ffffff" />}
      />
      <Tab
        variant="vertical"
        active={false}
        text="Translation"
        showCheckmark={true}
        icon={<Languages size={20} color="#ffffff" />}
      />
      <Tab
        variant="vertical"
        active={false}
        text="Warehouse"
        showCheckmark={true}
        icon={<Warehouse size={20} color="#ffffff" />}
      />
      <Tab
        variant="vertical"
        active={false}
        text="Shops"
        showCheckmark={true}
        icon={<ShoppingBag size={20} color="#ffffff" />}
      />
      <Tab
        variant="vertical"
        active={false}
        text="Product Settings"
        showCheckmark={true}
        icon={<Settings size={20} color="#ffffff" />}
      />
    </div>
  ),
  parameters: {
    controls: { disable: true },
  },
};

export const WithoutIcon: Story = {
  args: {
    variant: "leftBorder",
    active: true,
    text: "Project Languages",
    showCheckmark: true,
  },
  render: () => (
    <div style={{ padding: "20px" }}>
      <Tab
        variant="leftBorder"
        active={true}
        text="Project Languages"
        showCheckmark={true}
      />
      <Tab
        variant="leftBorder"
        active={false}
        text="Translation"
        showCheckmark={true}
      />
    </div>
  ),
  parameters: {
    controls: { disable: true },
  },
};

export const Interactive: Story = {
  args: {
    variant: "underline",
    active: false,
    text: "Settings",
  },
  render: () => {
    const [activeTab, setActiveTab] = React.useState("settings");
    return (
      <div style={{ padding: "20px" }}>
        <div style={{ display: "flex", gap: "24px", marginBottom: "40px" }}>
          <Tab
            variant="underline"
            active={activeTab === "settings"}
            text="Settings"
            onClick={() => setActiveTab("settings")}
          />
          <Tab
            variant="underline"
            active={activeTab === "profile"}
            text="Profile"
            onClick={() => setActiveTab("profile")}
          />
          <Tab
            variant="underline"
            active={activeTab === "account"}
            text="Account"
            onClick={() => setActiveTab("account")}
          />
        </div>
        <div style={{ marginTop: "20px" }}>
          <p style={{ color: "#ffffff" }}>Active tab: {activeTab}</p>
        </div>
      </div>
    );
  },
  parameters: {
    controls: { disable: true },
  },
};

export const SegmentedControl: Story = {
  args: {
    variant: "segmented",
    active: true,
    text: "Add New Translation",
  },
  render: () => (
    <div style={{ padding: "20px" }}>
      <TabGroup>
        <Tab
          variant="segmented"
          active={true}
          text="Add New Translation"
          onClick={() => {}}
        />
        <Tab
          variant="segmented"
          active={false}
          text="Translation History"
          onClick={() => {}}
        />
      </TabGroup>
    </div>
  ),
  parameters: {
    controls: { disable: true },
  },
};

export const SegmentedControlInverted: Story = {
  args: {
    variant: "segmented",
    active: false,
    text: "Add New Translation",
  },
  render: () => (
    <div style={{ padding: "20px" }}>
      <TabGroup>
        <Tab
          variant="segmented"
          active={false}
          text="Add New Translation"
          onClick={() => {}}
        />
        <Tab
          variant="segmented"
          active={true}
          text="Translation History"
          onClick={() => {}}
        />
      </TabGroup>
    </div>
  ),
  parameters: {
    controls: { disable: true },
  },
};

export const SegmentedControlInteractive: Story = {
  args: {
    variant: "segmented",
    active: true,
    text: "Add New Translation",
  },
  render: () => {
    const [activeSegment, setActiveSegment] = React.useState("add");
    return (
      <div style={{ padding: "20px" }}>
        <TabGroup>
          <Tab
            variant="segmented"
            active={activeSegment === "add"}
            text="Add New Translation"
            onClick={() => setActiveSegment("add")}
          />
          <Tab
            variant="segmented"
            active={activeSegment === "history"}
            text="Translation History"
            onClick={() => setActiveSegment("history")}
          />
        </TabGroup>
        <div style={{ marginTop: "20px" }}>
          <p style={{ color: "#ffffff", fontSize: "14px" }}>
            Active segment:{" "}
            {activeSegment === "add"
              ? "Add New Translation"
              : "Translation History"}
          </p>
        </div>
      </div>
    );
  },
  parameters: {
    controls: { disable: true },
  },
};
