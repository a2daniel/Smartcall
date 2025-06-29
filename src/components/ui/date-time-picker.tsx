"use client";
import React, { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import "react-datepicker/dist/react-datepicker.css";

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  required?: boolean;
}

export default function DateTimePicker({
  value,
  onChange,
  placeholder = "Select date and time",
  className,
  id,
  required = false,
}: DateTimePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  );
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  // Convert datetime-local string to Date object
  const parseDateTime = (dateTimeString: string): Date | null => {
    if (!dateTimeString) return null;
    return new Date(dateTimeString);
  };

  // Convert Date object to datetime-local string
  const formatDateTime = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      onChange(formatDateTime(date));
      setShowPicker(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedDate(parseDateTime(newValue));
  };

  // Set quick time options
  const setQuickTime = (hours: number, minutes: number = 0) => {
    const now = new Date();
    const quickDate = new Date();
    quickDate.setHours(hours, minutes, 0, 0);
    
    // If the time has passed today, set it for tomorrow
    if (quickDate <= now) {
      quickDate.setDate(quickDate.getDate() + 1);
    }
    
    handleDateChange(quickDate);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            id={id}
            type="datetime-local"
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={cn("h-11 pr-10", className)}
            required={required}
          />
          <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-11 px-3"
          onClick={() => setShowPicker(!showPicker)}
        >
          <Calendar className="h-4 w-4" />
        </Button>
      </div>

      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl shadow-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="mb-6">
              <h4 className="font-semibold text-lg text-foreground mb-2">Select Date & Time</h4>
              <p className="text-sm text-muted-foreground">Choose when the shift should start</p>
            </div>
            
            <div className="mb-6">
              <DatePicker
                selected={selectedDate}
                onChange={handleDateChange}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                minDate={new Date()}
                className="w-full p-3 border border-border rounded-lg text-sm"
                calendarClassName="custom-datepicker"
                inline
              />
            </div>
            
            <div className="border-t border-border pt-4 mb-6">
              <p className="text-sm font-medium text-foreground mb-3">Quick Times</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-sm h-10"
                  onClick={() => setQuickTime(7, 0)}
                >
                  7:00 AM
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-sm h-10"
                  onClick={() => setQuickTime(7, 30)}
                >
                  7:30 AM
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-sm h-10"
                  onClick={() => setQuickTime(15, 0)}
                >
                  3:00 PM
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-sm h-10"
                  onClick={() => setQuickTime(15, 30)}
                >
                  3:30 PM
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-sm h-10"
                  onClick={() => setQuickTime(23, 0)}
                >
                  11:00 PM
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-sm h-10"
                  onClick={() => setQuickTime(23, 30)}
                >
                  11:30 PM
                </Button>
              </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowPicker(false)}
                className="h-10 px-6"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 