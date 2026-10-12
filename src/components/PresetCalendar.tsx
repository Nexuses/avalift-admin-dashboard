"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import {
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  subYears,
} from "date-fns";

interface PresetCalendarProps {
  selected: DateRange | undefined;
  onSelect: (d: DateRange | undefined) => void;
}

const PresetCalendar = ({ selected, onSelect }: PresetCalendarProps) => {
  const today = new Date();
  const yesterday = { from: subDays(today, 1), to: subDays(today, 1) };
  const last7Days = { from: subDays(today, 6), to: today };
  const last30Days = { from: subDays(today, 29), to: today };
  const monthToDate = { from: startOfMonth(today), to: today };
  const lastMonth = { from: startOfMonth(subMonths(today, 1)), to: endOfMonth(subMonths(today, 1)) };
  const yearToDate = { from: startOfYear(today), to: today };
  const lastYear = { from: startOfYear(subYears(today, 1)), to: endOfYear(subYears(today, 1)) };

  const [month, setMonth] = useState(today);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handlePreset = (preset: string, range: DateRange) => {
    setSelectedPreset(preset);
    onSelect(range);
    setMonth(range.to ?? today);
  };

  return (
    <div>
      <div className="flex max-sm:flex-col">
        {/* Preset Buttons */}
        <div>
          <div className="border-border sm:border-e">
            <div className="flex flex-col">
              <Button
                variant="ghost"
                size="sm"
                className={`w-full justify-start ${
                  selectedPreset === "today" ? "bg-black text-white" : ""
                }`}
                onClick={() => handlePreset("today", { from: today, to: today })}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`w-full justify-start ${
                  selectedPreset === "yesterday" ? "bg-black text-white" : ""
                }`}
                onClick={() => handlePreset("yesterday", yesterday)}
              >
                Yesterday
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`w-full justify-start ${
                  selectedPreset === "last7Days" ? "bg-black text-white" : ""
                }`}
                onClick={() => handlePreset("last7Days", last7Days)}
              >
                Last 7 days
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`w-full justify-start ${
                  selectedPreset === "last30Days" ? "bg-black text-white" : ""
                }`}
                onClick={() => handlePreset("last30Days", last30Days)}
              >
                Last 30 days
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`w-full justify-start ${
                  selectedPreset === "monthToDate" ? "bg-black text-white" : ""
                }`}
                onClick={() => handlePreset("monthToDate", monthToDate)}
              >
                Month to date
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`w-full justify-start ${
                  selectedPreset === "lastMonth" ? "bg-black text-white" : ""
                }`}
                onClick={() => handlePreset("lastMonth", lastMonth)}
              >
                Last month
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`w-full justify-start ${
                  selectedPreset === "yearToDate" ? "bg-black text-white" : ""
                }`}
                onClick={() => handlePreset("yearToDate", yearToDate)}
              >
                Year to date
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`w-full justify-start ${
                  selectedPreset === "lastYear" ? "bg-black text-white" : ""
                }`}
                onClick={() => handlePreset("lastYear", lastYear)}
              >
                Last year
              </Button>
            </div>
          </div>
        </div>

        {/* The Calendar in range mode */}
        <div className="w-50"> {/* Adjust container width as needed */}
          <Calendar
            mode="range"
            selected={selected}
            onSelect={(newDate) => {
              if (newDate) {
                onSelect(newDate);
                setSelectedPreset(null); // clear preset highlight if manually selecting dates
              }
            }}
            month={month}
            onMonthChange={setMonth}
            className="p-1 bg-background" // Reduced padding for a smaller appearance
            disabled={[{ after: today }]}
            classNames={{
              nav_button:
                "relative flex size-9 items-center justify-center whitespace-nowrap rounded-lg p-0 hover:bg-black",
              day_selected: "bg-black text-white",
              day_range_start: "bg-black text-white",
              day_range_middle: "bg-gray-400 text-white",
              day_range_end: "bg-black text-white",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PresetCalendar;
