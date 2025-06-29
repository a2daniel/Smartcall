"use client";
import React, { useState } from "react";
import Calendar from "react-calendar";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import "react-calendar/dist/Calendar.css";

interface Shift {
  id: number;
  start: string;
  end: string;
  requiredSkill: string;
  callOutLogs: Array<{
    user?: { email: string };
    reason?: string;
    filledAt?: string;
  }>;
}

interface StaffCalendarProps {
  shifts: Shift[];
}

export default function StaffCalendar({ shifts }: StaffCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  // Group shifts by date
  const shiftsByDate = shifts.reduce((acc: { [key: string]: any[] }, shift) => {
    const date = new Date(shift.start).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(shift);
    return acc;
  }, {});

  // Check if a date has shifts
  const hasShifts = (date: Date) => {
    return shiftsByDate[date.toDateString()]?.length > 0;
  };

  // Get shifts for a specific date
  const getShiftsForDate = (date: Date) => {
    return shiftsByDate[date.toDateString()] || [];
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    const dayShifts = getShiftsForDate(date);
    if (dayShifts.length > 0) {
      setSelectedDate(date);
      setSelectedShift(dayShifts[0]); // Show first shift if multiple
      setShowModal(true);
    }
  };

  // Custom tile content to show shift indicators
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month' && hasShifts(date)) {
      const dayShifts = getShiftsForDate(date);
      return (
        <div className="flex flex-col items-center mt-1">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <div className="text-xs text-primary font-medium">
            {dayShifts.length}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tile class names
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month' && hasShifts(date)) {
      return 'has-shifts cursor-pointer hover:bg-primary/10 transition-colors';
    }
    return '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-card rounded-xl shadow-sm border"
    >
      <div className="p-4 border-b border-border/50">
        <h3 className="text-lg font-bold text-foreground">Shift Calendar</h3>
        <p className="text-muted-foreground text-sm mt-1">
          {shifts.length > 0 ? `${shifts.length} upcoming shift${shifts.length !== 1 ? 's' : ''}` : 'No shifts scheduled'}
        </p>
      </div>

      <div className="p-4">
        <div className="calendar-container">
          <Calendar
            onClickDay={handleDateClick}
            tileContent={tileContent}
            tileClassName={tileClassName}
            className="w-full border border-border rounded-lg"
            locale="en-US"
          />
        </div>

        {shifts.length === 0 && (
          <motion.div
            className="text-center py-6 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-muted-foreground/50 text-3xl mb-2">📅</div>
            <p className="text-muted-foreground text-sm">No upcoming shifts</p>
          </motion.div>
        )}
      </div>

      {/* Shift Details Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Shift Details</DialogTitle>
            <DialogDescription>
              {selectedDate && `Shift on ${selectedDate.toLocaleDateString()}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedShift && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                  {selectedShift.requiredSkill}
                </span>
              </div>
              
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-foreground">Time:</span>
                  <p className="text-muted-foreground">
                    {new Date(selectedShift.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(selectedShift.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
                
                <div>
                  <span className="font-medium text-foreground">Requested by:</span>
                  <p className="text-muted-foreground">
                    {selectedShift.callOutLogs[0]?.user?.email || 'System'}
                  </p>
                </div>
                
                {selectedShift.callOutLogs[0]?.reason && (
                  <div>
                    <span className="font-medium text-foreground">Reason:</span>
                    <p className="text-muted-foreground">
                      {selectedShift.callOutLogs[0].reason}
                    </p>
                  </div>
                )}
                
                {selectedShift.callOutLogs[0]?.filledAt && (
                  <div>
                    <span className="font-medium text-foreground">Accepted:</span>
                    <p className="text-emerald-600">
                      {new Date(selectedShift.callOutLogs[0].filledAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>


    </motion.div>
  );
} 