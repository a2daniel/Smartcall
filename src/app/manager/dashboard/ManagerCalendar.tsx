"use client";
import React, { useState } from "react";
import Calendar from "react-calendar";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown, ChevronUp } from "lucide-react";
import "react-calendar/dist/Calendar.css";

interface ManagerCalendarProps {
  shifts: any[];
}

export default function ManagerCalendar({ shifts }: ManagerCalendarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedShifts, setSelectedShifts] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Filter only assigned shifts for the calendar
  const assignedShifts = shifts.filter(shift => shift.assignedToId && shift.status === 'ASSIGNED');

  // Group shifts by date
  const shiftsByDate = assignedShifts.reduce((acc: { [key: string]: any[] }, shift) => {
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
      setSelectedShifts(dayShifts);
      setShowModal(true);
    }
  };

  // Custom tile content to show shift indicators
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month' && hasShifts(date)) {
      const dayShifts = getShiftsForDate(date);
      return (
        <div className="flex flex-col items-center mt-1">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          <div className="text-xs text-emerald-600 font-medium">
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
      return 'has-shifts cursor-pointer hover:bg-emerald-50 transition-colors';
    }
    return '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-card rounded-xl shadow-sm border"
    >
      {/* Collapsible Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors rounded-t-xl"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h3 className="text-lg font-bold text-foreground">Shift Calendar</h3>
          <p className="text-muted-foreground text-sm">
            {assignedShifts.length} scheduled shift{assignedShifts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="ghost" size="sm">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Collapsible Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0">
              {assignedShifts.length === 0 ? (
                <motion.div
                  className="text-center py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="text-muted-foreground/50 text-4xl mb-4">📅</div>
                  <p className="text-muted-foreground font-medium">No scheduled shifts</p>
                  <p className="text-muted-foreground/70 text-sm">Shifts will appear here once they're accepted</p>
                </motion.div>
              ) : (
                <div className="calendar-container">
                  <Calendar
                    onClickDay={handleDateClick}
                    tileContent={tileContent}
                    tileClassName={tileClassName}
                    className="w-full border border-border rounded-lg"
                    locale="en-US"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shift Details Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Scheduled Shifts</DialogTitle>
            <DialogDescription>
              {selectedDate && `Shifts on ${selectedDate.toLocaleDateString()}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedShifts.map((shift, index) => (
              <motion.div
                key={shift.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                      {shift.requiredSkill}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(shift.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(shift.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-foreground">Assigned to:</span>
                    <p className="text-muted-foreground">
                      {shift.assignedTo?.email || 'Unknown'}
                    </p>
                  </div>
                  
                  <div>
                    <span className="font-medium text-foreground">Requested by:</span>
                    <p className="text-muted-foreground">
                      {shift.callOutLogs[0]?.user?.email || 'System'}
                    </p>
                  </div>
                  
                  {shift.callOutLogs[0]?.reason && (
                    <div>
                      <span className="font-medium text-foreground">Reason:</span>
                      <p className="text-muted-foreground">
                        {shift.callOutLogs[0].reason}
                      </p>
                    </div>
                  )}
                  
                  {shift.callOutLogs[0]?.filledAt && (
                    <div>
                      <span className="font-medium text-foreground">Accepted:</span>
                      <p className="text-emerald-600">
                        {new Date(shift.callOutLogs[0].filledAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
} 