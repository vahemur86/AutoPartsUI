import {
  type FC,
  type FocusEvent,
  type ReactElement,
  type SyntheticEvent,
} from "react";

// components
import ReactDatePicker from "react-datepicker";

// styles
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
  customInput?: ReactElement;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  onSelect?: (
    date: Date,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event?: SyntheticEvent<any> | undefined,
  ) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface SingleDatePickerProps extends BaseDatePickerProps {
  selectsRange?: false;
  selected?: Date | null;
  onChange: (
    date: Date | null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event?: SyntheticEvent<any> | undefined,
  ) => void;
  startDate?: never;
  endDate?: never;
}

interface RangeDatePickerProps extends BaseDatePickerProps {
  selectsRange: true;
  selected?: never;
  onChange: (
    dates: [Date | null, Date | null],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event?: SyntheticEvent<any> | undefined,
  ) => void;
  startDate?: Date | null;
  endDate?: Date | null;
}

type DatePickerProps = SingleDatePickerProps | RangeDatePickerProps;

export const DatePicker: FC<DatePickerProps> = ({
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
  excludeDates,
  includeDates,
  filterDate,
  inline = false,
  monthsShown = 1,
  showWeekNumbers = false,
  readOnly = false,
  customInput,
  onBlur,
  onFocus,
  onSelect,
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
          onChange={onChange}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onSelect={onSelect as any}
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
        onChange={onChange}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onSelect={onSelect as any}
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
