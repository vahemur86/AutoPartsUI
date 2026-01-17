import { useState } from "storybook/internal/preview-api";

// types
import type { Meta, StoryObj } from "@storybook/react";

// components
import { InteractiveField } from "./InteractiveField";

// icons
import { X, Check, Edit, Trash2 } from "lucide-react";

const meta = {
  title: "UI-Kit/InteractiveField",
  component: InteractiveField,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["editable", "display"],
      description: "Field variant",
    },
    size: {
      control: "select",
      options: ["medium", "large"],
      description: "Field size",
    },
    disabled: {
      control: "boolean",
      description: "Disable the field",
    },
  },
} satisfies Meta<typeof InteractiveField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EditableWithPhotoUpload: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [textValue, setTextValue] = useState("Name here");
    return (
      <div style={{ maxWidth: "900px" }}>
        <InteractiveField
          variant="editable"
          photoUpload={{
            icon: (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            ),
            onUpload: (file) => {
              console.log("File uploaded:", file.name);
            },
          }}
          textInput={{
            value: textValue,
            onChange: (value) => setTextValue(value),
            placeholder: "Name here",
          }}
          actions={{
            cancel: {
              icon: <X size={16} />,
              onClick: () => {
                console.log("Cancel clicked");
                setTextValue("Name here");
              },
              ariaLabel: "Cancel",
            },
            save: {
              icon: <Check size={16} />,
              onClick: () => {
                console.log("Save clicked", textValue);
              },
              ariaLabel: "Save",
            },
          }}
        />
      </div>
    );
  },
  parameters: {
    controls: { disable: true },
  },
};

export const EditableWithoutPhoto: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [textValue, setTextValue] = useState("Name here");
    return (
      <div style={{ maxWidth: "900px" }}>
        <InteractiveField
          variant="editable"
          textInput={{
            value: textValue,
            onChange: (value) => setTextValue(value),
            placeholder: "Name here",
          }}
          actions={{
            cancel: {
              icon: <X size={16} />,
              onClick: () => {
                console.log("Cancel clicked");
                setTextValue("Name here");
              },
              ariaLabel: "Cancel",
            },
            save: {
              icon: <Check size={16} />,
              onClick: () => {
                console.log("Save clicked", textValue);
              },
              ariaLabel: "Save",
            },
          }}
        />
      </div>
    );
  },
  parameters: {
    controls: { disable: true },
  },
};

export const DisplayWithToggleAndActions: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [toggleChecked, setToggleChecked] = useState(true);
    return (
      <div style={{ maxWidth: "900px" }}>
        <InteractiveField
          variant="display"
          displayIcon={
            <div
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "#0066CC",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              BMW
            </div>
          }
          displayText="BMW"
          toggle={{
            checked: toggleChecked,
            onCheckedChange: setToggleChecked,
            label: "Enabled",
          }}
          actions={{
            edit: {
              icon: <Edit size={16} />,
              onClick: () => console.log("Edit clicked"),
              ariaLabel: "Edit",
            },
            delete: {
              icon: <Trash2 size={16} />,
              onClick: () => console.log("Delete clicked"),
              ariaLabel: "Delete",
            },
          }}
        />
      </div>
    );
  },
  parameters: {
    controls: { disable: true },
  },
};

export const DisplayDisabled: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [toggleChecked, setToggleChecked] = useState(false);
    return (
      <div style={{ maxWidth: "900px" }}>
        <InteractiveField
          variant="display"
          disabled
          displayText="Name here"
          toggle={{
            checked: toggleChecked,
            onCheckedChange: setToggleChecked,
            label: "Enabled",
          }}
          actions={{
            edit: {
              icon: <Edit size={16} />,
              onClick: () => console.log("Edit clicked"),
              ariaLabel: "Edit",
            },
            delete: {
              icon: <Trash2 size={16} />,
              onClick: () => console.log("Delete clicked"),
              ariaLabel: "Delete",
            },
          }}
        />
      </div>
    );
  },
  parameters: {
    controls: { disable: true },
  },
};

export const AllVariants: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [textValue1, setTextValue1] = useState("Name here");

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [textValue2, setTextValue2] = useState("Name here");

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [toggle1, setToggle1] = useState(true);

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [toggle2, setToggle2] = useState(false);

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        {/* Top Left: Editable with Photo */}
        <InteractiveField
          variant="editable"
          photoUpload={{
            icon: (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            ),
            onUpload: (file) => console.log("File uploaded:", file.name),
          }}
          textInput={{
            value: textValue1,
            onChange: (value) => setTextValue1(value),
            placeholder: "Name here",
          }}
          actions={{
            cancel: {
              icon: <X size={16} />,
              onClick: () => setTextValue1("Name here"),
              ariaLabel: "Cancel",
            },
            save: {
              icon: <Check size={16} />,
              onClick: () => console.log("Save clicked"),
              ariaLabel: "Save",
            },
          }}
        />

        {/* Top Right: Editable without Photo */}
        <InteractiveField
          variant="editable"
          textInput={{
            value: textValue2,
            onChange: (value) => setTextValue2(value),
            placeholder: "Name here",
          }}
          actions={{
            cancel: {
              icon: <X size={16} />,
              onClick: () => setTextValue2("Name here"),
              ariaLabel: "Cancel",
            },
            save: {
              icon: <Check size={16} />,
              onClick: () => console.log("Save clicked"),
              ariaLabel: "Save",
            },
          }}
        />

        {/* Bottom Left: Display with Toggle Enabled */}
        <InteractiveField
          variant="display"
          displayIcon={
            <div
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "#0066CC",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              BMW
            </div>
          }
          displayText="BMW"
          toggle={{
            checked: toggle1,
            onCheckedChange: setToggle1,
            label: "Enabled",
          }}
          actions={{
            edit: {
              icon: <Edit size={16} />,
              onClick: () => console.log("Edit clicked"),
              ariaLabel: "Edit",
            },
            delete: {
              icon: <Trash2 size={16} />,
              onClick: () => console.log("Delete clicked"),
              ariaLabel: "Delete",
            },
          }}
        />

        {/* Bottom Right: Display Disabled */}
        <InteractiveField
          variant="display"
          disabled
          displayText="Name here"
          toggle={{
            checked: toggle2,
            onCheckedChange: setToggle2,
            label: "Enabled",
          }}
          actions={{
            edit: {
              icon: <Edit size={16} />,
              onClick: () => console.log("Edit clicked"),
              ariaLabel: "Edit",
            },
            delete: {
              icon: <Trash2 size={16} />,
              onClick: () => console.log("Delete clicked"),
              ariaLabel: "Delete",
            },
          }}
        />
      </div>
    );
  },
  parameters: {
    layout: "padded",
    controls: { disable: true },
  },
};
