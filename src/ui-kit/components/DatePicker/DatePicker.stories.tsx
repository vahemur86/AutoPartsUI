import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { DatePicker } from "./DatePicker";

const meta: Meta<typeof DatePicker> = {
  title: "UI Kit/DatePicker",
  component: DatePicker,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    dateFormat: {
      control: "text",
      description: "Format of the date",
    },
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
    disabled: {
      control: "boolean",
      description: "Disable the date picker",
    },
    showTimeSelect: {
      control: "boolean",
      description: "Show time selection",
    },
    isClearable: {
      control: "boolean",
      description: "Show clear button",
    },
    showMonthDropdown: {
      control: "boolean",
      description: "Show month dropdown",
    },
    showYearDropdown: {
      control: "boolean",
      description: "Show year dropdown",
    },
    inline: {
      control: "boolean",
      description: "Display calendar inline",
    },
  },
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

// Template for single date picker
const SingleDateTemplate = (args: any) => {
  const [date, setDate] = useState<Date | null>(new Date());

  // Remove selectsRange from args to avoid conflicts
  const { selectsRange, startDate, endDate, ...singleDateArgs } = args;

  return (
    <div style={{ width: "300px" }}>
      <DatePicker
        {...singleDateArgs}
        selected={date}
        onChange={(date) => setDate(date)}
      />
    </div>
  );
};

// Template for range date picker
const RangeDateTemplate = (args: any) => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Remove single date props to avoid conflicts
  const { selected, ...rangeDateArgs } = args;

  return (
    <div style={{ width: "300px" }}>
      <DatePicker
        {...rangeDateArgs}
        selectsRange
        startDate={startDate}
        endDate={endDate}
        onChange={([start, end]) => {
          setStartDate(start);
          setEndDate(end);
        }}
      />
    </div>
  );
};

// Basic Stories
export const Default: Story = {
  render: SingleDateTemplate,
  args: {
    placeholder: "Select a date",
  },
};

export const WithTime: Story = {
  render: SingleDateTemplate,
  args: {
    placeholder: "Select date and time",
    showTimeSelect: true,
  },
};

export const DateRange: Story = {
  render: RangeDateTemplate,
  args: {
    placeholder: "Select date range",
    isClearable: true,
  },
};

export const WithMonthYearDropdowns: Story = {
  render: SingleDateTemplate,
  args: {
    placeholder: "Select a date",
    showMonthDropdown: true,
    showYearDropdown: true,
    dropdownMode: "select" as const,
  },
};

export const WithMinMaxDates: Story = {
  render: SingleDateTemplate,
  args: {
    placeholder: "Select future date",
    minDate: new Date(),
    maxDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
  },
};

export const Clearable: Story = {
  render: SingleDateTemplate,
  args: {
    placeholder: "Select a date",
    isClearable: true,
  },
};

export const Disabled: Story = {
  render: SingleDateTemplate,
  args: {
    placeholder: "Disabled date picker",
    disabled: true,
  },
};

export const InlineCalendar: Story = {
  render: SingleDateTemplate,
  args: {
    inline: true,
  },
};

export const WeekdaysOnly: Story = {
  render: (args) => {
    const [date, setDate] = useState<Date | null>(null);

    const isWeekday = (date: Date) => {
      const day = date.getDay();
      return day !== 0 && day !== 6; // 0 = Sunday, 6 = Saturday
    };

    // Remove conflicting props
    const { selectsRange, startDate, endDate, ...singleDateArgs } = args;

    return (
      <div style={{ width: "300px" }}>
        <DatePicker
          {...singleDateArgs}
          selected={date}
          onChange={(date) => setDate(date)}
          filterDate={isWeekday}
        />
      </div>
    );
  },
  args: {
    placeholder: "Select a weekday",
  },
};

export const CustomDateFormat: Story = {
  render: SingleDateTemplate,
  args: {
    placeholder: "Select a date",
    dateFormat: "dd/MM/yyyy",
  },
};

export const ReadOnly: Story = {
  render: SingleDateTemplate,
  args: {
    placeholder: "Read only date picker",
    readOnly: true,
  },
};

export const TimeOnly: Story = {
  render: SingleDateTemplate,
  args: {
    placeholder: "Select time",
    showTimeSelect: true,
    showTimeSelectOnly: true,
    timeIntervals: 15,
    timeCaption: "Time",
    dateFormat: "h:mm aa",
  },
};
