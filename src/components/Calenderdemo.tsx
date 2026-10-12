import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const [selectedYear, setSelectedYear] = React.useState(currentYear);
  const [selectedMonth, setSelectedMonth] = React.useState(currentMonth);

  // Generate future years dynamically (current year to +100 years)
  const years = Array.from({ length: 100 }, (_, i) => currentYear + i);
  const months = Array.from({ length: 12 }, (_, i) => i);

  // Handle Previous & Next Navigation
  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedYear((prev) => prev - 1);
      setSelectedMonth(11);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedYear((prev) => prev + 1);
      setSelectedMonth(0);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  // Debug: Log selected year and month
  React.useEffect(() => {
    console.log("Selected Year:", selectedYear, "Selected Month:", selectedMonth);
    console.log("Month Prop:", new Date(selectedYear, selectedMonth, 1));
  }, [selectedYear, selectedMonth]);

  return (
    <div className="p-2 border border-gray-300 rounded-lg shadow-md bg-white w-fit">
      {/* Year & Month Selection */}
      <div className="flex items-center space-x-2 justify-center mb-2">
        {/* Month Dropdown */}
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="border border-gray-300 bg-white px-2 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {months.map((month) => (
            <option key={month} value={month}>
              {new Date(0, month).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>

        {/* Year Dropdown */}
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="border border-gray-300 bg-white px-2 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Calendar Component */}
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-3", className)}
        classNames={{
          months: "flex flex-col space-y-4",
          month: "space-y-4",
          caption: "flex justify-between pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          ),
          nav_button_previous: "left-1",
          nav_button_next: "right-1",
          table: "w-full border-collapse",
          head_row: "flex justify-center",
          head_cell:
            "text-gray-500 rounded-md w-8 font-normal text-[0.8rem] dark:text-gray-400",
          row: "flex w-full mt-2",
          cell: cn(
            "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-gray-100 [&:has([aria-selected].day-outside)]:bg-gray-100/50 [&:has([aria-selected].day-range-end)]:rounded-r-md dark:[&:has([aria-selected])]:bg-gray-800 dark:[&:has([aria-selected].day-outside)]:bg-gray-800/50",
            props.mode === "range"
              ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
              : "[&:has([aria-selected])]:rounded-md"
          ),
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-8 w-8 p-0 font-normal aria-selected:opacity-100"
          ),
          day_range_start: "day-range-start",
          day_range_end: "day-range-end",
          day_selected:
            "bg-blue-500 text-white hover:bg-blue-600 focus:bg-blue-600",
          day_today: "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white",
          day_outside:
            "text-gray-500 aria-selected:bg-gray-100/50 aria-selected:text-gray-500 dark:text-gray-400 dark:aria-selected:bg-gray-800/50 dark:aria-selected:text-gray-400",
          day_disabled: "text-gray-300 opacity-50",
        }}
        components={{
          IconLeft: ({ className, ...props }) => (
            <button onClick={goToPreviousMonth} className="mr-2">
              <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
            </button>
          ),
          IconRight: ({ className, ...props }) => (
            <button onClick={goToNextMonth} className="ml-2">
              <ChevronRight className={cn("h-4 w-4", className)} {...props} />
            </button>
          ),
        }}
        {...props}
        month={new Date(selectedYear, selectedMonth, 1)} // Set selected year & month
        disabled={(date) => date < today} // Disable past dates
      />
    </div>
  );
}

Calendar.displayName = "Calendar";

export { Calendar };