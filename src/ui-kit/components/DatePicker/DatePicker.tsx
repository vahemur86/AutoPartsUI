import React from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./DatePicker.css";

interface BaseDatePickerProps {
  dateFormat?: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  showTimeSelect?: boolean;
  timeFormat?: string;
  timeIntervals?: number;
  isClearable?: boolean;
  showMonthDropdown?: boolean;
  showYearDropdown?: boolean;
  dropdownMode?: "select" | "scroll";
  className?: string;
  calendarClassName?: string;
  wrapperClassName?: string;
  excludeDates?: Date[];
  includeDates?: Date[];
  filterDate?: (date: Date) => boolean;
  inline?: boolean;
  monthsShown?: number;
  showWeekNumbers?: boolean;
  readOnly?: boolean;
  customInput?: React.ReactElement;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  [key: string]: any;
}

interface SingleDatePickerProps extends BaseDatePickerProps {
  selectsRange?: false;
  selected?: Date | null;
  onChange: (
    date: Date | null,
    event?: React.SyntheticEvent<any> | undefined,
  ) => void;
  startDate?: never;
  endDate?: never;
}

interface RangeDatePickerProps extends BaseDatePickerProps {
  selectsRange: true;
  selected?: never;
  onChange: (
    dates: [Date | null, Date | null],
    event?: React.SyntheticEvent<any> | undefined,
  ) => void;
  startDate?: Date | null;
  endDate?: Date | null;
}

type DatePickerProps = SingleDatePickerProps | RangeDatePickerProps;

export const DatePicker: React.FC<DatePickerProps> = ({
  dateFormat = "MM/dd/yyyy",
  placeholder = "Select date",
  minDate,
  maxDate,
  disabled = false,
  showTimeSelect = false,
  timeFormat = "HH:mm",
  timeIntervals = 15,
  selectsRange = false,
  isClearable = false,
  showMonthDropdown = false,
  showYearDropdown = false,
  dropdownMode = "select",
  className = "",
  calendarClassName = "",
  wrapperClassName = "",
  excludeDates = [],
  includeDates = [],
  filterDate,
  inline = false,
  monthsShown = 1,
  showWeekNumbers = false,
  readOnly = false,
  customInput,
  onBlur,
  onFocus,
  ...props
}) => {
  const finalDateFormat = showTimeSelect
    ? `${dateFormat} ${timeFormat}`
    : dateFormat;

  if (selectsRange) {
    const { startDate, endDate, onChange } = props as RangeDatePickerProps;
    return (
      <div className={`date-picker-wrapper ${wrapperClassName}`}>
        <ReactDatePicker
          selectsRange
          startDate={startDate}
          endDate={endDate}
          onChange={onChange as any}
          dateFormat={finalDateFormat}
          placeholderText={placeholder}
          minDate={minDate}
          maxDate={maxDate}
          disabled={disabled}
          showTimeSelect={showTimeSelect}
          timeFormat={timeFormat}
          timeIntervals={timeIntervals}
          isClearable={isClearable}
          showMonthDropdown={showMonthDropdown}
          showYearDropdown={showYearDropdown}
          dropdownMode={dropdownMode}
          className={`date-picker-input ${className}`}
          calendarClassName={`date-picker-calendar ${calendarClassName}`}
          excludeDates={excludeDates}
          includeDates={includeDates}
          filterDate={filterDate}
          inline={inline}
          monthsShown={monthsShown}
          showWeekNumbers={showWeekNumbers}
          readOnly={readOnly}
          customInput={customInput}
          onBlur={onBlur}
          onFocus={onFocus}
        />
      </div>
    );
  }

  const { selected, onChange } = props as SingleDatePickerProps;
  return (
    <div className={`date-picker-wrapper ${wrapperClassName}`}>
      <ReactDatePicker
        selected={selected}
        onChange={onChange as any}
        dateFormat={finalDateFormat}
        placeholderText={placeholder}
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        showTimeSelect={showTimeSelect}
        timeFormat={timeFormat}
        timeIntervals={timeIntervals}
        isClearable={isClearable}
        showMonthDropdown={showMonthDropdown}
        showYearDropdown={showYearDropdown}
        dropdownMode={dropdownMode}
        className={`date-picker-input ${className}`}
        calendarClassName={`date-picker-calendar ${calendarClassName}`}
        excludeDates={excludeDates}
        includeDates={includeDates}
        filterDate={filterDate}
        inline={inline}
        monthsShown={monthsShown}
        showWeekNumbers={showWeekNumbers}
        readOnly={readOnly}
        customInput={customInput}
        onBlur={onBlur}
        onFocus={onFocus}
      />
    </div>
  );
};
