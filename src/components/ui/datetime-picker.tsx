'use client';
import React, { useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar"; // Ensure this component exists

interface DateTimePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  className?: string;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({ value, onChange, className }) => {
  const [time, setTime] = useState(value ? format(value, "HH:mm") : "12:00");

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const [hours, minutes] = time.split(":").map(Number);
      date.setHours(hours, minutes);
      onChange(date);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.value);
    const [hours, minutes] = e.target.value.split(":").map(Number);
    const updatedDate = value ? new Date(value) : new Date();
    updatedDate.setHours(hours, minutes);
    onChange(updatedDate);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <Calendar
        mode="single"
        selected={value}
        onSelect={handleDateChange}
        className="rounded-md border shadow"
      />
      <input
        type="time"
        value={time}
        onChange={handleTimeChange}
        className="p-2 border rounded-md w-full"
      />
    </div>
  );
};
